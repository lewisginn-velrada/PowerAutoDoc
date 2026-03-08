import type { WikiConfig } from '../config/index.js';

export interface WikiPage {
  /** Full path from wiki root e.g. /Leave Management (App)/Data Model/vel_leaverequest */
  path: string;
  /** Markdown content */
  content: string;
}

interface WikiPageGetResult {
  path: string;
  eTag?: string;
}

// -----------------------------------------------
// Helpers
// -----------------------------------------------
function buildBaseUrl(config: WikiConfig): string {
  return (
    `https://dev.azure.com/${encodeURIComponent(config.organisation)}/` +
    `${encodeURIComponent(config.project)}/_apis/wiki/wikis/` +
    `${encodeURIComponent(config.wikiIdentifier)}/pages`
  );
}

function buildAuthHeader(pat: string): string {
  return `Basic ${Buffer.from(`:${pat}`).toString('base64')}`;
}

// -----------------------------------------------
// GET page — returns eTag if exists, null if 404
// -----------------------------------------------
async function getPage(config: WikiConfig, pagePath: string): Promise<WikiPageGetResult | null> {
  const url = `${buildBaseUrl(config)}?path=${encodeURIComponent(pagePath)}&api-version=7.0`;

  const response = await fetch(url, {
    headers: {
      'Authorization': buildAuthHeader(config.pat),
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`GET wiki page failed [${response.status}] "${pagePath}": ${await response.text()}`);
  }

  return {
    path: pagePath,
    eTag: response.headers.get('ETag') ?? undefined,
  };
}

// -----------------------------------------------
// PUT page — creates or overwrites
// -----------------------------------------------
async function putPage(
  config: WikiConfig,
  pagePath: string,
  content: string,
  eTag?: string
): Promise<void> {
  const url = `${buildBaseUrl(config)}?path=${encodeURIComponent(pagePath)}&api-version=7.0`;

  const headers: Record<string, string> = {
    'Authorization': buildAuthHeader(config.pat),
    'Content-Type': 'application/json',
  };

  // Only send If-Match when updating an existing page
  // For new pages, omit the header entirely — ADO rejects '*'
  if (eTag) {
    headers['If-Match'] = eTag;
  }

  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    throw new Error(`PUT wiki page failed [${response.status}] "${pagePath}": ${await response.text()}`);
  }

  const verb = response.status === 201 ? 'Created' : 'Updated';
  console.log(`  ✓ ${verb}: ${pagePath}`);
}

// -----------------------------------------------
// Ensure a parent page exists (placeholder if not)
// -----------------------------------------------
async function ensurePage(config: WikiConfig, pagePath: string): Promise<void> {
  const existing = await getPage(config, pagePath);
  if (!existing) {
    const title = pagePath.split('/').filter(Boolean).pop() ?? pagePath;
    await putPage(config, pagePath, `# ${title}\n`, undefined);
  }
}

// -----------------------------------------------
// Main publish function
// -----------------------------------------------
export async function publishToWiki(
  config: WikiConfig,
  pages: WikiPage[]
): Promise<void> {
  console.log(`\nPublishing ${pages.length} pages to ${config.wikiIdentifier}...`);
  console.log(`Organisation: ${config.organisation} · Project: ${config.project}\n`);

  // Collect all unique intermediate parent paths
  const parentPaths = new Set<string>();
  for (const page of pages) {
    const parts = page.path.split('/').filter(Boolean);
    for (let i = 1; i < parts.length; i++) {
      parentPaths.add('/' + parts.slice(0, i).join('/'));
    }
  }

  // Ensure parents exist top-down (shortest path first)
  const sortedParents = [...parentPaths].sort(
    (a, b) => a.split('/').length - b.split('/').length
  );

  for (const parentPath of sortedParents) {
    const isContentPage = pages.some(p => p.path === parentPath);
    if (!isContentPage) {
      await ensurePage(config, parentPath);
    }
  }

  // Publish all pages — always overwrite
  for (const page of pages) {
    try {
      const existing = await getPage(config, page.path);
      await putPage(config, page.path, page.content, existing?.eTag);
    } catch (err) {
      console.error(`  ✗ Failed: ${page.path}`, err);
    }
  }

  console.log('\nPublish complete.');
}
