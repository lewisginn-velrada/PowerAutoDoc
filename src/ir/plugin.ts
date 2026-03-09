export type PluginStage = 'PreValidation' | 'PreOperation' | 'PostOperation';
export type PluginMode = 'Synchronous' | 'Asynchronous';
export type ImageType = 'PreImage' | 'PostImage' | 'Both';

export interface PluginStepImageModel {
    id: string;
    name: string;
    imageType: ImageType;
    attributes: string[];
}

export interface PluginStepModel {
    id: string;
    /** Full display name e.g. "AllocationPostOperation: Update of isms_allocation" */
    name: string;
    /** Short class name e.g. "AllocationPostOperation" */
    className: string;
    /** Fully qualified type name e.g. "ISMS.CE.Plugins.AllocationPostOperation" */
    pluginTypeName: string;
    /** Assembly name e.g. "ISMS.CE.Plugins" */
    assemblyName: string;
    /** CRM message e.g. "Update", "Create", "Delete" */
    message: string;
    /** Primary entity logical name e.g. "isms_allocation" */
    primaryEntity: string;
    stage: PluginStage;
    mode: PluginMode;
    /** Comma-separated attribute names that trigger this step (empty = all) */
    filteringAttributes: string[];
    images: PluginStepImageModel[];
}

export interface PluginAssemblyModel {
    assemblyName: string;
    version: string;
    fileName: string;
    isolationMode: 'Sandbox' | 'None';
    pluginTypeNames: string[];
    steps: PluginStepModel[];
}
