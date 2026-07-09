import { expect, test } from '@playwright/test';
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

    await page.goto('/app');

    await expect(page.getByRole('heading', { name: '15 safe buffer days' })).toBeVisible();
    await expect(page.getByText('Italy fits')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Border-ready report' })).toBeVisible();

    await page.getByRole('button', { name: 'Show calculation' }).click();
    await expect(page.getByRole('heading', { name: 'Calculation proof' })).toBeVisible();
    await expect(page.getByText(/Entry and exit dates both count/i)).toBeVisible();

    await page.getByRole('button', { name: 'Report' }).click();
    await expect(page.getByRole('heading', { name: 'Border-ready report' })).toBeVisible();
    await expect(page.getByText(/not legal advice/i)).toBeVisible();

    await page.getByRole('button', { name: 'Privacy' }).click();
    await expect(page.getByRole('heading', { name: 'Privacy & data' })).toBeVisible();
    await expect(page.getByText(/Stored only in this browser/i)).toBeVisible();
    await expect(page.getByText(/If this browser is cleared, export JSON first/i)).toBeVisible();
    await expect(page.getByText(/Analytics never include trip dates/i)).toBeVisible();

    await page.getByRole('button', { name: 'Add trip' }).click();
    await page.getByLabel('Country').fill('Spain');
    await page.getByLabel('Entry date').fill('2026-07-01');
    await page.getByLabel('Exit date').fill('2026-07-19');
    await page.getByRole('button', { name: 'Save trip' }).click();
    await expect(page.getByRole('heading', { name: 'Trips' })).toBeVisible();
    await expect(page.getByText(/Spain/i)).toBeVisible();
    await expect(page.getByText(/07-01 to 07-19/i)).toBeVisible();

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

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    assertNoForbiddenNetworkPayloads(requests, forbiddenTripValues);
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
