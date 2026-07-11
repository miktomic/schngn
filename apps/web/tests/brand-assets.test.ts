import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';

const logoComponent = readFileSync('apps/web/src/lib/design/SchngnLogo.svelte', 'utf8');
const landingSource = readFileSync('apps/web/src/routes/+page.svelte', 'utf8');
const accuracySource = readFileSync('apps/web/src/routes/accuracy/+page.svelte', 'utf8');
const appSource = readFileSync('apps/web/src/routes/app/+page.svelte', 'utf8');

function readPngDimensions(path: string): { width: number; height: number } {
  const image = readFileSync(path);
  return { width: image.readUInt32BE(16), height: image.readUInt32BE(20) };
}

describe('SCHNGN production brand assets', () => {
  test('renders the supplied wordmark with intrinsic dimensions and accessible alt text', () => {
    expect(logoComponent).toContain('src="/brand/schngn-wordmark.png"');
    expect(logoComponent).toContain('width="864"');
    expect(logoComponent).toContain('height="156"');
    expect(logoComponent).toContain('{alt}');
    expect(logoComponent).not.toContain('mix-blend-mode');
  });

  test('uses the wordmark on every public product header', () => {
    for (const source of [landingSource, accuracySource, appSource]) {
      expect(source).toContain('SchngnLogo');
      expect(source).toContain("from '$lib/design'");
      expect(source).toContain('<SchngnLogo');
      expect(source).not.toContain('<SchngnMark');
    }
  });

  test('pairs primary header logos with the fixed brand motto', () => {
    expect(logoComponent).toContain('Never Overstay');
    expect(logoComponent).toContain('lang="en"');
    for (const source of [landingSource, accuracySource, appSource]) {
      expect(source).toMatch(/<SchngnLogo[^>]*motto/);
    }
  });

  test('ships a correctly sized social preview using the approved brand artwork', () => {
    expect(readPngDimensions('apps/web/static/brand/schngn-social.png')).toEqual({ width: 1200, height: 630 });
  });
});
