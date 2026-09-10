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
  let details = $state<{ clientName: string; redirectOrigin: string; scopes: string[]; transactionId?: string }>();
  let error = $state(false); let busy = $state(false); let loading = $state(true);
  let generation = 0; let disposed = false; let identity = '';
  function currentIdentity() { return auth?.available ? `${auth.userId}:${auth.sessionId}` : ''; }
  async function loadRequest() {
    const current = ++generation; const who = currentIdentity(); loading = true; details = undefined;
    try {
      const token = auth?.available ? await auth.getToken() : null;
      const response = await fetch(`/api/agent/authorize${page.url.search}`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error(); const result = await response.json();
      if (!disposed && current === generation && who === currentIdentity()) { details = result; error = false; }
    } catch { if (!disposed && current === generation) error = true; }
    finally { if (!disposed && current === generation) loading = false; }
  }
  onMount(() => {
    let remove = () => {};
    void (async () => {
      await loadRequest();
      const client = await initializeClerkBrowserAuth(env.PUBLIC_CLERK_PUBLISHABLE_KEY);
      if (disposed) return; auth = client;
      if (!client.available) { error = true; return; }
      const changed = () => { const next = currentIdentity(); if (next === identity) return; identity = next; signedIn = client.isSignedIn; busy = false; void loadRequest(); };
      remove = client.subscribe(changed); changed();
    })();
    return () => { disposed = true; generation++; remove(); };
  });
  async function decide(allow: boolean) {
    if (!auth?.available || !signedIn || busy || !details?.transactionId) return;
    const current = generation; const who = currentIdentity(); const transactionId = details.transactionId;
    busy = true; error = false;
    try {
      const token = await auth.getToken(); if (!token || who !== currentIdentity() || current !== generation) throw new Error();
      const response = await fetch(`/api/agent/authorize${page.url.search}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ allow, transactionId }), cache: 'no-store' });
      if (!response.ok) throw new Error(); const result = await response.json();
      if (!disposed && current === generation && who === currentIdentity()) location.assign(result.redirectTo);
    } catch { if (!disposed && current === generation) { error = true; busy = false; void loadRequest(); } }
  }
</script>
<AgentShell title={copy.connect}>
  {#if loading}<p role="status">{copy.loading}</p>{/if}
  {#if details}
    <p><strong><bdi>{details.clientName}</bdi></strong> {copy.requesting}</p>
    {#if signedIn && auth?.available && auth.email}<p><bdi>{auth.email}</bdi></p>{/if}
    <p>{copy.returnAddress}: <bdi>{details.redirectOrigin}</bdi></p>
    <ul>{#if details.scopes.includes('docs:read')}<li>{copy.docs}</li>{/if}{#if details.scopes.includes('trips:read')}<li>{copy.trips}</li>{/if}</ul>
    <p>{copy.limits}</p>
    {#if signedIn}<div class="actions"><button class="primary" disabled={busy || !details.transactionId} onclick={() => decide(true)}>{copy.allow}</button><button disabled={busy || !details.transactionId} onclick={() => decide(false)}>{copy.deny}</button></div>
    {:else}<button onclick={() => openClerkSignIn(env.PUBLIC_CLERK_PUBLISHABLE_KEY)}>{copy.signin}</button>{/if}
  {/if}
  {#if error}<p role="alert">{copy.error}</p>{/if}
  <p><a href={localizedPath('/agent/connections', locale)}>{copy.manage}</a> · <a href={localizedPath('/privacy', locale)}>{copy.privacy}</a></p>
</AgentShell>
