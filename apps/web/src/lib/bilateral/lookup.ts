import {
  BILATERAL_CATALOG,
  type BilateralCatalog,
  type BilateralCurrentVerification,
  type BilateralEuNotification,
  type BilateralOfficialSource,
  type BilateralPassportType,
  type BilateralResearchMarket
} from './catalog';

export interface BilateralLookupInput {
  passportCountryCode: string;
  hostCountryCode: string;
  passportType?: BilateralPassportType;
  asOf: string;
}

export type BilateralLookupState =
  | 'outside_initial_research_cohort'
  | 'research_not_started'
  | 'no_2019_notification_found'
  | 'candidate_needs_national_verification'
  | 'current_guidance_confirmed'
  | 'current_guidance_confirmed_with_cautions'
  | 'current_guidance_stale'
  | 'current_guidance_conflicts'
  | 'current_guidance_needs_reverification'
  | 'arrangement_inactive_or_superseded';

export interface BilateralLookupResult {
  state: BilateralLookupState;
  calculationSupport: 'none';
  market?: BilateralResearchMarket;
  notifications: BilateralEuNotification[];
  verification?: BilateralCurrentVerification;
  sources: BilateralOfficialSource[];
  primaryUserSource?: BilateralOfficialSource;
}

export function findBilateralResearch(
  input: BilateralLookupInput,
  catalog: BilateralCatalog = BILATERAL_CATALOG
): BilateralLookupResult {
  const passportCountryCode = normalizeCountryCode(input.passportCountryCode);
  const hostCountryCode = normalizeCountryCode(input.hostCountryCode);
  const passportType = input.passportType ?? 'ordinary';
  const asOf = normalizeDate(input.asOf);
  const market = catalog.markets.find((candidate) => candidate.countryCode === passportCountryCode);
  const notifications = catalog.euNotifications.filter(
    (notice) =>
      notice.travellerCountryCode === passportCountryCode &&
      notice.hostCountryCode === hostCountryCode &&
      (notice.passportTypes.includes(passportType) || notice.passportTypes.includes('all'))
  );
  const verification = catalog.currentVerifications.find(
    (candidate) =>
      candidate.travellerCountryCode === passportCountryCode &&
      candidate.hostCountryCode === hostCountryCode &&
      (candidate.passportType === passportType || candidate.passportType === 'all')
  );

  const sourceIds = new Set(notifications.map((notice) => notice.sourceId));
  for (const sourceId of verification?.sourceIds ?? []) sourceIds.add(sourceId);
  const sources = catalog.sources.filter((source) => sourceIds.has(source.id));
  const primaryUserSource = verification?.primaryUserSourceId
    ? catalog.sources.find((source) => source.id === verification.primaryUserSourceId)
    : undefined;

  return compactResult({
    state: resolveState({ market, notifications, verification, asOf }),
    calculationSupport: 'none',
    market,
    notifications,
    verification,
    sources,
    primaryUserSource
  });
}

function resolveState(input: {
  market: BilateralResearchMarket | undefined;
  notifications: BilateralEuNotification[];
  verification: BilateralCurrentVerification | undefined;
  asOf: string;
}): BilateralLookupState {
  if (!input.market) return 'outside_initial_research_cohort';
  if (input.market.researchStatus === 'not_started') return 'research_not_started';

  if (input.verification) {
    if (input.verification.evidenceStatus === 'conflicting_current_guidance') {
      return 'current_guidance_conflicts';
    }
    if (input.verification.evidenceStatus === 'needs_reverification') {
      return 'current_guidance_needs_reverification';
    }
    if (input.verification.evidenceStatus === 'inactive_or_superseded') {
      return 'arrangement_inactive_or_superseded';
    }
    if (input.verification.reviewDueOn < input.asOf) return 'current_guidance_stale';
    if (input.verification.evidenceStatus === 'confirmed_with_procedure_gap') {
      return 'current_guidance_confirmed_with_cautions';
    }
    return 'current_guidance_confirmed';
  }

  return input.notifications.length > 0
    ? 'candidate_needs_national_verification'
    : 'no_2019_notification_found';
}

function compactResult(result: BilateralLookupResult): BilateralLookupResult {
  return {
    state: result.state,
    calculationSupport: 'none',
    ...(result.market ? { market: result.market } : {}),
    notifications: result.notifications,
    ...(result.verification ? { verification: result.verification } : {}),
    sources: result.sources,
    ...(result.primaryUserSource ? { primaryUserSource: result.primaryUserSource } : {})
  };
}

function normalizeCountryCode(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) throw new Error('Country codes must be ISO alpha-2 codes');
  return normalized;
}

function normalizeDate(value: string): string {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(Date.parse(`${normalized}T00:00:00Z`))) {
    throw new Error('asOf must be a real ISO date');
  }
  return normalized;
}
