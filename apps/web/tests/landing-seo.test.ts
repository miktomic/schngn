import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync('apps/web/src/routes/+page.svelte', 'utf8');

describe('UK second-home landing SEO', () => {
  test('targets the approved UK second-home owner long-tail search intent', () => {
    expect(pageSource).toContain('<title>Schengen 90/180 calculator for UK second-home owners | SCHNGN</title>');
    expect(pageSource).toContain(
      'Plan Europe trips around the Schengen 90/180-day rule with a private calculator built for UK second-home owners and frequent travellers.'
    );
    expect(pageSource).toContain('UK second-home owners');
    expect(pageSource).toContain('Schengen 90/180 calculator');
    expect(pageSource).toContain('private calculator');
  });

  test('keeps landing-page trust copy specific, calm, and not legal-advice shaped', () => {
    expect(pageSource).toContain('Your dates stay in this browser.');
    expect(pageSource).toContain('Not legal advice. Not an EU service.');
    expect(pageSource).toContain('See if your Europe trip fits');
    expect(pageSource).toContain('For UK second-home owners');
    expect(pageSource).not.toContain('A privacy-first Schengen 90/180-day calculator and trip planner for frequent travelers');
    expect(pageSource).not.toContain('—');
    expect(pageSource).not.toContain('–');
  });

  test('sets share metadata and canonical URL for the public landing page', () => {
    expect(pageSource).toContain('<link rel="canonical" href="https://schngn.com/" />');
    expect(pageSource).toContain('property="og:title"');
    expect(pageSource).toContain('property="og:description"');
    expect(pageSource).toContain('name="twitter:card"');
    expect(pageSource).toContain('name="twitter:title"');
  });
});
