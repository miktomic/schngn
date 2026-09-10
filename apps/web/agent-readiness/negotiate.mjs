// An explicit Markdown preference is required. Wildcards keep browser HTML.
export function wantsMarkdown(accept = '') {
  const ranges = accept.toLowerCase().split(',').map((range) => {
    const [type, ...parameters] = range.trim().split(';');
    const q = parameters.find((part) => part.trim().startsWith('q='));
    const quality = q ? Number(q.trim().slice(2)) : 1;
    return { type: type.trim(), quality: Number.isFinite(quality) && quality >= 0 && quality <= 1 ? quality : 0 };
  });
  const qualityFor = (type) => {
    const matches = ranges.filter((range) => range.type === type);
    return matches.length ? Math.max(...matches.map((range) => range.quality)) : undefined;
  };
  const markdown = qualityFor('text/markdown') ?? 0;
  const html = qualityFor('text/html') ?? qualityFor('text/*') ?? qualityFor('*/*') ?? 0;
  return markdown > 0 && markdown >= html;
}

export async function agentResponse(request, env, next, pages) {
  const url = new URL(request.url);
  const page = pages[url.pathname.replace(/\/$/, '') || '/'];
  if (!page || !['GET', 'HEAD'].includes(request.method) || url.hostname === 'www.schngn.com') return next();
  let response;
  if (wantsMarkdown(request.headers.get('accept') || '')) {
    url.pathname = page;
    url.search = '';
    // Build-only public content: never forward cookies, auth, or query inputs.
    response = await env.ASSETS.fetch(new Request(url, { method: request.method }));
    if (response.status !== 200) return new Response('Public Markdown unavailable', { status: 503 });
    response = new Response(response.body, response);
    response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
    response.headers.set('Cache-Control', 'public, max-age=300');
    response.headers.set('Content-Location', page);
    response.headers.set('X-Content-Type-Options', 'nosniff');
  } else {
    response = await next();
    response = new Response(response.body, response);
  }
  // Keep shared CDN keys from mixing negotiated representations; assets cache separately.
  response.headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
  const vary = response.headers.get('Vary');
  response.headers.set('Vary', [vary, 'Accept'].filter(Boolean).join(', '));
  response.headers.append('Link', `<${page}>; rel="alternate"; type="text/markdown", </llms.txt>; rel="service-doc"; type="text/plain", </.well-known/agent-skills/index.json>; rel="https://agentskills.io/discovery"; type="application/json"`);
  return response;
}
