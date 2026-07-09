import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { assertNoForbiddenNetworkPayloads, type ObservedNetworkRequest } from '../src/lib/privacy/networkPrivacy';

const forbiddenTripValues = ['2026-10-01', '2026-10-13', 'Italy booked trip', 'michael@example.com'];

test.describe('SCHNGN app smoke and privacy checks', () => {
  test('landing page renders on mobile without leaking private trip values', async ({ page }) => {
    const requests = observeNetwork(page);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: /Know if your Schengen trip fits/i })).toBeVisible();
    await expect(page.getByText(/Your trip dates stay on this device/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Open calculator|Check Italy trip/i }).first()).toBeVisible();
    assertNoForbiddenNetworkPayloads(requests, forbiddenTripValues);
  });

  test('app route renders money-shot, proof, report, privacy, and waitlist states without leaking private values', async ({ page }) => {
    const requests = observeNetwork(page);
    const waitlistRequests: string[] = [];
    await page.route('**/api/waitlist', async (route) => {
      waitlistRequests.push(route.request().postData() ?? '');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, stored: true })
      });
    });
    await page.addInitScript(() => {
      const analyticsWindow = window as unknown as {
        __plausibleEvents: { name: string; options?: { props?: Record<string, string> } }[];
        plausible: (name: string, options?: { props?: Record<string, string> }) => void;
      };
      analyticsWindow.__plausibleEvents = [];
      analyticsWindow.plausible = (name, options) => analyticsWindow.__plausibleEvents.push({ name, options });
      window.localStorage.setItem('schngn.unlockPriceBucket.v1', 'eur_9');
    });

    await page.goto('/app');
    await page.getByRole('button', { name: 'Safe' }).focus();
    await expect(page.getByRole('button', { name: 'Safe' })).toBeFocused();

    await expect(page.getByRole('heading', { name: '15 safe buffer days' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Planning calculator only' })).toBeVisible();
    await expect(page.getByText(/not legal advice and not a guarantee of entry/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'European Commission short-stay calculator' })).toHaveAttribute(
      'href',
      'https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en'
    );
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByRole('heading', { name: 'Planning calculator only' })).toHaveCount(0);
    await expect(page.getByText(/Planning aid only\. Not legal advice/i)).toBeVisible();
    await expect(page.getByText('Italy fits')).toBeVisible();
    await expect(page.getByText('Latest safe exit')).toBeVisible();
    await expect(page.getByText('Nov 9', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Border-ready report' })).toBeVisible();

    await page.getByRole('button', { name: 'Planner' }).click();
    await expect(page.getByRole('heading', { name: 'Can I book this?' })).toBeVisible();
    await expect(page.getByText('Italy fits', { exact: true })).toBeVisible();
    await expect(page.getByText('56 days max from Sep 15')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unlock full trip planner — €9' })).toBeVisible();
    await page.getByRole('button', { name: 'Unlock full trip planner — €9' }).click();
    await expect(page.getByRole('heading', { name: 'Unlock request noted' })).toBeVisible();
    await expect(page.getByText(/No payment was taken/i)).toBeVisible();
    let plausibleEvents = await readPlausibleEvents(page);
    let plausibleEventNames = plausibleEvents.map((event) => event.name);
    expect(plausibleEventNames).toContain('unlock_buy_intent');
    assertSafePlausiblePayload(plausibleEvents);
    await page.getByLabel('Simulation label').fill('Portugal simulation');
    await page.getByLabel('Simulation country').fill('PT');
    await page.getByLabel('Simulation entry date').fill('2026-09-15');
    await page.getByLabel('Simulation exit date').fill('2026-11-30');
    await expect(page.getByText('Portugal simulation needs changes')).toBeVisible();
    await expect(page.getByText(/Latest safe exit is Nov 9/i)).toBeVisible();
    await page.getByRole('button', { name: 'Trips' }).click();
    await expect(page.getByText(/Portugal simulation/i)).toHaveCount(0);
    await page.getByRole('button', { name: 'Safe' }).click();

    await page.getByRole('button', { name: 'Show calculation' }).click();
    await expect(page.getByRole('heading', { name: 'Calculation proof' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Why this number?' })).toBeVisible();
    await expect(page.getByText('75 counted days between Apr 17 and Oct 13. That leaves 15 safe buffer days.')).toBeVisible();
    await expect(page.getByText(/Entry and exit dates both count/i)).toBeVisible();
    await expect(page.getByText(/The app looks back 180 calendar days from Oct 13/i)).toBeVisible();

    await page.getByRole('button', { name: 'Days returning soon' }).click();
    await expect(page.getByRole('heading', { name: '12 days return in the next 30 days' })).toBeVisible();
    await expect(page.getByText('Next return: Oct 28')).toBeVisible();
    await expect(page.getByText('France May 1 leaves the window')).toBeVisible();
    await expect(page.getByText('Nov 8')).toBeVisible();

    await page.getByRole('button', { name: 'Report' }).click();
    const reportRegion = page.getByLabel('Border-ready report');
    await expect(page.getByRole('heading', { name: 'Border-ready report' })).toBeVisible();
    await expect(reportRegion.getByText(/Not legal advice/i)).toBeVisible();
    await expect(page.getByText(/PDF export is an early-access fake door/i)).toBeVisible();
    await page.getByRole('button', { name: 'Generate border-ready PDF — €9' }).click();
    await expect(page.getByRole('heading', { name: 'Early-access request noted' })).toBeVisible();
    await expect(page.getByText(/No payment was taken/i)).toBeVisible();
    plausibleEvents = await readPlausibleEvents(page);
    plausibleEventNames = plausibleEvents.map((event) => event.name);
    expect(plausibleEventNames).toContain('pdf_buy_intent');
    assertSafePlausiblePayload(plausibleEvents);

    await page.getByRole('button', { name: 'Privacy' }).click();
    await expect(page.getByRole('heading', { name: 'Privacy & data' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Official sources' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entry/Exit System information' })).toHaveAttribute('href', 'https://travel-europe.europa.eu/en/ees');
    await expect(page.getByRole('link', { name: 'ETIAS information' })).toHaveAttribute('href', 'https://travel-europe.europa.eu/en/etias');
    await expect(page.getByText(/Stored only in this browser/i)).toBeVisible();
    await expect(page.getByText(/Export JSON before switching devices or clearing this browser/i)).toBeVisible();
    await expect(page.getByText(/Analytics never include trip dates/i)).toBeVisible();

    await page.getByRole('button', { name: 'Add trip' }).click();
    await page.getByLabel('Country').fill('Spain');
    await page.getByLabel('Entry date').fill('2026-07-01');
    await page.getByLabel('Exit date').fill('2026-07-19');
    await page.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.getByRole('heading', { name: 'Trips' })).toBeVisible();
    await expect(page.getByText(/Spain/i)).toBeVisible();
    await expect(page.getByText(/07-01 to 07-19/i)).toBeVisible();
    plausibleEvents = await readPlausibleEvents(page);
    plausibleEventNames = plausibleEvents.map((event) => event.name);
    expect(plausibleEventNames).toContain('page_view');
    expect(plausibleEventNames).toContain('calculator_start');
    expect(plausibleEventNames).toContain('trip_added');
    expect(plausibleEventNames).toContain('simulation_run');
    assertSafePlausiblePayload(plausibleEvents);

    await page.getByRole('button', { name: 'Edit Spain' }).click();
    await page.getByLabel('Label').fill('Spain shortened');
    await page.getByLabel('Exit date').fill('2026-07-01');
    await page.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.getByText(/Spain shortened/i)).toBeVisible();
    await expect(page.getByText(/07-01 to 07-01 · 1d/i)).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: 'Trips' }).click();
    await expect(page.getByText(/Spain shortened/i)).toBeVisible();
    await expect(page.getByText(/07-01 to 07-01 · 1d/i)).toBeVisible();

    await page.getByRole('button', { name: 'Privacy' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON' }).click();
    const download = await downloadPromise;
    const exportPath = await download.path();
    expect(exportPath).toBeTruthy();
    const exportedJson = await readFile(exportPath ?? '', 'utf8');
    expect(exportedJson).toContain('"schemaVersion": 1');
    expect(exportedJson).toContain('Spain shortened');

    await page.getByRole('button', { name: 'Clear local data' }).click();
    await page.getByRole('button', { name: 'Trips' }).click();
    await expect(page.getByText(/Spain shortened/i)).toHaveCount(0);

    await page.getByRole('button', { name: 'Privacy' }).click();
    await page.getByLabel('Import JSON file').setInputFiles({
      name: 'schngn-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(exportedJson)
    });
    await expect(page.getByText(/Imported 5 trips from JSON/i)).toBeVisible();
    await page.getByRole('button', { name: 'Trips' }).click();
    await expect(page.getByText(/Spain shortened/i)).toBeVisible();

    await page.getByRole('button', { name: 'Privacy' }).click();
    await page.getByLabel('Import JSON file').setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{not json')
    });
    await expect(page.getByText(/Import file is not valid JSON/i)).toBeVisible();

    await page.getByRole('button', { name: 'Trips' }).click();
    await page.getByRole('button', { name: 'Delete Spain shortened' }).click();
    await expect(page.getByText(/Spain shortened/i)).toHaveCount(0);

    await page.getByLabel('Trips').getByRole('button', { name: 'Add trip' }).click();
    await page.getByLabel('Entry date').fill('2026-10-14');
    await page.getByLabel('Exit date').fill('2026-10-13');
    await page.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.getByText(/Exit date cannot be before entry date/i)).toBeVisible();

    await page.getByRole('button', { name: 'Waitlist' }).click();
    await expect(page.getByRole('heading', { name: 'Get PDF export updates' })).toBeVisible();
    await expect(page.getByText(/does not send your trips, dates, country history/i)).toBeVisible();
    await page.getByRole('textbox', { name: 'Email' }).fill('michael@example.com');
    await expect(page.getByRole('button', { name: 'Join waitlist' })).toBeDisabled();
    await page.getByLabel(/I agree to receive SCHNGN updates/i).check();
    await page.getByRole('button', { name: 'Join waitlist' }).click();
    await expect(page.getByRole('heading', { name: 'You are on the list' })).toBeVisible();
    expect(waitlistRequests).toHaveLength(1);
    expect(JSON.parse(waitlistRequests[0])).toEqual({
      email: 'michael@example.com',
      consent: true,
      source: 'waitlist'
    });
    expect(waitlistRequests[0]).not.toContain('2026-10-13');
    expect(waitlistRequests[0]).not.toContain('Italy booked trip');

    plausibleEvents = await readPlausibleEvents(page);
    plausibleEventNames = plausibleEvents.map((event) => event.name);
    expect(plausibleEventNames).toContain('waitlist_signup');
    assertSafePlausiblePayload(plausibleEvents);

    assertNoForbiddenNetworkPayloads(
      requests,
      forbiddenTripValues.filter((value) => value !== 'michael@example.com')
    );
  });
});

function observeNetwork(page: import('@playwright/test').Page): ObservedNetworkRequest[] {
  const requests: ObservedNetworkRequest[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('data:') || url.includes('/@vite/') || url.includes('/node_modules/')) return;
    requests.push({ url, method: request.method(), postData: request.postData() });
  });
  return requests;
}

type PlausibleEvent = { name: string; options?: { props?: Record<string, string> } };

async function readPlausibleEvents(page: import('@playwright/test').Page): Promise<PlausibleEvent[]> {
  return page.evaluate(() =>
    (window as unknown as { __plausibleEvents: PlausibleEvent[] }).__plausibleEvents
  );
}

function assertSafePlausiblePayload(events: PlausibleEvent[]): void {
  const allowedNames = ['page_view', 'calculator_start', 'trip_added', 'simulation_run', 'pdf_buy_intent', 'unlock_buy_intent', 'waitlist_signup'];
  const allowedProps = ['source', 'trip_count_bucket', 'safe_buffer_bucket', 'verdict', 'price_bucket'];
  for (const event of events) {
    expect(allowedNames).toContain(event.name);
    for (const key of Object.keys(event.options?.props ?? {})) {
      expect(allowedProps).toContain(key);
    }
  }
  const payload = JSON.stringify(events);
  for (const forbidden of [...forbiddenTripValues, 'Portugal simulation', 'Spain shortened', '2026-07-01']) {
    expect(payload).not.toContain(forbidden);
  }
}
