import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { reroute } from '../src/hooks';
import { SUPPORTED_LOCALES, isLocalizedNavigationPath } from '../src/lib/i18n';

const agentsPagePath = 'apps/web/src/routes/agents/+page.svelte';
const agentsRoutePath = 'apps/web/src/routes/agents/+page.ts';
const agentsUiPath = 'apps/web/src/lib/i18n/agentsUi.ts';
const commandBlockPath = 'apps/web/src/lib/design/CommandBlock.svelte';

function readIfPresent(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectStrings);
  return [];
}

describe('public agent setup page', () => {
  test('ships a dedicated localized, indexable resource', () => {
    expect(existsSync(agentsPagePath)).toBe(true);
    expect(existsSync(agentsRoutePath)).toBe(true);
    expect(existsSync(agentsUiPath)).toBe(true);

    const page = readIfPresent(agentsPagePath);
    const route = readIfPresent(agentsRoutePath);

    expect(route).toContain('prerender = true');
    expect(page).toContain('SiteHeader');
    expect(page).toContain('localeFromPath(page.url.pathname)');
    expect(page).toContain('agentsUi(locale)');
    expect(page).toContain("localizedPath('/agents', locale)");
    expect(page).toContain('SUPPORTED_LOCALES');
    expect(page).toContain('rel="canonical"');
    expect(page).toContain('rel="alternate"');
    expect(page).toContain('hreflang="x-default"');
    expect(page).toContain('https://schngn.com/agents');
    expect(page).toContain('https://schngn.com/brand/schngn-social.png');
  });

  test('documents the public runtime, Codex MCP, and skill install commands exactly', () => {
    const setupSource = `${readIfPresent(agentsPagePath)}\n${readIfPresent(agentsUiPath)}`;

    expect(setupSource).toContain('npm install --global @schngn/agent');
    expect(setupSource).toContain('codex mcp add schngn -- schngn-mcp');
    expect(setupSource).toContain('npx skills add miktomic/schngn --skill schngn');
    expect(setupSource).toMatch(/Node(?:\.js)? 24\+/);
    expect(setupSource).toContain('3 read-only tools');
  });

  test('lists the real MCP tools with their exact input fields', () => {
    const page = readIfPresent(agentsPagePath);

    expect(page).toContain('calculate_schengen_usage');
    expect(page).toContain('{ stays, referenceDate, includeCountedDays? }');
    expect(page).toContain('check_schengen_stay');
    expect(page).toContain('{ existingStays, candidateStay }');
    expect(page).toContain('latest_safe_schengen_exit');
    expect(page).toContain('{ existingStays, entryDate }');
    expect(page).toContain('id="mcp"');
    expect(page).toContain('id="agent-skill"');
    expect(page).toContain('id="cli"');
    expect(page).toContain('id="rest-api"');
    expect(page).toContain('id="typescript"');
    expect(page).toContain('id="tool-reference"');
    expect(page).toContain('id="privacy-boundary"');
  });

  test('makes commands keyboard-accessible and announces copy results', () => {
    expect(existsSync(commandBlockPath)).toBe(true);
    const page = readIfPresent(agentsPagePath);
    const commandBlock = readIfPresent(commandBlockPath);

    expect(page).toContain('<CommandBlock');
    expect(commandBlock).toContain('<button');
    expect(commandBlock).toContain('type="button"');
    expect(commandBlock).toContain('aria-label');
    expect(commandBlock).toContain('aria-live="polite"');
    expect(commandBlock).toContain('navigator.clipboard.writeText');
    expect(commandBlock).toContain("document.execCommand('copy')");
    expect(commandBlock).toContain('dir="ltr"');
    expect(commandBlock).toContain('min-height: 44px');
  });

  test('states the local runtime boundary without hiding the agent host boundary', async () => {
    const { agentsUi } = await import('../src/lib/i18n/agentsUi');
    const english = collectStrings(agentsUi('en')).join(' ');
    const page = readIfPresent(agentsPagePath);

    expect(english).toContain('SCHNGN makes no outbound requests');
    expect(english).toMatch(/agent host/i);
    expect(english).toMatch(/model provider/i);
    expect(english).toMatch(/no hosted SCHNGN (calculation )?endpoint/i);
    expect(english).toMatch(/ordinary.*90.*180/i);
    expect(english).toMatch(/not legal advice/i);
    expect(english).not.toContain('Trip inputs and results exist only in the invoking local process');
    expect(page).not.toContain('<form');
    expect(page).not.toMatch(/\bfetch\s*\(/);
    expect(page).not.toMatch(/\baction\s*=/);
  });

  test('ships complete copy for all 17 locales and clean English punctuation', async () => {
    const { agentsUi, agentsUiCatalogLengths } = await import('../src/lib/i18n/agentsUi');
    const lengths = agentsUiCatalogLengths();

    expect(Object.keys(lengths).sort()).toEqual([...SUPPORTED_LOCALES].sort());
    expect(new Set(Object.values(lengths)).size).toBe(1);
    expect(lengths.en).toBeGreaterThan(35);

    const english = agentsUi('en');
    const englishStrings = collectStrings(english);
    expect(englishStrings.every((value) => value.trim().length > 0)).toBe(true);
    expect(englishStrings.join(' ')).not.toMatch(/[—–]/u);
    expect(readIfPresent(agentsPagePath)).not.toMatch(/[—–]/u);

    for (const locale of SUPPORTED_LOCALES) {
      const copy = agentsUi(locale);
      expect(collectStrings(copy).every((value) => value.trim().length > 0)).toBe(true);
      if (locale !== 'en') expect(copy.intro).not.toBe(english.intro);
    }
  });

  test('integrates the route into localization, offline navigation, sitemap, and smoke discovery', async () => {
    expect(isLocalizedNavigationPath('/agents')).toBe(true);
    expect(isLocalizedNavigationPath('/ar/agents')).toBe(true);
    expect(await reroute({ url: new URL('https://schngn.com/fr/agents'), fetch } as never)).toBe('/agents');

    const hook = readFileSync('apps/web/src/hooks.server.ts', 'utf8');
    const config = readFileSync('apps/web/svelte.config.js', 'utf8');
    const layout = readFileSync('apps/web/src/routes/+layout.svelte', 'utf8');
    const worker = readFileSync('apps/web/static/service-worker.js', 'utf8');
    const sitemap = readFileSync('apps/web/static/sitemap.xml', 'utf8');
    const smoke = readFileSync('scripts/post-deploy-smoke.mjs', 'utf8');

    expect(hook).toContain("'/agents'");
    expect(config).toContain('`/${locale}/agents`');
    expect(layout).toContain("'/agents'");
    expect(worker).toContain("'/agents'");
    expect(smoke).toContain("path: '/agents'");
    expect(smoke).toContain('<loc>https://schngn.com/agents</loc>');

    for (const locale of SUPPORTED_LOCALES) {
      const pathname = locale === 'en' ? '/agents' : `/${locale}/agents`;
      expect(sitemap).toContain(`<loc>https://schngn.com${pathname}</loc>`);
    }
  });
});
