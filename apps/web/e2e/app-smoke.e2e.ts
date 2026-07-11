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
    await expect(page.getByText(/See counted days and your safe-exit date/)).toBeVisible();
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

  test('serves localized public routes and RTL app navigation', async ({ page }) => {
    await installFakeClerk(page, null);
    await page.goto('/');
    const languageSelector = page.getByRole('combobox', { name: 'Language' });
    await expect(languageSelector).toBeVisible();
    await expect(languageSelector).toBeEnabled();
    const languageSelectorBox = await languageSelector.boundingBox();
    expect(languageSelectorBox?.width).toBeLessThanOrEqual(120);
    await languageSelector.selectOption('fr');
    await expect(page).toHaveURL(/\/fr$/);
    await expect(page.getByRole('heading', { name: 'Planifiez vos séjours en Europe sans deviner vos 90 jours.' })).toBeVisible();

    await page.goto('/ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { name: 'خطط لإقامتك في أوروبا من دون تخمين أيامك التسعين.' })).toBeVisible();
    await expect(page.locator('header.topbar').getByRole('link', { name: 'فتح الحاسبة', exact: true })).toHaveAttribute('href', '/ar/app?market=uk');

    await page.goto('/he/app?section=planner');
    await expect(page.locator('html')).toHaveAttribute('lang', 'he');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page).toHaveURL(/\/he\/app#plan$/);
    await expect(page.locator('#app-anchor-select')).toHaveValue('plan');
    await expect(page.getByRole('heading', { name: 'תכנון נסיעה עתידית' })).toBeVisible();
    await page.locator('#plan').getByRole('button', { name: 'לא היו לי נסיעות קודמות באזור שנגן', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'צריכים אפשרויות תכנון נוספות?' })).toBeVisible();
    const appLanguageSelector = page.getByRole('combobox', { name: 'שפה' });
    await appLanguageSelector.selectOption('fr');
    await expect(page).toHaveURL(/\/fr\/app#plan$/);
    await expect(page.locator('#app-anchor-select')).toHaveValue('plan');
    await expect(page.getByRole('heading', { name: 'Planifier un futur voyage' })).toBeVisible();
    await page.reload();
    await expect(page.locator('#app-anchor-select')).toHaveValue('plan');
    await navigateToAppAnchor(page, 'account');
    await expect(page.getByRole('heading', { name: 'Continuer sans compte' })).toBeVisible();

    await page.goto('/tr/accuracy');
    await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { name: 'Doğruluk kanıtı' })).toBeVisible();
  });

  test('keeps desktop workspace sections beside the sticky answer rail', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');

    await page.locator('#status').getByRole('button', { name: 'No previous Schengen trips? Go straight to planning.' }).click();
    await page.locator('#details').evaluate((section) => section.scrollIntoView());

    const answerBox = await page.locator('#status').boundingBox();
    const detailsBox = await page.locator('#details').boundingBox();
    expect(answerBox).not.toBeNull();
    expect(detailsBox).not.toBeNull();

    const answerRight = answerBox!.x + answerBox!.width;
    const verticalOverlap = Math.min(answerBox!.y + answerBox!.height, detailsBox!.y + detailsBox!.height)
      - Math.max(answerBox!.y, detailsBox!.y);
    expect(verticalOverlap).toBeGreaterThan(0);
    expect(detailsBox!.x).toBeGreaterThanOrEqual(answerRight - 1);

    await page.setViewportSize({ width: 900, height: 900 });
    await page.locator('#details').evaluate((section) => section.scrollIntoView());
    const tabletAnswerBox = await page.locator('#status').boundingBox();
    const tabletDetailsBox = await page.locator('#details').boundingBox();
    expect(tabletDetailsBox!.x).toBeGreaterThanOrEqual(tabletAnswerBox!.x + tabletAnswerBox!.width - 1);

    await page.setViewportSize({ width: 640, height: 900 });
    expect(await page.locator('#status').evaluate((section) => getComputedStyle(section).position)).toBe('static');

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/he/app#details');
    await page.locator('#details').evaluate((section) => section.scrollIntoView());
    const rtlAnswerBox = await page.locator('#status').boundingBox();
    const rtlDetailsBox = await page.locator('#details').boundingBox();
    expect(await page.locator('html').getAttribute('dir')).toBe('rtl');
    expect(rtlDetailsBox!.x + rtlDetailsBox!.width).toBeLessThanOrEqual(rtlAnswerBox!.x + 1);
  });

  test('installed PWA shell serves locally saved trips and a cached shell offline', async ({ page, context }) => {
    await installFakeClerk(page, null);
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem('schngn.e2e.initialized')) return;
      window.localStorage.clear();
      window.sessionStorage.setItem('schngn.e2e.initialized', 'true');
    });
    await page.goto('/app');
    await expect(page.locator('#status').getByRole('heading', { name: 'First, add your previous Schengen trips' })).toBeVisible();
    await expect(page.getByText('Add trips you already completed')).toBeVisible();
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json');
    await expect(page.locator('link[rel="icon"][href$="/favicon.png"]')).toHaveAttribute('sizes', '64x64');
    await expect(page.locator('link[rel="apple-touch-icon"][href$="/icons/apple-touch-icon.png"]')).toHaveAttribute('sizes', '180x180');

    const offlineReady = await page.evaluate(async () => {
      const offlineWindow = window as unknown as { __schngnOfflineReady?: Promise<boolean> };
      return offlineWindow.__schngnOfflineReady ?? false;
    });
    expect(offlineReady).toBe(true);

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByRole('heading', { name: 'Your 180-day timeline' })).toBeVisible();
    await expect(page.getByRole('img', { name: /0 counted days in this inclusive 180-day window/i })).toHaveCount(0);
    expect(await sectionComesBefore(page, 'trips', 'timeline')).toBe(true);
    await page.locator('#status').getByRole('button', { name: 'Add your first trip' }).click();
    const tripForm = page.getByRole('form', { name: 'Trip form' });
    await tripForm.getByLabel(/Trip label/).fill('Offline Spain stay');
    await tripForm.locator('#trip-entry-country').selectOption('ES');
    await tripForm.locator('#trip-exit-country').selectOption('ES');
    await tripForm.getByLabel('Entered Schengen').fill('2026-05-01');
    await tripForm.getByLabel('Left Schengen').fill('2026-05-05');
    await expect(tripForm.locator('.inferred-trip-status').getByText('Past trip', { exact: true })).toBeVisible();
    await expect(tripForm.getByRole('radio', { name: 'Past' })).toHaveCount(0);
    await tripForm.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.locator('#trips').getByRole('heading', { name: 'Offline Spain stay', exact: true })).toBeVisible();
    await expect(page.getByRole('img', { name: /5 counted days in this inclusive 180-day window/i })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Trips & planning', exact: true })).toBeVisible();
    await expect(page.getByText('1 trip stored on this device.')).toBeVisible();
    await expect(page.getByRole('heading', { name: '85 safe buffer days' })).toBeVisible();
    await expect(page.locator('#status .status-chip').getByText('Offline Spain stay fits', { exact: true })).toBeVisible();

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
        hasCachedAppShell: cachedRequests.some((request) => new URL(request.url).pathname === '/app'),
        hasCachedAccountApi: cachedRequests.some((request) => new URL(request.url).pathname.startsWith('/api/'))
      };
    });
    expect(cacheAudit.apiPrecacheReply).toEqual({ ok: true, cached: 0 });
    expect(cacheAudit.cachedDevResourceCount).toBeGreaterThan(10);
    expect(cacheAudit.missingDevResources).toEqual([]);
    expect(cacheAudit.hasCachedAppShell).toBe(true);
    expect(cacheAudit.hasCachedAccountApi).toBe(false);

    await context.setOffline(true);
    const offlineShell = await page.evaluate(async () => {
      const response = await caches.match('/app');
      if (!response) return { ok: false, status: 0, text: '' };
      return { ok: response.ok, status: response.status, text: await response.text() };
    });
    expect(offlineShell.ok).toBe(true);
    expect(offlineShell.status).toBe(200);
    expect(offlineShell.text).toContain('href="/manifest.json"');
    await expect(page.getByRole('heading', { name: '85 safe buffer days' })).toBeVisible();
    await expect(page.locator('#status .status-chip').getByText('Offline Spain stay fits', { exact: true })).toBeVisible();
    await expect(page.getByText('1 trip stored on this device.')).toBeVisible();
    await expect(page.locator('#trips').getByRole('heading', { name: 'Offline Spain stay', exact: true })).toBeVisible();
    await context.setOffline(false);
  });

  test('makes previous-trip setup explicit and remembers a confirmed empty history', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-07-10T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem('schngn.e2e.history-initialized')) return;
      window.localStorage.clear();
      window.sessionStorage.setItem('schngn.e2e.history-initialized', 'true');
    });
    await page.goto('/app');
    await page.getByRole('button', { name: 'Dismiss' }).click();

    const answer = page.locator('#status');
    await expect(answer.getByRole('heading', { name: 'First, add your previous Schengen trips' })).toBeVisible();
    await expect(answer.getByText('Add trips you already completed')).toBeVisible();
    await expect(answer.getByText('Then add any trips you already booked')).toBeVisible();
    await expect(answer.getByRole('button', { name: 'Add your first trip' })).toBeVisible();

    await navigateToAppAnchor(page, 'details');
    await expect(page.locator('#details').getByRole('heading', { name: 'First, add your previous Schengen trips' })).toBeVisible();
    await expect(page.locator('#details .ledger')).toHaveCount(0);
    await navigateToAppAnchor(page, 'report');
    await expect(page.locator('#report').getByRole('heading', { name: 'First, add your previous Schengen trips' })).toBeVisible();
    await expect(page.locator('#report .report-preview')).toHaveCount(0);
    await navigateToAppAnchor(page, 'status');

    await answer.getByRole('button', { name: 'No previous Schengen trips? Go straight to planning.' }).click();
    await expect(page).toHaveURL(/\/app#plan$/);
    await expect(answer.getByRole('heading', { name: '90 safe buffer days' })).toBeVisible();
    await expect(answer.getByText(/calculate as if you spent no days in Schengen during the last 180 days/i)).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('schngn-no-previous-history-v1'))).toBe('true');

    await page.reload();
    await expect(answer.getByRole('heading', { name: '90 safe buffer days' })).toBeVisible();
    await expect(answer.getByRole('heading', { name: 'First, add your previous Schengen trips' })).toHaveCount(0);
  });

  test('keeps the selected app anchor through refresh and browser history', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-07-10T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app?market=uk');
    await page.getByRole('button', { name: 'Dismiss' }).click();

    await navigateToAppAnchor(page, 'plan');
    await expect(page).toHaveURL(/\/app\?market=uk#plan$/);
    await expect(page.getByRole('heading', { name: 'Plan a future trip' })).toBeVisible();
    await page
      .locator('#plan')
      .getByRole('button', { name: 'I have no previous Schengen trips' })
      .click();

    const combinedSimulator = page.getByRole('form', { name: 'Future trip simulator' });
    await combinedSimulator.getByLabel(/Simulation label/).fill('Saved scenario');
    await combinedSimulator.getByLabel('Entered Schengen').fill('2026-08-01');
    await combinedSimulator.getByLabel('Left Schengen').fill('2026-08-05');
    await combinedSimulator.getByRole('button', { name: 'Check this plan' }).click();
    await page.getByRole('button', { name: 'Save as booked trip' }).click();
    await expect(page.getByText('Saved as a booked trip.')).toBeVisible();
    await expect(page.locator('#trips').getByRole('heading', { name: 'Saved scenario', exact: true })).toBeVisible();

    await combinedSimulator.getByLabel(/Simulation label/).fill('Old scenario');
    await combinedSimulator.getByLabel('Entered Schengen').fill('2025-01-01');
    await combinedSimulator.getByLabel('Left Schengen').fill('2025-01-05');
    await combinedSimulator.getByRole('button', { name: 'Check this plan' }).click();
    await page.getByRole('button', { name: 'Save as past trip' }).click();
    await expect(page.getByRole('heading', { name: 'This trip is outside today’s 180-day window' })).toBeVisible();
    await page.getByRole('button', { name: 'Save anyway' }).click();
    await expect(page.getByText('Saved as a past trip.')).toBeVisible();
    await page.locator('#trips').getByRole('button', { name: 'Show older trips' }).click();
    await expect(page.locator('#trips').getByRole('heading', { name: 'Old scenario', exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Plan a future trip' })).toBeVisible();
    await expect(page.locator('#app-anchor-select')).toHaveValue('plan');

    await navigateToAppAnchor(page, 'account');
    await expect(page).toHaveURL(/\/app\?market=uk#account$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/app\?market=uk#plan$/);
    await expect(page.getByRole('heading', { name: 'Plan a future trip' })).toBeVisible();
  });

  test('maps legacy section URLs to stable single-page anchors', async ({ page }) => {
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());

    await page.goto('/app?market=uk&section=planner');
    await expect(page).toHaveURL(/\/app\?market=uk#plan$/);
    await expect(page.locator('#app-anchor-select')).toHaveValue('plan');
    await expect(page.locator('#plan')).toBeVisible();

    await page.goto('/app?section=trip');
    await expect(page).toHaveURL(/\/app#trips$/);
    await expect(page.locator('#app-anchor-select')).toHaveValue('trips');

    await page.goto('/app?section=privacy');
    await expect(page).toHaveURL(/\/app#account$/);
    await expect(page.locator('#account details')).toHaveAttribute('open', '');
  });

  test('sends signup calls directly to Clerk without leaving the local app in tests', async ({ page }) => {
    const requests = observeNetwork(page);
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');
    await page.getByRole('button', { name: 'Dismiss' }).click();

    await navigateToAppAnchor(page, 'account');
    const account = page.locator('#account');
    await expect(account.getByRole('heading', { name: 'Keep using SCHNGN without an account' })).toBeVisible();
    await account.getByRole('button', { name: 'Sign up' }).click();

    await expect.poll(() => readClerkSignUpRedirects(page)).toEqual(['/app?account=connected#account']);
    expect(requests.filter((request) => new URL(request.url).pathname.startsWith('/api/'))).toEqual([]);
  });

  test('saving a quick adjustment replaces the original booked trip', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-02-01T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem('schngn.e2e.quick-adjust-initialized')) return;
      window.localStorage.clear();
      window.sessionStorage.setItem('schngn.e2e.quick-adjust-initialized', 'true');
    });
    await page.goto('/app');
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await page
      .locator('#status')
      .getByRole('button', { name: 'No previous Schengen trips? Go straight to planning.' })
      .click();
    await page.locator('#status').getByRole('button', { name: 'Add trip', exact: true }).click();

    const tripForm = page.getByRole('form', { name: 'Trip form' });
    await tripForm.getByLabel(/Trip label/).fill('Quick-adjust booking');
    await tripForm.getByLabel('Entered Schengen').fill('2026-07-01');
    await tripForm.getByLabel('Left Schengen').fill('2026-07-05');
    await tripForm.getByRole('button', { name: 'Save trip' }).click();
    await page.reload();
    await expect(page.locator('#status').getByRole('heading', { name: /safe buffer days/i })).toBeVisible();

    await navigateToAppAnchor(page, 'timeline');
    await page.locator('#timeline').getByRole('button', { name: /Adjust this trip Quick-adjust booking\./ }).click();
    const quickAdjuster = page.locator('.trip-adjust-panel');
    await expect(page).toHaveURL(/\/app#timeline$/);
    await expect(quickAdjuster.getByRole('heading', { name: 'Adjust trip dates' })).toBeFocused();
    const moveTrip = quickAdjuster.getByRole('button', { name: /Move trip:/ });
    const saveChanges = quickAdjuster.getByRole('button', { name: 'Save changes' });
    await expect(quickAdjuster.getByText('Live what-if result')).toBeVisible();
    await expect(saveChanges).toBeDisabled();
    await moveTrip.press('ArrowRight');
    await expect(saveChanges).toBeEnabled();
    await moveTrip.press('ArrowLeft');
    await expect(saveChanges).toBeDisabled();
    await moveTrip.press('ArrowRight');
    await expect(saveChanges).toBeEnabled();
    await saveChanges.click();
    await expect(page.getByText('Trip dates updated.')).toBeVisible();

    await expect(page.getByText('1 trip stored on this device.')).toBeVisible();
    await page.getByRole('button', { name: 'Edit Quick-adjust booking' }).click();
    await expect(page.locator('#trip-entry')).toHaveValue('2026-07-02');
    await expect(page.locator('#trip-exit')).toHaveValue('2026-07-06');
  });

  test('records a multi-country journey with an outside-Schengen break', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-01T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await page.locator('#status').getByRole('button', { name: 'Add your first trip' }).click();

    const form = page.getByRole('form', { name: 'Trip form' });
    await form.getByLabel(/Trip label/).fill('Summer trip');
    await form.locator('#trip-entry').fill('2026-07-01');
    await form.locator('#trip-exit').fill('2026-07-12');
    await form.locator('#trip-entry-country').selectOption('IT');
    await form.locator('#trip-exit-country').selectOption('AT');
    await form.locator('.what-if-toggle').click();
    await expect(form.locator('.what-if-toggle')).toHaveClass(/selected/);
    await expect(form.locator('.what-if-toggle')).toHaveCSS('background-color', 'rgb(255, 241, 214)');
    await form.getByRole('button', { name: 'Add time outside' }).click();
    await form.locator('[id^="trip-break-left-"]').fill('2026-07-05');
    await form.locator('[id^="trip-break-return-"]').fill('2026-07-08');

    await expect(form.getByText(/10 Schengen days · 2 days outside/)).toBeVisible();
    await form.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.locator('#status').getByRole('heading', { name: 'First, add your previous Schengen trips' })).toBeVisible();
    await expect(page.locator('#status').getByRole('heading', { name: /safe buffer days/i })).toHaveCount(0);
    await expect(page.locator('#timeline').getByRole('heading', { name: 'First, add your previous Schengen trips' })).toBeVisible();
    await expect(page.getByText('Italy → Austria')).toBeVisible();
    await expect(page.getByText(/10 Schengen days · 2 days outside/)).toBeVisible();
    await expect(page.locator('.trip-list article.whatif')).toHaveCSS('background-color', 'rgb(255, 241, 214)');

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

  test('keeps trip entry compact, mirrors an empty exit country, and confirms expired history', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-07-10T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await page.locator('#status').getByRole('button', { name: 'Add your first trip' }).click();

    const form = page.getByRole('form', { name: 'Trip form' });
    await expect(form.getByRole('img', { name: /Your 180-day allocation/i })).toHaveCount(0);
    await form.locator('#trip-entry-country').selectOption('IT');
    await expect(form.locator('#trip-exit-country')).toHaveValue('IT');
    await form.getByLabel('Entered Schengen').fill('2025-11-01');
    await form.getByLabel('Left Schengen').fill('2025-11-05');
    await form.getByRole('button', { name: 'Save trip' }).click();

    await expect(form.getByRole('heading', { name: 'This trip is outside today’s 180-day window' })).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('schngn.trips.v2'))).toBeNull();
    await form.getByRole('button', { name: 'Save anyway' }).click();
    await expect(page.getByRole('heading', { name: 'Trips & planning', exact: true })).toBeVisible();
    await page.locator('#trips').getByRole('button', { name: 'Show older trips' }).click();
    await expect(page.locator('#trips').getByRole('heading', { name: 'Italy → Italy', exact: true })).toBeVisible();
  });

  test('keeps overlapping trips separately visible and opens adjustment from either timeline lane', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-02-01T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await page
      .locator('#status')
      .getByRole('button', { name: 'No previous Schengen trips? Go straight to planning.' })
      .click();

    await addTrip(page, {
      countryCode: 'IT',
      entryDate: '2026-07-01',
      exitDate: '2026-07-10',
      label: 'Italy overlap',
      status: 'booked'
    });
    await addTrip(page, {
      countryCode: 'FR',
      entryDate: '2026-07-05',
      exitDate: '2026-07-14',
      label: 'France overlap',
      status: 'booked'
    });

    await navigateToAppAnchor(page, 'timeline');
    const timeline = page.locator('#timeline');
    const italyLane = timeline.getByRole('button', { name: /Adjust this trip Italy overlap/ });
    const franceLane = timeline.getByRole('button', { name: /Adjust this trip France overlap/ });
    await expect(italyLane).toBeVisible();
    await expect(franceLane).toBeVisible();
    const [italyBox, franceBox] = await Promise.all([italyLane.boundingBox(), franceLane.boundingBox()]);
    expect(italyBox?.y).not.toBe(franceBox?.y);

    await franceLane.click();
    const quickAdjuster = page.locator('.trip-adjust-panel');
    await expect(quickAdjuster.getByText('France overlap', { exact: true })).toBeVisible();
    await expect(franceLane).toHaveAttribute('aria-pressed', 'true');
  });

  test('app completes real local-first planning, proof, error, and recovery flows', async ({ page }) => {
    test.setTimeout(90_000);
    await page.clock.setFixedTime(new Date('2026-02-01T12:00:00Z'));
    const requests = observeNetwork(page);
    const accountRequests = observeAccountNetwork(page);
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
    const anchorSelector = page.locator('#app-anchor-select');
    await anchorSelector.focus();
    await expect(anchorSelector).toBeFocused();
    await expect(page.locator('#status').getByRole('heading', { name: 'First, add your previous Schengen trips' })).toBeVisible();
    await expect(page.locator('#status').getByRole('heading', { name: /safe buffer days/i })).toHaveCount(0);

    await page.getByRole('button', { name: 'Dismiss' }).click();
    await page.locator('#status').getByRole('button', { name: 'Add your first trip' }).click();
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
    await expect(tripForm.locator('#trip-entry-country-error')).toHaveText('Choose a Schengen country or leave this optional field blank.');
    await expect(tripForm.locator('#trip-entry-country')).toHaveAttribute('aria-invalid', 'true');
    await tripForm.locator('#trip-entry-country').selectOption('ES');
    await tripForm.locator('#trip-exit-country').selectOption('ES');
    await tripForm.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.locator('#trips').getByRole('heading', { name: 'Trips & planning', exact: true })).toBeVisible();
    await expect(page.locator('#trips').getByRole('heading', { name: 'Spain booking', exact: true })).toBeVisible();

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

    await expect(page.getByRole('heading', { name: '39 safe buffer days' })).toBeVisible();
    await expect(page.locator('#status .status-chip').getByText('Spain booking fits', { exact: true })).toBeVisible();
    const overviewTimeline = page.getByRole('img', { name: /Rolling 180-day window\. 51 counted days/i });
    await expect(overviewTimeline).toBeVisible();
    await expect(page.locator('#timeline .timeline-head > bdi')).toHaveText('21 Jan–19 Jul 2026');

    await page.locator('#timeline').getByRole('button', { name: /Adjust this trip Spain booking\./ }).click();
    const quickAdjuster = page.locator('.trip-adjust-panel');
    await expect(quickAdjuster).toBeVisible();
    await quickAdjuster.getByRole('button', { name: /Move trip:/ }).press('ArrowRight');
    await quickAdjuster.getByText('Exact dates').click();
    const exactDates = quickAdjuster.locator('input[type="date"]');
    await expect(exactDates.nth(0)).toHaveValue('2026-07-02');
    await expect(exactDates.nth(1)).toHaveValue('2026-07-20');
    await expect(page.getByText(/Highest affected-day window shows 51 counted days/)).toBeVisible();
    await quickAdjuster.getByRole('button', { name: 'Keep original' }).click();
    await expect(quickAdjuster).toHaveCount(0);

    await page.getByRole('button', { name: 'Show calculation' }).click();
    const details = page.locator('#details');
    await expect(details.getByRole('heading', { name: 'Calculation proof' })).toBeVisible();
    await expect(details.getByText('51 counted days between Jan 21 and Jul 19. That leaves 39 safe buffer days.')).toBeVisible();
    await expect(details.getByText(/The app looks back 180 calendar days from Jul 19/i)).toBeVisible();
    await expect(details.locator('p.mono-range').filter({ hasText: '21 Jan–19 Jul 2026' })).toBeVisible();

    await details.getByRole('button', { name: 'See when days return' }).click();
    const returns = page.locator('.returns-section');
    await expect(returns.getByRole('heading', { name: '2 days return in the next 30 days' })).toBeVisible();
    await expect(returns.getByText('51 / 90 used on 19 Jul 2026')).toBeVisible();
    await expect(returns.getByText('Next return: Jul 24')).toBeVisible();
    await expect(returns.getByText('France history Jan 25 leaves the window')).toBeVisible();
    await expect(returns.getByRole('img', { name: /2 counted days return to the allowance during this 30-day forecast/i })).toBeVisible();

    await navigateToAppAnchor(page, 'plan');
    await expect(page.getByRole('heading', { name: 'Plan a future trip' })).toBeVisible();
    await expect(page.locator('#plan').getByRole('button', { name: 'Sign up' })).toBeVisible();
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

    await navigateToAppAnchor(page, 'report');
    await expect(page.getByRole('heading', { name: 'Border-ready report' })).toBeVisible();
    await expect(page.getByLabel('Border-ready report').getByText('21 Jan–19 Jul 2026')).toBeVisible();
    const report = page.locator('#report');
    await report.getByRole('button', { name: 'Sign up' }).click();
    await expect.poll(() => readClerkSignUpRedirects(page)).toEqual(['/app?market=uk&account=connected#account']);
    expect((await readPlausibleEvents(page)).map((event) => event.name)).toContain('pdf_buy_intent');

    await navigateToAppAnchor(page, 'trips');
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
    const unicodeTripHeading = page.locator('#trips').getByRole('heading', { name: '家族旅行 ✈️', exact: true });
    await expect(unicodeTripHeading).toBeVisible();
    await expect(page.getByText(/Trips could not be saved in this browser/i)).toBeVisible();
    await page.evaluate(() => {
      const storagePrototype = Storage.prototype as Storage & { __schngnSetItem?: Storage['setItem'] };
      if (storagePrototype.__schngnSetItem) storagePrototype.setItem = storagePrototype.__schngnSetItem;
    });
    await page.getByRole('button', { name: 'Delete 家族旅行 ✈️' }).click();
    await expect(page.getByRole('heading', { name: 'Delete 家族旅行 ✈️?' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep trip' }).click();
    await expect(unicodeTripHeading).toBeVisible();
    await page.getByRole('button', { name: 'Delete 家族旅行 ✈️' }).click();
    await page.getByRole('button', { name: 'Delete trip' }).click();
    await expect(unicodeTripHeading).toHaveCount(0);

    await navigateToAppAnchor(page, 'account');
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
    await expect(page.locator('#status').getByRole('heading', { name: 'First, add your previous Schengen trips' })).toBeVisible();

    const plausibleEvents = await readPlausibleEvents(page);
    const plausibleEventNames = plausibleEvents.map((event) => event.name);
    expect(plausibleEventNames).toContain('page_view');
    expect(plausibleEventNames).toContain('calculator_start');
    expect(plausibleEventNames).toContain('trip_added');
    expect(plausibleEventNames).toContain('simulation_run');
    assertSafePlausiblePayload(plausibleEvents);
    expect(accountRequests).toEqual([]);
    assertNoForbiddenNetworkPayloads(requests, forbiddenTripValues);
  });

  test('signed-in account sync requires consent, revisions writes, and deletes only the cloud copy', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-07-01T12:00:00Z'));
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
    await page.locator('#status').getByRole('button', { name: 'Add your first trip' }).click();
    const firstTripForm = page.getByRole('form', { name: 'Trip form' });
    await firstTripForm.getByLabel(/Trip label/).fill('Account Italy stay');
    await firstTripForm.locator('#trip-entry-country').selectOption('IT');
    await firstTripForm.locator('#trip-exit-country').selectOption('IT');
    await firstTripForm.getByLabel('Entered Schengen').fill('2026-08-01');
    await firstTripForm.getByLabel('Left Schengen').fill('2026-08-05');
    await firstTripForm.getByRole('button', { name: 'Save trip' }).click();

    await navigateToAppAnchor(page, 'account');
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

    await navigateToAppAnchor(page, 'trips');
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
    await navigateToAppAnchor(page, 'trips');
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
    await navigateToAppAnchor(page, 'trips');
    await expect(page.locator('#trips').getByRole('heading', { name: 'Account France stay', exact: true })).toBeVisible();

    await navigateToAppAnchor(page, 'account');
    await accountScreen.getByRole('button', { name: 'Delete saved account trips' }).click();
    await accountScreen.getByRole('button', { name: 'Delete account trips' }).click();
    await expect.poll(() => deleteCount).toBe(1);
    await expect(accountScreen.getByText(/Cloud trip data was deleted/i)).toBeVisible();

    await navigateToAppAnchor(page, 'trips');
    await expect(page.locator('#trips').getByRole('heading', { name: 'Account Italy stay', exact: true })).toBeVisible();
    await expect(page.locator('#trips').getByRole('heading', { name: 'Account Spain stay', exact: true })).toBeVisible();
    await expect(page.locator('#trips').getByRole('heading', { name: 'Account France stay', exact: true })).toBeVisible();
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
  await page.locator('#trips').getByRole('button', { name: 'Add trip', exact: true }).click();
  const form = page.getByRole('form', { name: 'Trip form' });
  await form.getByLabel(/Trip label/).fill(trip.label);
  await form.locator('#trip-entry-country').selectOption(trip.countryCode);
  await form.locator('#trip-exit-country').selectOption(trip.countryCode);
  await form.getByLabel('Entered Schengen').fill(trip.entryDate);
  await form.getByLabel('Left Schengen').fill(trip.exitDate);
  const inferredPast = await form.locator('.inferred-trip-status').isVisible();
  expect(inferredPast).toBe(trip.status === 'past');
  if (!inferredPast) {
    await form.getByRole('radio', { name: trip.status === 'booked' ? 'Booked' : 'What-if' }).check();
  }
  await form.getByRole('button', { name: 'Save trip' }).click();
  await expect(page.getByRole('heading', { name: 'Trips & planning', exact: true })).toBeVisible();
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
    const redirects: { signUp: (string | null)[]; signIn: (string | null)[] } = { signUp: [], signIn: [] };
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
      async redirectToSignUp(options?: { redirectUrl?: string | null }) {
        redirects.signUp.push(options?.redirectUrl ?? null);
      },
      async redirectToSignIn(options?: { redirectUrl?: string | null }) {
        redirects.signIn.push(options?.redirectUrl ?? null);
      },
      async redirectToUserProfile() {},
      async signOut() {
        client.user = null;
        client.session = null;
        listeners.forEach((listener) => listener());
      }
    };
    const clerkWindow = window as unknown as {
      __schngnClerkTestClient: typeof client;
      __schngnClerkRedirects: typeof redirects;
    };
    clerkWindow.__schngnClerkTestClient = client;
    clerkWindow.__schngnClerkRedirects = redirects;
  }, identity);
}

async function navigateToAppAnchor(
  page: Page,
  anchor: 'status' | 'trips' | 'timeline' | 'plan' | 'details' | 'report' | 'account'
): Promise<void> {
  await page.locator('#app-anchor-select').selectOption(anchor);
  await expect(page).toHaveURL(new RegExp(`#${anchor}$`));
}

async function sectionComesBefore(page: Page, firstId: string, secondId: string): Promise<boolean> {
  return page.evaluate(
    ([first, second]) => {
      const firstSection = document.getElementById(first);
      const secondSection = document.getElementById(second);
      if (!firstSection || !secondSection) return false;
      return Boolean(firstSection.compareDocumentPosition(secondSection) & Node.DOCUMENT_POSITION_FOLLOWING);
    },
    [firstId, secondId]
  );
}

async function readClerkSignUpRedirects(page: Page): Promise<(string | null)[]> {
  return page.evaluate(
    () =>
      (window as unknown as { __schngnClerkRedirects: { signUp: (string | null)[] } })
        .__schngnClerkRedirects.signUp
  );
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
  const allowedNames = ['page_view', 'calculator_start', 'trip_added', 'simulation_run', 'pdf_buy_intent', 'unlock_buy_intent'];
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
