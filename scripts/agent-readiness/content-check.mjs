import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';

const NO_INDEX = /(?:^|[,\s])(?:noindex|none|nosnippet)(?:$|[,\s])/i;
const SPACE = /\s+/g;
const normalize = (text) => text.replace(SPACE, ' ').trim();

// This is a public-document gate, not a general WCAG or private-app validator.
export function assertPublicDocument(html, canonical) {
  const { document } = parseHTML(html);
  assert.ok(document.title?.trim(), `${canonical}: missing title`);
  assert.ok(document.documentElement.lang?.trim(), `${canonical}: missing language`);
  const main = document.querySelector('main');
  assert.ok(main, `${canonical}: missing main landmark`);
  assert.ok(main.querySelector('h1')?.textContent.trim(), `${canonical}: missing primary heading`);
  const links = document.querySelectorAll('link[rel="canonical"]');
  assert.equal(links.length, 1, `${canonical}: expected one canonical`);
  assert.equal(links[0].getAttribute('href'), canonical, `${canonical}: canonical mismatch`);
  assert.equal(new URL(canonical).protocol, 'https:', `${canonical}: canonical must use HTTPS`);
  for (const meta of document.querySelectorAll('meta[name]')) {
    if (['robots', 'googlebot'].includes(meta.getAttribute('name').toLowerCase())) {
      assert.doesNotMatch(meta.getAttribute('content') || '', NO_INDEX, `${canonical}: indexing suppressed`);
    }
  }
  for (const node of document.querySelectorAll('script[type="application/ld+json"]')) {
    assert.doesNotThrow(() => JSON.parse(node.textContent), `${canonical}: invalid JSON-LD`);
  }
  for (const node of main.querySelectorAll('script, style, [hidden], [aria-hidden="true"]')) node.remove();
  assert.ok(normalize(main.textContent).length > 80, `${canonical}: empty public content`);
}

export function assertMarkdownLinks(html, markdown, canonical) {
  const { document } = parseHTML(html);
  for (const node of document.querySelectorAll('script, style, [hidden], [aria-hidden="true"]')) node.remove();
  // Links in the reviewed main/footer carry source citations and legal limits.
  for (const link of document.querySelectorAll('main a[href], footer a[href]')) {
    const href = link.getAttribute('href');
    if (!href || !normalize(link.textContent)) continue;
    const target = new URL(href, canonical);
    if (!['https:', 'http:'].includes(target.protocol)) continue;
    assert.ok(markdown.includes(target.href), `${canonical}: Markdown omitted link ${target.href}`);
  }
}
