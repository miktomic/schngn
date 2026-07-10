import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { assertNoForbiddenNetworkPayloads, type ObservedNetworkRequest } from '../src/lib/privacy/networkPrivacy';
import type { EditableTrip } from '../src/lib/trips/tripCrud';

const forbiddenTripValues = [
  '2026-01-25',
  '2026-04-02',
  '2026-07-19',
  'Germany booking',
  'Spain booking',
  'michael@example.com'
];

test.describe('SCHNGN production smoke and privacy checks', () => {
  test('landing page renders the UK second-home pitch and carries UK pricing context', async ({ page }) => {
    const requests = observeNetwork(page);

    await page.goto('/');

    await expect(page).toHaveTitle('Schengen 90/180 calculator for UK second-home owners | SCHNGN');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /UK second-home owners and frequent travellers/);
    await expect(page.getByRole('heading', { name: /Plan Europe stays without guessing your 90 days/i })).toBeVisible();
    await expect(page.getByText('For UK second-home owners')).toBeVisible();
    await expect(page.getByText('Your dates stay in this browser.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'See if your Europe trip fits' })).toHaveAttribute('href', '/app?market=uk');
    await expect(page.getByRole('link', { name: 'Accuracy evidence' })).toHaveAttribute('href', '/accuracy');
    const wordmark = page.locator('header img[src$="/brand/schngn-wordmark.png"]');
    await expect(wordmark).toHaveCount(1);
    await expect(wordmark).toBeVisible();
    expect(await wordmark.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 864 && image.naturalHeight === 156)).toBe(true);
    assertNoForbiddenNetworkPayloads(requests, forbiddenTripValues);
  });

  test('accuracy page states the checked-in evidence without claiming official output parity', async ({ page }) => {
    const requests = observeNetwork(page);

    await page.goto('/accuracy');

    await expect(page).toHaveTitle('Accuracy evidence for the Schengen 90/180 calculator | SCHNGN');
    await expect(page.getByRole('heading', { name: 'Accuracy evidence' })).toBeVisible();
    await expect(page.getByText(/Tested with 50 deterministic rule fixtures, boundary cases, and an independent day-set oracle/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'European Commission short-stay calculator' })).toHaveAttribute(
      'href',
      'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en'
    );
    await expect(page.getByText('Inclusive entry and exit days')).toBeVisible();
    await expect(page.getByText('Rolling 180-day window')).toBeVisible();
    await expect(page.getByText('SCHNGN is not certified, approved, or guaranteed by the EU')).toBeVisible();
    await expect(page.getByText(/does not claim captured output parity with the official calculator/i)).toBeVisible();
    await expect(page.getByText(/Validated against the European Commission/i)).toHaveCount(0);
    assertNoForbiddenNetworkPayloads(requests, forbiddenTripValues);
  });

  test('installed PWA shell reloads locally saved trips offline', async ({ page, context }) => {
    await installFakeClerk(page, null);
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem('schngn.e2e.initialized')) return;
      window.localStorage.clear();
      window.sessionStorage.setItem('schngn.e2e.initialized', 'true');
    });
    await page.goto('/app');
    await expect(page.getByRole('heading', { name: 'Start with your travel dates' })).toBeVisible();
    await expect(page.getByText(/no example itinerary can affect your result/i)).toBeVisible();
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json');
    await expect(page.locator('link[rel="icon"][href$="/favicon.png"]')).toHaveAttribute('sizes', '64x64');
    await expect(page.locator('link[rel="apple-touch-icon"][href$="/icons/apple-touch-icon.png"]')).toHaveAttribute('sizes', '180x180');

    const offlineReady = await page.evaluate(async () => {
      const offlineWindow = window as unknown as { __schngnOfflineReady?: Promise<boolean> };
      return offlineWindow.__schngnOfflineReady ?? false;
    });
    expect(offlineReady).toBe(true);

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await page.getByRole('button', { name: 'Add your first trip' }).click();
    const tripForm = page.getByRole('form', { name: 'Trip form' });
    await tripForm.getByLabel(/Trip label/).fill('Offline Spain stay');
    await tripForm.locator('#trip-entry-country').selectOption('ES');
    await tripForm.locator('#trip-exit-country').selectOption('ES');
    await tripForm.getByLabel('Entered Schengen').fill('2026-05-01');
    await tripForm.getByLabel('Left Schengen').fill('2026-05-05');
    await tripForm.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.getByText('Offline Spain stay')).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: '85 safe buffer days' })).toBeVisible();
    await expect(page.getByText('Offline Spain stay fits')).toBeVisible();

    const cacheAudit = await page.evaluate(async () => {
      const offlineWindow = window as unknown as { __schngnOfflineReady?: Promise<boolean> };
      await offlineWindow.__schngnOfflineReady;

      const worker = navigator.serviceWorker.controller;
      if (!worker) throw new Error('No service worker controls the app');
      const apiPrecacheReply = await new Promise<{ ok?: boolean; cached?: number }>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => resolve(event.data);
        worker.postMessage({ type: 'SCHNGN_CACHE_URLS', urls: ['/api/account/trips'] }, [channel.port2]);
      });

      const devPrefixes = ['/@vite/', '/@id/', '/@fs/', '/.svelte-kit/', '/node_modules/.vite/', '/src/'];
      const devResources = performance
        .getEntriesByType('resource')
        .map((entry) => new URL(entry.name))
        .filter(
          (url) =>
            url.origin === location.origin && devPrefixes.some((prefix) => url.pathname.startsWith(prefix))
        );
      const missingDevResources: string[] = [];
      for (const resource of devResources) {
        if (!(await caches.match(resource.href))) missingDevResources.push(`${resource.pathname}${resource.search}`);
      }

      const cachedRequests = (
        await Promise.all((await caches.keys()).map(async (name) => (await caches.open(name)).keys()))
      ).flat();

      return {
        apiPrecacheReply,
        cachedDevResourceCount: devResources.length,
        missingDevResources,
        hasCachedAccountApi: cachedRequests.some((request) => new URL(request.url).pathname.startsWith('/api/'))
      };
    });
    expect(cacheAudit.apiPrecacheReply).toEqual({ ok: true, cached: 0 });
    expect(cacheAudit.cachedDevResourceCount).toBeGreaterThan(10);
    expect(cacheAudit.missingDevResources).toEqual([]);
    expect(cacheAudit.hasCachedAccountApi).toBe(false);

    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: '85 safe buffer days' })).toBeVisible();
    await expect(page.getByText('Offline Spain stay fits')).toBeVisible();
    await page.getByRole('button', { name: 'Trips' }).click();
    await expect(page.getByText('1 trip stored on this device.')).toBeVisible();
    await expect(page.getByText('Offline Spain stay')).toBeVisible();
    await context.setOffline(false);
  });

  test('records a multi-country journey with an outside-Schengen break', async ({ page }) => {
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await page.getByRole('button', { name: 'Add your first trip' }).click();

    const form = page.getByRole('form', { name: 'Trip form' });
    await form.getByLabel(/Trip label/).fill('Summer trip');
    await form.locator('#trip-entry').fill('2026-07-01');
    await form.locator('#trip-exit').fill('2026-07-12');
    await form.locator('#trip-entry-country').selectOption('IT');
    await form.locator('#trip-exit-country').selectOption('AT');
    await form.getByRole('button', { name: 'Add time outside' }).click();
    await form.locator('[id^="trip-break-left-"]').fill('2026-07-05');
    await form.locator('[id^="trip-break-return-"]').fill('2026-07-08');

    await expect(form.getByText(/10 Schengen days · 2 days outside/)).toBeVisible();
    await form.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.getByText('Italy → Austria')).toBeVisible();
    await expect(page.getByText(/10 Schengen days · 2 days outside/)).toBeVisible();

    const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem('schngn.trips.v2') ?? '[]'));
    expect(stored).toEqual([
      expect.objectContaining({
        entryCountryCode: 'IT',
        exitCountryCode: 'AT',
        stays: [
          { entryDate: '2026-07-01', exitDate: '2026-07-05' },
          { entryDate: '2026-07-08', exitDate: '2026-07-12' }
        ]
      })
    ]);
  });

  test('app completes real local-first planning, proof, error, and recovery flows', async ({ page }) => {
    test.setTimeout(90_000);
    const requests = observeNetwork(page);
    const accountRequests = observeAccountNetwork(page);
    const waitlistRequests: string[] = [];
    let waitlistMode: 'not-configured' | 'rate-limit' | 'stored' = 'not-configured';

    await page.route('**/api/waitlist', async (route) => {
      waitlistRequests.push(route.request().postData() ?? '');
      if (waitlistMode === 'rate-limit') {
        await route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'rate_limited' }) });
        return;
      }
      await route.fulfill({
        status: waitlistMode === 'not-configured' ? 202 : 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, stored: waitlistMode === 'stored' })
      });
    });
    await installFakeClerk(page, null);
    await page.addInitScript(() => {
      window.localStorage.clear();
      Math.random = () => 0.34;
      const analyticsWindow = window as unknown as {
        __plausibleEvents: { name: string; options?: { props?: Record<string, string> } }[];
        plausible: (name: string, options?: { props?: Record<string, string> }) => void;
      };
      analyticsWindow.__plausibleEvents = [];
      analyticsWindow.plausible = (name, options) => analyticsWindow.__plausibleEvents.push({ name, options });
    });

    await page.goto('/app?market=uk');
    const overviewButton = page.getByRole('button', { name: 'Overview' });
    await overviewButton.focus();
    await expect(overviewButton).toBeFocused();
    await expect(page.getByRole('heading', { name: 'Start with your travel dates' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Proof' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Unlock full trip planner — £9' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await page.getByRole('button', { name: 'Add your first trip' }).click();
    const tripForm = page.getByRole('form', { name: 'Trip form' });
    await expect(tripForm.getByLabel(/Trip label/)).toHaveAttribute('maxlength', '80');
    await tripForm.getByLabel(/Trip label/).fill('Spain booking');
    await tripForm.locator('#trip-entry-country').evaluate((select) => {
      const countrySelect = select as HTMLSelectElement;
      countrySelect.add(new Option('Spain typo', 'SPAIN'));
      countrySelect.value = 'SPAIN';
      countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await tripForm.getByLabel('Entered Schengen').fill('2026-07-01');
    await tripForm.getByLabel('Left Schengen').fill('2026-07-19');
    await tripForm.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.getByText('Choose a Schengen country or leave this optional field blank.')).toBeVisible();
    await expect(tripForm.locator('#trip-entry-country')).toHaveAttribute('aria-invalid', 'true');
    await tripForm.locator('#trip-entry-country').selectOption('ES');
    await tripForm.locator('#trip-exit-country').selectOption('ES');
    await tripForm.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.getByRole('heading', { name: 'Trips' })).toBeVisible();
    await expect(page.getByText('Spain booking')).toBeVisible();

    await addTrip(page, {
      countryCode: 'FR',
      entryDate: '2026-01-25',
      exitDate: '2026-01-26',
      label: 'France history',
      status: 'past'
    });
    await addTrip(page, {
      countryCode: 'DE',
      entryDate: '2026-03-04',
      exitDate: '2026-04-02',
      label: 'Germany booking',
      status: 'booked'
    });
    await expect(page.getByText('3 trips stored on this device.')).toBeVisible();

    await page.getByRole('button', { name: 'Overview' }).click();
    await expect(page.getByRole('heading', { name: '39 safe buffer days' })).toBeVisible();
    await expect(page.getByText('Spain booking fits')).toBeVisible();
    const overviewTimeline = page.getByRole('img', { name: /Rolling 180-day window\. 51 counted days/i });
    await expect(overviewTimeline).toBeVisible();
    await expect(page.getByText('21 Jan–19 Jul 2026')).toBeVisible();

    await page.getByRole('button', { name: 'Show calculation' }).click();
    await expect(page.getByRole('heading', { name: 'Calculation proof' })).toBeVisible();
    await expect(page.getByText('51 counted days between Jan 21 and Jul 19. That leaves 39 safe buffer days.')).toBeVisible();
    await expect(page.getByText(/The app looks back 180 calendar days from Jul 19/i)).toBeVisible();
    await expect(page.locator('p.mono-range').filter({ hasText: '21 Jan–19 Jul 2026' })).toBeVisible();

    await page.getByRole('button', { name: 'See when days return' }).click();
    await expect(page.getByRole('heading', { name: '2 days return in the next 30 days' })).toBeVisible();
    await expect(page.getByText('51 / 90 used on 19 Jul 2026')).toBeVisible();
    await expect(page.getByText('Next return: Jul 24')).toBeVisible();
    await expect(page.getByText('France history Jan 25 leaves the window')).toBeVisible();
    await expect(page.getByRole('img', { name: /2 counted days return to the allowance during this 30-day forecast/i })).toBeVisible();

    await page.getByRole('button', { name: 'Planner' }).click();
    await expect(page.getByRole('heading', { name: 'Can I book this?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock full trip planner — £9' })).toBeVisible();
    const simulator = page.getByRole('form', { name: 'Future trip simulator' });
    await simulator.getByLabel(/Simulation label/).fill('Spain proposal');
    await simulator.locator('#simulation-entry-country').selectOption('ES');
    await simulator.getByLabel('Entered Schengen').fill('2026-01-01');
    await simulator.getByLabel('Left Schengen').fill('2026-03-03');
    await simulator.getByRole('button', { name: 'Check this plan' }).click();
    await expect(page.getByText('Spain proposal needs changes')).toBeVisible();
    await expect(page.getByText(/Germany booking would reach 91 \/ 90 on Apr 1/i)).toBeVisible();
    await expect(page.getByText(/protect Germany booking/i)).toBeVisible();
    await expect(page.getByRole('img', { name: /What-if rolling window\. 91 counted days/i })).toBeVisible();

    await page.getByRole('button', { name: 'Report' }).click();
    await expect(page.getByRole('heading', { name: 'Border-ready report' })).toBeVisible();
    await expect(page.getByLabel('Border-ready report').getByText('21 Jan–19 Jul 2026')).toBeVisible();
    await page.getByRole('button', { name: 'Join PDF export list' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill('michael@example.com');
    await page.getByLabel(/I agree to receive SCHNGN updates/i).check();
    await page.getByRole('button', { name: 'Join waitlist' }).click();
    await expect(page.getByRole('heading', { name: 'Email was not confirmed as saved' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveValue('michael@example.com');
    expect((await readPlausibleEvents(page)).map((event) => event.name)).not.toContain('waitlist_signup');

    waitlistMode = 'rate-limit';
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText(/Too many attempts were made/i)).toBeVisible();
    waitlistMode = 'stored';
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('heading', { name: 'You are on the list' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Joined' })).toBeDisabled();
    const waitlistEvents = (await readPlausibleEvents(page)).filter((event) => event.name === 'waitlist_signup');
    expect(waitlistEvents).toHaveLength(1);
    expect(waitlistRequests).toHaveLength(3);
    for (const payload of waitlistRequests) {
      expect(JSON.parse(payload)).toEqual({ email: 'michael@example.com', consent: true, source: 'waitlist' });
      expect(payload).not.toContain('2026-07-19');
      expect(payload).not.toContain('Spain booking');
    }

    await page.getByRole('button', { name: 'Trips' }).click();
    await page.evaluate(() => {
      const storagePrototype = Storage.prototype as Storage & { __schngnSetItem?: Storage['setItem'] };
      storagePrototype.__schngnSetItem = storagePrototype.setItem;
      storagePrototype.setItem = function (key: string, value: string): void {
        if (key === 'schngn.trips.v2') throw new DOMException('Quota exceeded', 'QuotaExceededError');
        storagePrototype.__schngnSetItem?.call(this, key, value);
      };
    });
    await addTrip(page, {
      countryCode: 'IT',
      entryDate: '2026-08-01',
      exitDate: '2026-08-01',
      label: '家族旅行 ✈️',
      status: 'booked'
    });
    await expect(page.getByText('家族旅行 ✈️')).toBeVisible();
    await expect(page.getByText(/Trips could not be saved in this browser/i)).toBeVisible();
    await page.evaluate(() => {
      const storagePrototype = Storage.prototype as Storage & { __schngnSetItem?: Storage['setItem'] };
      if (storagePrototype.__schngnSetItem) storagePrototype.setItem = storagePrototype.__schngnSetItem;
    });
    await page.getByRole('button', { name: 'Delete 家族旅行 ✈️' }).click();
    await expect(page.getByRole('heading', { name: 'Delete 家族旅行 ✈️?' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep trip' }).click();
    await expect(page.getByText('家族旅行 ✈️')).toBeVisible();
    await page.getByRole('button', { name: 'Delete 家族旅行 ✈️' }).click();
    await page.getByRole('button', { name: 'Delete trip' }).click();
    await expect(page.getByText('家族旅行 ✈️')).toHaveCount(0);

    await page.getByRole('button', { name: 'Account', exact: true }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON' }).click();
    const download = await downloadPromise;
    const exportPath = await download.path();
    const exportedJson = await readFile(exportPath ?? '', 'utf8');
    expect(exportedJson).toContain('Spain booking');

    const importButton = page.getByRole('button', { name: 'Import JSON', exact: true });
    await importButton.focus();
    await expect(importButton).toBeFocused();
    const chooserPromise = page.waitForEvent('filechooser');
    await importButton.press('Enter');
    const chooser = await chooserPromise;
    await chooser.setFiles({ name: 'schngn-backup.json', mimeType: 'application/json', buffer: Buffer.from(exportedJson) });
    await expect(page.getByText(/Imported 3 trips/i)).toBeVisible();

    await page.getByRole('button', { name: 'Clear local data' }).click();
    await expect(page.getByRole('heading', { name: 'Clear all local trip data?' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep my trips' }).click();
    await expect(page.getByRole('heading', { name: 'Clear all local trip data?' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Clear local data' }).click();
    await page.getByRole('button', { name: 'Clear this browser' }).click();
    await expect(page.getByText('Trip data is now cleared from this tab.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export JSON' })).toBeDisabled();
    await page.getByRole('button', { name: 'Trips' }).click();
    await expect(page.getByRole('heading', { name: 'No trips saved yet' })).toBeVisible();

    const plausibleEvents = await readPlausibleEvents(page);
    const plausibleEventNames = plausibleEvents.map((event) => event.name);
    expect(plausibleEventNames).toContain('page_view');
    expect(plausibleEventNames).toContain('calculator_start');
    expect(plausibleEventNames).toContain('trip_added');
    expect(plausibleEventNames).toContain('simulation_run');
    assertSafePlausiblePayload(plausibleEvents);
    expect(accountRequests).toEqual([]);
    assertNoForbiddenNetworkPayloads(requests, forbiddenTripValues.filter((value) => value !== 'michael@example.com'));
  });

  test('signed-in account sync requires consent, revisions writes, and deletes only the cloud copy', async ({ page }) => {
    test.setTimeout(60_000);
    const accountRequests = observeAccountNetwork(page);
    const writes: AccountWrite[] = [];
    let cloudTrips: AccountWrite['trips'] = [];
    let revision = 0;
    let deleteCount = 0;
    let releaseFirstWrite: (() => void) | undefined;
    const firstWriteGate = new Promise<void>((resolve) => {
      releaseFirstWrite = resolve;
    });

    await installFakeClerk(page, {
      userId: 'user_e2eaccount',
      sessionId: 'sess_e2eaccount',
      email: 'signed-in@example.invalid'
    });
    await page.addInitScript(() => {
      window.localStorage.clear();
      const analyticsWindow = window as unknown as {
        __plausibleEvents: PlausibleEvent[];
        plausible: (name: string, options?: PlausibleEvent['options']) => void;
      };
      analyticsWindow.__plausibleEvents = [];
      analyticsWindow.plausible = (name, options) => analyticsWindow.__plausibleEvents.push({ name, options });
    });
    await page.route('**/api/account/trips', async (route) => {
      const request = route.request();
      expect(request.headers().authorization).toBe('Bearer e2e-session-token');
      if (request.method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            trips: cloudTrips,
            revision,
            updatedAt: revision === 0 ? null : `2026-07-09T12:0${revision}:00.000Z`,
            consentVersion: revision === 0 ? null : 'account-sync-v2'
          })
        });
        return;
      }

      if (request.method() !== 'PUT') {
        await route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ error: 'method_not_allowed' }) });
        return;
      }

      const body = request.postDataJSON() as AccountWrite;
      writes.push(body);
      if (writes.length === 1) await firstWriteGate;
      cloudTrips = body.trips;
      revision += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          trips: cloudTrips,
          revision,
          updatedAt: `2026-07-09T12:0${revision}:00.000Z`,
          consentVersion: 'account-sync-v2'
        })
      });
    });
    await page.route('**/api/account', async (route) => {
      expect(route.request().headers().authorization).toBe('Bearer e2e-session-token');
      if (route.request().method() !== 'DELETE') {
        await route.fulfill({ status: 405, contentType: 'application/json', body: JSON.stringify({ error: 'method_not_allowed' }) });
        return;
      }
      deleteCount += 1;
      cloudTrips = [];
      revision = 0;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/app');
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await page.getByRole('button', { name: 'Add your first trip' }).click();
    const firstTripForm = page.getByRole('form', { name: 'Trip form' });
    await firstTripForm.getByLabel(/Trip label/).fill('Account Italy stay');
    await firstTripForm.locator('#trip-entry-country').selectOption('IT');
    await firstTripForm.locator('#trip-exit-country').selectOption('IT');
    await firstTripForm.getByLabel('Entered Schengen').fill('2026-08-01');
    await firstTripForm.getByLabel('Left Schengen').fill('2026-08-05');
    await firstTripForm.getByRole('button', { name: 'Save trip' }).click();

    await page.getByRole('button', { name: 'Account', exact: true }).click();
    const accountScreen = page.getByRole('region', { name: 'Account & data' });
    await expect(accountScreen.getByRole('heading', { name: 'Account & data' })).toBeVisible();
    await expect(accountScreen.getByRole('heading', { name: 'Choose whether to sync' })).toBeVisible();
    const consent = accountScreen.getByLabel(/Allow SCHNGN to store/i);
    await expect(accountScreen.getByRole('button', { name: 'Sync 1 trip' })).toBeDisabled();
    await consent.check();
    await accountScreen.getByRole('button', { name: 'Sync 1 trip' }).click();
    await expect.poll(() => writes.length).toBe(1);
    await expect(page.getByRole('button', { name: 'Open Account — Syncing…' })).toBeVisible();
    expect(writes[0]).toMatchObject({
      expectedRevision: 0,
      consent: true,
      consentVersion: 'account-sync-v2'
    });
    expect(writes[0].trips).toHaveLength(1);
    expect(writes[0].trips.map((trip) => trip.label)).toEqual(['Account Italy stay']);
    expect(Object.keys(writes[0]).sort()).toEqual(['consent', 'consentVersion', 'expectedRevision', 'trips']);
    expect(JSON.stringify(writes[0])).not.toContain('user_e2eaccount');
    expect(JSON.stringify(writes[0])).not.toContain('signed-in@example.invalid');

    await page.getByRole('button', { name: 'Trips', exact: true }).click();
    await addTrip(page, {
      countryCode: 'ES',
      entryDate: '2026-09-10',
      exitDate: '2026-09-12',
      label: 'Account Spain stay',
      status: 'booked'
    });
    expect(writes).toHaveLength(1);
    releaseFirstWrite?.();
    await expect.poll(() => writes.length).toBe(2);
    await expect(page.getByRole('button', { name: 'Open Account — Synced' })).toBeVisible();
    expect(writes[1]).toMatchObject({
      expectedRevision: 1,
      consent: true,
      consentVersion: 'account-sync-v2'
    });
    expect(writes[1].trips).toHaveLength(2);
    expect(writes[1].trips.map((trip) => trip.label)).toEqual(['Account Italy stay', 'Account Spain stay']);

    await page.evaluate(() => {
      const storagePrototype = Storage.prototype as Storage & { __schngnAccountSetItem?: Storage['setItem'] };
      storagePrototype.__schngnAccountSetItem = storagePrototype.setItem;
      storagePrototype.setItem = function (key: string, value: string): void {
        if (key === 'schngn.trips.v2') throw new DOMException('Quota exceeded', 'QuotaExceededError');
        storagePrototype.__schngnAccountSetItem?.call(this, key, value);
      };
    });
    await page.getByRole('button', { name: 'Trips', exact: true }).click();
    await addTrip(page, {
      countryCode: 'FR',
      entryDate: '2026-10-01',
      exitDate: '2026-10-02',
      label: 'Account France stay',
      status: 'booked'
    });
    await expect.poll(() => writes.length).toBe(3);
    expect(writes[2]).toMatchObject({ expectedRevision: 2 });
    expect(writes[2].trips.map((trip) => trip.label)).toEqual([
      'Account Italy stay',
      'Account Spain stay',
      'Account France stay'
    ]);
    await expect(page.getByRole('button', { name: 'Open Account — Sync paused' })).toBeVisible();
    await page.evaluate(() => {
      const storagePrototype = Storage.prototype as Storage & { __schngnAccountSetItem?: Storage['setItem'] };
      if (storagePrototype.__schngnAccountSetItem) storagePrototype.setItem = storagePrototype.__schngnAccountSetItem;
    });
    await page.reload();
    await expect(page.getByRole('button', { name: 'Open Account — Synced' })).toBeVisible();
    await page.getByRole('button', { name: 'Trips', exact: true }).click();
    await expect(page.getByText('Account France stay')).toBeVisible();

    await page.getByRole('button', { name: 'Account', exact: true }).click();
    await accountScreen.getByRole('button', { name: 'Delete saved account trips' }).click();
    await accountScreen.getByRole('button', { name: 'Delete account trips' }).click();
    await expect.poll(() => deleteCount).toBe(1);
    await expect(accountScreen.getByText(/Cloud trip data was deleted/i)).toBeVisible();

    await page.getByRole('button', { name: 'Trips', exact: true }).click();
    await expect(page.getByText('Account Italy stay')).toBeVisible();
    await expect(page.getByText('Account Spain stay')).toBeVisible();
    await expect(page.getByText('Account France stay')).toBeVisible();
    await expect(page.getByText('3 trips stored on this device.')).toBeVisible();

    const accountPuts = accountRequests.filter((request) => request.method === 'PUT');
    expect(accountPuts).toHaveLength(3);
    expect(accountRequests.filter((request) => request.method === 'DELETE')).toHaveLength(1);
    expect(accountRequests.map((request) => request.method)).toEqual(['GET', 'PUT', 'PUT', 'PUT', 'GET', 'DELETE']);
    const plausiblePayload = JSON.stringify(await readPlausibleEvents(page));
    for (const privateValue of ['Account Italy stay', 'Account Spain stay', 'Account France stay', '2026-08-01', '2026-09-10', 'signed-in@example.invalid']) {
      expect(plausiblePayload).not.toContain(privateValue);
    }
  });
});

async function addTrip(
  page: Page,
  trip: { countryCode: string; entryDate: string; exitDate: string; label: string; status: 'past' | 'booked' | 'what-if' }
): Promise<void> {
  await page.getByRole('button', { name: 'Add trip', exact: true }).click();
  const form = page.getByRole('form', { name: 'Trip form' });
  await form.getByLabel(/Trip label/).fill(trip.label);
  await form.locator('#trip-entry-country').selectOption(trip.countryCode);
  await form.locator('#trip-exit-country').selectOption(trip.countryCode);
  await form.getByLabel('Entered Schengen').fill(trip.entryDate);
  await form.getByLabel('Left Schengen').fill(trip.exitDate);
  await form.getByRole('radio', { name: trip.status === 'past' ? 'Past' : trip.status === 'booked' ? 'Booked' : 'What-if' }).check();
  await form.getByRole('button', { name: 'Save trip' }).click();
  await expect(page.getByRole('heading', { name: 'Trips' })).toBeVisible();
}

type FakeClerkIdentity = {
  userId: string;
  sessionId: string;
  email: string;
};

type AccountWrite = {
  trips: EditableTrip[];
  expectedRevision: number;
  consent: boolean;
  consentVersion: string;
};

async function installFakeClerk(page: Page, identity: FakeClerkIdentity | null): Promise<void> {
  await page.addInitScript((accountIdentity) => {
    const listeners = new Set<() => void>();
    const client = {
      user: accountIdentity
        ? { id: accountIdentity.userId, primaryEmailAddress: { emailAddress: accountIdentity.email } }
        : null,
      session: accountIdentity
        ? {
            id: accountIdentity.sessionId,
            async getToken() {
              return 'e2e-session-token';
            }
          }
        : null,
      async load() {},
      addListener(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      async redirectToSignUp() {},
      async redirectToSignIn() {},
      async redirectToUserProfile() {},
      async signOut() {
        client.user = null;
        client.session = null;
        listeners.forEach((listener) => listener());
      }
    };
    const clerkWindow = window as unknown as { __schngnClerkTestClient: typeof client };
    clerkWindow.__schngnClerkTestClient = client;
  }, identity);
}

function observeNetwork(page: Page): ObservedNetworkRequest[] {
  const requests: ObservedNetworkRequest[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('data:') || url.includes('/@vite/') || url.includes('/node_modules/')) return;
    requests.push({ url, method: request.method(), postData: request.postData() });
  });
  return requests;
}

function observeAccountNetwork(page: Page): ObservedNetworkRequest[] {
  const requests: ObservedNetworkRequest[] = [];
  page.on('request', (request) => {
    if (!new URL(request.url()).pathname.startsWith('/api/account')) return;
    requests.push({ url: request.url(), method: request.method(), postData: request.postData() });
  });
  return requests;
}

type PlausibleEvent = { name: string; options?: { props?: Record<string, string> } };

async function readPlausibleEvents(page: Page): Promise<PlausibleEvent[]> {
  return page.evaluate(() => (window as unknown as { __plausibleEvents: PlausibleEvent[] }).__plausibleEvents);
}

function assertSafePlausiblePayload(events: PlausibleEvent[]): void {
  const allowedNames = ['page_view', 'calculator_start', 'trip_added', 'simulation_run', 'pdf_buy_intent', 'unlock_buy_intent', 'waitlist_signup'];
  const allowedProps = ['source', 'trip_count_bucket', 'safe_buffer_bucket', 'verdict', 'price_bucket'];
  for (const event of events) {
    expect(allowedNames).toContain(event.name);
    for (const key of Object.keys(event.options?.props ?? {})) expect(allowedProps).toContain(key);
  }
  const payload = JSON.stringify(events);
  for (const forbidden of [...forbiddenTripValues, 'Spain proposal', 'France history', '家族旅行 ✈️']) {
    expect(payload).not.toContain(forbidden);
  }
}
