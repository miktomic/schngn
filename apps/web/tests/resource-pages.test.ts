import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';

const explainerPath = 'apps/web/src/routes/explainer/+page.svelte';
const faqPath = 'apps/web/src/routes/faq/+page.svelte';
const appPath = 'apps/web/src/routes/app/+page.svelte';
const contactPath = 'apps/web/src/routes/contact/+page.svelte';
const agentsPath = 'apps/web/src/routes/agents/+page.svelte';

describe('standalone public resources', () => {
  test('ships dedicated localized, indexable pages', () => {
    expect(existsSync(explainerPath)).toBe(true);
    expect(existsSync(faqPath)).toBe(true);
    expect(existsSync(contactPath)).toBe(true);
    expect(existsSync(agentsPath)).toBe(true);

    const explainer = readFileSync(explainerPath, 'utf8');
    const faq = readFileSync(faqPath, 'utf8');
    const contact = readFileSync(contactPath, 'utf8');
    const agents = readFileSync(agentsPath, 'utf8');

    for (const source of [explainer, faq, contact, agents]) {
      expect(source).toContain('rel="canonical"');
      expect(source).toContain('hreflang="x-default"');
      expect(source).toContain('SiteHeader');
      expect(source).toContain('localeFromPath(page.url.pathname)');
    }

    expect(explainer).toContain('ExplainerWalkthrough');
    expect(explainer).toContain('localizedOfficialSourceLinks');
    expect(faq).toContain('FAQ_SOURCE_URLS');
    expect(faq).toContain('<details class="faq-item"');
    expect(faq).not.toContain('product-label');
    expect(contact).toContain('ContactForm');

    const topbar = readFileSync('apps/web/src/lib/design/SiteHeader.svelte', 'utf8');
    expect(topbar).toContain('siteHeaderUi(locale)');
    expect(topbar).toContain('copy.calculator');
    expect(topbar).toContain('copy.explainer');
    expect(topbar).toContain('copy.faq');
    expect(topbar).toContain('copy.contact');
  });

  test('uses a sticky, scroll-driven rule walkthrough without a scroll event handler', () => {
    const walkthrough = readFileSync('apps/web/src/lib/design/ExplainerWalkthrough.svelte', 'utf8');

    expect(walkthrough).toContain('IntersectionObserver');
    expect(walkthrough).toContain('data-explainer-step');
    expect(walkthrough).toContain('data-active-step');
    expect(walkthrough).toContain('position: sticky');
    expect(walkthrough).toContain('href="#schengen-countries"');
    expect(walkthrough).toContain('openCountryGuide');
    expect(walkthrough).not.toContain("addEventListener('scroll'");
    expect(walkthrough).not.toContain('addEventListener("scroll"');
  });

  test('reuses the current Schengen country guide across help and trip-entry surfaces', () => {
    const guide = readFileSync('apps/web/src/lib/design/SchengenCountryGuide.svelte', 'utf8');
    const explainer = readFileSync(explainerPath, 'utf8');
    const faq = readFileSync(faqPath, 'utf8');
    const app = readFileSync(appPath, 'utf8');
    const adjuster = readFileSync('apps/web/src/lib/design/TripAdjustPanel.svelte', 'utf8');

    expect(guide).toContain('SCHENGEN_SHORT_STAY_COUNTRY_CODES');
    expect(guide).toContain('NON_EU_SCHENGEN_COUNTRY_CODES');
    expect(guide).toContain('EU_COUNTRIES_OUTSIDE_SCHENGEN');
    expect(guide).toContain('popover="auto"');
    expect(guide).toContain('popovertarget=');
    expect(guide).toContain('expanded = true');
    expect(explainer).toContain('<SchengenCountryGuide');
    expect(faq).toContain('<SchengenCountryGuide');
    expect(app).toContain('presentation="popover"');
    expect(adjuster).toContain('presentation="popover"');
  });

  test('keeps long-form resources out of the calculator workspace', () => {
    const app = readFileSync(appPath, 'utf8');

    expect(app).not.toContain('ExplainerWalkthrough');
    expect(app).not.toContain('FAQ_SOURCE_URLS');
    expect(app).not.toContain('class="screen rules-section"');
    expect(app).not.toContain('class="screen faq-section"');
    expect(app).toContain('<SiteHeader');
    expect(app).not.toContain("localizedPath('/explainer', locale)");
    expect(app).not.toContain("localizedPath('/faq', locale)");
    expect(app).not.toContain("localizedPath('/agents', locale)");
  });
});
