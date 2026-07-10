export const ALLOWED_ANALYTICS_EVENTS = [
  'page_view',
  'calculator_start',
  'trip_added',
  'simulation_run',
  'pdf_buy_intent',
  'unlock_buy_intent',
  'waitlist_signup'
] as const;

export type AnalyticsEventName = (typeof ALLOWED_ANALYTICS_EVENTS)[number];

export type TripCountBucket = '0' | '1' | '2-3' | '4-7' | '8-15' | '16+';
export type SafeBufferBucket = '0' | '1-3' | '4-7' | '8-30' | '31+';
export type AnalyticsVerdict = 'safe' | 'close' | 'at_limit' | 'over_limit' | 'empty';
export type AnalyticsSource =
  | 'app'
  | 'landing'
  | 'accuracy'
  | 'dashboard'
  | 'trip_form'
  | 'planner'
  | 'report'
  | 'waitlist'
  | 'privacy'
  | 'manual';
export type PriceBucket = 'eur_5' | 'eur_9' | 'eur_19' | 'gbp_5' | 'gbp_9' | 'gbp_19';

export type AnalyticsProps = Partial<{
  source: AnalyticsSource;
  trip_count_bucket: TripCountBucket;
  safe_buffer_bucket: SafeBufferBucket;
  verdict: AnalyticsVerdict;
  price_bucket: PriceBucket;
}>;

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  props: AnalyticsProps;
}

const ALLOWED_PROP_KEYS = new Set<keyof AnalyticsProps>([
  'source',
  'trip_count_bucket',
  'safe_buffer_bucket',
  'verdict',
  'price_bucket'
]);

const ALLOWED_PROP_VALUES: { [Key in keyof Required<AnalyticsProps>]: ReadonlySet<Required<AnalyticsProps>[Key]> } = {
  source: new Set<AnalyticsSource>([
    'app',
    'landing',
    'accuracy',
    'dashboard',
    'trip_form',
    'planner',
    'report',
    'waitlist',
    'privacy',
    'manual'
  ]),
  trip_count_bucket: new Set<TripCountBucket>(['0', '1', '2-3', '4-7', '8-15', '16+']),
  safe_buffer_bucket: new Set<SafeBufferBucket>(['0', '1-3', '4-7', '8-30', '31+']),
  verdict: new Set<AnalyticsVerdict>(['safe', 'close', 'at_limit', 'over_limit', 'empty']),
  price_bucket: new Set<PriceBucket>(['eur_5', 'eur_9', 'eur_19', 'gbp_5', 'gbp_9', 'gbp_19'])
};

const FORBIDDEN_PROP_KEYS = /(^|_)(date|dates|day|days|country|countries|label|name|email|timeline|history|passport|visa|residence)($|_)/i;
const ISO_DATE_VALUE = /\b\d{4}-\d{2}-\d{2}\b/;
const EMAIL_VALUE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const SUSPICIOUS_TRAVEL_WORD_VALUE = /\b(italy|france|spain|portugal|germany|belgium|netherlands|greece|austria|switzerland|schengen|anniversary|trip)\b/i;

export function buildTripCountBucket(count: number): TripCountBucket {
  if (!Number.isFinite(count) || count <= 0) return '0';
  if (count === 1) return '1';
  if (count <= 3) return '2-3';
  if (count <= 7) return '4-7';
  if (count <= 15) return '8-15';
  return '16+';
}

export function buildSafeBufferBucket(daysRemaining: number): SafeBufferBucket {
  if (!Number.isFinite(daysRemaining) || daysRemaining <= 0) return '0';
  if (daysRemaining <= 3) return '1-3';
  if (daysRemaining <= 7) return '4-7';
  if (daysRemaining <= 30) return '8-30';
  return '31+';
}

export function buildAnalyticsEvent(name: AnalyticsEventName, props: AnalyticsProps = {}): AnalyticsEvent {
  assertSafeAnalyticsEvent(name, props);
  return { name, props: { ...props } };
}

export function assertSafeAnalyticsEvent(name: AnalyticsEventName, props: Record<string, unknown> = {}): void {
  if (!ALLOWED_ANALYTICS_EVENTS.includes(name)) {
    throw new Error(`Analytics event ${String(name)} is not allowlisted.`);
  }

  for (const [key, value] of Object.entries(props)) {
    if (!ALLOWED_PROP_KEYS.has(key as keyof AnalyticsProps)) {
      throw new Error(`Analytics property ${key} is not allowed.`);
    }
    if (FORBIDDEN_PROP_KEYS.test(key)) {
      throw new Error(`Analytics property ${key} may contain private travel data.`);
    }
    assertSafeAnalyticsValue(key, value);
    if (value !== undefined && value !== null && !ALLOWED_PROP_VALUES[key as keyof AnalyticsProps].has(value as never)) {
      throw new Error(`Analytics property ${key} value is not allowlisted.`);
    }
  }
}

function assertSafeAnalyticsValue(key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string') {
    throw new Error(`Analytics property ${key} must be a safe string bucket.`);
  }
  if (ISO_DATE_VALUE.test(value) || EMAIL_VALUE.test(value) || SUSPICIOUS_TRAVEL_WORD_VALUE.test(value)) {
    throw new Error(`Analytics property ${key} contains forbidden private or travel-specific data.`);
  }
}

type PlausibleWindow = Window & {
  plausible?: (eventName: string, options?: { props?: AnalyticsProps; url?: string }) => void;
};

const ANALYTICS_ORIGIN = 'https://schngn.com';
const ALLOWED_ANALYTICS_PATHS = new Set(['/', '/app', '/accuracy']);

export function buildAnalyticsUrl(targetWindow: Pick<Window, 'location'>): string {
  const path = ALLOWED_ANALYTICS_PATHS.has(targetWindow.location.pathname) ? targetWindow.location.pathname : '/other';
  return `${ANALYTICS_ORIGIN}${path}`;
}

export function trackAnalyticsEvent(name: AnalyticsEventName, props: AnalyticsProps = {}, targetWindow: Window | undefined = globalThis.window): AnalyticsEvent {
  const event = buildAnalyticsEvent(name, props);
  const plausible = (targetWindow as PlausibleWindow | undefined)?.plausible;
  if (plausible && targetWindow) {
    plausible(event.name, {
      ...(Object.keys(event.props).length > 0 ? { props: event.props } : {}),
      url: buildAnalyticsUrl(targetWindow)
    });
  }
  return event;
}
