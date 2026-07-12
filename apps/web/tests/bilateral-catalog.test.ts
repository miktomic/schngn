import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import {
  BILATERAL_CATALOG,
  BILATERAL_CATALOG_SCHEMA_VERSION,
  findBilateralResearch
} from '../src/lib/bilateral';

const OFFICIAL_HOSTS = new Set([
  'biznes.gov.pl',
  'dofi.ibz.be',
  'ec.europa.eu',
  'eur-lex.europa.eu',
  'home-affairs.ec.europa.eu',
  'israel.diplomatie.belgium.be',
  'nyidanmark.dk',
  'www.bmeia.gv.at',
  'www.bmi.gv.at',
  'www.diplomatie.gouv.fr',
  'www.gov.pl',
  'www.mfa.gov.lv',
  'www.mos.cudzoziemcy.gov.pl',
  'www.nyidanmark.dk',
  'www.ris.bka.gv.at',
  'www.strazgraniczna.pl'
]);

describe('bilateral research catalogue', () => {
  test('loads the complete 2019 notification extraction and the 50-jurisdiction cohort', () => {
    expect(BILATERAL_CATALOG.schemaVersion).toBe(BILATERAL_CATALOG_SCHEMA_VERSION);
    expect(BILATERAL_CATALOG.catalogVersion).toBe('2026.07.12');
    expect(BILATERAL_CATALOG.cohort.rankingClaim).toBe('research_priority_not_visitor_ranking');
    expect(BILATERAL_CATALOG.markets).toHaveLength(50);
    expect(BILATERAL_CATALOG.euNotifications).toHaveLength(380);
    expect(new Set(BILATERAL_CATALOG.euNotifications.map((notice) => notice.hostCountryCode)).size).toBe(24);
    expect(new Set(BILATERAL_CATALOG.euNotifications.map((notice) => notice.travellerCountryCode)).size).toBe(41);
    expect(
      BILATERAL_CATALOG.euNotifications.filter(
        (notice) => notice.passportTypes.includes('ordinary') || notice.passportTypes.includes('all')
      )
    ).toHaveLength(304);
  });

  test('keeps market selection evidence distinct from passport nationality', () => {
    const unitedKingdom = BILATERAL_CATALOG.markets.find((market) => market.countryCode === 'GB');
    expect(unitedKingdom?.evidenceMetricKind).toBe('residence_nights');
    expect(unitedKingdom?.evidenceValue).toBe(190_204_615);
    expect(unitedKingdom?.evidenceCaveat).toContain('not passport nationality');

    const india = BILATERAL_CATALOG.markets.find((market) => market.countryCode === 'IN');
    expect(india?.evidenceMetricKind).toBe('consulate_location_applications');
    expect(india?.evidenceValue).toBe(1_153_748);
    expect(india?.evidenceCaveat).toContain('not applicant citizenship');

    expect(BILATERAL_CATALOG.cohort.limitation).toContain('No public official EU-wide top 50');
  });

  test('contains only direct HTTPS links on reviewed official domains', () => {
    for (const source of BILATERAL_CATALOG.sources) {
      const url = new URL(source.url);
      expect(url.protocol).toBe('https:');
      expect(OFFICIAL_HOSTS.has(url.hostname)).toBe(true);
    }
  });

  test('never promotes a 2019 notification to a current right by itself', () => {
    expect(BILATERAL_CATALOG.euNotifications.every((notice) => notice.evidenceStatus === 'notified_unconfirmed')).toBe(
      true
    );
    expect(BILATERAL_CATALOG.euNotifications.every((notice) => notice.calculationSupport === 'none')).toBe(true);

    const belgiumUnitedStates = findBilateralResearch({
      passportCountryCode: 'US',
      hostCountryCode: 'BE',
      asOf: '2026-07-12'
    });
    expect(belgiumUnitedStates.state).toBe('candidate_needs_national_verification');
    expect(belgiumUnitedStates.notifications.length).toBeGreaterThan(0);
    expect(belgiumUnitedStates.primaryUserSource).toBeUndefined();
  });

  test('returns current Israeli-passport pilot results with safe status handling', () => {
    const austria = findBilateralResearch({
      passportCountryCode: 'il',
      hostCountryCode: 'at',
      asOf: '2026-07-12'
    });
    expect(austria.state).toBe('current_guidance_confirmed');
    expect(austria.primaryUserSource?.issuer).toBe('Austrian Federal Ministry of the Interior');
    expect(austria.calculationSupport).toBe('none');

    const latvia = findBilateralResearch({
      passportCountryCode: 'IL',
      hostCountryCode: 'LV',
      asOf: '2026-07-12'
    });
    expect(latvia.state).toBe('current_guidance_confirmed_with_cautions');
    expect(latvia.verification?.authorityProcedure).toContain('does not explain');

    const belgium = findBilateralResearch({
      passportCountryCode: 'IL',
      hostCountryCode: 'BE',
      asOf: '2026-07-12'
    });
    expect(belgium.state).toBe('current_guidance_conflicts');
    expect(belgium.verification?.summary).toContain('Do not rely');

    const staleAustria = findBilateralResearch({
      passportCountryCode: 'IL',
      hostCountryCode: 'AT',
      asOf: '2026-10-13'
    });
    expect(staleAustria.state).toBe('current_guidance_stale');
  });

  test('distinguishes a screened negative from an origin outside the initial cohort', () => {
    const unitedKingdomBelgium = findBilateralResearch({
      passportCountryCode: 'GB',
      hostCountryCode: 'BE',
      asOf: '2026-07-12'
    });
    expect(unitedKingdomBelgium.state).toBe('no_2019_notification_found');

    const emiratesBelgium = findBilateralResearch({
      passportCountryCode: 'AE',
      hostCountryCode: 'BE',
      asOf: '2026-07-12'
    });
    expect(emiratesBelgium.state).toBe('outside_initial_research_cohort');
  });

  test('does not expose an executable extra-days field or enter the calculation engine', () => {
    const serialized = JSON.stringify(BILATERAL_CATALOG);
    expect(serialized).not.toContain('"extraDays"');
    expect(BILATERAL_CATALOG.calculationSupport).toBe('none');
    expect(BILATERAL_CATALOG.ordinarySchengenCalculationUnaffected).toBe(true);

    const engineSource = readFileSync('packages/engine/src/index.ts', 'utf8');
    expect(engineSource).not.toContain('bilateral');
  });
});
