import rawRuntimeCatalog from './data/runtime.v1.json';

export interface BilateralRuntimePassport {
  countryCode: string;
  countryName: string;
}

export interface BilateralRuntimeSource {
  id: string;
  title: string;
  issuer: string;
  url: string;
  language: string;
  accessedOn: string;
}

export interface BilateralRuntimeVerification {
  passportCountryCode: string;
  hostCountryCode: string;
  passportType: 'ordinary' | 'all';
  evidenceStatus: 'confirmed_current' | 'confirmed_with_procedure_gap';
  primaryUserSourceId: string;
  reviewedOn: string;
  reviewDueOn: string;
}

export interface BilateralRuntimeCatalog {
  schemaVersion: 1;
  catalogVersion: string;
  generatedOn: string;
  calculationSupport: 'none';
  passports: BilateralRuntimePassport[];
  sources: BilateralRuntimeSource[];
  verifications: BilateralRuntimeVerification[];
}

export interface PotentialBilateralNoticeInput {
  passportCountryCode: string;
  hostCountryCode: string;
  asOf: string;
}

export interface PotentialBilateralNotice {
  kind: 'conditional_current' | 'conditional_current_with_cautions';
  passportCountryCode: string;
  hostCountryCode: string;
  calculationSupport: 'none';
  reviewedOn: string;
  reviewDueOn: string;
  source: BilateralRuntimeSource;
}

const COUNTRY_CODE = /^[A-Z]{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const BILATERAL_RUNTIME_CATALOG = parseRuntimeCatalog(rawRuntimeCatalog);
export const BILATERAL_RUNTIME_PASSPORTS = BILATERAL_RUNTIME_CATALOG.passports;

export function findPotentialBilateralNotice(
  input: PotentialBilateralNoticeInput,
  catalog: BilateralRuntimeCatalog = BILATERAL_RUNTIME_CATALOG
): PotentialBilateralNotice | null {
  const passportCountryCode = normalizeOptionalCountryCode(input.passportCountryCode, 'passportCountryCode');
  const hostCountryCode = normalizeOptionalCountryCode(input.hostCountryCode, 'hostCountryCode');
  const asOf = dateValue(input.asOf, 'asOf');
  if (!passportCountryCode || !hostCountryCode) return null;

  const verification = catalog.verifications.find(
    (candidate) =>
      candidate.passportCountryCode === passportCountryCode &&
      candidate.hostCountryCode === hostCountryCode
  );
  if (!verification || verification.reviewDueOn < asOf) return null;

  const source = catalog.sources.find((candidate) => candidate.id === verification.primaryUserSourceId);
  if (!source) return null;

  return {
    kind:
      verification.evidenceStatus === 'confirmed_current'
        ? 'conditional_current'
        : 'conditional_current_with_cautions',
    passportCountryCode,
    hostCountryCode,
    calculationSupport: 'none',
    reviewedOn: verification.reviewedOn,
    reviewDueOn: verification.reviewDueOn,
    source
  };
}

function parseRuntimeCatalog(input: unknown): BilateralRuntimeCatalog {
  const catalog = objectValue(input, 'catalog');
  equal(catalog.schemaVersion, 1, 'schemaVersion');
  equal(catalog.calculationSupport, 'none', 'calculationSupport');

  const parsed: BilateralRuntimeCatalog = {
    schemaVersion: 1,
    catalogVersion: stringValue(catalog.catalogVersion, 'catalogVersion'),
    generatedOn: dateValue(catalog.generatedOn, 'generatedOn'),
    calculationSupport: 'none',
    passports: arrayValue(catalog.passports, 'passports').map(parsePassport),
    sources: arrayValue(catalog.sources, 'sources').map(parseSource),
    verifications: arrayValue(catalog.verifications, 'verifications').map(parseVerification)
  };

  unique(parsed.passports.map((passport) => passport.countryCode), 'passport country code');
  unique(parsed.sources.map((source) => source.id), 'source id');
  unique(
    parsed.verifications.map(
      (verification) => `${verification.passportCountryCode}:${verification.hostCountryCode}`
    ),
    'passport/host verification'
  );

  const sourceIds = new Set(parsed.sources.map((source) => source.id));
  for (const verification of parsed.verifications) {
    if (!sourceIds.has(verification.primaryUserSourceId)) {
      fail(`verification references missing source ${verification.primaryUserSourceId}`);
    }
    if (verification.reviewDueOn < verification.reviewedOn) {
      fail('verification reviewDueOn precedes reviewedOn');
    }
  }
  return parsed;
}

function parsePassport(input: unknown, index: number): BilateralRuntimePassport {
  const path = `passports[${index}]`;
  const passport = objectValue(input, path);
  return {
    countryCode: countryCodeValue(passport.countryCode, `${path}.countryCode`),
    countryName: stringValue(passport.countryName, `${path}.countryName`)
  };
}

function parseSource(input: unknown, index: number): BilateralRuntimeSource {
  const path = `sources[${index}]`;
  const source = objectValue(input, path);
  const url = stringValue(source.url, `${path}.url`);
  if (!url.startsWith('https://')) fail(`${path}.url must be HTTPS`);
  return {
    id: idValue(source.id, `${path}.id`),
    title: stringValue(source.title, `${path}.title`),
    issuer: stringValue(source.issuer, `${path}.issuer`),
    url,
    language: stringValue(source.language, `${path}.language`),
    accessedOn: dateValue(source.accessedOn, `${path}.accessedOn`)
  };
}

function parseVerification(input: unknown, index: number): BilateralRuntimeVerification {
  const path = `verifications[${index}]`;
  const verification = objectValue(input, path);
  const evidenceStatus = stringValue(verification.evidenceStatus, `${path}.evidenceStatus`);
  if (!['confirmed_current', 'confirmed_with_procedure_gap'].includes(evidenceStatus)) {
    fail(`${path}.evidenceStatus is not publishable`);
  }
  const passportType = stringValue(verification.passportType, `${path}.passportType`);
  if (!['ordinary', 'all'].includes(passportType)) {
    fail(`${path}.passportType is not valid for the ordinary-passport prompt`);
  }
  return {
    passportCountryCode: countryCodeValue(
      verification.passportCountryCode,
      `${path}.passportCountryCode`
    ),
    hostCountryCode: countryCodeValue(verification.hostCountryCode, `${path}.hostCountryCode`),
    passportType: passportType as BilateralRuntimeVerification['passportType'],
    evidenceStatus: evidenceStatus as BilateralRuntimeVerification['evidenceStatus'],
    primaryUserSourceId: idValue(
      verification.primaryUserSourceId,
      `${path}.primaryUserSourceId`
    ),
    reviewedOn: dateValue(verification.reviewedOn, `${path}.reviewedOn`),
    reviewDueOn: dateValue(verification.reviewDueOn, `${path}.reviewDueOn`)
  };
}

function objectValue(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${path} must be an object`);
  return value as Record<string, unknown>;
}

function arrayValue(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
  return value;
}

function stringValue(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim() === '') fail(`${path} must be a non-empty string`);
  return value;
}

function countryCodeValue(value: unknown, path: string): string {
  const code = stringValue(value, path);
  if (!COUNTRY_CODE.test(code)) fail(`${path} must be an ISO alpha-2 code`);
  return code;
}

function normalizeOptionalCountryCode(value: string, path: string): string {
  const normalized = value.trim().toUpperCase();
  if (normalized && !COUNTRY_CODE.test(normalized)) fail(`${path} must be an ISO alpha-2 code`);
  return normalized;
}

function dateValue(value: unknown, path: string): string {
  const date = stringValue(value, path);
  if (!ISO_DATE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    fail(`${path} must be a real ISO date`);
  }
  return date;
}

function idValue(value: unknown, path: string): string {
  const id = stringValue(value, path);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(id)) fail(`${path} must be a stable lowercase id`);
  return id;
}

function equal(value: unknown, expected: unknown, path: string): void {
  if (value !== expected) fail(`${path} must equal ${String(expected)}`);
}

function unique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) fail(`${label} values must be unique`);
}

function fail(message: string): never {
  throw new Error(`Invalid bilateral runtime catalogue: ${message}`);
}
