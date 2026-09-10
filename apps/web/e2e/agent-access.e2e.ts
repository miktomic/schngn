import { test, expect, type Page } from '@playwright/test';
async function clerk(page: Page) {
  await page.addInitScript(() => {
    const listeners = new Set<() => void>();
    const client = { user: { id: 'user_alice', primaryEmailAddress: { emailAddress: 'alice@example.test' } }, session: { id: 'session_alice', async getToken() { return client.user.id; } }, async load() {}, addListener(fn: () => void) { listeners.add(fn); return () => listeners.delete(fn); }, openSignIn() {}, openSignUp() {}, async redirectToUserProfile() {}, async signOut() {} };
    (window as any).__schngnClerkTestClient = client;
    (window as any).switchTestAccount = () => { client.user = { id: 'user_bob', primaryEmailAddress: { emailAddress: 'bob@example.test' } }; client.session.id = 'session_bob'; listeners.forEach(fn => fn()); };
  });
}
for (const surface of ['document', 'navigator']) {
  test(`WebMCP ${surface} registration executes local tools without reading saved data or transmitting dates`, async ({ page }) => {
    await page.addInitScript(kind => {
      (window as any).registeredTools = {};
      Object.defineProperty(kind === 'document' ? document : navigator, 'modelContext', { configurable: true, value: { registerTool(tool: any) { (window as any).registeredTools[tool.name] = tool; }, unregisterTool(name: string) { delete (window as any).registeredTools[name]; } } });
      localStorage.setItem('agent-privacy-sentinel', 'private-saved-value');
    }, surface);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect.poll(() => page.evaluate(() => Object.keys((window as any).registeredTools).length)).toBe(3);
    const requests: string[] = []; page.on('request', request => requests.push(request.url() + (request.postData() || '')));
    const result = await page.evaluate(async () => {
      const before = JSON.stringify(localStorage);
      const result = JSON.parse(await (window as any).registeredTools.calculate_schengen_usage.execute({ stays: [{ entryDate: '2026-02-01', exitDate: '2026-02-10' }], referenceDate: '2026-02-10' }));
      return { result, unchanged: before === JSON.stringify(localStorage) };
    });
    expect(result.unchanged).toBe(true); expect(result.result.result.daysUsed).toBe(10);
    expect(requests.join(' ')).not.toContain('2026-02'); expect(requests.join(' ')).not.toContain('private-saved-value'); expect(errors).toEqual([]);
  });
}
for (const allow of [true, false]) {
  test(`consent requires a deliberate keyboard ${allow ? 'allow' : 'deny'} action and uses the displayed transaction`, async ({ page }, testInfo) => {
    await clerk(page); const submissions: unknown[] = [];
    await page.route('**/api/agent/authorize*', async route => {
      if (route.request().method() === 'POST') { submissions.push(route.request().postDataJSON()); await route.fulfill({ json: { redirectTo: '/agents?synthetic-callback=1' } }); }
      else await route.fulfill({ json: { clientName: '<script>untrusted client</script>', redirectOrigin: 'https://client.example', scopes: ['docs:read', 'trips:read'], ...(route.request().headers().authorization ? { transactionId: 'bound-transaction' } : {}) } });
    });
    await page.goto('/agent/authorize?client_id=synthetic&state=private-state');
    const action = page.getByRole('button', { name: allow ? 'Allow read-only access' : 'Deny', exact: true });
    await expect(action).toBeEnabled(); expect(submissions).toEqual([]);
    await expect(page.getByText('alice@example.test', { exact: true })).toBeVisible();
    await expect(page.getByText('<script>untrusted client</script>', { exact: true })).toBeVisible();
    await expect(page.locator('main')).toContainText('saved only on this device');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (allow) await page.screenshot({ path: testInfo.outputPath('consent-mobile.png'), fullPage: true });
    await action.focus(); await page.keyboard.press('Space'); await expect(page).toHaveURL(/synthetic-callback=1/);
    expect(submissions).toEqual([{ allow, transactionId: 'bound-transaction' }]);
  });
}
test('connection list discards a delayed previous-account response and revokes only the current connection', async ({ page }) => {
  await clerk(page); let releaseAlice!: () => void; let sawAlice!: () => void;
  const alicePending = new Promise<void>(resolve => { sawAlice = resolve; }); const aliceReleased = new Promise<void>(resolve => { releaseAlice = resolve; }); const revoked: unknown[] = [];
  await page.route('**/api/agent/connections*', async route => {
    const request = route.request();
    if (request.method() === 'POST') { revoked.push({ auth: request.headers().authorization, body: request.postDataJSON() }); await route.fulfill({ json: { revoked: true } }); return; }
    const alice = request.headers().authorization === 'Bearer user_alice'; if (alice) { sawAlice(); await aliceReleased; }
    await route.fulfill({ json: { items: [{ id: alice ? 'grant_alice' : 'grant_bob', name: alice ? 'Alice private client' : 'Bob client', scopes: ['docs:read'] }] } });
  });
  await page.goto('/agent/connections'); await alicePending;
  await page.evaluate(() => (window as any).switchTestAccount());
  await expect(page.getByRole('button', { name: 'Revoke Bob client' })).toBeVisible();
  releaseAlice(); await page.waitForTimeout(100);
  await expect(page.locator('main')).not.toContainText('Alice private client');
  await page.getByRole('button', { name: 'Revoke Bob client' }).click();
  await expect(page.locator('main')).toContainText('No active connections');
  expect(revoked).toEqual([{ auth: 'Bearer user_bob', body: { grantId: 'grant_bob' } }]);
});
test('localized consent preserves the authorization query and supports RTL', async ({ page }) => {
  await clerk(page);
  await page.route('**/api/agent/authorize*', route => route.fulfill({ json: { clientName: 'Synthetic client', redirectOrigin: 'https://client.example', scopes: ['trips:read'], transactionId: 'synthetic' } }));
  await page.goto('/fr/agent/authorize?state=preserved'); await expect(page.getByRole('heading', { level: 1 })).toHaveText('Connecter un agent');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('ar');
  await expect(page).toHaveURL('/ar/agent/authorize?state=preserved'); await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ربط وكيل');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
