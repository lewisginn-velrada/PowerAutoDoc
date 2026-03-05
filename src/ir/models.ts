// SOLUTION (top-level container)
export interface PublisherModel {
  uniqueName: string;
  displayName: string;
  prefix: string;
}

export interface SolutionModel {
  uniqueName: string;
  displayName: string;
  version: string;
  isManaged: boolean;
  publisher: PublisherModel;
  tables: TableModel[];
}

// TABLES / ENTITIES
export interface TableModel {
  logicalName: string;
  displayName: string;
  pluralDisplayName: string;
  description: string;
  isCustom: boolean;
  isActivity: boolean;
  columns: ColumnModel[];
  relationships: RelationshipModel[];
  forms: FormModel[];
  views: ViewModel[];
  // Added by enrichment layer later
  aiSummary?: string;
}

export interface ColumnModel {
  logicalName: string;
  displayName: string;
  description: string;
  type: ColumnType;
  isRequired: boolean;
  isCustom: boolean;
  maxLength?: number;
  targets?: string[]; // for lookups — which tables it points to
}

export type ColumnType =
  | "string"
  | "integer"
  | "decimal"
  | "boolean"
  | "datetime"
  | "lookup"
  | "optionset"
  | "money"
  | "memo"
  | "uniqueidentifier"
  | "unknown";

export interface RelationshipModel {
  name: string;
  type: 'OneToMany' | 'ManyToOne' | 'ManyToMany';
  referencingEntity: string;   // the child/many side
  referencedEntity: string;    // the parent/one side
  referencingAttribute: string; // the lookup field
  description: string;
  isCustom: boolean;
}

// FORMS
export interface FormModel {
  name: string;
  type: "Main" | "Quick Create" | "Quick View" | "Card" | "Other";
  tabs: FormTabModel[];
}

export interface FormTabModel {
  label: string;
  sections: FormSectionModel[];
}

export interface FormSectionModel {
  label: string;
  columns: string[]; // logical names of columns on this section
}

// VIEWS
export interface ViewModel {
  name: string;
  type: 'Public' | 'System' | 'Associated' | 'Other' | 'Quick Find' | 'Lookup' | 'SubGrid';
  columns: string[];
  description: string;
  isDefault: boolean;
  isQuickFind: boolean;
  filters: ViewFilterCondition[];
}

export interface ViewFilterCondition {
  attribute: string;        // column logical name for normal conditions, entity name for joins
  operator: string;         // eq, null, not-null, linked etc.
  value?: string;
  isJoin?: boolean;         // true = this row is a link-entity join
  joinType?: string;        // 'inner' | 'outer'
  joinField?: string;       // the field joining on 
  filterType?: string;      // 'and' | 'or' — the group logic
  depth: number;
}

// FLOWS & WORKFLOWS
export interface FlowModel {
  name: string;
  type: "Modern" | "Classic";
  triggerType: "Manual" | "Automated" | "Scheduled" | "Unknown";
  triggerTable?: string;
  triggerEvent?: string; // Create, Update, Delete etc.
  steps: FlowStepModel[];
  aiSummary?: string;
}

export interface FlowStepModel {
  name: string;
  type: string;       // e.g. "Condition", "SendEmail", "UpdateRecord"
  description: string;
  children?: FlowStepModel[]; // for branches/conditions
}

// PLUGINS
export interface PluginAssemblyModel {
  name: string;
  version: string;
  plugins: PluginModel[];
  aiSummary?: string;
}

export interface PluginModel {
  className: string;
  description: string;
  steps: PluginStepModel[];
  aiSummary?: string;
}

export interface PluginStepModel {
  name: string;
  table: string;
  message: string;        // Create, Update, Delete etc.
  stage: "PreValidation" | "PreOperation" | "PostOperation";
  mode: "Synchronous" | "Asynchronous";
  rank: number;
  filteringAttributes?: string[];
}

// ============================================
// SECURITY ROLES
// ============================================
export interface SecurityRoleModel {
  name: string;
  roleId: string;
  privileges: EntityPrivilegeModel[];
}

export interface EntityPrivilegeModel {
  table: string;
  create: PrivilegeLevel;
  read: PrivilegeLevel;
  write: PrivilegeLevel;
  delete: PrivilegeLevel;
  append: PrivilegeLevel;
  appendTo: PrivilegeLevel;
}

export type PrivilegeLevel = "None" | "User" | "BusinessUnit" | "ParentChild" | "Organisation";

// ============================================
// WEB RESOURCES
// ============================================
export interface WebResourceModel {
  name: string;
  displayName: string;
  type: "JavaScript" | "HTML" | "CSS" | "XML" | "Image" | "Other";
  description: string;
  functions?: JsFunctionModel[]; // populated for JS files
  aiSummary?: string;
}

export interface JsFunctionModel {
  name: string;
  parameters: string[];
  jsDocComment?: string;
}

// ============================================
// INTEGRATIONS
// ============================================
export interface EnvironmentVariableModel {
  displayName: string;
  logicalName: string;
  type: "String" | "Number" | "Boolean" | "JSON" | "DataSource" | "Secret";
  description: string;
  defaultValue?: string;
}

export interface ConnectionReferenceModel {
  displayName: string;
  logicalName: string;
  connectorId: string;
}