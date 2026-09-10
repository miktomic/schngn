<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { env } from '$env/dynamic/public';
  import { localeFromPath, localizedPath } from '$lib/i18n';
  import { agentCopy } from '$lib/agent/copy';
  import AgentShell from '$lib/agent/AgentShell.svelte';
  import { initializeClerkBrowserAuth, openClerkSignIn, type ClerkBrowserAuth } from '$lib/auth/clerkBrowser';
  let locale = $derived(localeFromPath(page.url.pathname)); let copy = $derived(agentCopy[locale]);
  let auth = $state<ClerkBrowserAuth>(); let signedIn = $state(false);
  let connections = $state<{ id: string; name: string; scopes: string[] }[]>([]);
  let cursor = $state<string>(); let error = $state(false); let busy = $state(false); let loading = $state(true);
  let generation = 0; let disposed = false; let identity = '';
  function currentIdentity() { return auth?.available ? `${auth.userId}:${auth.sessionId}` : ''; }
  async function request(path: string, init: RequestInit = {}) {
    const who = currentIdentity(); const token = auth?.available ? await auth.getToken() : null;
    if (!token || who !== currentIdentity()) throw new Error();
    const response = await fetch(path, { ...init, cache: 'no-store', headers: { ...init.headers, Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(); return response.json();
  }
  async function load(more = false) {
    if (!signedIn || (more && (loading || busy))) return;
    const current = ++generation; const who = currentIdentity(); loading = true; error = false;
    try {
      const data = await request(`/api/agent/connections${more && cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);
      if (!disposed && current === generation && who === currentIdentity()) { connections = more ? [...connections, ...data.items] : data.items; cursor = data.cursor; }
    } catch { if (!disposed && current === generation) error = true; }
    finally { if (!disposed && current === generation) loading = false; }
  }
  onMount(() => {
    let remove = () => {};
    void initializeClerkBrowserAuth(env.PUBLIC_CLERK_PUBLISHABLE_KEY).then(client => {
      if (disposed) return; auth = client;
      if (!client.available) { loading = false; error = true; return; }
      const changed = () => { const next = currentIdentity(); if (next === identity) return; identity = next; generation++; signedIn = client.isSignedIn; connections = []; cursor = undefined; busy = false; loading = false; void load(); };
      remove = client.subscribe(changed); changed();
    });
    return () => { disposed = true; generation++; remove(); };
  });
  async function revoke(grantId: string) {
    if (busy || loading) return;
    const current = generation; const who = currentIdentity(); busy = true; error = false;
    try {
      await request('/api/agent/connections', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grantId }) });
      if (!disposed && current === generation && who === currentIdentity()) connections = connections.filter(connection => connection.id !== grantId);
    } catch { if (!disposed && current === generation) error = true; }
    finally { if (!disposed && current === generation) busy = false; }
  }
</script>
<AgentShell title={copy.manage}>
  <p>{copy.manageIntro}</p>
  {#if signedIn && auth?.available && auth.email}<p><bdi>{auth.email}</bdi></p>{/if}
  {#if loading}<p role="status">{copy.loading}</p>{/if}
  {#if signedIn}
    <ul>{#each connections as connection (connection.id)}<li><strong><bdi>{connection.name}</bdi></strong><p>{connection.scopes.includes('trips:read') ? copy.trips : copy.docs}</p><button disabled={busy || loading} onclick={() => revoke(connection.id)}>{copy.revoke} {connection.name}</button></li>{/each}</ul>
    {#if !loading && !connections.length && !error}<p>{copy.empty}</p>{/if}
    {#if cursor}<button disabled={busy || loading} onclick={() => load(true)}>{copy.more}</button>{/if}
  {:else if !loading}<button onclick={() => openClerkSignIn(env.PUBLIC_CLERK_PUBLISHABLE_KEY)}>{copy.signin}</button>{/if}
  {#if error}<p role="alert">{copy.error}</p><button disabled={busy || loading} onclick={() => load()}>{copy.more}</button>{/if}
  <p><a href={localizedPath('/app', locale) + '#account'}>{copy.back}</a></p>
</AgentShell>
