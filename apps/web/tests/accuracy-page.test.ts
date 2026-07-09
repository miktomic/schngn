import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

const accuracyPath = 'apps/web/src/routes/accuracy/+page.svelte';
const landingSource = readFileSync('apps/web/src/routes/+page.svelte', 'utf8');

describe('public accuracy trust signal', () => {
  test('publishes a public accuracy page with official-source framing', () => {
    expect(existsSync(accuracyPath)).toBe(true);
    const source = readFileSync(accuracyPath, 'utf8');

    expect(source).toContain('Validated against the European Commission official short-stay calculator');
    expect(source).toContain('https://home-affairs.ec.europa.eu/policies/schengen/border-crossing/short-stay-calculator_en');
    expect(source).toContain('Inclusive entry and exit days');
    expect(source).toContain('Rolling 180-day window');
    expect(source).toContain('Overlapping trips are de-duplicated');
    expect(source).toContain('SCHNGN is not certified, approved, or guaranteed by the EU');
  });

  test('does not use unsafe guarantee language outside the explicit non-endorsement sentence', () => {
    const source = readFileSync(accuracyPath, 'utf8');
    const normalized = source.replace('SCHNGN is not certified, approved, or guaranteed by the EU', '');

    expect(normalized).not.toMatch(/\bcertified\b/i);
    expect(normalized).not.toMatch(/\bapproved\b/i);
    expect(normalized).not.toMatch(/\bguaranteed\b/i);
    expect(source).not.toContain('—');
    expect(source).not.toContain('–');
  });

  test('links the landing page to the accuracy evidence', () => {
    expect(landingSource).toContain('Validated against official-rule fixtures');
    expect(landingSource).toContain('href="/accuracy"');
  });
});
