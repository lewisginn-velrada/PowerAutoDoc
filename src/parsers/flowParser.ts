import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs';
import * as path from 'path';
import type { FlowModel, FlowTriggerModel, FlowActionModel, FlowTriggerType } from '../ir/index.js';

const xmlParser = new XMLParser({
  attributeNamePrefix: '@_',
  ignoreAttributes: false,
  isArray: (name) => ['LocalizedName'].includes(name),
});

// -----------------------------------------------
// Dataverse webhook message code → trigger type
// -----------------------------------------------
const MESSAGE_MAP: Record<number, FlowTriggerType> = {
  1: 'DataverseCreate',
  2: 'DataverseDelete',
  3: 'DataverseUpdate',
  4: 'DataverseCreateOrUpdate',
  5: 'DataverseCreateOrDelete',
  6: 'DataverseUpdateOrDelete',
  7: 'DataverseCreateOrUpdateOrDelete',
};

// -----------------------------------------------
// OperationId → human-readable action description
// -----------------------------------------------
function describeAction(operationId: string, entityName?: string): string {
  const entity = entityName ? ` on \`${entityName}\`` : '';
  const opMap: Record<string, string> = {
    CreateRecord: `Create record${entity}`,
    UpdateRecord: `Update record${entity}`,
    DeleteRecord: `Delete record${entity}`,
    GetItem: `Get record${entity}`,
    ListRecords: `List records${entity}`,
    ExecuteChangeset: `Execute changeset${entity}`,
    PerformBoundAction: `Perform bound action${entity}`,
    SendEmail: 'Send email',
    SendEmailV2: 'Send email',
    SendApproval: 'Send approval request',
    StartAndWaitForAnApproval: 'Send approval and wait for response',
    CreateHtml: 'Create HTML content',
    Compose: 'Compose value',
    ParseJson: 'Parse JSON',
    Http: 'HTTP request',
    Response: 'Return response',
    Terminate: 'Terminate flow',
    Delay: 'Wait / delay',
    If: 'Condition branch',
    Switch: 'Switch condition',
    Foreach: 'Loop — for each',
    Until: 'Loop — until',
    Scope: 'Scope / try block',
  };
  return opMap[operationId] ?? `Run action: ${operationId}${entity}`;
}

// -----------------------------------------------
// Parse trigger from JSON definition
// -----------------------------------------------
function parseTrigger(triggers: Record<string, any>): FlowTriggerModel {
  const [triggerKey, trigger] = Object.entries(triggers)[0] ?? ['Unknown', {}];
  const name = triggerKey.replace(/_/g, ' ');
  const params = trigger?.inputs?.parameters ?? {};
  const operationId: string = trigger?.inputs?.host?.operationId ?? '';

  // Dataverse webhook trigger
  if (operationId === 'SubscribeWebhookTrigger') {
    const messageCode = Number(params['subscriptionRequest/message']);
    const entity: string = params['subscriptionRequest/entityname'] ?? '';
    const filterExpression: string = params['subscriptionRequest/filterexpression'] ?? '';
    const filterAttributes: string = params['subscriptionRequest/filteringattributes'] ?? '';
    const triggerType = MESSAGE_MAP[messageCode] ?? 'Other';

    const triggerLabels: Record<string, string> = {
      DataverseCreate: `When a \`${entity}\` record is added`,
      DataverseUpdate: `When a \`${entity}\` record is modified`,
      DataverseDelete: `When a \`${entity}\` record is deleted`,
      DataverseCreateOrUpdate: `When a \`${entity}\` record is added or modified`,
      DataverseCreateOrDelete: `When a \`${entity}\` record is added or deleted`,
      DataverseUpdateOrDelete: `When a \`${entity}\` record is modified or deleted`,
      DataverseCreateOrUpdateOrDelete: `When a \`${entity}\` record is added, modified or deleted`,
    };

    return {
      name,
      type: triggerType,
      entity,
      filterExpression: filterExpression || undefined,
      filterAttributes: filterAttributes || undefined,
      description: triggerLabels[triggerType] ?? `Dataverse trigger on \`${entity}\``,
    };
  }

  // Scheduled trigger
  if (trigger?.type === 'Recurrence') {
    const interval = trigger?.recurrence?.interval ?? '';
    const freq = trigger?.recurrence?.frequency ?? '';
    return {
      name,
      type: 'Scheduled',
      description: `Scheduled — every ${interval} ${freq}`.trim(),
    };
  }

  // Manual trigger
  if (trigger?.type === 'Request' || operationId === 'PowerAppsNotification') {
    return { name, type: 'Manual', description: 'Manually triggered or called from Power Apps' };
  }

  return { name, type: 'Other', description: `Trigger: ${trigger?.type ?? 'Unknown'}` };
}

// -----------------------------------------------
// Parse actions from JSON definition
// -----------------------------------------------
function parseActions(actions: Record<string, any>): FlowActionModel[] {
  return Object.entries(actions).map(([key, action]) => {
    const name = key.replace(/_/g, ' ');
    const type: string = action?.type ?? '';
    const operationId: string = action?.inputs?.host?.operationId ?? type;
    const params = action?.inputs?.parameters ?? {};
    const entityName: string = params.entityName ?? '';
    const runAfter: string[] = Object.keys(action?.runAfter ?? {}).map(k => k.replace(/_/g, ' '));

    // Extract field mappings from item/* parameters (Create/Update actions)
    // or $select parameter (Get actions)
    let fieldMappings: string[] | undefined;

    if (['CreateRecord', 'UpdateRecord'].includes(operationId)) {
      fieldMappings = Object.keys(params)
        .filter(k => k.startsWith('item/'))
        .map(k => k.replace('item/', '').replace('@odata.bind', ' (lookup)'));
    } else if (operationId === 'GetItem' && params['$select']) {
      fieldMappings = (params['$select'] as string).split(',').map(s => s.trim());
    }

    return {
      name,
      type,
      operationId,
      entityName: entityName || undefined,
      description: describeAction(operationId, entityName || undefined),
      runAfter,
      fieldMappings: fieldMappings?.length ? fieldMappings : undefined,
    };
  });
}

// -----------------------------------------------
// Parse a single flow XML + JSON pair
// -----------------------------------------------
function parseFlowPair(xmlPath: string, unpackedPath: string): FlowModel | null {
  const rawXml = fs.readFileSync(xmlPath, 'utf-8');
  const parsed = xmlParser.parse(rawXml);
  const workflow = parsed?.Workflow;

  if (!workflow) {
    console.warn(`No Workflow node found in: ${xmlPath}`);
    return null;
  }

  const id: string = workflow['@_WorkflowId']?.replace(/[{}]/g, '') ?? '';
  const category = Number(workflow.Category);

  // Category 5 = Modern Flow, anything else = Classic Workflow
  // We only parse Modern Flows here — classic workflows handled separately
  if (category !== 5) return null;

  const isActive = Number(workflow.StateCode) === 1;

  const localizedNames = workflow.LocalizedNames?.LocalizedName ?? [];
  const nameEntry = localizedNames.find((n: any) => n['@_languagecode'] === '1033');
  const name: string = nameEntry?.['@_description'] ?? workflow['@_Name'] ?? 'Unknown Flow';

  // Resolve JSON file path — JsonFileName is relative to unpacked root
  const jsonRelPath: string = workflow.JsonFileName ?? '';
  if (!jsonRelPath) {
    console.warn(`No JsonFileName in workflow XML: ${xmlPath}`);
    return null;
  }

  // JsonFileName starts with /Workflows/... — strip leading slash and join
  const jsonPath = path.join(unpackedPath, jsonRelPath.replace(/^\//, ''));

  if (!fs.existsSync(jsonPath)) {
    console.warn(`Flow JSON not found: ${jsonPath}`);
    return null;
  }

  let flowJson: any;
  try {
    flowJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (err) {
    console.error(`Failed to parse flow JSON: ${jsonPath}`, err);
    return null;
  }

  const definition = flowJson?.properties?.definition;
  if (!definition) {
    console.warn(`No definition found in flow JSON: ${jsonPath}`);
    return null;
  }

  const triggers: Record<string, any> = definition.triggers ?? {};
  const actions: Record<string, any> = definition.actions ?? {};

  const connectionRefs = Object.values(flowJson?.properties?.connectionReferences ?? {})
    .map((ref: any) => ref?.connection?.connectionReferenceLogicalName ?? '')
    .filter(Boolean);

  return {
    id,
    name,
    category: 'ModernFlow',
    isActive,
    trigger: parseTrigger(triggers),
    actions: parseActions(actions),
    connectionReferences: connectionRefs,
  };
}

// -----------------------------------------------
// Parse all flows from the Workflows folder
// -----------------------------------------------
export function parseAllFlows(unpackedPath: string): FlowModel[] {
  const workflowsPath = path.join(unpackedPath, 'Workflows');

  if (!fs.existsSync(workflowsPath)) {
    console.warn(`No Workflows folder found at: ${workflowsPath}`);
    return [];
  }

  // Only process XML files — each XML is the metadata for one flow
  // The paired JSON is referenced inside the XML via JsonFileName
  const xmlFiles = fs
    .readdirSync(workflowsPath)
    .filter(f => f.endsWith('.xml'));

  console.log(`Found ${xmlFiles.length} workflow XML files`);

  const flows: FlowModel[] = [];

  for (const file of xmlFiles) {
    const xmlPath = path.join(workflowsPath, file);
    try {
      const flow = parseFlowPair(xmlPath, unpackedPath);
      if (flow) flows.push(flow);
    } catch (err) {
      console.error(`Failed to parse workflow: ${file}`, err);
    }
  }

  console.log(`Parsed ${flows.length} modern flows`);
  return flows;
}
