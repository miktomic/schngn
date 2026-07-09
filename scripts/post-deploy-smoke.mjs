#!/usr/bin/env node

const BASE_URL = process.env.SCHNGN_BASE_URL ?? 'https://schngn.com';
const WWW_URL = process.env.SCHNGN_WWW_URL ?? 'https://www.schngn.com';
const timeoutMs = Number(process.env.SCHNGN_SMOKE_TIMEOUT_MS ?? 15000);

const checks = [];
const warnings = [];

const publicChecks = [
  { path: '/', type: 'text/html', contains: ['Schengen 90/180 calculator', 'https://schngn.com/'] },
  { path: '/app', type: 'text/html', contains: [] },
  { path: '/accuracy', type: 'text/html', contains: ['Accuracy evidence', 'European Commission short-stay calculator'] },
  { path: '/manifest.json', type: 'application/json', contains: ['SCHNGN', '/app', '/icons/icon-192.png'] },
  { path: '/service-worker.js', type: 'text/javascript', contains: ['SCHNGN_STATIC_CACHE', '/app'] },
  { path: '/robots.txt', type: 'text/plain', contains: ['Sitemap: https://schngn.com/sitemap.xml'] },
  { path: '/sitemap.xml', type: 'application/xml', contains: ['<loc>https://schngn.com/</loc>', '<loc>https://schngn.com/app</loc>', '<loc>https://schngn.com/accuracy</loc>'] }
];

function fail(name, message) {
  checks.push({ name, ok: false, message });
}

function pass(name, message) {
  checks.push({ name, ok: true, message });
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

function assertNoTripDataPayload(body) {
  const forbiddenKeys = ['trips', 'tripDates', 'entryDate', 'exitDate', 'travelHistory', 'countries', 'timeline'];
  for (const key of forbiddenKeys) {
    if (Object.hasOwn(body, key)) {
      throw new Error(`smoke payload must not contain ${key}`);
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
    if (text.includes('www.schngn.com')) return fail(name, 'contains non-canonical www.schngn.com');
    pass(name, `${response.status} ${contentType}`);
  } catch (error) {
    fail(name, error.message);
  }
}

async function checkWaitlistPrivacy() {
  const name = 'POST /api/waitlist smoke payload';
  const body = {
    email: `smoke+${Date.now()}@schngn.invalid`,
    consent: true,
    source: 'waitlist'
  };

  try {
    assertNoTripDataPayload(body);
    const response = await fetchWithTimeout(new URL('/api/waitlist', BASE_URL), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json().catch(() => ({}));
    if (response.status !== 202 && response.status !== 200) return fail(name, `expected 200/202, got ${response.status}`);
    if (result && result.ok !== true) return fail(name, `expected ok response, got ${JSON.stringify(result)}`);
    pass(name, `accepted email-only smoke request; stored=${result.stored ?? 'unknown'}`);
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
        warnings.push({
          name,
          message:
            `${WWW_URL} currently serves apex-canonical content with HTTP 200. Add a Cloudflare Redirect Rule/Bulk Redirect for strict www→apex redirects.`
        });
        return;
      }
    }

    return fail(name, `expected redirect or apex-canonical 200, got ${response.status}`);
  } catch (error) {
    if (/fetch failed|ENOTFOUND|EAI_AGAIN|Could not resolve/i.test(String(error.cause?.code ?? error.message))) {
      warnings.push({ name, message: `${WWW_URL} is not resolvable yet; Cloudflare DNS/custom-domain provisioning still needs attention.` });
      return;
    }
    fail(name, error.message);
  }
}

for (const check of publicChecks) {
  await checkPublicAsset(check);
}
await checkWaitlistPrivacy();
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
