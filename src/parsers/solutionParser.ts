import * as fs from 'fs';
import * as path from 'path';
import { parseEntityXml } from './tableParser.js';
import { parseEntityViews } from './viewParser.js';
import { parseEntityForms } from './formParser.js';
import { parseAllRelationships, getRelationshipsForTable } from './relationshipParser.js';
import type { TableModel } from '../ir/index.js';
import {
    DEFAULT_EXCLUDED_COLUMNS,
    DEFAULT_EXCLUDE_BASE_CURRENCY_FIELDS,
    DEFAULT_EXCLUDE_STANDARD_RELATIONSHIPS,
} from '../config/index.js';

interface ParseOptions {
    excludedColumns?: Set<string>;
    customColumnsOnly?: boolean;
    excludeBaseCurrencyFields?: boolean;
    excludeStandardRelationships?: boolean;
}

export function parseSolution(
    unpackedPath: string,
    options: ParseOptions = {}
): TableModel[] {
    const excludedColumns = options.excludedColumns ?? DEFAULT_EXCLUDED_COLUMNS;
    const customColumnsOnly = options.customColumnsOnly ?? false;
    const excludeBaseCurrency = options.excludeBaseCurrencyFields ?? DEFAULT_EXCLUDE_BASE_CURRENCY_FIELDS;
    const excludeStandardRelationships = options.excludeStandardRelationships ?? DEFAULT_EXCLUDE_STANDARD_RELATIONSHIPS;

    const entitiesPath = path.join(unpackedPath, 'Entities');

    if (!fs.existsSync(entitiesPath)) {
        console.warn(`No Entities folder found at: ${entitiesPath}`);
        return [];
    }

    const entityFolders = fs
        .readdirSync(entitiesPath, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);

    console.log(`Found ${entityFolders.length} entities in solution`);

    // Parse relationships once up front — they live outside entity folders
    const allRelationships = parseAllRelationships(unpackedPath);

    const tables: TableModel[] = [];

    for (const folderName of entityFolders) {
        const entityFolderPath = path.join(entitiesPath, folderName);
        const entityXmlPath = path.join(entityFolderPath, 'Entity.xml');

        if (!fs.existsSync(entityXmlPath)) {
            console.warn(`Skipping ${folderName} — no Entity.xml found`);
            continue;
        }

        try {
            const table = parseEntityXml(entityXmlPath);

            // Filter columns
            table.columns = table.columns.filter(col => {
                if (excludedColumns.has(col.logicalName)) return false;
                if (customColumnsOnly && !col.isCustom) return false;
                if (excludeBaseCurrency && col.logicalName.endsWith('_base') && col.type === 'money') return false;
                return true;
            });

            // Wire in views, forms and relationships
            table.views = parseEntityViews(entityFolderPath);
            table.forms = parseEntityForms(entityFolderPath);

            table.relationships = getRelationshipsForTable(allRelationships, table.logicalName);

            if (excludeStandardRelationships) {
                table.relationships = table.relationships.filter(r => r.isCustom);
            }

            tables.push(table);
        } catch (err) {
            console.error(`Failed to parse entity: ${folderName}`, err);
        }
    }

    return tables;
}