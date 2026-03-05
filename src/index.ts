import { parseSolution } from './parsers/solutionParser.js';
import { parseSolutionManifest } from './parsers/solutionManifestParser.js';
import { writeTableMarkdown } from './renderers/tableRenderer.js';
import { writeOverviewMarkdown } from './renderers/overviewRenderer.js';

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