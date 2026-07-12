import { describe, expect, test } from 'bun:test';
import { SUPPORTED_LOCALES } from '../src/lib/i18n';
import { FAQ_SOURCE_URLS, faqCatalogShape, faqUi } from '../src/lib/i18n/faqUi';

const expectedGroups = ['rule', 'documents', 'problems', 'product'];
const expectedItems = [
  'meaning', 'reset', 'boundaries', 'countries', 'outside',
  'who', 'visa', 'permit', 'family', 'area', 'transit', 'systems',
  'overstay', 'bilateral', 'authority', 'ongoing', 'records', 'privacy'
];

describe('localized Schengen FAQ', () => {
  test('ships the same comprehensive question set in every language', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(faqCatalogShape(locale)).toEqual({ groups: expectedGroups, items: expectedItems });
      const catalog = faqUi(locale);
      expect(catalog.title.trim().length).toBeGreaterThan(0);
      expect(catalog.intro.trim().length).toBeGreaterThan(0);
      expect(catalog.reviewedCopy.trim().length).toBeGreaterThan(0);
      for (const group of catalog.groups) {
        expect(group.title.trim().length).toBeGreaterThan(0);
        for (const item of group.items) {
          expect(item.question.trim().length).toBeGreaterThan(10);
          expect(item.answer.trim().length).toBeGreaterThan(35);
          if (item.source) {
            expect(FAQ_SOURCE_URLS[item.source]).toMatch(/^https:\/\//);
            expect(catalog.sourceNames[item.source].trim().length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test('labels SCHNGN-specific answers separately from official rule answers', () => {
    const items = faqUi('en').groups.flatMap((group) => group.items);
    expect(items.filter((item) => item.productGuidance).map((item) => item.id)).toEqual([
      'ongoing', 'records', 'privacy'
    ]);
    expect(items.filter((item) => item.source).length).toBe(15);
  });

  test('explains that an open exit date works for current and future stays', () => {
    const faq = faqUi('en');
    const ongoing = faq.groups
      .flatMap((group) => group.items)
      .find((item) => item.id === 'ongoing');

    expect(ongoing?.question).toContain('current or future');
    expect(ongoing?.answer).toContain("I don’t know the exit date yet");
    expect(ongoing?.answer).toContain('latest safe exit');
  });

  test('explains that account creation saves the current trip history', () => {
    const privacy = faqUi('en').groups
      .flatMap((group) => group.items)
      .find((item) => item.id === 'privacy');

    expect(privacy?.answer).toContain('automatically saves your current trip history');
    expect(privacy?.answer).not.toMatch(/clerk/i);
    expect(privacy?.answer).not.toContain('does not upload');
  });

  test('keeps authentication providers out of every localized FAQ', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const faqText = faqUi(locale).groups.flatMap((group) => group.items).map((item) => `${item.question} ${item.answer}`).join(' ');
      expect(faqText).not.toMatch(/clerk/i);
    }
  });

  test('warns Ukrainian users that temporary-protection and residence status are outside ordinary short-stay calculations', () => {
    const permit = faqUi('uk').groups.flatMap((group) => group.items).find((item) => item.id === 'permit');
    expect(permit?.answer).toContain('Тимчасовий захист');
    expect(permit?.answer).toContain('звичайні короткострокові перебування');
  });

  test('keeps high-risk claims connected to official sources', () => {
    const byId = new Map(faqUi('en').groups.flatMap((group) => group.items).map((item) => [item.id, item]));
    for (const id of ['meaning', 'boundaries', 'visa', 'permit', 'family', 'overstay', 'authority']) {
      expect(byId.get(id)?.source).toBeDefined();
    }
  });
});
