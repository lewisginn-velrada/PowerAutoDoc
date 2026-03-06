import { loadConfig } from './config/index.js';
import { parseSolution, parseSolutionManifest } from './parsers/index.js';
import { writeTableMarkdown, writeOverviewMarkdown } from './renderers/index.js';
import { parseAllFlows } from './parsers/index.js';
import { writeFlowMarkdown } from './renderers/index.js';

// Load config from doc-gen.config.yml in the current working directory
const config = loadConfig();

const { unpackedPath } = config.solution;
const { path: outputPath } = config.output;

// Parse manifest for solution metadata
const solution = parseSolutionManifest(unpackedPath);

// Parse all tables — config drives all filtering and component toggles
const tables = parseSolution(unpackedPath, config);

// Attach tables to solution model for overview
solution.tables = tables;

// Write overview page
writeOverviewMarkdown(solution, outputPath);

// Write per-table pages
if (config.components.tables) {
  for (const table of tables) {
    writeTableMarkdown(table, `${outputPath}/tables`, config);
  }
}

if (config.components.flows) {
  const flows = parseAllFlows(config.solution.unpackedPath);
  writeFlowMarkdown(flows, outputPath);
}