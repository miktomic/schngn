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
    await expect(page.getByText(/Analytics never include trip dates/i)).toBeVisible();

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
