import { describe, expect, test } from 'bun:test';
import {
  APP_ANCHORS,
  appAnchorFromUrl,
  appResourceFromUrl,
  appAnchorUrl,
  canonicalAppAnchorUrl,
  isAppAnchor,
  type AppAnchor
} from '../src/lib/navigation/appAnchor';

describe('single-page app anchors', () => {
  test('recognizes only the supported workspace anchors', () => {
    const expected: AppAnchor[] = ['timeline', 'trips', 'account'];

    expect(APP_ANCHORS).toEqual(expected);
    for (const anchor of expected) expect(isAppAnchor(anchor)).toBe(true);
    expect(isAppAnchor('planner')).toBe(false);
    expect(isAppAnchor('')).toBe(false);
  });

  test('restores a valid hash and defaults missing or invalid hashes to timeline', () => {
    expect(appAnchorFromUrl(new URL('https://schngn.com/app#trips'))).toBe('trips');
    expect(appAnchorFromUrl(new URL('https://schngn.com/he/app#account'))).toBe('account');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app#timeline'))).toBe('timeline');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app#explainer'))).toBe('timeline');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app#faq'))).toBe('timeline');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app#status'))).toBe('timeline');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app#details'))).toBe('trips');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app#unknown'))).toBe('timeline');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app'))).toBe('timeline');
  });

  test.each([
    ['dashboard', 'timeline'],
    ['trip', 'trips'],
    ['trips', 'trips'],
    ['planner', 'trips'],
    ['proof', 'trips'],
    ['returns', 'trips'],
    ['report', 'account'],
    ['waitlist', 'account'],
    ['privacy', 'account']
  ] as const)('maps legacy section=%s to #%s', (section, anchor) => {
    expect(appAnchorFromUrl(new URL(`https://schngn.com/app?section=${section}`))).toBe(anchor);
  });

  test.each([
    ['rules', 'explainer'],
    ['explainer', 'explainer'],
    ['faq', 'faq'],
    ['help', 'faq']
  ] as const)('maps legacy resource destination %s to the %s page', (destination, resource) => {
    expect(appResourceFromUrl(new URL(`https://schngn.com/app?section=${destination}`))).toBe(resource);
    expect(appResourceFromUrl(new URL(`https://schngn.com/app#${destination}`))).toBe(resource);
  });

  test('an explicit section controls resource redirects before the hash', () => {
    expect(appResourceFromUrl(new URL('https://schngn.com/app?section=planner#faq'))).toBeNull();
    expect(appResourceFromUrl(new URL('https://schngn.com/app?section=faq#rules'))).toBe('faq');
  });

  test('an explicit legacy section wins over an existing valid hash', () => {
    expect(appAnchorFromUrl(new URL('https://schngn.com/app?section=planner#timeline'))).toBe('trips');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app?section=unknown#timeline'))).toBe('timeline');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app?section=#timeline'))).toBe('timeline');
  });

  test('builds anchor URLs without losing locale, path, or safe query context', () => {
    const current = new URL(
      'https://schngn.com/he/app?market=uk&account=connected&campaign=summer#timeline'
    );

    expect(appAnchorUrl(current, 'trips')).toBe(
      '/he/app?market=uk&account=connected&campaign=summer#trips'
    );
  });

  test('canonicalizes legacy URLs and removes only the section parameter', () => {
    const legacy = new URL(
      'https://schngn.com/fr/app?market=uk&section=returns&account=connected#plan'
    );

    expect(canonicalAppAnchorUrl(legacy)).toBe(
      '/fr/app?market=uk&account=connected#trips'
    );
    expect(legacy.href).toBe(
      'https://schngn.com/fr/app?market=uk&section=returns&account=connected#plan'
    );
  });

  test('canonicalization keeps an existing valid hash when there is no legacy section', () => {
    expect(
      canonicalAppAnchorUrl(
        new URL('https://schngn.com/tr/app?market=uk&account=connected#report')
      )
    ).toBe('/tr/app?market=uk&account=connected#account');

    expect(canonicalAppAnchorUrl(new URL('https://schngn.com/app?market=uk#invalid'))).toBe(
      '/app?market=uk#timeline'
    );

    expect(canonicalAppAnchorUrl(new URL('https://schngn.com/app#timeline'))).toBe(
      '/app#timeline'
    );
    expect(canonicalAppAnchorUrl(new URL('https://schngn.com/app#details'))).toBe(
      '/app#trips'
    );
  });
});
