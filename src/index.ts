import { loadConfig } from './config/index.js';
import { parseSolution, parseSolutionManifest } from './parsers/index.js';
import { writeTableMarkdown, writeOverviewMarkdown } from './renderers/index.js';
import { parseAllFlows } from './parsers/index.js';
import { writeFlowMarkdown } from './renderers/index.js';
import { publishToWiki } from './publisher/wikiPublisher.js';
import { buildWikiPages } from './publisher/wikiAssembler.js';

async function main() {
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

  // Parse flows — hoisted so publisher can access them
  const flows = config.components.flows
    ? parseAllFlows(config.solution.unpackedPath)
    : [];

  // Write flow markdown locally
  if (flows.length > 0) {
    writeFlowMarkdown(flows, outputPath);
  }

  // Publish to ADO Wiki if configured
  if (config.wiki) {
    const pages = buildWikiPages(config, solution, flows);
    await publishToWiki(config.wiki, pages);
  }
}

main().catch(console.error);
