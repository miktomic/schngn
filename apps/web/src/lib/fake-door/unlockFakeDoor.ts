import { buildAnalyticsEvent, type AnalyticsEvent, type AnalyticsSource, type PriceBucket } from '../analytics/privacyAnalytics';

export const UNLOCK_PRICE_STORAGE_KEY = 'schngn.unlockPriceBucket.v1';

export type UnlockMarket = 'eu' | 'uk';

export interface UnlockPriceAssignment {
  bucket: PriceBucket;
  label: string;
}

export interface UnlockFakeDoorState {
  buttonLabel: string;
  helperCopy: string;
  messageCopy: string;
  messageTitle: string;
  showIntentMessage: boolean;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const EU_PRICE_BUCKETS: UnlockPriceAssignment[] = [
  { bucket: 'eur_5', label: '€5' },
  { bucket: 'eur_9', label: '€9' },
  { bucket: 'eur_19', label: '€19' }
];
const UK_PRICE_BUCKETS: UnlockPriceAssignment[] = [
  { bucket: 'gbp_5', label: '£5' },
  { bucket: 'gbp_9', label: '£9' },
  { bucket: 'gbp_19', label: '£19' }
];
const ALL_PRICE_BUCKETS = [...EU_PRICE_BUCKETS, ...UK_PRICE_BUCKETS];

export function chooseUnlockPriceBucket(market: UnlockMarket = 'eu', randomValue = Math.random()): UnlockPriceAssignment {
  const buckets = market === 'uk' ? UK_PRICE_BUCKETS : EU_PRICE_BUCKETS;
  const bounded = Math.min(Math.max(randomValue, 0), 0.999999);
  return buckets[Math.floor(bounded * buckets.length)];
}

export function loadOrAssignUnlockPriceBucket(
  storage: StorageLike | undefined,
  options: { market?: UnlockMarket; random?: () => number } = {}
): UnlockPriceAssignment {
  const stored = storage?.getItem(UNLOCK_PRICE_STORAGE_KEY);
  const existing = parsePriceBucket(stored);
  if (existing) return existing;

  const assigned = chooseUnlockPriceBucket(options.market ?? 'eu', options.random?.() ?? Math.random());
  storage?.setItem(UNLOCK_PRICE_STORAGE_KEY, assigned.bucket);
  return assigned;
}

export function buildUnlockFakeDoorState(price: UnlockPriceAssignment, showIntentMessage: boolean): UnlockFakeDoorState {
  return {
    buttonLabel: `Unlock full trip planner — ${price.label}`,
    helperCopy: 'One-time unlock signal only. Clicking records interest and opens early access; no payment is taken.',
    messageTitle: 'Full planner is not live yet',
    messageCopy: 'You can join early access. SCHNGN records the selected price bucket only and does not charge you.',
    showIntentMessage
  };
}

export function buildUnlockBuyIntentEvent(price: UnlockPriceAssignment, source: AnalyticsSource = 'planner'): AnalyticsEvent {
  return buildAnalyticsEvent('unlock_buy_intent', {
    source,
    price_bucket: price.bucket
  });
}

function parsePriceBucket(value: string | null | undefined): UnlockPriceAssignment | null {
  if (!value) return null;
  return ALL_PRICE_BUCKETS.find((assignment) => assignment.bucket === value) ?? null;
}
