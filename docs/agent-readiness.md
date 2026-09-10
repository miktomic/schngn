# Public agent readiness

Owner: SCHNGN. Audit source: https://isitagentready.com/schngn.com,
retrieved 2026-09-10. HQ coordination: miktomic/mg-hq#7.

## Contract

Public documentation must remain discoverable without sign-in or JavaScript:
real robots.txt, complete canonical sitemap, useful HTTP Link headers, llms.txt,
ARD documentation catalog, and a digest-verified skills index. Public content
permits search and AI input; model training is not part of the agent-use grant.
Robots directives describe crawler preferences; they are never access control.

`Accept: text/markdown` selects a Markdown representation of the same reviewed
public HTML. The build generates every locale from prerendered pages using
Turndown, with GFM tables, source URLs, absolute links, and hidden/script content
removed. Do not create independently authored legal/rule summaries for agents.
HTML stays the default; explicit q=0 and stronger HTML preference are honored.
Both variants vary on Accept. GET and HEAD work; writes retain normal behavior.

The Cloudflare build wraps the adapter's Worker with a public-path allowlist.
`run_worker_first` is required for negotiation before static assets; immutable
app/brand/icon assets and API paths retain their existing dispatch. Generated
Markdown assets contain public build output only. Never forward cookies,
Authorization, or query strings into the Markdown asset request. Never convert
account, API, guest trip, or personalized pages. Missing resources are real 404s.

The repository skill and all relative references ship together as an archive.
The discovery index hashes the exact archive bytes at build time. Never publish
placeholder digests or repurpose internal AGENTS.md as a public skill.

## Protocol applicability

The baseline scanner score was 20/100. Applicable defects: discovery headers,
Markdown, Content Signals, skills discovery, and ARD. Robots and sitemap passed.

OAuth authorization-server discovery, protected-resource metadata, auth.md
registration, hosted MCP cards, A2A, Web Bot Auth signing, DNS-AID service records,
and payment protocols are not implemented product services. Do not fabricate
endpoints or credentials to raise a score. Clerk sign-in is not an OAuth
agent-delegation contract. DNS-AID is deferred until a remotely discoverable
service is approved. WebMCP is a potential browser-local feature, not a
requirement to expose user data; the existing local CLI/stdio MCP is the
supported calculation contract. Revisit these entries when capabilities change.

Hosted anonymous calculation remains prohibited by DEC-16. The operator's
local runtime never transmits dates; an agent host/model provider may handle
inputs/results under its own policies. Discovery does not change this boundary.

## Change and release gates

- Every public route or locale change updates the sitemap and checks Markdown
  output, links, disclaimers, and language. Builds fail if a sitemap page is absent.
- Every skill change rebuilds the archive and digest together.
- Run `bun run check`, then `bun run smoke:agent-readiness -- <base-url>` against
  a Cloudflare preview and again after deployment.
- Verify HTML/Markdown order in both directions, HEAD, missing routes, and
  unauthenticated API behavior. Check public skill CORS and content types.
- Re-run isitagentready.com on the canonical site after deployment. Record the
  raw score and each unsupported protocol separately; never label a reduced
  check selection as a full 100/100 result.
- A source-level fix is not a production fix. Do not close the audit until the
  production HTTP checks and external rescan pass for applicable requirements.

References (checked 2026-09-10):
https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
https://github.com/cloudflare/agent-skills-discovery-rfc (draft 0.2.0)
https://agenticresourcediscovery.org/ (draft; ai-catalog data model 1.0)
https://www.rfc-editor.org/rfc/rfc8288

Negotiated public Markdown has a five-minute browser cache lifetime. Shared
Cloudflare CDN caching of canonical variants is disabled so a cache key cannot
mix HTML and Markdown; underlying generated assets remain independently cached.

## Pre-deployment skill and expanded checks

Use `$agent-readiness` before website releases. The shared skill lives in MG HQ;
this repository owns enforcement and does not load the personal skill in CI.
Static builds validate canonical identity, title, language, main/heading content,
indexability and JSON-LD syntax. Markdown must retain reviewed source/footer
links. HTTP tests additionally verify llms.txt, both representation orders,
wildcards, HEAD variation and synthetic query/cookie/auth isolation.

CI checks the final production build before inactive upload; `bun run deploy`
also checks its final build. Rebuilding requires another check. Changed UI,
content claims, auth, or protocol capabilities still require browser/manual
review; these automatic checks are not a complete accessibility/security audit.
Live DNS/WAF/CDN and the full external score remain post-deployment evidence.
