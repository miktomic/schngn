import { describe, expect, test } from 'bun:test';
import {
  appSectionFromUrl,
  appSectionUrl,
  isAppSectionAvailable,
  type AppSection
} from '../src/lib/navigation/appSection';

describe('app section URLs', () => {
  test('restores a valid section and ignores unknown values', () => {
    expect(appSectionFromUrl(new URL('https://schngn.com/app?section=planner'))).toBe('planner');
    expect(appSectionFromUrl(new URL('https://schngn.com/app?section=unknown'))).toBe('dashboard');
    expect(appSectionFromUrl(new URL('https://schngn.com/app'))).toBe('dashboard');
  });

  test('updates only the section parameter and keeps existing context', () => {
    const current = new URL('https://schngn.com/app?market=uk&account=connected');

    expect(appSectionUrl(current, 'returns')).toBe('/app?market=uk&account=connected&section=returns');
    expect(appSectionUrl(current, 'dashboard')).toBe('/app?market=uk&account=connected');
  });

  test('keeps trip-dependent sections unreachable until trips exist', () => {
    const alwaysAvailable: AppSection[] = ['dashboard', 'trip', 'trips', 'planner', 'privacy', 'waitlist'];
    for (const section of alwaysAvailable) expect(isAppSectionAvailable(section, false)).toBe(true);

    for (const section of ['proof', 'returns', 'report'] as const) {
      expect(isAppSectionAvailable(section, false)).toBe(false);
      expect(isAppSectionAvailable(section, true)).toBe(true);
    }
  });
});
