import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

const accuracyPath = 'apps/web/src/routes/accuracy/+page.svelte';
const landingSource = readFileSync('apps/web/src/routes/+page.svelte', 'utf8');
const messagesSource = readFileSync('apps/web/src/lib/i18n/messages.ts', 'utf8');

describe('public accuracy trust signal', () => {
  test('publishes transparent test evidence without claiming unrecorded EC parity', () => {
    expect(existsSync(accuracyPath)).toBe(true);
    const source = readFileSync(accuracyPath, 'utf8');

    expect(messagesSource).toContain('Tested with 50 deterministic rule fixtures');
    expect(messagesSource).toContain('independent day-set oracle');
    expect(messagesSource).toContain('does not claim captured output parity with the official calculator');
    expect(source).not.toContain('Validated against the European Commission');
    expect(source).toContain('https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en');
    expect(messagesSource).toContain('Inclusive entry and exit days');
    expect(messagesSource).toContain('Rolling 180-day window');
    expect(messagesSource).toContain('Overlapping trips are de-duplicated');
    expect(messagesSource).toContain('SCHNGN is not certified, approved, or guaranteed by the EU');
    expect(source).toContain("t('accuracy.noticeCopy')");
  });

  test('does not use unsafe guarantee language outside the explicit non-endorsement sentence', () => {
    const source = readFileSync(accuracyPath, 'utf8');
    const normalized = messagesSource.replace('SCHNGN is not certified, approved, or guaranteed by the EU', '');

    expect(normalized).not.toMatch(/\bcertified\b/i);
    expect(normalized).not.toMatch(/\bapproved\b/i);
    expect(normalized).not.toMatch(/\bguaranteed\b/i);
    expect(source).not.toContain('—');
    expect(source).not.toContain('–');
  });

  test('links the landing page to the accuracy evidence', () => {
    expect(messagesSource).toContain('Tested with 50 rule fixtures and an independent oracle');
    expect(landingSource).toContain('href={accuracyPath}');
  });

  test('uses the production brand card for social sharing', () => {
    const source = readFileSync(accuracyPath, 'utf8');
    expect(source).toContain('<meta property="og:image" content="https://schngn.com/brand/schngn-social.png" />');
    expect(source).toContain('<meta name="twitter:image" content="https://schngn.com/brand/schngn-social.png" />');
  });
});
