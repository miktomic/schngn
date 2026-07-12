import { expect, test, type Page } from '@playwright/test';

test('shows a sourced bilateral note without saving the passport answer', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-07-12T12:00:00Z'));
  await installSignedOutClerk(page);
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/app');

  await page.locator('#add-trip-button').click();
  const form = page.getByRole('form', { name: 'Trip form' });
  const passport = form.getByRole('combobox', { name: /Which ordinary passport will you use/ });
  const exitCountry = form.locator('#trip-exit-country');

  await form.getByLabel('Entry date').fill('2026-08-01');
  await form.getByLabel('Exit date', { exact: true }).fill('2026-08-10');
  await form.locator('#trip-entry-country').selectOption('FR');
  await expect(exitCountry).toHaveValue('FR');
  await expect(passport).toHaveCount(0);

  // The common same-country route confirms the reversible mirrored default.
  const confirmMirroredExit = form.getByRole('button', {
    name: 'I plan to leave Schengen through this country'
  });
  await expect(confirmMirroredExit).toBeVisible();
  await confirmMirroredExit.click();
  await expect(passport).toBeVisible();
  await expect(passport).toBeFocused();
  await passport.selectOption('IL');
  const franceNotice = form.locator('[data-bilateral-kind="conditional_current"]');
  await expect(franceNotice).toBeVisible();
  await expect(franceNotice).toContainText('A country-specific stay may apply');
  await expect(franceNotice).toContainText('Other eligibility, duration, and procedural conditions may apply');
  await expect(franceNotice).toContainText('SCHNGN has not added any days');
  await expect(franceNotice.getByRole('link', { name: /Open official guidance/ })).toHaveAttribute(
    'href',
    'https://www.diplomatie.gouv.fr/de/aufenthalt-in-frankreich/reisen-in-frankreich/einreise-in-den-schengen-raum-einfuehrung-der-systeme-ees-und-etias'
  );

  // Clearing the explicit exit unmounts the check and resets its ephemeral answer.
  await exitCountry.selectOption('');
  await expect(passport).toHaveCount(0);
  await form.locator('#trip-entry-country').selectOption('AT');
  await expect(exitCountry).toHaveValue('AT');
  await expect(passport).toHaveCount(0);
  await expect(confirmMirroredExit).toBeVisible();

  await exitCountry.selectOption('BE');
  await expect(passport).toBeVisible();
  await expect(passport).toHaveValue('');
  await passport.selectOption('IL');
  await expect(form.locator('[data-bilateral-kind]')).toHaveCount(0);

  await exitCountry.selectOption('FR');
  await expect(franceNotice).toBeVisible();

  await exitCountry.selectOption('LV');
  const latviaNotice = form.locator('[data-bilateral-kind="conditional_current_with_cautions"]');
  await expect(latviaNotice).toBeVisible();
  await expect(latviaNotice).toContainText('needs an authority check');
  await expect(latviaNotice.getByRole('link', { name: /Open official guidance/ })).toHaveAttribute(
    'href',
    'https://www.mfa.gov.lv/en/entry-requirements-citizens-countries-whom-latvia-has-signed-bilateral-visa-waiver-agremeent'
  );

  await exitCountry.selectOption('FR');
  await form.getByRole('button', { name: 'Save trip' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const storedTrips = await page.evaluate(() => JSON.parse(window.localStorage.getItem('schngn.trips.v2') ?? '[]'));
  expect(JSON.stringify(storedTrips)).not.toContain('passport');
  expect(JSON.stringify(storedTrips)).not.toContain('"IL"');

  await page.locator('#add-trip-button').click();
  await form.getByLabel('Entry date').fill('2026-06-01');
  await form.getByLabel('Exit date', { exact: true }).fill('2026-06-10');
  await exitCountry.selectOption('FR');
  await expect(passport).toHaveCount(0);
});

async function installSignedOutClerk(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const client = {
      user: null,
      session: null,
      async load() {},
      addListener() {
        return () => {};
      },
      async redirectToSignUp() {},
      async redirectToSignIn() {},
      async redirectToUserProfile() {},
      async signOut() {}
    };
    (window as unknown as { __schngnClerkTestClient: typeof client }).__schngnClerkTestClient = client;
  });
}
