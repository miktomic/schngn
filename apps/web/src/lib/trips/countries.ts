import {
  SCHENGEN_SHORT_STAY_COUNTRY_CODES,
  type SchengenShortStayCountryCode
} from '@schngn/engine';

export interface SupportedCountryOption {
  code: string;
  name: string;
  countsForShortStay: boolean;
}

const SCHENGEN_COUNTRY_NAMES: Record<SchengenShortStayCountryCode, string> = {
  AT: 'Austria',
  BE: 'Belgium',
  BG: 'Bulgaria',
  HR: 'Croatia',
  CZ: 'Czechia',
  DK: 'Denmark',
  EE: 'Estonia',
  FI: 'Finland',
  FR: 'France',
  DE: 'Germany',
  GR: 'Greece',
  HU: 'Hungary',
  IS: 'Iceland',
  IT: 'Italy',
  LV: 'Latvia',
  LI: 'Liechtenstein',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  MT: 'Malta',
  NL: 'Netherlands',
  NO: 'Norway',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  SK: 'Slovakia',
  SI: 'Slovenia',
  ES: 'Spain',
  SE: 'Sweden',
  CH: 'Switzerland'
};

const COMMON_EXCLUDED_COUNTRIES = [
  { code: 'CY', name: 'Cyprus', countsForShortStay: false },
  { code: 'IE', name: 'Ireland', countsForShortStay: false },
  { code: 'GB', name: 'United Kingdom', countsForShortStay: false }
] satisfies SupportedCountryOption[];

export const SCHENGEN_COUNTRY_OPTIONS: readonly SupportedCountryOption[] =
  SCHENGEN_SHORT_STAY_COUNTRY_CODES.map((code) => ({
    code,
    name: SCHENGEN_COUNTRY_NAMES[code],
    countsForShortStay: true
  })).sort(compareCountryOptions);

export const EXCLUDED_COUNTRY_OPTIONS: readonly SupportedCountryOption[] =
  [...COMMON_EXCLUDED_COUNTRIES].sort(compareCountryOptions);

export const SUPPORTED_COUNTRY_OPTIONS: readonly SupportedCountryOption[] = [
  ...SCHENGEN_COUNTRY_OPTIONS,
  ...EXCLUDED_COUNTRY_OPTIONS
];

const SUPPORTED_COUNTRY_CODES = new Set(SUPPORTED_COUNTRY_OPTIONS.map((country) => country.code));

export function normalizeCountryCode(countryCode: string | undefined): string | undefined {
  const normalized = countryCode?.trim().toUpperCase();
  return normalized || undefined;
}

export function isSupportedCountryCode(countryCode: string): boolean {
  return SUPPORTED_COUNTRY_CODES.has(countryCode.trim().toUpperCase());
}

function compareCountryOptions(left: SupportedCountryOption, right: SupportedCountryOption): number {
  return left.name.localeCompare(right.name);
}
