import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { SUPPORTED_LOCALES } from '../src/lib/i18n';
import { explainerCatalogLengths, explainerUi } from '../src/lib/i18n/explainerUi';

describe('rules-first Schengen explainer', () => {
  test('ships the same seven-step learning path in every locale', () => {
    const lengths = explainerCatalogLengths();
    expect(new Set(Object.values(lengths))).toEqual(new Set([9]));

    for (const locale of SUPPORTED_LOCALES) {
      const copy = explainerUi(locale);
      expect(copy.steps).toHaveLength(7);
      expect(copy.heroTitle.trim().length).toBeGreaterThan(0);
      expect(copy.heroIntro.trim().length).toBeGreaterThan(0);
      for (const step of copy.steps) {
        expect(step.title.trim().length).toBeGreaterThan(0);
        expect(step.body.trim().length).toBeGreaterThan(0);
      }
      expect(copy.steps.at(-1)?.emphasis?.trim().length).toBeGreaterThan(0);
      if (locale !== 'en') {
        expect(copy.steps.at(-1)?.emphasis).not.toBe(explainerUi('en').steps.at(-1)?.emphasis);
      }
    }
  });

  test('explains the general rule instead of narrating product actions', () => {
    const copy = explainerUi('en');
    const titles = explainerUi('en').steps.map((step) => step.title);
    expect(titles).toEqual([
      'The basic rule: up to 90 days in any 180 days',
      'Start with today and look back 179 days',
      'Arrival and departure days both count',
      'Changing Schengen countries does not reset the count',
      'Older days stop counting one by one',
      'Day 91 is beyond the ordinary limit',
      'What happens if I exceed 90 days?'
    ]);
    expect(copy.heroTitle).toBe('Understand the Schengen 90/180-day rule');
    expect(copy.heroIntro).not.toContain('saved trips');
    expect(copy.steps.map((step) => step.title).join(' ')).not.toMatch(/add|save|calculator/i);
    expect(copy.steps[0].body).toContain('no more than 90 days total');
    expect(copy.steps[1].body).toContain('Today plus the previous 179');
    expect(copy.steps[5].body).toContain('100 days inside today’s window');
    expect(copy.steps.at(-1)?.body).toContain('return procedures');
    expect(copy.steps.at(-1)?.emphasis).toBe('This site exists to help you make sure you never overstay.');
  });

  test('uses the same past-or-future stay title as the real trip dialog', () => {
    const walkthrough = readFileSync('apps/web/src/lib/design/ExplainerWalkthrough.svelte', 'utf8');
    expect(walkthrough).toContain("deep('addStay')");
    expect(walkthrough).not.toContain("tripOnboarding('title')");
  });
});
