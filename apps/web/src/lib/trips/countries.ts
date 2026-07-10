export const SCHENGEN_SHORT_STAY_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE',
  'GR', 'HU', 'IS', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL',
  'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH'
] as const;

export type SchengenShortStayCountryCode = (typeof SCHENGEN_SHORT_STAY_COUNTRY_CODES)[number];

export interface SupportedCountryOption {
  code: string;
  name: string;
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

export const SCHENGEN_COUNTRY_OPTIONS: readonly SupportedCountryOption[] =
  SCHENGEN_SHORT_STAY_COUNTRY_CODES.map((code) => ({
    code,
    name: SCHENGEN_COUNTRY_NAMES[code]
  })).sort(compareCountryOptions);

const SUPPORTED_COUNTRY_CODES = new Set(SCHENGEN_COUNTRY_OPTIONS.map((country) => country.code));

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
