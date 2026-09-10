import assert from 'node:assert/strict';

const VARY_ACCEPT = /(?:^|,)\s*accept\s*(?:,|$)/i;
const HTML = /text\/html/i;
const MARKDOWN = /text\/markdown/i;
const NO_INDEX = /(?:^|[,\s])(?:noindex|none|nosnippet)(?:$|[,\s])/i;

export async function assertPublicHttp(get) {
  const guide = await get('/llms.txt');
  assert.equal(guide.status, 200, 'llms.txt must resolve');
  assert.match(guide.headers.get('content-type') || '', /text\/(plain|markdown)/i);
  const guideText = await guide.text();
  assert.ok(guideText.length > 100, 'llms.txt must contain useful documentation');
  assert.doesNotMatch(guideText, /<!doctype|<html/i);
  let markdown;
  // Same canonical URL, both request orders; do not use a cache-busting query.
  for (const accept of ['text/html', 'text/markdown', 'text/html', 'text/markdown']) {
    const result = await get('/', { headers: { Accept: accept } });
    assert.equal(result.status, 200, accept);
    assert.match(result.headers.get('content-type') || '', accept === 'text/html' ? HTML : MARKDOWN);
    assert.match(result.headers.get('vary') || '', VARY_ACCEPT);
    assert.doesNotMatch(result.headers.get('x-robots-tag') || '', NO_INDEX);
    const text = await result.text();
    if (accept === 'text/markdown') {
      assert.equal(result.headers.get('set-cookie'), null, 'public Markdown must not set cookies');
      if (markdown !== undefined) assert.equal(text, markdown, 'unstable public Markdown');
      markdown = text;
    }
  }
  for (const accept of ['*/*', 'text/*', 'text/markdown;q=0,*/*;q=1']) {
    const result = await get('/', { headers: { Accept: accept } });
    assert.equal(result.status, 200);
    assert.match(result.headers.get('content-type') || '', HTML);
    await result.arrayBuffer();
  }
  const isolated = await get('/?agent_audit=synthetic', { headers: {
    Accept: 'text/markdown', Cookie: 'agent_audit=synthetic', Authorization: 'Bearer agent-audit-invalid',
  } });
  assert.equal(isolated.status, 200);
  assert.match(isolated.headers.get('content-type') || '', MARKDOWN);
  assert.equal(await isolated.text(), markdown, 'public output depends on query/cookie/auth input');
  const head = await get('/', { method: 'HEAD', headers: { Accept: 'text/markdown' } });
  assert.match(head.headers.get('vary') || '', VARY_ACCEPT);
  assert.equal(await head.text(), '');
}
