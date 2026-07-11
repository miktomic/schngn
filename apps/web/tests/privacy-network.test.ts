import { describe, expect, test } from 'bun:test';
import {
  assertNoForbiddenNetworkPayloads,
  findForbiddenNetworkPayloads,
  type ObservedNetworkRequest
} from '../src/lib/privacy/networkPrivacy';

const privateTripValues = ['2026-10-01', '2026-10-13', 'michael@example.com', 'Italy booked trip'];

describe('privacy network payload assertions', () => {
  test('passes when requests do not contain trip dates, email, names, or labels', () => {
    const requests: ObservedNetworkRequest[] = [
      { url: 'https://plausible.io/api/event', method: 'POST', postData: '{"name":"page_view","props":{"route":"/app"}}' },
      { url: 'https://schngn.com/api/account/trips', method: 'GET' }
    ];

    expect(findForbiddenNetworkPayloads(requests, privateTripValues)).toEqual([]);
    expect(() => assertNoForbiddenNetworkPayloads(requests, privateTripValues)).not.toThrow();
  });

  test('fails loudly when a trip date appears in a query string', () => {
    const requests: ObservedNetworkRequest[] = [
      { url: 'https://analytics.example/collect?entry=2026-10-01', method: 'GET' }
    ];

    const findings = findForbiddenNetworkPayloads(requests, privateTripValues);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ forbiddenValue: '2026-10-01', location: 'url' });
    expect(() => assertNoForbiddenNetworkPayloads(requests, privateTripValues)).toThrow(/Forbidden private travel data/);
  });

  test('fails loudly when email or trip labels appear in request bodies', () => {
    const requests: ObservedNetworkRequest[] = [
      {
        url: 'https://analytics.example/collect',
        method: 'POST',
        postData: JSON.stringify({ email: 'michael@example.com', label: 'Italy booked trip' })
      }
    ];

    const findings = findForbiddenNetworkPayloads(requests, privateTripValues);
    expect(findings.map((finding) => finding.forbiddenValue)).toEqual(['michael@example.com', 'Italy booked trip']);
    expect(findings.every((finding) => finding.location === 'postData')).toBe(true);
  });
});
