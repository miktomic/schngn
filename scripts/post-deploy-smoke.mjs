#!/usr/bin/env node

const BASE_URL = process.env.SCHNGN_BASE_URL ?? 'https://schngn.com';
const WWW_URL = process.env.SCHNGN_WWW_URL ?? 'https://www.schngn.com';
const timeoutMs = Number(process.env.SCHNGN_SMOKE_TIMEOUT_MS ?? 15000);
const expectWwwRedirect = parseBooleanEnv('SCHNGN_SMOKE_EXPECT_WWW_REDIRECT', true);

const checks = [];
const warnings = [];

const requiredSecurityHeaders = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=()'
};

const requiredDocumentCspTokens = [
  "default-src 'self'",
  "script-src 'self'",
  'https://clerk.schngn.com',
  'https://challenges.cloudflare.com',
  "connect-src 'self' https://clerk.schngn.com https://plausible.io",
  "img-src 'self' data: https://img.clerk.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests'
];

const publicChecks = [
  { path: '/', type: 'text/html', contains: ['Schengen 90/180 calculator', 'https://schngn.com/'] },
  { path: '/app', type: 'text/html', contains: [] },
  { path: '/accuracy', type: 'text/html', contains: ['Accuracy evidence', 'European Commission short-stay calculator'] },
  { path: '/explainer', type: 'text/html', contains: ['Explainer', '90 days in any 180 days'] },
  { path: '/faq', type: 'text/html', contains: ['Frequently asked questions', 'What does “90 days in any 180 days” mean?'] },
  { path: '/agents', type: 'text/html', contains: ['Put SCHNGN behind your agent', 'codex mcp add schngn -- schngn-mcp'] },
  { path: '/contact', type: 'text/html', contains: ['How can we help?', 'Send message'] },
  { path: '/privacy', type: 'text/html', contains: ['Privacy Policy'] },
  { path: '/terms', type: 'text/html', contains: ['Terms of Use'] },
  { path: '/manifest.json', type: 'application/json', contains: ['SCHNGN', '/app', '/icons/icon-192.png'] },
  { path: '/service-worker.js', type: 'text/javascript', contains: ['SCHNGN_STATIC_CACHE', '/app'] },
  { path: '/favicon.png', type: 'image/png', contains: [] },
  { path: '/brand/schngn-wordmark.png', type: 'image/png', contains: [] },
  { path: '/brand/schngn-social.png', type: 'image/png', contains: [] },
  { path: '/icons/icon-maskable-512.png', type: 'image/png', contains: [] },
  { path: '/robots.txt', type: 'text/plain', contains: ['Sitemap: https://schngn.com/sitemap.xml'] },
  { path: '/sitemap.xml', type: 'application/xml', contains: ['<loc>https://schngn.com/</loc>', '<loc>https://schngn.com/app</loc>', '<loc>https://schngn.com/accuracy</loc>', '<loc>https://schngn.com/explainer</loc>', '<loc>https://schngn.com/faq</loc>', '<loc>https://schngn.com/agents</loc>', '<loc>https://schngn.com/contact</loc>', '<loc>https://schngn.com/privacy</loc>', '<loc>https://schngn.com/terms</loc>'] }
];

const anonymousAccountChecks = [
  { name: 'GET /api/account/trips rejects guests', path: '/api/account/trips', method: 'GET' },
  {
    name: 'PUT /api/account/trips rejects guests before sync parsing',
    path: '/api/account/trips',
    method: 'PUT',
    body: { expectedRevision: 0, consent: true, trips: [] }
  },
  { name: 'DELETE /api/account rejects guests', path: '/api/account', method: 'DELETE' }
];

function fail(name, message) {
  checks.push({ name, ok: false, message });
}

function pass(name, message) {
  checks.push({ name, ok: true, message });
}

function parseBooleanEnv(name, defaultValue) {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  if (/^(1|true|yes)$/i.test(value)) return true;
  if (/^(0|false|no)$/i.test(value)) return false;
  throw new Error(`${name} must be true or false.`);
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, redirect: init.redirect ?? 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

function documentContentSecurityPolicy(response, text) {
  const header = response.headers.get('content-security-policy');
  if (header) return header;

  // SvelteKit cannot safely nonce prerendered HTML. It writes a build-specific
  // hash policy into a meta tag instead; dynamic pages receive a response header.
  return text.match(/<meta\s+http-equiv="content-security-policy"\s+content="([^"]+)"/i)?.[1] ?? '';
}

function assertDocumentContentSecurityPolicy(response, text) {
  const policy = documentContentSecurityPolicy(response, text);
  if (!policy) throw new Error('missing SvelteKit-generated document Content-Security-Policy');

  for (const token of requiredDocumentCspTokens) {
    if (!policy.includes(token)) throw new Error(`Content-Security-Policy is missing ${token}`);
  }

  const scriptDirective = policy
    .split(';')
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith('script-src '));
  if (!scriptDirective || !/'(?:nonce|sha256)-/.test(scriptDirective)) {
    throw new Error('script-src must contain a SvelteKit nonce or SHA-256 hash');
  }
  if (scriptDirective.includes("'unsafe-inline'") || scriptDirective.includes("'unsafe-eval'")) {
    throw new Error('script-src must not allow unsafe-inline or unsafe-eval');
  }
  for (const developmentOnlyOrigin of ['clerk.accounts.dev', 'localhost', '127.0.0.1']) {
    if (policy.includes(developmentOnlyOrigin)) {
      throw new Error(`production Content-Security-Policy contains ${developmentOnlyOrigin}`);
    }
  }
}

async function checkPublicAsset({ path, type, contains }) {
  const url = new URL(path, BASE_URL).toString();
  const name = `GET ${path}`;
  try {
    const response = await fetchWithTimeout(url);
    const text = await response.text();
    const contentType = response.headers.get('content-type') ?? '';

    if (response.status !== 200) return fail(name, `expected 200, got ${response.status}`);
    if (!contentType.includes(type)) return fail(name, `expected content-type containing ${type}, got ${contentType}`);
    for (const needle of contains) {
      if (!text.includes(needle)) return fail(name, `missing ${needle}`);
    }
    for (const [header, expectedValue] of Object.entries(requiredSecurityHeaders)) {
      const actualValue = response.headers.get(header) ?? '';
      if (!actualValue.includes(expectedValue)) return fail(name, `expected ${header} to contain ${expectedValue}, got ${actualValue || '(missing)'}`);
    }
    if (type === 'text/html') assertDocumentContentSecurityPolicy(response, text);
    if (text.includes('www.schngn.com')) return fail(name, 'contains non-canonical www.schngn.com');
    pass(name, `${response.status} ${contentType}`);
  } catch (error) {
    fail(name, error.message);
  }
}

async function checkAnonymousAccountBoundary({ name, path, method, body }) {
  try {
    const response = await fetchWithTimeout(new URL(path, BASE_URL), {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const cacheControl = response.headers.get('cache-control') ?? '';
    const vary = response.headers.get('vary') ?? '';
    const result = await response.json().catch(() => ({}));

    if (response.status !== 401) return fail(name, `expected 401, got ${response.status}`);
    if (!cacheControl.toLowerCase().includes('no-store')) {
      return fail(name, `expected cache-control to contain no-store, got ${cacheControl || '(missing)'}`);
    }
    if (!vary.split(',').some((value) => value.trim() === '*')) {
      return fail(name, `expected vary to contain *, got ${vary || '(missing)'}`);
    }
    if (result.error !== 'authentication_required') {
      return fail(name, `expected authentication_required, got ${JSON.stringify(result)}`);
    }

    pass(name, '401 authentication_required with no-store and Vary: *');
  } catch (error) {
    fail(name, error.message);
  }
}

async function checkWwwRedirect() {
  const name = 'www canonical redirect';
  try {
    const response = await fetchWithTimeout(WWW_URL, { method: 'GET', redirect: 'manual' });
    const location = response.headers.get('location') ?? '';
    if ([301, 302, 307, 308].includes(response.status)) {
      if (!location.startsWith(BASE_URL)) return fail(name, `expected apex location, got ${location}`);
      pass(name, `${response.status} ${location}`);
      return;
    }

    if (response.status === 200) {
      const text = await response.text();
      if (text.includes('https://schngn.com/') && !text.includes('https://www.schngn.com')) {
        if (expectWwwRedirect) {
          return fail(name, `${WWW_URL} serves apex-canonical content with HTTP 200 instead of redirecting.`);
        }
        warnings.push({
          name,
          message:
            `${WWW_URL} currently serves apex-canonical content with HTTP 200. Add a Cloudflare Redirect Rule/Bulk Redirect for strict www→apex redirects.`
        });
        pass(name, 'strict www redirect check explicitly disabled; apex-canonical content is present');
        return;
      }
    }

    return fail(name, `expected redirect or apex-canonical 200, got ${response.status}`);
  } catch (error) {
    if (/fetch failed|ENOTFOUND|EAI_AGAIN|Could not resolve/i.test(String(error.cause?.code ?? error.message))) {
      if (expectWwwRedirect) return fail(name, `${WWW_URL} is not resolvable.`);
      warnings.push({ name, message: `${WWW_URL} is not resolvable yet; Cloudflare DNS/custom-domain provisioning still needs attention.` });
      pass(name, 'strict www redirect check explicitly disabled; hostname is unresolved');
      return;
    }
    fail(name, error.message);
  }
}

for (const check of publicChecks) {
  await checkPublicAsset(check);
}
for (const check of anonymousAccountChecks) {
  await checkAnonymousAccountBoundary(check);
}
await checkWwwRedirect();

for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name} — ${check.message}`);
}
for (const warning of warnings) {
  console.log(`WARN ${warning.name} — ${warning.message}`);
}

const failed = checks.filter((check) => !check.ok);
if (failed.length > 0) {
  console.error(`Production smoke failed: ${failed.length} failed check(s).`);
  process.exit(1);
}

console.log(`Production smoke passed: ${checks.length} checks, ${warnings.length} warning(s).`);
