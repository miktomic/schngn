import { describe, expect, test } from 'bun:test';
import {
  ALLOWED_ANALYTICS_EVENTS,
  assertSafeAnalyticsEvent,
  buildAnalyticsEvent,
  buildTripCountBucket,
  type AnalyticsEventName
} from '../src/lib/analytics/privacyAnalytics';

const allowedEvents: AnalyticsEventName[] = [
  'page_view',
  'calculator_start',
  'trip_added',
  'simulation_run',
  'pdf_buy_intent',
  'unlock_buy_intent',
  'waitlist_signup'
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
    expect(() =>
      buildAnalyticsEvent('trip_added', {
        trip_count_bucket: '1',
        countryCode: 'IT'
      } as never)
    ).toThrow(/property.*countryCode/i);
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
});
