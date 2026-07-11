export const APP_ANCHORS = [
  'status',
  'timeline',
  'trips',
  'details',
  'report',
  'account'
] as const;

export type AppAnchor = (typeof APP_ANCHORS)[number];

const APP_ANCHOR_SET = new Set<string>(APP_ANCHORS);

const LEGACY_SECTION_ANCHORS: Readonly<Record<string, AppAnchor>> = {
  dashboard: 'status',
  trip: 'trips',
  trips: 'trips',
  planner: 'trips',
  proof: 'details',
  returns: 'details',
  report: 'report',
  waitlist: 'report',
  privacy: 'account'
};

export function isAppAnchor(value: unknown): value is AppAnchor {
  return typeof value === 'string' && APP_ANCHOR_SET.has(value);
}

export function appAnchorFromUrl(url: URL): AppAnchor {
  if (url.searchParams.has('section')) {
    return LEGACY_SECTION_ANCHORS[url.searchParams.get('section') ?? ''] ?? 'status';
  }

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  return isAppAnchor(hash) ? hash : 'status';
}

export function appAnchorUrl(currentUrl: URL, anchor: AppAnchor): string {
  const nextUrl = new URL(currentUrl);
  nextUrl.searchParams.delete('section');
  nextUrl.hash = anchor;
  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}

export function canonicalAppAnchorUrl(currentUrl: URL): string {
  return appAnchorUrl(currentUrl, appAnchorFromUrl(currentUrl));
}
