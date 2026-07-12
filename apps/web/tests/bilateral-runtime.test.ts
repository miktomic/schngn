import { describe, expect, test } from 'bun:test';
import { BILATERAL_CATALOG } from '../src/lib/bilateral';
import {
  BILATERAL_RUNTIME_CATALOG,
  BILATERAL_RUNTIME_PASSPORTS,
  findPotentialBilateralNotice
} from '../src/lib/bilateral/runtime';

describe('compact bilateral runtime catalogue', () => {
  test('matches the publishable current-guidance subset of the research catalogue', () => {
    expect(BILATERAL_RUNTIME_CATALOG.catalogVersion).toBe(BILATERAL_CATALOG.catalogVersion);
    expect(BILATERAL_RUNTIME_CATALOG.calculationSupport).toBe('none');
    expect(BILATERAL_RUNTIME_PASSPORTS).toHaveLength(50);

    const expected = BILATERAL_CATALOG.currentVerifications
      .filter((verification) =>
        ['confirmed_current', 'confirmed_with_procedure_gap'].includes(verification.evidenceStatus)
      )
      .filter((verification) => ['ordinary', 'all'].includes(verification.passportType))
      .map((verification) => ({
        passportCountryCode: verification.travellerCountryCode,
        hostCountryCode: verification.hostCountryCode,
        passportType: verification.passportType,
        evidenceStatus: verification.evidenceStatus,
        primaryUserSourceId: verification.primaryUserSourceId,
        reviewedOn: verification.reviewedOn,
        reviewDueOn: verification.reviewDueOn
      }));

    expect(BILATERAL_RUNTIME_CATALOG.verifications).toEqual(expected);
    expect(
      BILATERAL_RUNTIME_CATALOG.verifications.every((verification) =>
        ['ordinary', 'all'].includes(verification.passportType)
      )
    ).toBe(true);
  });

  test('returns only fresh current national guidance', () => {
    const france = findPotentialBilateralNotice({
      passportCountryCode: 'il',
      hostCountryCode: 'fr',
      asOf: '2026-07-12'
    });
    expect(france?.kind).toBe('conditional_current');
    expect(france?.source.url).toContain('diplomatie.gouv.fr');
    expect(france?.calculationSupport).toBe('none');

    const latvia = findPotentialBilateralNotice({
      passportCountryCode: 'IL',
      hostCountryCode: 'LV',
      asOf: '2026-07-12'
    });
    expect(latvia?.kind).toBe('conditional_current_with_cautions');
    expect(latvia?.source.url).toContain('mfa.gov.lv');

    expect(
      findPotentialBilateralNotice({
        passportCountryCode: 'IL',
        hostCountryCode: 'BE',
        asOf: '2026-07-12'
      })
    ).toBeNull();
    expect(
      findPotentialBilateralNotice({
        passportCountryCode: 'IL',
        hostCountryCode: 'FR',
        asOf: '2026-10-13'
      })
    ).toBeNull();
  });

  test('rejects missing or malformed lookup inputs without making a negative legal claim', () => {
    expect(
      findPotentialBilateralNotice({ passportCountryCode: '', hostCountryCode: 'FR', asOf: '2026-07-12' })
    ).toBeNull();
    expect(
      findPotentialBilateralNotice({ passportCountryCode: 'GB', hostCountryCode: 'FR', asOf: '2026-07-12' })
    ).toBeNull();
    expect(() =>
      findPotentialBilateralNotice({ passportCountryCode: 'IL', hostCountryCode: 'FR', asOf: 'not-a-date' })
    ).toThrow('asOf');
  });
});
