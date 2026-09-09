import { expect, test } from '@playwright/test';

test('first run exposes dates and exit actions, recovers invalid input and deletion focus', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-08T12:00:00Z'));
  await page.goto('/app');
  await expect(page.locator('#status #add-trip-button')).toBeVisible();
  await expect(page.locator('#timeline')).toHaveCount(0);
  await page.locator('#add-trip-button').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Dismiss', exact: true })).toBeInViewport();
  await expect(dialog.getByLabel('Entry date', { exact: true })).toBeInViewport();
  await expect(dialog.getByLabel('Exit date', { exact: true })).toBeInViewport();
  await expect(dialog.getByRole('button', { name: 'Save trip', exact: true })).toBeInViewport();
  await dialog.getByRole('button', { name: 'Save trip', exact: true }).click();
  await expect(dialog.getByLabel('Entry date', { exact: true })).toBeFocused();
  await expect(dialog.getByLabel('Entry date', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await dialog.getByLabel('Entry date', { exact: true }).fill('2026-09-08');
  await dialog.getByLabel('Exit date', { exact: true }).fill('2026-09-18');
  await dialog.getByRole('button', { name: 'Save trip', exact: true }).click();
  await expect(page.locator('.calculation-scope time')).toHaveAttribute('datetime', '2026-09-18');
  await page.locator('.trip-delete-action').click();
  await page.locator('.confirm-panel').getByRole('button', { name: 'Delete trip', exact: true }).click();
  await expect(page.locator('#add-trip-button')).toBeFocused();
  await expect(page.locator('.trip-list')).toHaveCount(0);
});

test('risk verdict identifies the first conflict checkpoint, not the full trip overage', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-08T12:00:00Z'));
  await page.goto('/app');
  await page.locator('#add-trip-button').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Entry date', { exact: true }).fill('2026-06-01');
  await dialog.getByLabel('Exit date', { exact: true }).fill('2026-10-01');
  await dialog.getByRole('button', { name: 'Save trip', exact: true }).click();
  await expect(page.locator('.calculation-scope')).toContainText('First over the limit on');
  await expect(page.locator('.calculation-scope time')).toHaveAttribute('datetime', '2026-08-30');
  await expect(page.locator('#status-heading')).toHaveText('1 day over limit');
});

test('completed history does not imply a future overstay and new scope labels fit every locale', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-08T12:00:00Z'));
  await page.goto('/app');
  await page.locator('#add-trip-button').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Entry date', { exact: true }).fill('2026-06-01');
  await dialog.getByLabel('Exit date', { exact: true }).fill('2026-06-11');
  await dialog.getByRole('button', { name: 'Save trip', exact: true }).click();
  await page.locator('.trip-summary-trigger').click();
  await expect(page.locator('.trip-adjust-panel .cutoff-label')).toHaveCount(0);
  await expect(page.locator('.trip-adjust-panel .live-result')).not.toContainText('Latest safe exit');
  await page.locator('.trip-adjust-panel').getByRole('button', { name: 'Keep original', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const locale of ['en','fr','de','es','it','pt-br','ru','uk','tr','sr','sq','ka','zh-cn','ja','ko','he','ar']) {
    await page.goto(locale === 'en' ? '/app' : `/${locale}/app`);
    await expect(page.locator('.calculation-scope time')).toHaveAttribute('datetime', '2026-06-11');
    await expect(page.locator('html')).toHaveAttribute('dir', ['he','ar'].includes(locale) ? 'rtl' : 'ltr');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
