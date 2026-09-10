#!/usr/bin/env node
const token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) throw new Error('Cloudflare credentials are required');
const name = '_index._agents.schngn.com';
const comment = 'SCHNGN agent discovery; managed by scripts/configure-agent-dns.mjs';
const desired = { type: 'SVCB', name, ttl: 300, data: { priority: 1, target: 'schngn.com', value: 'mandatory=alpn,port alpn="h2" port=443' }, comment };
async function api(method, path, body) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20000) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(`Cloudflare ${method} failed (${response.status}; codes ${result.errors?.map(error => error.code).join(',')})`);
  return result.result;
}
const zones = await api('GET', '/zones?name=schngn.com&status=active');
if (zones.length !== 1) throw new Error('Expected one active schngn.com zone');
const path = `/zones/${zones[0].id}/dns_records`;
const records = await api('GET', `${path}?name=${name}`);
const record = records.find(record => record.type === 'SVCB');
if (!record) { await api('POST', path, desired); console.log('Created SCHNGN DNS-AID index'); }
else if (record.comment !== comment) throw new Error('Existing unowned index record needs review');
else if (record.data?.priority !== 1 || record.data?.target?.replace(/\.$/, '') !== 'schngn.com' || record.data?.value !== desired.data.value) { await api('PATCH', `${path}/${record.id}`, desired); console.log('Updated SCHNGN DNS-AID index'); }
else console.log('SCHNGN DNS-AID index already current');
const dnssec = await api('GET', `/zones/${zones[0].id}/dnssec`);
if (dnssec.status !== 'active') console.log(`DNSSEC status: ${dnssec.status}; verify registrar DS propagation before marking live discovery complete`);
else console.log('Cloudflare DNSSEC active; verify AD with a validating resolver');
