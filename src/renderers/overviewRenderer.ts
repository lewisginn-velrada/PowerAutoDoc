import * as fs from 'fs';
import * as path from 'path';
import type { SolutionModel } from '../ir/models.js';

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

export function renderOverviewMarkdown(solution: SolutionModel): string {
    const lines: string[] = [];

    lines.push(`# ${solution.displayName}`);
    lines.push('');

    // ---- Solution metadata ----
    lines.push('## Solution Details');
    lines.push('');
    lines.push('| Property | Value |');
    lines.push('| --- | --- |');
    lines.push(`| Solution Name | ${solution.displayName} |`);
    lines.push(`| Unique Name | \`${solution.uniqueName}\` |`);
    lines.push(`| Version | ${solution.version} |`);
    lines.push(`| Managed | ${solution.isManaged ? 'Yes' : 'No'} |`);
    lines.push(`| Publisher | ${solution.publisher.displayName} |`);
    lines.push(`| Customization Prefix | \`${solution.publisher.prefix}\` |`);
    lines.push('');

    // ---- Summary counts ----
    const customTables = solution.tables.filter(t => t.isCustom);
    const extendedTables = solution.tables.filter(t => !t.isCustom);
    const totalColumns = solution.tables.reduce(
        (acc, t) => acc + t.columns.filter(c => c.isCustom).length, 0
    );
    const totalRelationships = solution.tables.reduce(
        (acc, t) => acc + t.relationships.filter(
            r => r.isCustom && r.referencingEntity.toLowerCase() === t.logicalName.toLowerCase()
        ).length, 0
    );
    const totalForms = solution.tables.reduce((acc, t) => acc + t.forms.length, 0);
    const totalViews = solution.tables.reduce((acc, t) => acc + t.views.length, 0);

    lines.push('## Summary');
    lines.push('');
    lines.push('| Component | Count |');
    lines.push('| --- | --- |');
    lines.push(`| Custom Tables | ${customTables.length} |`);
    lines.push(`| Extended Standard Tables | ${extendedTables.length} |`);
    lines.push(`| Custom Columns | ${totalColumns} |`);
    lines.push(`| Custom Relationships | ${totalRelationships} |`);
    lines.push(`| Forms | ${totalForms} |`);
    lines.push(`| Views | ${totalViews} |`);
    lines.push('');

    // ---- Custom tables ----
    if (customTables.length > 0) {
        lines.push('## Custom Tables');
        lines.push('');
        const rows = customTables.map(t => [
            `[${t.displayName}](${t.logicalName})`,
            `\`${t.logicalName}\``,
            t.columns.filter(c => c.isCustom).length.toString(),
            t.relationships.filter(r => r.isCustom).length.toString(),
            t.forms.length.toString(),
            t.views.length.toString(),
        ]);
        lines.push(markdownTable(
            ['Display Name', 'Logical Name', 'Custom Columns', 'Relationships', 'Forms', 'Views'],
            rows
        ));
        lines.push('');
    }

    // ---- Extended standard tables ----
    if (extendedTables.length > 0) {
        lines.push('## Extended Standard Tables');
        lines.push('');
        lines.push('These standard Dataverse tables have been extended by this solution.');
        lines.push('');
        const rows = extendedTables.map(t => [
            `[${t.displayName}](${t.logicalName})`,
            `\`${t.logicalName}\``,
            t.columns.filter(c => c.isCustom).length.toString(),
        ]);
        lines.push(markdownTable(
            ['Display Name', 'Logical Name', 'Custom Columns Added'],
            rows
        ));
        lines.push('');
    }

    return lines.join('\n');
}

export function writeOverviewMarkdown(solution: SolutionModel, outputDir: string): void {
    fs.mkdirSync(outputDir, { recursive: true });
    const filepath = path.join(outputDir, 'overview.md');
    const content = renderOverviewMarkdown(solution).replace(/\r\n/g, '\n');
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`Written: ${filepath}`);
}