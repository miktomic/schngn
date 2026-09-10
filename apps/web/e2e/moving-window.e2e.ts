import { expect, test } from '@playwright/test';

test('calculator date exploration keeps saved trips and the main verdict intact', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-09T12:00:00Z'));
  await page.addInitScript(() => {
    localStorage.setItem('schngn.trips.v2', JSON.stringify([
      { id: 'earlier', label: 'Earlier', status: 'past', stays: [{entryDate: '2026-04-02', exitDate: '2026-04-16'}] },
      { id: 'recent', label: 'Recent', status: 'past', stays: [{entryDate: '2026-04-22', exitDate: '2026-05-01'}] },
      { id: 'whatif', label: 'What-if', status: 'what-if', stays: [{entryDate: '2026-09-09', exitDate: '2026-11-12'}] },
      { id: 'spain', label: 'Spain', status: 'booked', stays: [{entryDate: '2026-11-28', exitDate: '2026-12-27'}] }
    ]));
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/app');
  const timeline = page.locator('#timeline .moving-window');
  await expect(timeline).toHaveAttribute('data-checking-date', '2026-12-23');
  const storage = await page.evaluate(() => localStorage.getItem('schngn.trips.v2'));
  const verdict = await page.locator('#status-heading').innerText();
  const outgoing: string[] = [];
  page.on('request', request => { if (request.postData()) outgoing.push(request.postData()!); });
  await timeline.getByLabel('Checking date', { exact: true }).fill('2026-09-08');
  await expect(timeline.locator('.window-result')).toContainText('25 / 90');
  await timeline.getByRole('slider').press('ArrowRight');
  await expect(timeline.locator('.window-result')).toContainText('26 / 90');
  await timeline.getByLabel('Checking date', { exact: true }).fill('2026-12-27');
  await expect(timeline.locator('.window-result')).toContainText('95 / 90');
  await expect(page.locator('#status-heading')).toHaveText(verdict);
  expect(await page.evaluate(() => localStorage.getItem('schngn.trips.v2'))).toBe(storage);
  await timeline.getByRole('button', { name: 'Back to result' }).click();
  await expect(timeline).toHaveAttribute('data-checking-date', '2026-12-23');
  expect(outgoing).toEqual([]);
  expect(errors).toEqual([]);
});

test('example toggle changes later usage and the window fits every locale at 320px', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-09T12:00:00Z'));
  await page.goto('/explainer');
  const example = page.locator('.moving-example');
  await expect(example.locator('.moving-window')).toHaveAttribute('data-checking-date', '2026-09-09');
  await expect(example.locator('.window-result')).toContainText('25 / 90');
  await expect(example.locator('.today-label')).toHaveText('Today');
  await expect(example.locator('.journey-axis')).toHaveCount(1);
  await expect(example.locator('.trip-details')).not.toHaveAttribute('open', '');
  expect(await example.evaluate(el => el.querySelector('.window-result')!.getBoundingClientRect().top > el.querySelector('.journey-chart')!.getBoundingClientRect().bottom)).toBe(true);
  await example.locator('.trip-details summary').click();
  await expect(example.locator('.lane-dates').first()).toContainText('2 Apr');
  await example.getByLabel('Include what-if stay').check();
  await expect(example.locator('.window-result')).toContainText('26 / 90');
  await example.getByRole('button', { name: 'Planned exit', exact: true }).click();
  await expect(example.locator('.window-result')).toContainText('95 / 90');
  await example.getByLabel('Include what-if stay').uncheck();
  await expect(example.locator('.window-result')).toContainText('30 / 90');
  await example.getByLabel('Include what-if stay').check();
  await expect(example.locator('.window-result')).toContainText('95 / 90');
  await expect(example.locator('.window-key')).toContainText('Outside this window');
  await example.getByLabel('Checking date', { exact: true }).fill('2026-12-23');
  await expect(example.locator('.window-result')).toContainText('91 / 90');
  await example.getByRole('slider').press('ArrowLeft');
  await expect(example.locator('.window-result')).toContainText('90 / 90');
  await page.setViewportSize({width: 320, height: 740});
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const locale of ['en','fr','de','es','it','pt-br','ru','uk','tr','sr','sq','ka','zh-cn','ja','ko','he','ar']) {
    await page.goto(locale === 'en' ? '/explainer' : `/${locale}/explainer`);
    await expect(example.getByRole('slider')).toBeEnabled();
    await example.getByRole('slider').press('ArrowLeft');
    await expect(example.locator('.moving-window')).toHaveAttribute('data-checking-date', '2026-09-08');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
