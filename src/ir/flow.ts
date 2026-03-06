export type FlowCategory = 'ModernFlow' | 'ClassicWorkflow';

export type FlowTriggerType =
  | 'DataverseCreate'
  | 'DataverseUpdate'
  | 'DataverseDelete'
  | 'DataverseCreateOrUpdate'
  | 'DataverseCreateOrDelete'
  | 'DataverseUpdateOrDelete'
  | 'DataverseCreateOrUpdateOrDelete'
  | 'Scheduled'
  | 'Manual'
  | 'Other';

export interface FlowTriggerModel {
  name: string;
  type: FlowTriggerType;
  /** Dataverse table logical name, if applicable */
  entity?: string;
  /** Raw filter expression e.g. "statuscode eq 948610001" */
  filterExpression?: string;
  /** Comma-separated attributes that trigger the flow */
  filterAttributes?: string;
  /** Human-readable one-liner */
  description: string;
}

export interface FlowActionModel {
  name: string;
  type: string;
  operationId: string;
  entityName?: string;
  description: string;
  runAfter: string[];
  /** Fields being set on Create/Update, or selected on Get */
  fieldMappings?: string[];
}
export interface FlowModel {
  id: string;
  name: string;
  category: FlowCategory;
  isActive: boolean;
  trigger: FlowTriggerModel;
  actions: FlowActionModel[];
  /** Logical names of connection references used */
  connectionReferences: string[];
}
