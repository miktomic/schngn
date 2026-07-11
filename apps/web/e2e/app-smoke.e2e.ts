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
    await expect(page).toHaveURL(/\/he\/app#trips$/);
    await expect(page.locator('#app-anchor-select')).toHaveValue('trips');
    await expect(page.locator('#plan')).toHaveCount(0);
    const appLanguageSelector = page.getByRole('combobox', { name: 'שפה' });
    await appLanguageSelector.selectOption('fr');
    await expect(page).toHaveURL(/\/fr\/app#trips$/);
    await expect(page.locator('#app-anchor-select')).toHaveValue('trips');
    await page.reload();
    await expect(page.locator('#app-anchor-select')).toHaveValue('trips');
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

    await page.locator('#status').getByRole('button', { name: 'I don’t have a trip to add yet.' }).click();
    await page.locator('#trips').evaluate((section) => section.scrollIntoView());

    const answerBox = await page.locator('#status').boundingBox();
    const detailsBox = await page.locator('#trips').boundingBox();
    expect(answerBox).not.toBeNull();
    expect(detailsBox).not.toBeNull();

    const answerRight = answerBox!.x + answerBox!.width;
    const verticalOverlap = Math.min(answerBox!.y + answerBox!.height, detailsBox!.y + detailsBox!.height)
      - Math.max(answerBox!.y, detailsBox!.y);
    expect(verticalOverlap).toBeGreaterThan(0);
    expect(detailsBox!.x).toBeGreaterThanOrEqual(answerRight - 1);

    await page.setViewportSize({ width: 900, height: 900 });
    await page.locator('#trips').evaluate((section) => section.scrollIntoView());
    const tabletAnswerBox = await page.locator('#status').boundingBox();
    const tabletDetailsBox = await page.locator('#trips').boundingBox();
    expect(tabletDetailsBox!.x).toBeGreaterThanOrEqual(tabletAnswerBox!.x + tabletAnswerBox!.width - 1);

    await page.setViewportSize({ width: 640, height: 900 });
    expect(await page.locator('#status').evaluate((section) => getComputedStyle(section).position)).toBe('static');

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/he/app#details');
    await expect(page).toHaveURL(/\/he\/app#trips$/);
    await page.locator('#trips').evaluate((section) => section.scrollIntoView());
    const rtlAnswerBox = await page.locator('#status').boundingBox();
    const rtlDetailsBox = await page.locator('#trips').boundingBox();
    expect(await page.locator('html').getAttribute('dir')).toBe('rtl');
    expect(rtlDetailsBox!.x + rtlDetailsBox!.width).toBeLessThanOrEqual(rtlAnswerBox!.x + 1);
  });

  test('keeps native date controls inside the trip dialog on narrow mobile screens', async ({ page }) => {
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');
    await page.locator('#add-trip-button').click();

    const dialog = page.getByRole('dialog', { name: 'Add a Schengen stay' });
    await expect(dialog).toBeVisible();

    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 760 });

      const dialogGeometry = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
          left: rect.left,
          right: rect.right,
          viewportWidth: window.innerWidth
        };
      });
      expect(dialogGeometry.scrollWidth).toBeLessThanOrEqual(dialogGeometry.clientWidth + 1);
      expect(dialogGeometry.left).toBeGreaterThanOrEqual(0);
      expect(dialogGeometry.right).toBeLessThanOrEqual(dialogGeometry.viewportWidth + 1);

      const dateControls = dialog.locator('.field-group input[type="date"]:visible');
      await expect(dateControls).toHaveCount(2);
      const dateControlGeometry = await dateControls.evaluateAll((inputs) =>
        inputs.map((input) => {
          const inputRect = input.getBoundingClientRect();
          const fieldRect = input.closest('.field-group')?.getBoundingClientRect();
          const style = getComputedStyle(input);
          return {
            inputLeft: inputRect.left,
            inputRight: inputRect.right,
            fieldLeft: fieldRect?.left,
            fieldRight: fieldRect?.right,
            paddingInlineStart: Number.parseFloat(style.paddingInlineStart),
            paddingInlineEnd: Number.parseFloat(style.paddingInlineEnd)
          };
        })
      );
      for (const geometry of dateControlGeometry) {
        expect(geometry.fieldLeft).toBeDefined();
        expect(geometry.fieldRight).toBeDefined();
        expect(geometry.inputLeft).toBeGreaterThanOrEqual(geometry.fieldLeft! - 1);
        expect(geometry.inputRight).toBeLessThanOrEqual(geometry.fieldRight! + 1);
        expect(geometry.paddingInlineStart).toBeGreaterThanOrEqual(8);
        expect(geometry.paddingInlineEnd).toBeGreaterThanOrEqual(8);
      }
    }
  });

  test('saves an open ongoing stay and calculates the departure deadline without an exit date', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-07-10T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');
    await page.locator('#add-trip-button').click();

    const form = page.getByRole('form', { name: 'Trip form' });
    await form.getByLabel('Entry date').fill('2026-07-01');
    await form.getByLabel("I'm currently in Schengen").check();
    await expect(form.locator('input#trip-exit')).toHaveCount(0);
    await expect(form.getByText('Leave by')).toBeVisible();
    await expect(form.locator('.ongoing-departure')).toContainText(/28 Sept 2026/);
    await form.getByRole('button', { name: 'Save trip' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    const currentTrip = page.locator('.trip-list article').filter({ hasText: 'Currently in Schengen' });
    await expect(currentTrip.locator('.trip-day-count')).toHaveText('10 days');
    await expect(page.locator('#status')).toContainText(/Leave by: 28 Sept/);

    await currentTrip.locator('.trip-summary-trigger').click();
    await expect(currentTrip.getByLabel("I'm currently in Schengen")).toBeChecked();
    await expect(currentTrip.getByText('Leave by')).toBeVisible();
    await currentTrip.getByLabel("I'm currently in Schengen").uncheck();
    await currentTrip.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.locator('.trip-list article').filter({ hasText: 'Currently in Schengen' })).toHaveCount(0);
  });

  test('installed PWA shell serves locally saved trips and a cached shell offline', async ({ page, context }) => {
    await installFakeClerk(page, null);
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem('schngn.e2e.initialized')) return;
      window.localStorage.clear();
      window.sessionStorage.setItem('schngn.e2e.initialized', 'true');
    });
    await page.goto('/app');
    await expect(page.locator('#status').getByRole('heading', { name: 'Add your Schengen trips' })).toBeVisible();
    await expect(page.locator('#status').getByText('Enter each Schengen trip once. Its dates determine the calculation automatically.')).toBeVisible();
    await expect(page.locator('#trip-editor')).toHaveCount(0);
    await expect(page.locator('#add-trip-button')).toHaveText('Add new trip');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json');
    await expect(page.locator('link[rel="icon"][href$="/favicon.png"]')).toHaveAttribute('sizes', '64x64');
    await expect(page.locator('link[rel="apple-touch-icon"][href$="/icons/apple-touch-icon.png"]')).toHaveAttribute('sizes', '180x180');

    const offlineReady = await page.evaluate(async () => {
      const offlineWindow = window as unknown as { __schngnOfflineReady?: Promise<boolean> };
      return offlineWindow.__schngnOfflineReady ?? false;
    });
    expect(offlineReady).toBe(true);

    await expect(page.getByRole('heading', { name: 'Your 180-day timeline' })).toBeVisible();
    await expect(page.getByRole('img', { name: /0 counted days in this inclusive 180-day window/i })).toHaveCount(0);
    await expect(page.locator('#timeline')).toBeVisible();
    await expect(page.locator('#timeline #timeline-heading')).toBeVisible();
    await page.locator('#add-trip-button').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add a Schengen stay' })).toBeFocused();
    const tripForm = page.getByRole('form', { name: 'Trip form' });
    await tripForm.getByLabel(/Trip label/).fill('Offline Spain stay');
    await tripForm.locator('#trip-entry-country').selectOption('ES');
    await tripForm.locator('#trip-exit-country').selectOption('ES');
    await tripForm.getByLabel('Entry date').fill('2026-05-01');
    await tripForm.getByLabel('Exit date').fill('2026-05-05');
    await expect(tripForm.getByRole('radio')).toHaveCount(0);
    await tripForm.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(tripDisclosure(page, 'Offline Spain stay')).toBeVisible();
    await expect(page.getByRole('img', { name: /5 counted days in this inclusive 180-day window/i })).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Your Trips', exact: true })).toBeVisible();
    await expect(page.getByText('1 trip stored on this device.')).toBeVisible();
    await expect(page.getByRole('heading', { name: '85 safe buffer days' })).toBeVisible();
    await expect(page.locator('#status .status-chip').getByText('Offline Spain stay · Completed', { exact: true })).toBeVisible();

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
    await expect(page.locator('#status .status-chip').getByText('Offline Spain stay · Completed', { exact: true })).toBeVisible();
    await expect(page.getByText('1 trip stored on this device.')).toBeVisible();
    await expect(tripDisclosure(page, 'Offline Spain stay')).toBeVisible();
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
    const answer = page.locator('#status');
    await expect(answer.getByRole('heading', { name: 'Add your Schengen trips' })).toBeVisible();
    await expect(answer.getByRole('button', { name: /Add .*trip/ })).toHaveCount(0);
    await expect(page.locator('#add-trip-button')).toBeVisible();
    await expect(page.getByRole('form', { name: 'Trip form' })).toHaveCount(0);

    await expect(page.locator('.anchor-links a')).toHaveText(['Timeline', 'Trips', 'Account']);
    await expect(page.locator('#app-anchor-select option')).toHaveText(['Timeline', 'Trips', 'Account']);
    const timelineBox = await page.locator('#timeline').boundingBox();
    const tripsBox = await page.locator('#trips').boundingBox();
    expect(timelineBox).not.toBeNull();
    expect(tripsBox).not.toBeNull();
    expect(timelineBox!.y).toBeLessThan(tripsBox!.y);
    await navigateToAppAnchor(page, 'timeline');
    await expect(page.locator('#timeline').getByRole('heading', { name: 'Your 180-day timeline' })).toBeVisible();
    await navigateToAppAnchor(page, 'trips');
    await expect(page.locator('#trips').getByRole('heading', { name: 'Your Trips' })).toBeVisible();
    await expect(page.locator('#trips .empty-state')).toContainText('Enter each Schengen trip once');
    await page.locator('#add-trip-button').click();
    await expect(page.getByRole('dialog', { name: 'Add a Schengen stay' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Add a Schengen stay' })).toBeFocused();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('#add-trip-button')).toBeFocused();
    await expect(page.locator('#report')).toHaveCount(0);
    await answer.scrollIntoViewIfNeeded();
    await answer.getByRole('button', { name: 'I don’t have a trip to add yet.' }).click();
    await expect(page).toHaveURL(/\/app#timeline$/);
    await expect(answer.getByRole('heading', { name: '90 safe buffer days' })).toBeVisible();
    await expect(answer.getByText(/calculate as if you spent no days in Schengen during the last 180 days/i)).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('schngn-no-previous-history-v1'))).toBe('true');

    await page.reload();
    await expect(answer.getByRole('heading', { name: '90 safe buffer days' })).toBeVisible();
    await expect(answer.getByRole('heading', { name: 'Add your Schengen trips' })).toHaveCount(0);
  });

  test('keeps the selected app anchor through refresh and browser history', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-07-10T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app?market=uk');
    await navigateToAppAnchor(page, 'trips');
    await page.reload();
    await expect(page.locator('#app-anchor-select')).toHaveValue('trips');

    await navigateToAppAnchor(page, 'account');
    await expect(page).toHaveURL(/\/app\?market=uk#account$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/app\?market=uk#trips$/);
    await expect(page.getByRole('heading', { name: 'Your 180-day timeline' })).toBeVisible();
  });

  test('maps legacy section URLs to stable single-page anchors', async ({ page }) => {
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());

    await page.goto('/app?market=uk&section=planner');
    await expect(page.locator('#app-anchor-select')).toHaveValue('trips');
    await expect(page).toHaveURL(/\/app\?market=uk#trips$/);
    await expect(page.locator('#plan')).toHaveCount(0);

    await page.goto('/app?section=trip');
    await expect(page.locator('#app-anchor-select')).toHaveValue('trips');
    await expect(page).toHaveURL(/\/app#trips$/);

    await page.goto('/app#timeline');
    await expect(page.locator('#app-anchor-select')).toHaveValue('timeline');
    await expect(page).toHaveURL(/\/app#timeline$/);

    await page.goto('/app#status');
    await expect(page.locator('#app-anchor-select')).toHaveValue('timeline');
    await expect(page).toHaveURL(/\/app#timeline$/);

    await page.goto('/app#details');
    await expect(page.locator('#app-anchor-select')).toHaveValue('trips');
    await expect(page).toHaveURL(/\/app#trips$/);

    await page.goto('/app?section=privacy');
    await expect(page.locator('#app-anchor-select')).toHaveValue('account');
    await expect(page).toHaveURL(/\/app#account$/);
    await expect(page.locator('#account details')).toHaveAttribute('open', '');
  });

  test('sends signup calls directly to Clerk without leaving the local app in tests', async ({ page }) => {
    const requests = observeNetwork(page);
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');
    await navigateToAppAnchor(page, 'account');
    const account = page.locator('#account');
    await expect(account.getByRole('heading', { name: 'Keep using SCHNGN without an account' })).toBeVisible();
    await account.getByRole('button', { name: 'Sign up' }).click();

    await expect.poll(() => readClerkSignUpRedirects(page)).toEqual(['/app?account=connected#account']);
    expect(requests.filter((request) => new URL(request.url).pathname.startsWith('/api/'))).toEqual([]);
  });

  test('saving an inline adjustment replaces the original trip without opening an edit dialog', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-02-01T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem('schngn.e2e.quick-adjust-initialized')) return;
      window.localStorage.clear();
      window.sessionStorage.setItem('schngn.e2e.quick-adjust-initialized', 'true');
    });
    await page.goto('/app');
    await page
      .locator('#status')
      .getByRole('button', { name: 'I don’t have a trip to add yet.' })
      .click();
    await addTrip(page, {
      countryCode: 'IT',
      entryDate: '2026-07-01',
      exitDate: '2026-09-28',
      label: 'Quick-adjust booking',
      status: 'booked'
    });
    await page.reload();
    await expect(page.locator('#status').getByRole('heading', { name: /safe buffer days/i })).toBeVisible();

    await navigateToAppAnchor(page, 'trips');
    const tripRowTrigger = tripDisclosure(page, 'Quick-adjust booking');
    const tripCard = savedTripCard(page, 'Quick-adjust booking');
    await expect(tripCard.locator('.trip-mini-timeline')).toHaveCount(1);
    await expect(tripCard.locator('.expand-trip-icon')).toHaveCount(0);
    await expect(tripCard.getByRole('button', { name: /^Edit / })).toHaveCount(0);
    await tripRowTrigger.click();
    const quickAdjuster = tripCard.locator('.trip-adjust-panel');
    await expect(page).toHaveURL(/\/app#trips$/);
    await expect(tripRowTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(quickAdjuster).toHaveCount(1);
    await expect(quickAdjuster.getByRole('heading', { name: 'Adjust trip dates' })).toBeFocused();
    await expect(quickAdjuster.getByLabel('Arrival', { exact: true })).toBeVisible();
    await expect(quickAdjuster.getByLabel('Departure', { exact: true })).toBeVisible();
    await expect(quickAdjuster.getByText('Exact dates', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Edit Schengen stay' })).toHaveCount(0);
    await quickAdjuster.getByText('Trip details', { exact: true }).click();
    await expect(quickAdjuster.getByLabel(/Trip label/)).toHaveValue('Quick-adjust booking');
    await expect(quickAdjuster.getByLabel(/Entry country/)).toBeVisible();
    await expect(quickAdjuster.getByLabel(/Exit country/)).toBeVisible();
    await expect(quickAdjuster.getByRole('button', { name: 'Add time outside' })).toBeVisible();
    const moveTrip = quickAdjuster.getByRole('button', { name: /Move trip:/ });
    const exitHandle = quickAdjuster.getByRole('slider', { name: /Departure:/ });
    const saveChanges = quickAdjuster.getByRole('button', { name: 'Save changes' });
    await expect(quickAdjuster.getByText('Live what-if result')).toBeVisible();
    await expect(quickAdjuster.locator('.entry-date')).toContainText('1 Jul 2026');
    await expect(quickAdjuster.locator('.exit-date')).toContainText('28 Sept 2026');
    await expect(quickAdjuster.locator('.range-feedback')).toHaveText('At the limit');
    await expect(quickAdjuster.locator('.cutoff-marker')).toHaveAttribute('aria-label', 'Over limit from 29 Sept 2026');
    await expect(quickAdjuster.locator('.cutoff-label')).toHaveText('Over limit from 29 Sept 2026');
    await exitHandle.press('ArrowRight');
    await expect(quickAdjuster.locator('.exit-date')).toContainText('29 Sept 2026');
    await expect(quickAdjuster.locator('.range-feedback')).toHaveText('Over by 1 day');
    await expect(quickAdjuster.locator('.cutoff-marker')).toHaveAttribute('aria-label', 'Over limit from 29 Sept 2026');
    await expect(quickAdjuster.locator('.cutoff-label')).toHaveText('Over limit from 29 Sept 2026');
    await exitHandle.press('ArrowLeft');
    await expect(saveChanges).toBeDisabled();
    await moveTrip.press('ArrowRight');
    await expect(saveChanges).toBeEnabled();
    await moveTrip.press('ArrowLeft');
    await expect(saveChanges).toBeDisabled();
    await moveTrip.press('ArrowRight');
    await expect(saveChanges).toBeEnabled();
    await saveChanges.click();
    await expect(page.getByText('Trip updated.')).toBeVisible();

    await expect(page.getByText('1 trip stored on this device.')).toBeVisible();
    await tripRowTrigger.click();
    await expect(quickAdjuster).toHaveCount(1);
    await expect(quickAdjuster.getByLabel('Arrival', { exact: true })).toHaveValue('2026-07-02');
    await expect(quickAdjuster.getByLabel('Departure', { exact: true })).toHaveValue('2026-09-29');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('records a multi-country journey with an outside-Schengen break', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-06-01T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');
    await page.locator('#add-trip-button').click();

    const form = page.getByRole('form', { name: 'Trip form' });
    await form.getByLabel(/Trip label/).fill('Summer trip');
    await form.locator('#trip-entry').fill('2026-07-01');
    await form.locator('#trip-exit').fill('2026-07-12');
    await form.locator('#trip-entry-country').selectOption('IT');
    await form.locator('#trip-exit-country').selectOption('AT');
    await expect(form.getByRole('radio')).toHaveCount(0);
    await form.getByRole('button', { name: 'Add time outside' }).click();
    await form.locator('[id^="trip-break-left-"]').fill('2026-07-05');
    await form.locator('[id^="trip-break-return-"]').fill('2026-07-08');

    await expect(form.getByText(/10 Schengen days · 2 days outside/)).toBeVisible();
    await form.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.locator('#status').getByRole('heading', { name: '80 safe buffer days' })).toBeVisible();
    await expect(page.locator('#timeline').getByRole('img', { name: /10 counted days/i })).toBeVisible();
    await expect(page.getByText('Italy → Austria')).toBeVisible();
    await expect(savedTripCard(page, 'Summer trip').locator('.trip-day-count')).toHaveText('10 days');
    await expect(savedTripCard(page, 'Summer trip').locator('.trip-dates')).toContainText('2 days outside');

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
    await page.locator('#add-trip-button').click();

    const form = page.getByRole('form', { name: 'Trip form' });
    await expect(form.getByRole('img', { name: /Your 180-day allocation/i })).toHaveCount(0);
    await form.locator('#trip-entry-country').selectOption('IT');
    await expect(form.locator('#trip-exit-country')).toHaveValue('IT');
    await form.getByLabel('Entry date').fill('2025-11-01');
    await form.getByLabel('Exit date').fill('2025-11-05');
    await form.getByRole('button', { name: 'Save trip' }).click();

    await expect(form.getByRole('heading', { name: 'This trip is outside today’s 180-day window' })).toBeVisible();
    expect(await page.evaluate(() => window.localStorage.getItem('schngn.trips.v2'))).toBeNull();
    await form.getByRole('button', { name: 'Save anyway' }).click();
    await expect(page.getByRole('heading', { name: 'Your Trips', exact: true })).toBeVisible();
    await page.locator('#status').getByRole('button', { name: 'Adjust this trip' }).click();
    const olderTrip = tripDisclosure(page, 'Italy → Italy');
    await expect(olderTrip).toBeVisible();
    await expect(olderTrip).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.trip-adjust-panel')).toHaveCount(1);
    await page.locator('.trip-adjust-panel').getByRole('button', { name: 'Keep original' }).click();
    await expect(olderTrip).toHaveAttribute('aria-expanded', 'false');
  });

  test('gives every trip a distinct mini timeline and expands one inline editor at a time', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-02-01T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');
    await page
      .locator('#status')
      .getByRole('button', { name: 'I don’t have a trip to add yet.' })
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
    await addTrip(page, {
      countryCode: 'DE',
      entryDate: '2026-07-09',
      exitDate: '2026-07-16',
      label: 'Germany overlap',
      status: 'booked'
    });

    await navigateToAppAnchor(page, 'trips');
    const italyRow = tripDisclosure(page, 'Italy overlap');
    const franceRow = tripDisclosure(page, 'France overlap');
    const germanyRow = tripDisclosure(page, 'Germany overlap');
    const italyCard = savedTripCard(page, 'Italy overlap');
    const franceCard = savedTripCard(page, 'France overlap');
    const germanyCard = savedTripCard(page, 'Germany overlap');
    await expect(italyRow).toBeVisible();
    await expect(franceRow).toBeVisible();
    await expect(germanyRow).toBeVisible();
    await expect(italyRow).toHaveAttribute('aria-label', /Italy overlap.*Italy.*1 Jul.*10 Jul 2026/);
    await expect(franceRow).toHaveAttribute('aria-label', /France overlap.*France.*5 Jul.*14 Jul 2026/);
    await expect(germanyRow).toHaveAttribute('aria-label', /Germany overlap.*Germany.*9 Jul.*16 Jul 2026/);
    await expect(italyRow).toHaveAttribute('aria-expanded', 'false');
    await expect(franceRow).toHaveAttribute('aria-expanded', 'false');
    await expect(germanyRow).toHaveAttribute('aria-expanded', 'false');
    await expect(italyCard.locator('.trip-day-count')).toHaveText('10 days');
    await expect(franceCard.locator('.trip-day-count')).toHaveText('10 days');
    await expect(germanyCard.locator('.trip-day-count')).toHaveText('8 days');
    await expect(italyRow).toHaveAttribute('aria-label', /10 days/);
    const tripMetricType = await italyCard.evaluate((card) => ({
      date: Number.parseFloat(getComputedStyle(card.querySelector('.trip-dates')!).fontSize),
      days: Number.parseFloat(getComputedStyle(card.querySelector('.trip-day-count')!).fontSize)
    }));
    expect(tripMetricType.days).toBeGreaterThan(tripMetricType.date * 1.25);

    const tripCards = page.locator('#trips .trip-list > article');
    await expect(tripCards).toHaveCount(3);
    for (const card of [italyCard, franceCard, germanyCard]) {
      await expect(card.locator('.trip-mini-timeline')).toHaveCount(1);
      await expect(card.locator('.trip-mini-segment')).toHaveCount(1);
      await expect(card.locator('.expand-trip-icon')).toHaveCount(0);
      await expect(card.getByRole('button', { name: /^Edit / })).toHaveCount(0);
    }
    const segmentColors = await page.locator('#trips .trip-list > article .trip-mini-segment').evaluateAll((segments) =>
      segments.map((segment) => getComputedStyle(segment).backgroundColor)
    );
    expect(segmentColors).toHaveLength(3);
    expect(segmentColors.every((color) => color !== '' && color !== 'rgba(0, 0, 0, 0)')).toBe(true);
    expect(new Set(segmentColors).size).toBe(3);

    await franceRow.click();
    const quickAdjuster = franceCard.locator('.trip-adjust-panel');
    await expect(page.locator('.trip-adjust-panel')).toHaveCount(1);
    await expect(quickAdjuster).toHaveCount(1);
    await expect(quickAdjuster.getByText('France overlap', { exact: true })).toBeVisible();
    await expect(franceRow).toHaveAttribute('aria-expanded', 'true');
    await expect(quickAdjuster.getByLabel('Arrival', { exact: true })).toBeVisible();
    await expect(quickAdjuster.getByLabel('Departure', { exact: true })).toBeVisible();
    await expect(quickAdjuster.getByText('Exact dates', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Edit Schengen stay' })).toHaveCount(0);

    await italyRow.click();
    const italyAdjuster = italyCard.locator('.trip-adjust-panel');
    await expect(page.locator('.trip-adjust-panel')).toHaveCount(1);
    await expect(italyAdjuster).toHaveCount(1);
    await expect(italyAdjuster.getByText('Italy overlap', { exact: true })).toBeVisible();
    await expect(italyRow).toHaveAttribute('aria-expanded', 'true');
    await expect(franceRow).toHaveAttribute('aria-expanded', 'false');

    await italyAdjuster.getByRole('slider', { name: /Departure:/ }).press('ArrowLeft');
    await page.locator('#add-trip-button').click();
    await expect(page.getByRole('dialog', { name: 'Add a Schengen stay' })).toHaveCount(0);
    await expect(italyAdjuster.getByText('Save changes or keep the original before opening another trip.')).toBeVisible();
    await franceRow.click();
    await expect(italyRow).toHaveAttribute('aria-expanded', 'true');
    await expect(franceRow).toHaveAttribute('aria-expanded', 'false');
    await italyAdjuster.getByRole('button', { name: 'Keep original' }).click();
    await expect(page.locator('.trip-adjust-panel')).toHaveCount(0);
    await expect(italyRow).toHaveAttribute('aria-expanded', 'false');

    await page.locator('#add-trip-button').click();
    await expect(page.getByRole('dialog', { name: 'Add a Schengen stay' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Edit Schengen stay' })).toHaveCount(0);
  });

  test('reports a completed over-limit trip as historical evidence, not a plan to fix', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-07-10T12:00:00Z'));
    await installFakeClerk(page, null);
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/app');

    await addTrip(page, {
      countryCode: 'PT',
      entryDate: '2026-02-01',
      exitDate: '2026-05-02',
      label: 'Completed long stay',
      status: 'past'
    });

    const answer = page.locator('#status');
    await expect(answer.locator('.status-chip')).toHaveText('Completed long stay · Completed');
    await expect(answer.getByRole('heading', { name: '1 day over limit' })).toBeVisible();
    await expect(answer).toContainText('That is 1 day over the 90-day limit.');
    await expect(answer).toContainText('This completed trip is included in your history. Review the counted days against your travel records.');
    await expect(answer).not.toContainText(/fits|needs changes|shorten or move/i);
    await expect(page.getByText('1 trip stored on this device.')).toBeVisible();

    const completedCard = savedTripCard(page, 'Completed long stay');
    await expect(completedCard.locator('.trip-mini-timeline')).toHaveCount(1);
    await tripDisclosure(page, 'Completed long stay').click();
    const completedAdjuster = completedCard.locator('.trip-adjust-panel');
    await expect(completedAdjuster).toHaveCount(1);
    const completedResult = completedAdjuster.locator('.live-result');
    await expect(completedResult.locator('.status-chip')).toHaveText('Completed long stay · Completed');
    await expect(completedResult).toContainText('Completed long stay reached 91 / 90 counted days in its highest affected window, 1 day over the limit.');
    await expect(completedResult).not.toContainText(/fits|needs changes|shorten or move/i);
  });

  test('app completes real local-first planning, forecast, error, and recovery flows', async ({ page }) => {
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
    await expect(page.locator('#status').getByRole('heading', { name: 'Add your Schengen trips' })).toBeVisible();
    await expect(page.locator('#status').getByRole('heading', { name: /safe buffer days/i })).toHaveCount(0);

    await page.locator('#add-trip-button').click();
    const tripForm = page.getByRole('form', { name: 'Trip form' });
    await expect(tripForm.getByLabel(/Trip label/)).toHaveAttribute('maxlength', '80');
    await tripForm.getByLabel(/Trip label/).fill('Spain booking');
    await tripForm.locator('#trip-entry-country').evaluate((select) => {
      const countrySelect = select as HTMLSelectElement;
      countrySelect.add(new Option('Spain typo', 'SPAIN'));
      countrySelect.value = 'SPAIN';
      countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await tripForm.getByLabel('Entry date').fill('2026-07-01');
    await tripForm.getByLabel('Exit date').fill('2026-07-19');
    await tripForm.getByRole('button', { name: 'Save trip' }).click();
    await expect(tripForm.locator('#trip-entry-country-error')).toHaveText('Choose a Schengen country or leave this optional field blank.');
    await expect(tripForm.locator('#trip-entry-country')).toHaveAttribute('aria-invalid', 'true');
    await tripForm.locator('#trip-entry-country').selectOption('ES');
    await tripForm.locator('#trip-exit-country').selectOption('ES');
    await tripForm.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.locator('#trips').getByRole('heading', { name: 'Your Trips', exact: true })).toBeVisible();
    await expect(tripDisclosure(page, 'Spain booking')).toBeVisible();
    await expect(page.locator('#timeline')).toBeVisible();
    await expect(page.locator('#timeline #timeline-heading')).toBeVisible();
    await expect(page.locator('#timeline .timeline-card')).toBeVisible();

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
    await expect(page.locator('#canonical-timeline-heading + bdi')).toHaveCount(0);
    await expect(page.locator('#timeline .timeline-ticks > bdi')).toHaveText(['21 Jan 2026', '19 Jul 2026']);
    const returnStart = page.locator('#timeline .return-start-forecast');
    await expect(returnStart.getByText('Days start returning')).toBeVisible();
    await expect(returnStart.getByText('24 Jul 2026')).toBeVisible();
    await expect(returnStart.getByRole('img', { name: /First counted day returns on 24 Jul 2026/i })).toBeVisible();

    await tripDisclosure(page, 'Spain booking').click();
    const quickAdjuster = savedTripCard(page, 'Spain booking').locator('.trip-adjust-panel');
    await expect(quickAdjuster).toBeVisible();
    await expect(quickAdjuster.getByLabel('Arrival', { exact: true })).toBeVisible();
    await expect(quickAdjuster.getByLabel('Departure', { exact: true })).toBeVisible();
    await expect(quickAdjuster.getByText('Exact dates', { exact: true })).toHaveCount(0);
    await quickAdjuster.getByRole('button', { name: /Move trip:/ }).press('ArrowRight');
    const exactDates = quickAdjuster.locator('input[type="date"]');
    await expect(exactDates.nth(0)).toHaveValue('2026-07-02');
    await expect(exactDates.nth(1)).toHaveValue('2026-07-20');
    await expect(page.getByText(/Highest affected-day window shows 51 counted days/)).toBeVisible();
    await quickAdjuster.getByRole('button', { name: 'Keep original' }).click();
    await expect(quickAdjuster).toHaveCount(0);

    await expect(page.locator('.returns-section')).toHaveCount(0);

    await expect(page.locator('#plan')).toHaveCount(0);

    const signupValue = page.locator('.signup-value-section');
    await expect(signupValue.getByRole('heading', { name: 'Keep your trips for next time' })).toBeVisible();
    await expect(signupValue).toContainText('future 90/180 calculations');
    await expect(signupValue.getByRole('button', { name: 'Create account' })).toBeVisible();

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
    const unicodeTrip = tripDisclosure(page, '家族旅行 ✈️');
    await expect(unicodeTrip).toBeVisible();
    await expect(page.getByText(/Trips could not be saved in this browser/i)).toBeVisible();
    await page.evaluate(() => {
      const storagePrototype = Storage.prototype as Storage & { __schngnSetItem?: Storage['setItem'] };
      if (storagePrototype.__schngnSetItem) storagePrototype.setItem = storagePrototype.__schngnSetItem;
    });
    await page.getByRole('button', { name: 'Delete 家族旅行 ✈️' }).click();
    await expect(page.getByRole('heading', { name: 'Delete 家族旅行 ✈️?' })).toBeVisible();
    await page.getByRole('button', { name: 'Keep trip' }).click();
    await expect(unicodeTrip).toBeVisible();
    await page.getByRole('button', { name: 'Delete 家族旅行 ✈️' }).click();
    await page.getByRole('button', { name: 'Delete trip' }).click();
    await expect(unicodeTrip).toHaveCount(0);

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
    await expect(page.locator('#status').getByRole('heading', { name: 'Add your Schengen trips' })).toBeVisible();

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
    await page.locator('#add-trip-button').click();
    const firstTripForm = page.getByRole('form', { name: 'Trip form' });
    await firstTripForm.getByLabel(/Trip label/).fill('Account Italy stay');
    await firstTripForm.locator('#trip-entry-country').selectOption('IT');
    await firstTripForm.locator('#trip-exit-country').selectOption('IT');
    await firstTripForm.getByLabel('Entry date').fill('2026-08-01');
    await firstTripForm.getByLabel('Exit date').fill('2026-08-05');
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
    await expect(tripDisclosure(page, 'Account France stay')).toBeVisible();

    await navigateToAppAnchor(page, 'account');
    await accountScreen.getByRole('button', { name: 'Delete saved account trips' }).click();
    await accountScreen.getByRole('button', { name: 'Delete account trips' }).click();
    await expect.poll(() => deleteCount).toBe(1);
    await expect(accountScreen.getByText(/Cloud trip data was deleted/i)).toBeVisible();

    await navigateToAppAnchor(page, 'trips');
    await expect(tripDisclosure(page, 'Account Italy stay')).toBeVisible();
    await expect(tripDisclosure(page, 'Account Spain stay')).toBeVisible();
    await expect(tripDisclosure(page, 'Account France stay')).toBeVisible();
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
  await page.locator('#add-trip-button').click();
  await expect(page.getByRole('dialog', { name: 'Add a Schengen stay' })).toBeVisible();
  const form = page.getByRole('form', { name: 'Trip form' });
  await form.getByLabel(/Trip label/).fill(trip.label);
  await form.locator('#trip-entry-country').selectOption(trip.countryCode);
  await form.locator('#trip-exit-country').selectOption(trip.countryCode);
  await form.getByLabel('Entry date').fill(trip.entryDate);
  await form.getByLabel('Exit date').fill(trip.exitDate);
  await expect(form.getByRole('radio')).toHaveCount(0);
  await form.getByRole('button', { name: 'Save trip' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Your Trips', exact: true })).toBeVisible();
  await expect(tripDisclosure(page, trip.label)).toBeVisible();
}

function tripDisclosure(page: Page, label: string) {
  return page.locator('#trips .trip-summary-trigger').filter({ hasText: label });
}

function savedTripCard(page: Page, label: string) {
  return page.locator('#trips .trip-list > article').filter({
    has: page.locator('.trip-summary-trigger').filter({ hasText: label })
  });
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
  anchor: 'timeline' | 'trips' | 'report' | 'account'
): Promise<void> {
  await page.locator('#app-anchor-select').selectOption(anchor);
  await expect(page).toHaveURL(new RegExp(`#${anchor}$`));
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
  const allowedNames = ['page_view', 'calculator_start', 'trip_added', 'simulation_run', 'unlock_buy_intent'];
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
