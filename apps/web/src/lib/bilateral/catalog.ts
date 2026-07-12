import rawCatalog from './data/catalog.v1.json';
import rawEuNotificationCandidates from './data/eu-2019-notification-candidates.v1.json';
import { SCHENGEN_SHORT_STAY_COUNTRY_CODES } from '../trips/countries';

export const BILATERAL_CATALOG_SCHEMA_VERSION = 1 as const;

export const BILATERAL_EVIDENCE_STATUSES = [
  'notified_unconfirmed',
  'confirmed_current',
  'confirmed_with_procedure_gap',
  'conflicting_current_guidance',
  'needs_reverification',
  'inactive_or_superseded'
] as const;

export type BilateralEvidenceStatus = (typeof BILATERAL_EVIDENCE_STATUSES)[number];

export const BILATERAL_RESEARCH_STATUSES = [
  'not_started',
  'candidate_screened',
  'national_sources_in_progress',
  'national_sources_reviewed'
] as const;

export type BilateralResearchStatus = (typeof BILATERAL_RESEARCH_STATUSES)[number];

export const BILATERAL_PASSPORT_TYPES = [
  'ordinary',
  'diplomatic',
  'service_official',
  'special',
  'emergency',
  'seamans_book',
  'consular',
  'all',
  'other_or_unclear'
] as const;

export type BilateralPassportType = (typeof BILATERAL_PASSPORT_TYPES)[number];

export const BILATERAL_SOURCE_TYPES = [
  'eu_notification',
  'legislation',
  'treaty_text',
  'current_national_guidance',
  'current_enforcement_notice',
  'official_statistics',
  'official_methodology'
] as const;

export type BilateralSourceType = (typeof BILATERAL_SOURCE_TYPES)[number];

export const BILATERAL_AUTHORITY_CLASSES = [
  'eu_official',
  'national_government',
  'treaty_depository',
  'official_statistics'
] as const;

export type BilateralAuthorityClass = (typeof BILATERAL_AUTHORITY_CLASSES)[number];

export interface BilateralOfficialSource {
  id: string;
  title: string;
  issuer: string;
  authorityClass: BilateralAuthorityClass;
  sourceType: BilateralSourceType;
  url: string;
  language: string;
  sourceState: 'live' | 'content_removed_or_redirected' | 'unavailable';
  publishedOn?: string;
  updatedOn?: string;
  accessedOn: string;
}

export interface BilateralResearchMarket {
  catalogOrder: number;
  countryCode: string;
  countryName: string;
  issuingJurisdictionKind: 'country' | 'special_administrative_region';
  selectionGroup: string;
  selectionReason: string;
  evidenceMetricKind:
    | 'residence_nights'
    | 'consulate_location_applications'
    | 'commission_2019_notification'
    | 'user_trigger';
  evidenceYear?: number;
  evidenceValue?: number;
  evidenceSourceIds: string[];
  evidenceCaveat: string;
  researchStatus: BilateralResearchStatus;
  candidateHostCount: number;
  screenedOn?: string;
}

export interface BilateralEuNotification {
  id: string;
  travellerCountryCode: string;
  travellerCountryLabelRaw: string;
  hostCountryCode: string;
  hostCountryLabel: string;
  effectiveDateRaw: string;
  authorisedStayRaw: string;
  passportTypes: BilateralPassportType[];
  passportTypeRaw: string;
  sourceId: string;
  sourceRowOrder: number;
  sourceLocator: string;
  evidenceStatus: 'notified_unconfirmed';
  calculationSupport: 'none';
}

export interface BilateralCurrentVerification {
  id: string;
  travellerCountryCode: string;
  hostCountryCode: string;
  passportType: BilateralPassportType;
  evidenceStatus: Exclude<BilateralEvidenceStatus, 'notified_unconfirmed'>;
  calculationSupport: 'none';
  summary: string;
  territorialScope: string;
  sequencingRule: string;
  authorityProcedure: string;
  externalExitRequirement: string;
  sourceIds: string[];
  primaryUserSourceId?: string;
  reviewedOn: string;
  reviewDueOn: string;
}

export interface BilateralResearchCohort {
  label: string;
  size: number;
  basis: string;
  rankingClaim: 'research_priority_not_visitor_ranking' | 'official_visitor_ranking';
  referencePeriod: string;
  sourceIds: string[];
  limitation: string;
}

export interface BilateralCatalog {
  schemaVersion: typeof BILATERAL_CATALOG_SCHEMA_VERSION;
  catalogVersion: string;
  generatedOn: string;
  calculationSupport: 'none';
  ordinarySchengenCalculationUnaffected: true;
  methodologyDocument: string;
  cohort: BilateralResearchCohort;
  sources: BilateralOfficialSource[];
  markets: BilateralResearchMarket[];
  euNotifications: BilateralEuNotification[];
  currentVerifications: BilateralCurrentVerification[];
}

const ISO_COUNTRY_CODE = /^[A-Z]{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HTTP_URL = /^https:\/\//;
const SCHENGEN_HOST_CODES = new Set<string>(SCHENGEN_SHORT_STAY_COUNTRY_CODES);

export function parseBilateralCatalog(input: unknown): BilateralCatalog {
  const catalog = objectValue(input, 'catalog');
  equal(catalog.schemaVersion, BILATERAL_CATALOG_SCHEMA_VERSION, 'schemaVersion');
  const parsed: BilateralCatalog = {
    schemaVersion: BILATERAL_CATALOG_SCHEMA_VERSION,
    catalogVersion: stringValue(catalog.catalogVersion, 'catalogVersion'),
    generatedOn: dateValue(catalog.generatedOn, 'generatedOn'),
    calculationSupport: literalValue(catalog.calculationSupport, 'none', 'calculationSupport'),
    ordinarySchengenCalculationUnaffected: literalValue(
      catalog.ordinarySchengenCalculationUnaffected,
      true,
      'ordinarySchengenCalculationUnaffected'
    ),
    methodologyDocument: stringValue(catalog.methodologyDocument, 'methodologyDocument'),
    cohort: parseCohort(catalog.cohort),
    sources: arrayValue(catalog.sources, 'sources').map(parseSource),
    markets: arrayValue(catalog.markets, 'markets').map(parseMarket),
    euNotifications: arrayValue(catalog.euNotifications, 'euNotifications').map(parseNotification),
    currentVerifications: arrayValue(catalog.currentVerifications, 'currentVerifications').map(parseVerification)
  };

  validateRelationships(parsed);
  return parsed;
}

function parseCohort(input: unknown): BilateralResearchCohort {
  const cohort = objectValue(input, 'cohort');
  return {
    label: stringValue(cohort.label, 'cohort.label'),
    size: positiveIntegerValue(cohort.size, 'cohort.size'),
    basis: stringValue(cohort.basis, 'cohort.basis'),
    rankingClaim: enumValue(
      cohort.rankingClaim,
      ['research_priority_not_visitor_ranking', 'official_visitor_ranking'] as const,
      'cohort.rankingClaim'
    ),
    referencePeriod: stringValue(cohort.referencePeriod, 'cohort.referencePeriod'),
    sourceIds: stringArrayValue(cohort.sourceIds, 'cohort.sourceIds'),
    limitation: stringValue(cohort.limitation, 'cohort.limitation')
  };
}

function parseSource(input: unknown, index: number): BilateralOfficialSource {
  const path = `sources[${index}]`;
  const source = objectValue(input, path);
  return {
    id: idValue(source.id, `${path}.id`),
    title: stringValue(source.title, `${path}.title`),
    issuer: stringValue(source.issuer, `${path}.issuer`),
    authorityClass: enumValue(source.authorityClass, BILATERAL_AUTHORITY_CLASSES, `${path}.authorityClass`),
    sourceType: enumValue(source.sourceType, BILATERAL_SOURCE_TYPES, `${path}.sourceType`),
    url: httpsUrlValue(source.url, `${path}.url`),
    language: stringValue(source.language, `${path}.language`),
    sourceState: enumValue(
      source.sourceState,
      ['live', 'content_removed_or_redirected', 'unavailable'] as const,
      `${path}.sourceState`
    ),
    ...(optionalDateValue(source.publishedOn, `${path}.publishedOn`, 'publishedOn')),
    ...(optionalDateValue(source.updatedOn, `${path}.updatedOn`, 'updatedOn')),
    accessedOn: dateValue(source.accessedOn, `${path}.accessedOn`)
  };
}

function parseMarket(input: unknown, index: number): BilateralResearchMarket {
  const path = `markets[${index}]`;
  const market = objectValue(input, path);
  return {
    catalogOrder: positiveIntegerValue(market.catalogOrder, `${path}.catalogOrder`),
    countryCode: countryCodeValue(market.countryCode, `${path}.countryCode`),
    countryName: stringValue(market.countryName, `${path}.countryName`),
    issuingJurisdictionKind: enumValue(
      market.issuingJurisdictionKind,
      ['country', 'special_administrative_region'] as const,
      `${path}.issuingJurisdictionKind`
    ),
    selectionGroup: stringValue(market.selectionGroup, `${path}.selectionGroup`),
    selectionReason: stringValue(market.selectionReason, `${path}.selectionReason`),
    evidenceMetricKind: enumValue(
      market.evidenceMetricKind,
      [
        'residence_nights',
        'consulate_location_applications',
        'commission_2019_notification',
        'user_trigger'
      ] as const,
      `${path}.evidenceMetricKind`
    ),
    ...(optionalIntegerValue(market.evidenceYear, `${path}.evidenceYear`, 'evidenceYear')),
    ...(optionalNonNegativeNumberValue(market.evidenceValue, `${path}.evidenceValue`, 'evidenceValue')),
    evidenceSourceIds: stringArrayValue(market.evidenceSourceIds, `${path}.evidenceSourceIds`),
    evidenceCaveat: stringValue(market.evidenceCaveat, `${path}.evidenceCaveat`),
    researchStatus: enumValue(market.researchStatus, BILATERAL_RESEARCH_STATUSES, `${path}.researchStatus`),
    candidateHostCount: nonNegativeIntegerValue(market.candidateHostCount, `${path}.candidateHostCount`),
    ...(optionalDateValue(market.screenedOn, `${path}.screenedOn`, 'screenedOn'))
  };
}

function parseNotification(input: unknown, index: number): BilateralEuNotification {
  const path = `euNotifications[${index}]`;
  const notification = objectValue(input, path);
  return {
    id: idValue(notification.id, `${path}.id`),
    travellerCountryCode: countryCodeValue(notification.travellerCountryCode, `${path}.travellerCountryCode`),
    travellerCountryLabelRaw: stringValue(
      notification.travellerCountryLabelRaw,
      `${path}.travellerCountryLabelRaw`
    ),
    hostCountryCode: countryCodeValue(notification.hostCountryCode, `${path}.hostCountryCode`),
    hostCountryLabel: stringValue(notification.hostCountryLabel, `${path}.hostCountryLabel`),
    effectiveDateRaw: stringValue(notification.effectiveDateRaw, `${path}.effectiveDateRaw`),
    authorisedStayRaw: stringValue(notification.authorisedStayRaw, `${path}.authorisedStayRaw`),
    passportTypes: arrayValue(notification.passportTypes, `${path}.passportTypes`).map((value, categoryIndex) =>
      enumValue(value, BILATERAL_PASSPORT_TYPES, `${path}.passportTypes[${categoryIndex}]`)
    ),
    passportTypeRaw: stringValue(notification.passportTypeRaw, `${path}.passportTypeRaw`),
    sourceId: idValue(notification.sourceId, `${path}.sourceId`),
    sourceRowOrder: positiveIntegerValue(notification.sourceRowOrder, `${path}.sourceRowOrder`),
    sourceLocator: stringValue(notification.sourceLocator, `${path}.sourceLocator`),
    evidenceStatus: literalValue(notification.evidenceStatus, 'notified_unconfirmed', `${path}.evidenceStatus`),
    calculationSupport: literalValue(notification.calculationSupport, 'none', `${path}.calculationSupport`)
  };
}

function parseVerification(input: unknown, index: number): BilateralCurrentVerification {
  const path = `currentVerifications[${index}]`;
  const verification = objectValue(input, path);
  const parsed: BilateralCurrentVerification = {
    id: idValue(verification.id, `${path}.id`),
    travellerCountryCode: countryCodeValue(verification.travellerCountryCode, `${path}.travellerCountryCode`),
    hostCountryCode: countryCodeValue(verification.hostCountryCode, `${path}.hostCountryCode`),
    passportType: enumValue(verification.passportType, BILATERAL_PASSPORT_TYPES, `${path}.passportType`),
    evidenceStatus: enumValue(
      verification.evidenceStatus,
      [
        'confirmed_current',
        'confirmed_with_procedure_gap',
        'conflicting_current_guidance',
        'needs_reverification',
        'inactive_or_superseded'
      ] as const,
      `${path}.evidenceStatus`
    ),
    calculationSupport: literalValue(verification.calculationSupport, 'none', `${path}.calculationSupport`),
    summary: stringValue(verification.summary, `${path}.summary`),
    territorialScope: stringValue(verification.territorialScope, `${path}.territorialScope`),
    sequencingRule: stringValue(verification.sequencingRule, `${path}.sequencingRule`),
    authorityProcedure: stringValue(verification.authorityProcedure, `${path}.authorityProcedure`),
    externalExitRequirement: stringValue(
      verification.externalExitRequirement,
      `${path}.externalExitRequirement`
    ),
    sourceIds: stringArrayValue(verification.sourceIds, `${path}.sourceIds`),
    reviewedOn: dateValue(verification.reviewedOn, `${path}.reviewedOn`),
    reviewDueOn: dateValue(verification.reviewDueOn, `${path}.reviewDueOn`)
  };
  const primaryUserSourceId = optionalStringValue(
    verification.primaryUserSourceId,
    `${path}.primaryUserSourceId`
  );
  if (primaryUserSourceId !== undefined) parsed.primaryUserSourceId = primaryUserSourceId;
  return parsed;
}

function validateRelationships(catalog: BilateralCatalog): void {
  if (catalog.markets.length !== catalog.cohort.size) {
    fail(`markets must contain exactly cohort.size (${catalog.cohort.size}) entries`);
  }
  unique(catalog.sources.map((source) => source.id), 'source id');
  unique(catalog.markets.map((market) => market.countryCode), 'market countryCode');
  unique(catalog.markets.map((market) => market.catalogOrder), 'market catalogOrder');
  unique(catalog.euNotifications.map((notice) => notice.id), 'notification id');
  unique(catalog.currentVerifications.map((verification) => verification.id), 'verification id');

  const expectedOrders = Array.from({ length: catalog.cohort.size }, (_, index) => index + 1);
  const actualOrders = catalog.markets.map((market) => market.catalogOrder).sort((left, right) => left - right);
  if (actualOrders.some((order, index) => order !== expectedOrders[index])) {
    fail('market catalogOrder values must be contiguous from 1 through cohort.size');
  }

  const sourceById = new Map(catalog.sources.map((source) => [source.id, source]));
  for (const sourceId of catalog.cohort.sourceIds) requireSource(sourceById, sourceId, 'cohort.sourceIds');
  for (const market of catalog.markets) {
    if (market.evidenceSourceIds.length === 0) {
      fail(`market ${market.countryCode} must cite selection evidence`);
    }
    for (const sourceId of market.evidenceSourceIds) {
      requireSource(sourceById, sourceId, `market ${market.countryCode}.evidenceSourceIds`);
    }
    const candidateHostCount = new Set(
      catalog.euNotifications
        .filter(
          (notice) =>
            notice.travellerCountryCode === market.countryCode &&
            (notice.passportTypes.includes('ordinary') || notice.passportTypes.includes('all'))
        )
        .map((notice) => notice.hostCountryCode)
    ).size;
    if (candidateHostCount !== market.candidateHostCount) {
      fail(
        `market ${market.countryCode} candidateHostCount must equal its ordinary/all notification host count (${candidateHostCount})`
      );
    }
  }

  for (const notice of catalog.euNotifications) {
    if (notice.passportTypes.length === 0) fail(`notification ${notice.id} must include a passport type`);
    unique(notice.passportTypes, `notification ${notice.id} passportTypes`);
    if (!SCHENGEN_HOST_CODES.has(notice.hostCountryCode)) {
      fail(`notification ${notice.id} has a non-Schengen host code`);
    }
    const source = requireSource(sourceById, notice.sourceId, `notification ${notice.id}`);
    if (source.sourceType !== 'eu_notification') {
      fail(`notification ${notice.id} must cite an eu_notification source`);
    }
  }

  const verificationKeys = new Set<string>();
  for (const verification of catalog.currentVerifications) {
    const key = `${verification.travellerCountryCode}:${verification.hostCountryCode}:${verification.passportType}`;
    if (verificationKeys.has(key)) fail(`duplicate current verification key: ${key}`);
    verificationKeys.add(key);
    if (!catalog.markets.some((market) => market.countryCode === verification.travellerCountryCode)) {
      fail(`verification ${verification.id} has a traveller country outside the research cohort`);
    }
    if (!SCHENGEN_HOST_CODES.has(verification.hostCountryCode)) {
      fail(`verification ${verification.id} has a non-Schengen host code`);
    }
    unique(verification.sourceIds, `verification ${verification.id} sourceIds`);
    for (const sourceId of verification.sourceIds) {
      requireSource(sourceById, sourceId, `verification ${verification.id}`);
    }
    const primaryUserSource = verification.primaryUserSourceId
      ? requireSource(
          sourceById,
          verification.primaryUserSourceId,
          `verification ${verification.id}.primaryUserSourceId`
        )
      : undefined;
    if (
      verification.primaryUserSourceId &&
      !verification.sourceIds.includes(verification.primaryUserSourceId)
    ) {
      fail(`verification ${verification.id} primaryUserSourceId must also appear in sourceIds`);
    }
    if (verification.reviewDueOn < verification.reviewedOn) {
      fail(`verification ${verification.id} reviewDueOn precedes reviewedOn`);
    }
    if (
      verification.evidenceStatus === 'confirmed_current' ||
      verification.evidenceStatus === 'confirmed_with_procedure_gap'
    ) {
      if (!verification.primaryUserSourceId || !primaryUserSource) {
        fail(`confirmed verification ${verification.id} requires primaryUserSourceId`);
      }
      if (
        primaryUserSource.sourceState !== 'live' ||
        primaryUserSource.authorityClass !== 'national_government' ||
        primaryUserSource.sourceType !== 'current_national_guidance'
      ) {
        fail(`confirmed verification ${verification.id} must link to current national-government guidance`);
      }
    }
  }
}

function requireSource(
  sourceById: ReadonlyMap<string, BilateralOfficialSource>,
  sourceId: string,
  path: string
): BilateralOfficialSource {
  const source = sourceById.get(sourceId);
  if (!source) fail(`${path} references missing source ${sourceId}`);
  return source;
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

function optionalStringValue(value: unknown, path: string): string | undefined {
  if (value === undefined) return undefined;
  return stringValue(value, path);
}

function stringArrayValue(value: unknown, path: string): string[] {
  return arrayValue(value, path).map((item, index) => stringValue(item, `${path}[${index}]`));
}

function idValue(value: unknown, path: string): string {
  const id = stringValue(value, path);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(id)) fail(`${path} must be a stable lowercase id`);
  return id;
}

function countryCodeValue(value: unknown, path: string): string {
  const code = stringValue(value, path);
  if (!ISO_COUNTRY_CODE.test(code)) fail(`${path} must be an ISO alpha-2 country code`);
  return code;
}

function dateValue(value: unknown, path: string): string {
  const date = stringValue(value, path);
  if (!ISO_DATE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    fail(`${path} must be a real ISO date`);
  }
  return date;
}

function optionalDateValue(
  value: unknown,
  path: string,
  property: 'publishedOn' | 'updatedOn' | 'screenedOn'
): Partial<Record<typeof property, string>> {
  return value === undefined ? {} : { [property]: dateValue(value, path) };
}

function optionalIntegerValue(
  value: unknown,
  path: string,
  property: 'evidenceYear'
): Partial<Record<typeof property, number>> {
  if (value === undefined) return {};
  if (!Number.isInteger(value)) fail(`${path} must be an integer`);
  return { [property]: value as number };
}

function optionalNonNegativeNumberValue(
  value: unknown,
  path: string,
  property: 'evidenceValue'
): Partial<Record<typeof property, number>> {
  if (value === undefined) return {};
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    fail(`${path} must be a non-negative finite number`);
  }
  return { [property]: value };
}

function httpsUrlValue(value: unknown, path: string): string {
  const url = stringValue(value, path);
  if (!HTTP_URL.test(url)) fail(`${path} must be an HTTPS URL`);
  try {
    new URL(url);
  } catch {
    fail(`${path} must be a valid URL`);
  }
  return url;
}

function positiveIntegerValue(value: unknown, path: string): number {
  if (!Number.isInteger(value) || (value as number) <= 0) fail(`${path} must be a positive integer`);
  return value as number;
}

function nonNegativeIntegerValue(value: unknown, path: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) fail(`${path} must be a non-negative integer`);
  return value as number;
}

function enumValue<const Values extends readonly string[]>(
  value: unknown,
  allowed: Values,
  path: string
): Values[number] {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    fail(`${path} must be one of: ${allowed.join(', ')}`);
  }
  return value as Values[number];
}

function literalValue<const Value extends string | number | boolean>(
  value: unknown,
  expected: Value,
  path: string
): Value {
  equal(value, expected, path);
  return expected;
}

function equal(value: unknown, expected: unknown, path: string): void {
  if (value !== expected) fail(`${path} must equal ${String(expected)}`);
}

function unique(values: readonly (string | number)[], label: string): void {
  if (new Set(values).size !== values.length) fail(`${label} values must be unique`);
}

function fail(message: string): never {
  throw new Error(`Invalid bilateral catalogue: ${message}`);
}

function adaptEuNotificationCandidates(input: unknown): unknown[] {
  const envelope = objectValue(input, 'euNotificationCandidates');
  equal(envelope.schemaVersion, 1, 'euNotificationCandidates.schemaVersion');
  equal(
    envelope.catalogKind,
    'eu_oj_notification_candidates',
    'euNotificationCandidates.catalogKind'
  );
  const generatedFrom = objectValue(envelope.generatedFrom, 'euNotificationCandidates.generatedFrom');
  const sourceUrl = httpsUrlValue(generatedFrom.url, 'euNotificationCandidates.generatedFrom.url');
  const records = arrayValue(envelope.records, 'euNotificationCandidates.records');
  const statistics = objectValue(envelope.statistics, 'euNotificationCandidates.statistics');
  equal(statistics.sourceRows, records.length, 'euNotificationCandidates.statistics.sourceRows');

  return records.map((inputRecord, index) => {
    const path = `euNotificationCandidates.records[${index}]`;
    const record = objectValue(inputRecord, path);
    equal(record.researchStatus, 'notified_unconfirmed', `${path}.researchStatus`);
    const source = objectValue(record.source, `${path}.source`);
    equal(source.url, sourceUrl, `${path}.source.url`);
    return {
      id: record.id,
      travellerCountryCode: record.passportCountryCode,
      travellerCountryLabelRaw: record.rawThirdCountryLabel,
      hostCountryCode: record.hostCountryCode,
      hostCountryLabel: record.hostCountryLabel,
      effectiveDateRaw: record.effectiveDateRaw,
      authorisedStayRaw: record.authorisedStayRaw,
      passportTypes: record.passportCategories,
      passportTypeRaw: record.passportCategoryRaw,
      sourceId: 'eu-oj-2019-c130-07',
      sourceRowOrder: source.row,
      sourceLocator: source.locator,
      evidenceStatus: 'notified_unconfirmed',
      calculationSupport: 'none'
    };
  });
}

export const BILATERAL_CATALOG = parseBilateralCatalog({
  ...objectValue(rawCatalog, 'catalog'),
  euNotifications: adaptEuNotificationCandidates(rawEuNotificationCandidates)
});
