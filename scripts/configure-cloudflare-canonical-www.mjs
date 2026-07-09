#!/usr/bin/env node

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneName = process.env.SCHNGN_ZONE_NAME ?? 'schngn.com';
const apexHost = process.env.SCHNGN_APEX_HOST ?? 'schngn.com';
const wwwHost = process.env.SCHNGN_WWW_HOST ?? `www.${apexHost}`;
const dnsTarget = process.env.SCHNGN_WWW_DNS_TARGET ?? apexHost;
const ruleRef = 'schngn-www-to-apex';

if (!token) {
  throw new Error('CLOUDFLARE_API_TOKEN is required to configure canonical www redirect.');
}

async function cloudflare(method, path, body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { success: false, errors: [{ message: text.slice(0, 300) }] };
  }

  if (!response.ok || !payload.success) {
    const errors = (payload.errors ?? []).map((error) => error.message ?? String(error)).join('; ');
    throw new Error(`Cloudflare ${method} ${path} failed: ${response.status} ${errors}`);
  }

  return payload.result;
}

async function findZoneId() {
  const zones = await cloudflare('GET', `/zones?name=${encodeURIComponent(zoneName)}&status=active`);
  if (!Array.isArray(zones) || zones.length === 0) {
    throw new Error(`No active Cloudflare zone found for ${zoneName}.`);
  }
  return zones[0].id;
}

async function ensureWwwDns(zoneId) {
  const records = await cloudflare('GET', `/zones/${zoneId}/dns_records?name=${encodeURIComponent(wwwHost)}`);
  const cname = records.find((record) => record.type === 'CNAME');
  const desired = {
    type: 'CNAME',
    name: wwwHost,
    content: dnsTarget,
    proxied: true,
    ttl: 1,
    comment: 'SCHNGN canonical www redirect target. Managed by scripts/configure-cloudflare-canonical-www.mjs.'
  };

  if (!cname) {
    await cloudflare('POST', `/zones/${zoneId}/dns_records`, desired);
    console.log(`created proxied CNAME for ${wwwHost}`);
    return;
  }

  if (cname.content !== dnsTarget || cname.proxied !== true) {
    await cloudflare('PATCH', `/zones/${zoneId}/dns_records/${cname.id}`, desired);
    console.log(`updated proxied CNAME for ${wwwHost}`);
    return;
  }

  console.log(`proxied CNAME for ${wwwHost} already configured`);
}

function canonicalRedirectRule() {
  return {
    ref: ruleRef,
    description: `Redirect ${wwwHost} to ${apexHost}`,
    expression: `(http.host eq "${wwwHost}")`,
    action: 'redirect',
    action_parameters: {
      from_value: {
        status_code: 308,
        target_url: {
          expression: `concat("https://${apexHost}", http.request.uri.path)`
        },
        preserve_query_string: true
      }
    },
    enabled: true
  };
}

async function getDynamicRedirectEntrypoint(zoneId) {
  try {
    return await cloudflare('GET', `/zones/${zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`);
  } catch (error) {
    if (String(error.message).includes('404')) return null;
    if (String(error.message).includes('not found')) return null;
    throw error;
  }
}

async function ensureRedirectRule(zoneId) {
  const desiredRule = canonicalRedirectRule();
  const existing = await getDynamicRedirectEntrypoint(zoneId);

  if (!existing) {
    await cloudflare('POST', `/zones/${zoneId}/rulesets`, {
      name: 'SCHNGN canonical redirects',
      description: 'Canonical host redirects for SCHNGN.',
      kind: 'zone',
      phase: 'http_request_dynamic_redirect',
      rules: [desiredRule]
    });
    console.log(`created dynamic redirect rule for ${wwwHost}`);
    return;
  }

  const rules = Array.isArray(existing.rules) ? [...existing.rules] : [];
  const index = rules.findIndex(
    (rule) => rule.ref === ruleRef || rule.description === desiredRule.description || rule.expression === desiredRule.expression
  );

  if (index >= 0) {
    rules[index] = { ...rules[index], ...desiredRule };
  } else {
    rules.push(desiredRule);
  }

  await cloudflare('PUT', `/zones/${zoneId}/rulesets/${existing.id}`, {
    name: existing.name,
    description: existing.description,
    kind: existing.kind,
    phase: existing.phase,
    rules
  });

  console.log(index >= 0 ? `updated dynamic redirect rule for ${wwwHost}` : `added dynamic redirect rule for ${wwwHost}`);
}

const zoneId = await findZoneId();
console.log(`configuring canonical www redirect for ${zoneName}`);
await ensureWwwDns(zoneId);
await ensureRedirectRule(zoneId);
console.log(`canonical www redirect configured: https://${wwwHost}/* -> https://${apexHost}/*`);
