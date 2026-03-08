import type { DocGenConfig } from '../config/index.js';
import type { SolutionModel, FlowModel } from '../ir/index.js';
import type { WikiPage } from './wikiPublisher.js';
import { renderOverviewMarkdown } from '../renderers/index.js';
import { renderTableMarkdown } from '../renderers/index.js';
import { renderFlowSummaryMarkdown, renderSingleFlowMarkdown } from '../renderers/index.js';

/**
 * Builds the full ordered list of wiki pages from parsed IR.
 * Each page has a path and markdown content ready to publish.
 */
export function buildWikiPages(
  config: DocGenConfig,
  solution: SolutionModel,
  flows: FlowModel[]
): WikiPage[] {
  if (!config.wiki) return [];

  const base = config.wiki.parentPath.replace(/\/$/, '');
  const pages: WikiPage[] = [];

  // ---- Overview ----
  pages.push({
    path: `${base}/Overview`,
    content: renderOverviewMarkdown(solution),
  });

  // ---- Data Model ----
  const tableLinks = solution.tables
    .map(t => `- [${t.displayName}](${base}/Data Model/${t.displayName})`)
    .join('\n');

  pages.push({
    path: `${base}/Data Model`,
    content: `# Data Model\n\n${solution.tables.length} table(s) in this solution.\n\n${tableLinks}\n`,
  });

  for (const table of solution.tables) {
    pages.push({
      path: `${base}/Data Model/${table.displayName}`,
      content: renderTableMarkdown(table, config),
    });
  }

  // ---- Automation ----
  if (flows.length > 0) {
    pages.push({
      path: `${base}/Automation`,
      content: `# Automation\n\nPower Automate flows and classic workflows in this solution.\n`,
    });

    // Flows index — summary table with links to child pages
    const flowsBasePath = `${base}/Automation/Flows`;
    pages.push({
      path: flowsBasePath,
      content: renderFlowSummaryMarkdown(flows, flowsBasePath),
    });

    // One page per flow
    for (const flow of flows) {
      pages.push({
        path: `${flowsBasePath}/${flow.name}`,
        content: renderSingleFlowMarkdown(flow),
      });
    }
  }

  return pages;
}
