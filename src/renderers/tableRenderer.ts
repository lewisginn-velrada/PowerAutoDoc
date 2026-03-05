import * as fs from 'fs';
import * as path from 'path';
import type { TableModel, ColumnModel, RelationshipModel } from '../ir/index.js';

import { RENDER_OPTIONS } from '../config/index.js';

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

function friendlyType(col: ColumnModel): string {
    const typeLabels: Record<string, string> = {
        string: 'Text',
        memo: 'Multiline Text',
        integer: 'Whole Number',
        decimal: 'Decimal',
        money: 'Currency',
        boolean: 'Yes/No',
        datetime: 'Date & Time',
        lookup: 'Lookup',
        optionset: 'Choice',
        uniqueidentifier: 'Unique Identifier',
        unknown: 'Unknown',
    };
    return typeLabels[col.type] ?? col.type;
}

function renderColumnTable(columns: ColumnModel[]): string {
    const rows = columns.map(col => [
        col.displayName,
        `\`${col.logicalName}\``,
        friendlyType(col),
        col.isRequired ? 'Yes' : 'No',
        col.description || '',
    ]);
    return markdownTable(
        ['Display Name', 'Logical Name', 'Type', 'Required', 'Description'],
        rows
    );
}

function renderRelationshipTable(relationships: RelationshipModel[], currentTable: string): string {
  const rows = relationships.map(rel => {
    // Show the relationship from the perspective of the current table
    const isParent = rel.referencedEntity.toLowerCase() === currentTable.toLowerCase();
    const direction = isParent ? 'One (this) → Many' : 'Many → One (this)';
    const otherTable = isParent ? rel.referencingEntity : rel.referencedEntity;

    return [
      rel.name,
      direction,
      otherTable,
      `\`${rel.referencingAttribute}\``,
      rel.description || '',
    ];
  });

  return markdownTable(
    ['Relationship Name', 'Direction', 'Related Table', 'Lookup Field', 'Description'],
    rows
  );
}

export function renderTableMarkdown(table: TableModel): string {
    const lines: string[] = [];

    // ---- Heading ----
    lines.push(`# ${table.displayName}`);
    lines.push('');

    // ---- Overview ----
    lines.push('## Overview');
    lines.push('');
    lines.push('| Property | Value |');
    lines.push('| --- | --- |');
    lines.push(`| Logical Name | \`${table.logicalName}\` |`);
    lines.push(`| Display Name | ${table.displayName} |`);
    if (table.pluralDisplayName) {
        lines.push(`| Plural Name | ${table.pluralDisplayName} |`);
    }
    lines.push(`| Type | ${table.isCustom ? 'Custom Table' : 'Standard Table (Extended)'} |`);
    lines.push(`| Activity Table | ${table.isActivity ? 'Yes' : 'No'} |`);
    if (table.description) {
        lines.push(`| Description | ${table.description} |`);
    }
    lines.push('');

    // ---- AI Summary ----
    if (table.aiSummary) {
        lines.push('## Summary');
        lines.push('');
        lines.push(table.aiSummary);
        lines.push('');
    }

    // ---- Columns ----
    lines.push('## Columns');
    lines.push('');

    if (table.columns.length === 0) {
        lines.push('_No columns found in solution for this table._');
    } else {
        const customCols = table.columns.filter(c => c.isCustom);
        const standardCols = table.columns.filter(c => !c.isCustom);

        if (customCols.length > 0) {
            lines.push('### Custom Columns');
            lines.push('');
            lines.push(renderColumnTable(customCols));
            lines.push('');
        }

        if (standardCols.length > 0) {
            lines.push('### Standard Columns');
            lines.push('');
            lines.push(renderColumnTable(standardCols));
            lines.push('');
        }
    }

    // ---- Relationships ----
    // ---- Relationships ----
    lines.push('## Relationships');
    lines.push('');

    if (table.relationships.length === 0) {
        lines.push('_No relationships found._');
    } else {
        const customRels = table.relationships.filter(r => r.isCustom);
        const standardRels = table.relationships.filter(r => !r.isCustom);

        if (customRels.length > 0) {
            lines.push('### Custom Relationships');
            lines.push('');
            lines.push(renderRelationshipTable(customRels, table.logicalName));
            lines.push('');
        }

        if (standardRels.length > 0) {
            lines.push('### Standard Relationships');
            lines.push('');
            lines.push(renderRelationshipTable(standardRels, table.logicalName));
            lines.push('');
        }
    }
    // ---- Views ----
    lines.push('## Views');
    lines.push('');

    if (table.views.length === 0) {
        lines.push('_No views found._');
    } else {
        const viewRows = table.views.map(v => [
            v.name,
            v.type,
            v.isDefault ? 'Yes' : 'No',
            v.columns.length.toString(),
            v.description || '',
        ]);
        lines.push(markdownTable(
            ['View Name', 'Type', 'Default', 'Column Count', 'Description'],
            viewRows
        ));
        lines.push('');

        for (const view of table.views) {
            lines.push(`### ${view.name}`);
            lines.push('');
            lines.push(`**Type:** ${view.type}`);
            if (view.description) lines.push(`**Notes:** ${view.description}`);
            lines.push('');

            if (view.filters.length > 0) {
                lines.push('**Filters:**');
                lines.push('');
                for (const f of view.filters) {
                    const indent = '  '.repeat(f.depth);
                    const value = f.value ? ` \`${f.value}\`` : '';
                    if (f.isJoin) {
                        const joinLabel = f.joinType === 'inner' ? 'inner join' : 'outer join';
                        const field = f.joinField ? ` via \`${f.joinField}\`` : '';
                        lines.push(`${indent}- **${f.attribute}**${field} — ${joinLabel}`);
                    } else {
                        const groupPrefix = f.filterType === 'or' ? '*(or)* ' : '';
                        lines.push(`${indent}- ${groupPrefix}\`${f.attribute}\` ${f.operator}${value}`);
                    }
                }
                lines.push('');
            }

            if (view.columns.length === 0) {
                lines.push('**Columns:** _none_');
            } else {
                lines.push('**Columns:** ' + view.columns.map(c => `\`${c}\``).join(', '));
            }
            lines.push('');
        }
    }

    return lines.join('\n');
}

export function writeTableMarkdown(table: TableModel, outputDir: string): void {
    fs.mkdirSync(outputDir, { recursive: true });
    const filename = `${table.logicalName}.md`;
    const filepath = path.join(outputDir, filename);
    // Force \n line endings — Windows Node can produce \r\n which breaks ADO Wiki tables
    const content = renderTableMarkdown(table).replace(/\r\n/g, '\n');
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`Written: ${filepath}`);
}
