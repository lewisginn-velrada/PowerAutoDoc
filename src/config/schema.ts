/**
 * Shape of doc-gen.config.yml
 * All fields are optional — loader merges with defaults.
 */
export interface DocGenConfig {
  solution: {
    /** Path to the unpacked solution folder */
    unpackedPath: string;
    /** Publisher prefix used to detect custom components (e.g. 'vel') */
    publisherPrefix: string;
  };

  output: {
    /** Directory to write generated markdown files */
    path: string;
  };

  parse: {
    /** Only include custom columns in output. Default: false */
    customColumnsOnly: boolean;
    /** Strip base currency (_base) money fields. Default: true */
    excludeBaseCurrencyFields: boolean;
    /** Strip standard OOB relationships. Default: true */
    excludeStandardRelationships: boolean;
    /** Additional columns to exclude by logical name */
    excludedColumns: string[];
  };

  render: {
    /** Form layout style. 'compact' = summary table, 'detailed' = full tab/section breakdown */
    formLayout: 'compact' | 'detailed';
  };

  components: {
    /** Toggle each documentation component on/off */
    tables: boolean;
    forms: boolean;
    views: boolean;
    relationships: boolean;
    flows: boolean;
    plugins: boolean;
    webResources: boolean;
    security: boolean;
  };
}
