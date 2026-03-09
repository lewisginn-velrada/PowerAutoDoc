import * as fs from 'fs';
import * as path from 'path';
import type { FlowModel, FlowActionModel } from '../ir/index.js';
import { toADOWikiLink } from './rendererUtils.js';

function pad(str: string, length: number): string {
  return str.padEnd(length, ' ');
}

function markdownTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ?? '').length))
  );
  const header = '| ' + headers.map((h, i) => pad(h, widths[i])).join(' | ') + ' |';
  const divider = '| ' + widths.map(w => '-'.repeat(w)).join(' | ') + ' |';
  const body = rows.map(
    row => '| ' + row.map((cell, i) => pad(cell ?? '', widths[i])).join(' | ') + ' |'
  );
  return [header, divider, ...body].join('\n');
}

// -----------------------------------------------
// Summary page — index table only, links to child pages
// Used by wiki publisher for the /Automation/Flows page
// -----------------------------------------------
export function renderFlowSummaryMarkdown(flows: FlowModel[], basePath?: string): string {
  const lines: string[] = [];
  
  lines.push('# Power Automate Flows');
  lines.push('');

  if (flows.length === 0) {
    lines.push('_No modern flows found in this solution._');
    return lines.join('\n');
  }

  lines.push(`${flows.length} flow(s) in this solution.`);
  lines.push('');

  const summaryRows = flows.map(f => {
    const linkName = basePath
      ? `[${f.name}](${toADOWikiLink(`${basePath}/${f.name}`)})`
      : f.name;
    return [
      linkName,
      f.trigger.type,
      f.trigger.entity ? `\`${f.trigger.entity}\`` : '—',
      f.actions.length.toString(),
      f.isActive ? '✅ Active' : '❌ Inactive',
    ];
  });

  lines.push(markdownTable(
    ['Flow Name', 'Trigger Type', 'Entity', 'Actions', 'Status'],
    summaryRows
  ));
  lines.push('');

  return lines.join('\n');
}

// -----------------------------------------------
// Single flow detail page
// Used by wiki publisher for each /Automation/Flows/<name> page
// -----------------------------------------------
export function renderSingleFlowMarkdown(flow: FlowModel): string {
  const lines: string[] = [];

  lines.push(`# ${flow.name}`);
  lines.push('');

  lines.push('| Property | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Status | ${flow.isActive ? 'Active' : 'Inactive'} |`);
  lines.push(`| Type | ${flow.category === 'ModernFlow' ? 'Power Automate (Modern Flow)' : 'Classic Workflow'} |`);
  if (flow.connectionReferences.length > 0) {
    lines.push(`| Connections | ${flow.connectionReferences.map(c => `\`${c}\``).join(', ')} |`);
  }
  lines.push('');

  // ---- Trigger ----
  lines.push('## Trigger');
  lines.push('');
  lines.push(flow.trigger.description);
  lines.push('');
  if (flow.trigger.filterAttributes) {
    lines.push(`**Filtering attributes:** \`${flow.trigger.filterAttributes}\``);
  }
  if (flow.trigger.filterExpression) {
    lines.push(`**Filter expression:** \`${flow.trigger.filterExpression}\``);
  }
  lines.push('');

  // ---- Actions ----
  lines.push('## Actions');
  lines.push('');

  if (flow.actions.length === 0) {
    lines.push('_No actions found._');
    lines.push('');
  } else {
    const sorted = sortActionsByOrder(flow.actions);

    const actionRows = sorted.map((a, i) => [
      (i + 1).toString(),
      a.name,
      a.description,
      a.runAfter.length > 0 ? a.runAfter.join(', ') : '—',
    ]);
    lines.push(markdownTable(
      ['#', 'Action', 'Description', 'Runs After'],
      actionRows
    ));
    lines.push('');

    const actionsWithMappings = sorted.filter(a => a.fieldMappings?.length);
    if (actionsWithMappings.length > 0) {
      lines.push('**Field mappings:**');
      lines.push('');
      for (const a of actionsWithMappings) {
        lines.push(`_${a.name}_: ${a.fieldMappings!.map(f => `\`${f}\``).join(', ')}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

// -----------------------------------------------
// Combined render — kept for local file output
// -----------------------------------------------
export function renderFlowMarkdown(flows: FlowModel[]): string {
  const lines: string[] = [];

  lines.push(renderFlowSummaryMarkdown(flows));

  for (const flow of flows) {
    lines.push(renderSingleFlowMarkdown(flow));
  }

  return lines.join('\n');
}

// -----------------------------------------------
// Topological sort by runAfter
// -----------------------------------------------
function sortActionsByOrder(actions: FlowActionModel[]): FlowActionModel[] {
  const sorted: FlowActionModel[] = [];
  const remaining = [...actions];
  const seen = new Set<string>();

  let iterations = 0;
  while (remaining.length > 0 && iterations < remaining.length * remaining.length) {
    const next = remaining.findIndex(a =>
      a.runAfter.length === 0 || a.runAfter.every(dep => seen.has(dep))
    );
    if (next === -1) break;
    const [action] = remaining.splice(next, 1);
    sorted.push(action);
    seen.add(action.name);
    iterations++;
  }

  return [...sorted, ...remaining];
}

// -----------------------------------------------
// Local file writer
// -----------------------------------------------
export function writeFlowMarkdown(flows: FlowModel[], outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });
  const filepath = path.join(outputDir, 'flows.md');
  const content = renderFlowMarkdown(flows).replace(/\r\n/g, '\n');
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log(`Written: ${filepath}`);
}