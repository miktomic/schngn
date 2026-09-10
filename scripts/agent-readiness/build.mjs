import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { toMarkdown } from './markdown.mjs';
import { assertPublicDocument, assertMarkdownLinks } from './content-check.mjs';

const root = resolve(import.meta.dirname, '../..');
const output = resolve(root, 'apps/web/.svelte-kit/cloudflare');
const pages = {};
const sitemap = await readFile(resolve(output, 'sitemap.xml'), 'utf8');
for (const [, canonical] of sitemap.matchAll(/<loc>(.*?)<\/loc>/g)) {
  const path = new URL(canonical).pathname;
  // The app is a client-only private workspace, not a public document.
  if (path.endsWith('/app')) continue;
  const filename = path === '/' ? 'index' : path.slice(1);
  const html = await readFile(resolve(output, `${filename}.html`), 'utf8');
  const target = `/agent-content/${filename}.md`;
  await mkdir(resolve(output, 'agent-content', filename, '..'), { recursive: true });
  assertPublicDocument(html, canonical);
  const markdown = toMarkdown(html, canonical);
  assertMarkdownLinks(html, markdown, canonical);
  await writeFile(resolve(output, target.slice(1)), markdown);
  pages[path] = target;
}
// Publish the existing skill with its relative references intact.
const skillRoot = resolve(root, '.agents/skills/schngn');
const published = resolve(output, '.well-known/agent-skills/schngn');
await mkdir(resolve(published, 'references'), { recursive: true });
for (const file of ['SKILL.md', 'references/setup.md', 'references/contract.md']) {
  await copyFile(resolve(skillRoot, file), resolve(published, file));
}
const skill = await readFile(resolve(published, 'SKILL.md'));
const archive = resolve(output, '.well-known/agent-skills/schngn.tar.gz');
// Archive only the curated files, never incidental/untracked skill-directory content.
execFileSync('tar', ['-czf', archive, '-C', published, 'SKILL.md', 'references/setup.md', 'references/contract.md'], { env: { ...process.env, COPYFILE_DISABLE: '1' } });
const artifact = await readFile(archive);
await writeFile(resolve(output, '.well-known/agent-skills/index.json'), JSON.stringify({
  $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
  skills: [{ name: 'schngn', type: 'archive', description: skill.toString().match(/^description: (.+)$/m)[1],
    url: '/.well-known/agent-skills/schngn.tar.gz', digest: `sha256:${createHash('sha256').update(artifact).digest('hex')}` }]
}, null, 2));
await copyFile(resolve(output, '_worker.js'), resolve(output, '../cloudflare-tmp/app-worker.js'));
await copyFile(resolve(root, 'apps/web/agent-readiness/negotiate.mjs'), resolve(output, '../cloudflare-tmp/negotiate.mjs'));
await writeFile(resolve(output, '_worker.js'), `import app from '../cloudflare-tmp/app-worker.js';\nimport { agentResponse } from '../cloudflare-tmp/negotiate.mjs';\nconst pages = ${JSON.stringify(pages)};\nexport default { ...app, fetch(request, env, ctx) { return agentResponse(request, env, () => app.fetch(request, env, ctx), pages); } };\n`);
console.log(`Agent readiness: ${Object.keys(pages).length} public Markdown pages and verified skill discovery generated.`);
