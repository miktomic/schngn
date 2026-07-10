import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const pageSource = readFileSync('apps/web/src/routes/+page.svelte', 'utf8');
const messagesSource = readFileSync('apps/web/src/lib/i18n/messages.ts', 'utf8');

describe('UK second-home landing SEO', () => {
  test('targets the approved UK second-home owner long-tail search intent', () => {
    expect(messagesSource).toContain('Schengen 90/180 calculator for UK second-home owners | SCHNGN');
    expect(messagesSource).toContain(
      'Plan Europe trips around the Schengen 90/180-day rule with a calculator built for UK second-home owners and frequent travellers.'
    );
    expect(messagesSource).toContain('UK second-home owners');
    expect(messagesSource).toContain('Schengen 90/180 calculator');
    expect(messagesSource).toContain('See which trips count, how many days you used, and the rolling window behind the answer.');
  });

  test('keeps landing-page trust copy specific, calm, and not legal-advice shaped', () => {
    expect(messagesSource).toContain('See counted days and your safe-exit date.');
    expect(messagesSource).toContain('Not legal advice. Not an EU service.');
    expect(messagesSource).toContain('See if your Europe trip fits');
    expect(messagesSource).toContain('For UK second-home owners');
    expect(pageSource).not.toContain('A privacy-first Schengen 90/180-day calculator and trip planner for frequent travelers');
    expect(pageSource).not.toContain('—');
    expect(pageSource).not.toContain('–');
    expect(messagesSource).not.toContain('Local & private');
    expect(messagesSource).not.toContain('Keep travel private');
  });

  test('sets share metadata and canonical URL for the public landing page', () => {
    expect(pageSource).toContain('<link rel="canonical" href={canonicalUrl} />');
    expect(pageSource).toContain('<meta property="og:url" content={canonicalUrl} />');
    expect(pageSource).not.toContain('www.schngn.com');
    expect(pageSource).toContain('property="og:title"');
    expect(pageSource).toContain('property="og:description"');
    expect(pageSource).toContain('<meta property="og:image" content="https://schngn.com/brand/schngn-social.png" />');
    expect(pageSource).toContain('<meta property="og:image:width" content="1200" />');
    expect(pageSource).toContain('<meta property="og:image:height" content="630" />');
    expect(pageSource).toContain('<meta property="og:image:alt" content="SCHNGN" />');
    expect(pageSource).toContain('name="twitter:card"');
    expect(pageSource).toContain('name="twitter:title"');
    expect(pageSource).toContain('<meta name="twitter:image" content="https://schngn.com/brand/schngn-social.png" />');
  });

  test('routes the UK-targeted landing audience into GBP pricing', () => {
    expect(pageSource).toContain("`${localizedPath('/app', locale)}?market=uk`");
    expect(pageSource.match(/href=\{appPath\}/g)).toHaveLength(3);
  });
});
