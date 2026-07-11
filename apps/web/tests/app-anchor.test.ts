import { describe, expect, test } from 'bun:test';
import {
  APP_ANCHORS,
  appAnchorFromUrl,
  appAnchorUrl,
  canonicalAppAnchorUrl,
  isAppAnchor,
  type AppAnchor
} from '../src/lib/navigation/appAnchor';

describe('single-page app anchors', () => {
  test('recognizes only the supported workspace anchors', () => {
    const expected: AppAnchor[] = [
      'status',
      'trips',
      'timeline',
      'details',
      'report',
      'account'
    ];

    expect(APP_ANCHORS).toEqual(expected);
    for (const anchor of expected) expect(isAppAnchor(anchor)).toBe(true);
    expect(isAppAnchor('planner')).toBe(false);
    expect(isAppAnchor('')).toBe(false);
  });

  test('restores a valid hash and defaults missing or invalid hashes to status', () => {
    expect(appAnchorFromUrl(new URL('https://schngn.com/app#timeline'))).toBe('timeline');
    expect(appAnchorFromUrl(new URL('https://schngn.com/he/app#account'))).toBe('account');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app#unknown'))).toBe('status');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app'))).toBe('status');
  });

  test.each([
    ['dashboard', 'status'],
    ['trip', 'trips'],
    ['trips', 'trips'],
    ['planner', 'trips'],
    ['proof', 'details'],
    ['returns', 'details'],
    ['report', 'report'],
    ['waitlist', 'report'],
    ['privacy', 'account']
  ] as const)('maps legacy section=%s to #%s', (section, anchor) => {
    expect(appAnchorFromUrl(new URL(`https://schngn.com/app?section=${section}`))).toBe(anchor);
  });

  test('an explicit legacy section wins over an existing valid hash', () => {
    expect(appAnchorFromUrl(new URL('https://schngn.com/app?section=planner#timeline'))).toBe('trips');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app?section=unknown#timeline'))).toBe('status');
    expect(appAnchorFromUrl(new URL('https://schngn.com/app?section=#timeline'))).toBe('status');
  });

  test('builds anchor URLs without losing locale, path, or safe query context', () => {
    const current = new URL(
      'https://schngn.com/he/app?market=uk&account=connected&campaign=summer#status'
    );

    expect(appAnchorUrl(current, 'timeline')).toBe(
      '/he/app?market=uk&account=connected&campaign=summer#timeline'
    );
  });

  test('canonicalizes legacy URLs and removes only the section parameter', () => {
    const legacy = new URL(
      'https://schngn.com/fr/app?market=uk&section=returns&account=connected#plan'
    );

    expect(canonicalAppAnchorUrl(legacy)).toBe(
      '/fr/app?market=uk&account=connected#details'
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
    ).toBe('/tr/app?market=uk&account=connected#report');

    expect(canonicalAppAnchorUrl(new URL('https://schngn.com/app?market=uk#invalid'))).toBe(
      '/app?market=uk#status'
    );
  });
});
