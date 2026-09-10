# Public agent readiness

Owner: SCHNGN. Audit source: https://isitagentready.com/schngn.com,
retrieved 2026-09-10. HQ coordination: miktomic/mg-hq#7 (baseline) and #10 (delegated access).

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

DEC-17 approves read-only documentation and explicitly consented account access.
The public OAuth authorization server, protected-resource metadata, OAuth guide
at `/auth.md`, hosted MCP, paginated REST and A2A services now have executable
contracts and regression tests. The exact OAuth resource is `https://schngn.com`
for all three agent endpoints. Tokens do not authorize Clerk-only account APIs.
`services.mjs` checks these contracts against the final production artifact.

WebMCP uses `document.modelContext` and the earlier `navigator.modelContext`
where available. Tools only calculate explicit inputs locally, with no saved
state access. Browser tests execute both registrations, inspect requests and
storage, and exercise consent/revocation and account switching.

MCP server cards use the experimental v1 schema and are published at both
`/mcp/server-card` and the scanner's older well-known URL. A2A uses the 1.0 JSON-RPC
binding with immediate structured messages; no streaming, writes, hosted
calculation, task retention or free-text model processing is advertised.

`/auth.md` documents the real OAuth code/PKCE and DCR/CIMD flow. It deliberately
does not advertise WorkOS `agent_auth`, identity assertions, claim tokens or
ID-JAG. A scanner's older advice cannot authorize a fabricated protocol.
Web Bot Auth and commerce remain conditional on an approved future service.

DNS-AID uses an SVCB organization index targeting the live HTTPS origin. Standard
ALPN and explicit port parameters identify the transport; the origin's HTTP Link
header leads to the API catalog. Draft custom key numbers are not invented.
Cloudflare DNSSEC activation and a validating resolver's AD response are checked
separately. `configure-agent-dns.mjs` owns only its marked discovery record.

Hosted anonymous calculation remains prohibited by DEC-16. Local runtime and
browser tools never transmit dates; an external agent/model provider may still
handle inputs and results. Saved account data is shared only after DEC-17 consent.

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

## Delegated-access release checks

`bun run prepr` includes real-provider OAuth code/PKCE, resource/scope/replay,
retention and revocation tests, D1 transaction/principal tests, MCP/A2A execution,
all-locale privacy disclosure, and browser consent/account-switch/WebMCP checks.
The final workerd preview also registers a synthetic ephemeral client in local KV.
Production smoke is read-only and must not silently mint account grants.

The provider's revocation state is eventually consistent; D1 is the immediate
extra deny-list. Both token and user-initiated grant revocation are exercised.
Expired metadata cleanup is hourly. There is no OAuth token or trip-body logging.
The public registry, tokens, grants, input/output sizes and pagination all have
independent bounds. Never relax a required check to obtain a scanner score.

Current primary sources reviewed 2026-09-10:
- https://github.com/cloudflare/workers-oauth-provider
- https://modelcontextprotocol.io/specification/latest/basic/authorization
- https://github.com/modelcontextprotocol/experimental-ext-server-card
- https://developer.chrome.com/docs/ai/webmcp/imperative-api
- https://webmachinelearning.github.io/webmcp/
- https://a2a-protocol.org/v1.0.0/specification/
- https://github.com/workos/auth.md
- https://www.rfc-editor.org/rfc/rfc9727.html
- https://datatracker.ietf.org/doc/html/draft-mozleywilliams-dnsop-dnsaid-02

Each explicit approval creates an independent connection. Approving again does not revoke existing connections; revoke each connection from Account & data or let its 10-minute token expire. A2A JSON-RPC requests require the `A2A-Version: 1.0` header.
