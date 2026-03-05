import { parseSolution, parseSolutionManifest } from './parsers/index.js';
import { writeTableMarkdown, writeOverviewMarkdown } from './renderers/index.js';

const unpackedPath = './unpacked';

// Parse manifest for solution metadata
const solution = parseSolutionManifest(unpackedPath);

// Parse all tables
const tables = parseSolution(unpackedPath, {
  customColumnsOnly: false,
  excludeBaseCurrencyFields: true,
  excludeStandardRelationships: true,
});

// Attach tables to solution model for overview
solution.tables = tables;

// Write overview page
writeOverviewMarkdown(solution, './output');

// Write per-table pages
for (const table of tables) {
  writeTableMarkdown(table, './output/tables');
}