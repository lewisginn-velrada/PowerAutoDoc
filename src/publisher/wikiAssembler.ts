import type { DocGenConfig } from '../config/index.js';
import type { SolutionModel, FlowModel, PluginAssemblyModel } from '../ir/index.js';
import type { WikiPage } from './wikiPublisher.js';
import { renderOverviewMarkdown } from '../renderers/index.js';
import { renderTableMarkdown } from '../renderers/index.js';
import { renderFlowSummaryMarkdown, renderSingleFlowMarkdown } from '../renderers/index.js';
import { renderPluginSummaryMarkdown, renderAssemblyIndexMarkdown, renderSinglePluginTypeMarkdown } from '../renderers/index.js';

export function buildWikiPages(
  config: DocGenConfig,
  solutions: SolutionModel[],
  mergedSolution: SolutionModel,
  flows: FlowModel[],
  pluginAssemblies: PluginAssemblyModel[] = []
): WikiPage[] {
  if (!config.wiki) return [];

  const base = config.wiki.parentPath.replace(/\/$/, '');
  const pages: WikiPage[] = [];

  // ---- Overview ----
  pages.push({
    path: `${base}/Overview`,
    content: renderOverviewMarkdown(solutions, flows, pluginAssemblies),
  });

  // ---- Data Model ----
  pages.push({
    path: `${base}/Data Model`,
    content: `# Data Model\n\n[[_TOSP_]]\n`,
  });

  for (const table of mergedSolution.tables) {
    pages.push({
      path: `${base}/Data Model/${table.displayName}`,
      content: renderTableMarkdown(table, config),
    });
  }

  // ---- Automation ----
  const hasFlows = flows.length > 0;
  const validAssemblies = pluginAssemblies.filter(a => a.assemblyName.trim() !== '');
  const hasPlugins = validAssemblies.length > 0;

  if (hasFlows || hasPlugins) {
    pages.push({
      path: `${base}/Automation`,
      content: `# Automation\n\nPower Automate flows and plugins in this solution.\n`,
    });

    // ---- Flows ----
    if (hasFlows) {
      const flowsBasePath = `${base}/Automation/Flows`;
      pages.push({
        path: flowsBasePath,
        content: renderFlowSummaryMarkdown(flows, flowsBasePath),
      });

      for (const flow of flows) {
        pages.push({
          path: `${flowsBasePath}/${flow.name}`,
          content: renderSingleFlowMarkdown(flow),
        });
      }
    }

    // ---- Plugins ----
    if (hasPlugins) {
      const pluginsBasePath = `${base}/Automation/Plugins`;

      pages.push({
        path: pluginsBasePath,
        content: renderPluginSummaryMarkdown(validAssemblies),
      });

      for (const assembly of validAssemblies) {
        const safeAssemblyName = assembly.assemblyName.replace(/\./g, '-');
        const assemblyBasePath = `${pluginsBasePath}/${safeAssemblyName}`;

        pages.push({
          path: assemblyBasePath,
          content: renderAssemblyIndexMarkdown(assembly, assemblyBasePath),
        });

        for (const fullName of assembly.pluginTypeNames) {
          const shortName = fullName.startsWith(assembly.assemblyName + '.')
            ? fullName.slice(assembly.assemblyName.length + 1)
            : fullName;
          const steps = assembly.steps.filter(s => s.className === shortName);

          pages.push({
            path: `${assemblyBasePath}/${shortName}`,
            content: renderSinglePluginTypeMarkdown(shortName, steps, assembly),
          });
        }
      }
    }
  }

  return pages;
}