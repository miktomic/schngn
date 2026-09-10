import { expect, test } from 'bun:test';
import { assertPublicDocument, assertMarkdownLinks } from '../../../scripts/agent-readiness/content-check.mjs';
const canonical = 'https://example.com/guide';
const html = `<html lang="en"><head><title>Reviewed guide</title><link rel="canonical" href="${canonical}"></head><body><main><h1>Guide</h1><p>This reviewed public guide has enough useful content to explain the workflow and its important limitations.</p><a href="/source">Official source</a></main><footer><a href="/privacy">Privacy</a></footer></body></html>`;
test('accepts readable canonical documents and complete source links', () => {
  expect(() => assertPublicDocument(html, canonical)).not.toThrow();
  expect(() => assertMarkdownLinks(html, '[Source](https://example.com/source) [Privacy](https://example.com/privacy)', canonical)).not.toThrow();
});
test('blocks invisible content, indexing mistakes, bad canonicals and malformed structured data', () => {
  for (const broken of [
    html.replace('lang="en"', 'lang=""'),
    html.replace('<main>', '<div>').replace('</main>', '</div>'),
    html.replace('rel="canonical"', 'rel="alternate"'),
    html.replace(canonical, 'https://wrong.example/'),
    html.replace('</head>', '<meta name="robots" content="noindex"></head>'),
    html.replace('</head>', '<script type="application/ld+json">{bad}</script></head>'),
  ]) expect(() => assertPublicDocument(broken, canonical)).toThrow();
});
test('rejects Markdown that drops source attribution or footer links', () => {
  expect(() => assertMarkdownLinks(html, '[Source](https://example.com/source)', canonical)).toThrow('omitted link');
});
