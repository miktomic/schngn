import { describe, expect, test } from 'bun:test';
import {
  ALLOWED_ANALYTICS_EVENTS,
  assertSafeAnalyticsEvent,
  buildAnalyticsEvent,
  buildTripCountBucket,
  trackAnalyticsEvent,
  type AnalyticsEventName
} from '../src/lib/analytics/privacyAnalytics';
import { initializePlausibleAnalytics } from '../src/lib/analytics/plausibleClient';

const allowedEvents: AnalyticsEventName[] = [
  'page_view',
  'calculator_start',
  'trip_added',
  'simulation_run',
  'pdf_buy_intent',
  'unlock_buy_intent'
];

describe('privacy-safe analytics wrapper', () => {
  test('keeps the approved event list explicit and stable', () => {
    expect(ALLOWED_ANALYTICS_EVENTS).toEqual(allowedEvents);
  });

  test('builds aggregate trip count buckets without dates or labels', () => {
    expect(buildTripCountBucket(0)).toBe('0');
    expect(buildTripCountBucket(1)).toBe('1');
    expect(buildTripCountBucket(2)).toBe('2-3');
    expect(buildTripCountBucket(4)).toBe('4-7');
    expect(buildTripCountBucket(8)).toBe('8-15');
    expect(buildTripCountBucket(25)).toBe('16+');

    const event = buildAnalyticsEvent('trip_added', {
      trip_count_bucket: buildTripCountBucket(4),
      source: 'manual'
    });

    expect(event).toEqual({
      name: 'trip_added',
      props: {
        trip_count_bucket: '4-7',
        source: 'manual'
      }
    });
    expect(JSON.stringify(event)).not.toContain('2026-');
    expect(JSON.stringify(event)).not.toContain('Italy');
  });

  test('allows only non-identifying validation/funnel properties', () => {
    expect(
      buildAnalyticsEvent('simulation_run', {
        trip_count_bucket: '2-3',
        verdict: 'safe',
        safe_buffer_bucket: '8-30'
      })
    ).toEqual({
      name: 'simulation_run',
      props: {
        trip_count_bucket: '2-3',
        verdict: 'safe',
        safe_buffer_bucket: '8-30'
      }
    });

    expect(
      buildAnalyticsEvent('unlock_buy_intent', {
        price_bucket: 'eur_9',
        source: 'planner'
      })
    ).toEqual({ name: 'unlock_buy_intent', props: { price_bucket: 'eur_9', source: 'planner' } });
  });

  test('rejects unknown event names and unknown property keys', () => {
    expect(() => buildAnalyticsEvent('trip_deleted' as AnalyticsEventName, {})).toThrow(/not allowlisted/i);
    expect(() => buildAnalyticsEvent('waitlist_signup' as AnalyticsEventName, {})).toThrow(/not allowlisted/i);
    expect(() =>
      buildAnalyticsEvent('trip_added', {
        trip_count_bucket: '1',
        countryCode: 'IT'
      } as never)
    ).toThrow(/property.*countryCode/i);
  });

  test('runtime-validates every analytics bucket instead of relying on TypeScript types', () => {
    const unsafeValues = [
      { source: 'other' },
      { source: 'waitlist' },
      { trip_count_bucket: 'exactly-2' },
      { safe_buffer_bucket: 'about-a-week' },
      { verdict: 'approved' },
      { price_bucket: 'eur_99' }
    ];

    for (const props of unsafeValues) {
      expect(() => buildAnalyticsEvent('page_view', props as never)).toThrow(/value.*not allowlisted/i);
    }
  });

  test('rejects dates, emails, names, labels, and raw travel timeline values in payloads', () => {
    const unsafePayloads = [
      { trip_date: '2026-09-15' },
      { label: 'Italy anniversary' },
      { email: 'person@example.com' },
      { timeline: ['2026-01-01', '2026-01-02'] },
      { source: 'France May trip' },
      { source: 'michael@example.com' }
    ];

    for (const props of unsafePayloads) {
      expect(() => assertSafeAnalyticsEvent('page_view', props as never)).toThrow(/private|not allowed|forbidden/i);
    }
  });

  test('supports interception while stripping query strings and hashes from Plausible URLs', () => {
    const calls: { name: string; options?: { props?: Record<string, string>; url?: string } }[] = [];
    const targetWindow = {
      location: new URL('https://schngn.com/app?entryDate=2026-09-15#private-trip'),
      plausible(name: string, options?: { props?: Record<string, string>; url?: string }) {
        calls.push({ name, options });
      }
    } as unknown as Window;

    expect(trackAnalyticsEvent('trip_added', { source: 'trip_form', trip_count_bucket: '2-3' }, targetWindow)).toEqual({
      name: 'trip_added',
      props: { source: 'trip_form', trip_count_bucket: '2-3' }
    });
    expect(calls).toEqual([
      {
        name: 'trip_added',
        options: {
          props: { source: 'trip_form', trip_count_bucket: '2-3' },
          url: 'https://schngn.com/app'
        }
      }
    ]);
    expect(JSON.stringify(calls)).not.toContain('2026-09-15');
    expect(JSON.stringify(calls)).not.toContain('private-trip');
  });

  test('initializes the official Plausible tracker only on the production apex', async () => {
    let capturedConfig: Record<string, unknown> | undefined;
    const productionWindow = {
      location: new URL('https://schngn.com/app')
    } as unknown as Window;

    expect(
      await initializePlausibleAnalytics(productionWindow, async () => ({
        init(config) {
          capturedConfig = config as unknown as Record<string, unknown>;
        }
      }))
    ).toBe('initialized');
    expect(capturedConfig).toMatchObject({
      domain: 'schngn.com',
      autoCapturePageviews: false,
      captureOnLocalhost: false,
      formSubmissions: false,
      outboundLinks: false,
      fileDownloads: false,
      bindToWindow: true
    });
    const transformRequest = capturedConfig?.transformRequest as ((payload: Record<string, unknown>) => Record<string, unknown> | null) | undefined;
    expect(transformRequest).toBeFunction();
    expect(
      transformRequest?.({
        n: 'trip_added',
        u: 'https://schngn.com/app?entryDate=2026-09-15#private',
        d: 'untrusted.example',
        r: 'https://referrer.example/private',
        p: { source: 'trip_form', trip_count_bucket: '2-3' }
      })
    ).toEqual({
      n: 'trip_added',
      u: 'https://schngn.com/app',
      d: 'schngn.com',
      p: { source: 'trip_form', trip_count_bucket: '2-3' }
    });
    expect(transformRequest?.({ n: 'engagement', u: 'https://schngn.com/app', d: 'schngn.com' })).toBeNull();
    expect(
      transformRequest?.({
        n: 'trip_added',
        u: 'https://schngn.com/app',
        d: 'schngn.com',
        p: { source: 'not-allowlisted' }
      })
    ).toBeNull();

    let previewInitCalled = false;
    const previewWindow = { location: new URL('https://preview.schngn.pages.dev/app') } as unknown as Window;
    expect(
      await initializePlausibleAnalytics(previewWindow, async () => {
        previewInitCalled = true;
        return { init() {} };
      })
    ).toBe('disabled');
    expect(previewInitCalled).toBe(false);
  });

  test('does not replace an injected Plausible test interceptor', async () => {
    const intercepted = (() => undefined) as (name: string) => void;
    const targetWindow = {
      location: new URL('https://schngn.com/app'),
      plausible: intercepted
    } as unknown as Window;
    let initCalled = false;

    expect(
      await initializePlausibleAnalytics(targetWindow, async () => {
        initCalled = true;
        return { init() {} };
      })
    ).toBe('intercepted');
    expect(initCalled).toBe(false);
    expect((targetWindow as Window & { plausible?: unknown }).plausible).toBe(intercepted);
  });
});
