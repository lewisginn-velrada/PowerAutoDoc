import { loadConfig } from './config/index.js';
import { parseSolution, parseSolutionManifest } from './parsers/index.js';
import { writeTableMarkdown, writeOverviewMarkdown, writePluginMarkdown } from './renderers/index.js';
import { parseAllFlows } from './parsers/index.js';
import { writeFlowMarkdown } from './renderers/index.js';
import { publishToWiki } from './publisher/wikiPublisher.js';
import { buildWikiPages } from './publisher/wikiAssembler.js';
import type { SolutionModel } from './ir/index.js';
import type { FlowModel } from './ir/index.js';
import { parseAllPlugins } from './parsers/index.js';
import type { PluginAssemblyModel } from './ir/index.js';

async function main() {
  const config = loadConfig();
  const { path: outputPath } = config.output;

  let mergedSolution: SolutionModel | null = null;
  const allSolutions: SolutionModel[] = [];
  const allFlows: FlowModel[] = [];
  const allPluginAssemblies: PluginAssemblyModel[] = [];

  for (const solutionEntry of config.solutions) {
    const { path: unpackedPath, role, publisherPrefix } = solutionEntry;

    console.log(`\nProcessing solution: ${unpackedPath} (role: ${role})`);

    const solConfig = {
      ...config,
      solution: {
        unpackedPath,
        publisherPrefix,
      },
    };

    const isDataModel = role === 'datamodel' || role === 'all';
    const isFlows = role === 'flows' || role === 'all';
    const isPlugins = role === 'plugins' || role === 'all';
    const isWebResources = role === 'webresources' || role === 'all';

    // ---- Data model ----
    if (isDataModel) {
      const manifest = parseSolutionManifest(unpackedPath);
      const tables = parseSolution(unpackedPath, solConfig, publisherPrefix);

      manifest.tables = tables;
      allSolutions.push(manifest);

      if (!mergedSolution) {
        mergedSolution = manifest;
      } else {
        mergedSolution.tables = [...mergedSolution.tables, ...tables];
      }

      writeOverviewMarkdown(manifest, outputPath);

      if (config.components.tables) {
        for (const table of tables) {
          writeTableMarkdown(table, `${outputPath}/tables`, solConfig);
        }
      }
    }

    // ---- Flows ----
    if (isFlows && config.components.flows) {
      const flows = parseAllFlows(unpackedPath);
      allFlows.push(...flows);
      writeFlowMarkdown(flows, outputPath);
    }

    // ---- Plugins ----
    if (isPlugins && config.components.plugins) {
      const assemblies = parseAllPlugins(unpackedPath);
      allPluginAssemblies.push(...assemblies);
      writePluginMarkdown(assemblies, outputPath);
      console.log(`  Parsed ${assemblies.length} plugin assemblies from: ${unpackedPath}`);
    }

    // ---- Web Resources ---- (Phase 3 — parser not yet built)
    if (isWebResources && config.components.webResources) {
      console.log(`  Web resource parsing not yet implemented for: ${unpackedPath}`);
    }
  }

  // ---- Wiki publish ----
  if (config.wiki && mergedSolution) {
    const pages = buildWikiPages(config, allSolutions, mergedSolution, allFlows, allPluginAssemblies);
    await publishToWiki(config.wiki, pages);
  }
}

main().catch(console.error);