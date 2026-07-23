export const APP_ANCHORS = [
  'timeline',
  'trips',
  'account'
] as const;

export type AppAnchor = (typeof APP_ANCHORS)[number];
export type AppResourcePage = 'explainer' | 'faq';

const APP_ANCHOR_SET = new Set<string>(APP_ANCHORS);

const LEGACY_SECTION_ANCHORS: Readonly<Record<string, AppAnchor>> = {
  dashboard: 'timeline',
  trip: 'trips',
  trips: 'trips',
  planner: 'trips',
  proof: 'trips',
  returns: 'trips',
  report: 'account',
  waitlist: 'account',
  privacy: 'account'
};

const LEGACY_RESOURCE_SECTIONS: Readonly<Record<string, AppResourcePage>> = {
  rules: 'explainer',
  explainer: 'explainer',
  faq: 'faq',
  help: 'faq'
};

export function isAppAnchor(value: unknown): value is AppAnchor {
  return typeof value === 'string' && APP_ANCHOR_SET.has(value);
}

export function appAnchorFromUrl(url: URL): AppAnchor {
  if (url.searchParams.has('section')) {
    return LEGACY_SECTION_ANCHORS[url.searchParams.get('section') ?? ''] ?? 'timeline';
  }

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  if (hash === 'status') return 'timeline';
  if (hash === 'details') return 'trips';
  if (hash === 'report') return 'account';
  return isAppAnchor(hash) ? hash : 'timeline';
}

export function appResourceFromUrl(url: URL): AppResourcePage | null {
  if (url.searchParams.has('section')) {
    return LEGACY_RESOURCE_SECTIONS[url.searchParams.get('section') ?? ''] ?? null;
  }

  const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
  return LEGACY_RESOURCE_SECTIONS[hash] ?? null;
}

export function appAnchorUrl(currentUrl: URL, anchor: AppAnchor): string {
  const nextUrl = new URL(currentUrl);
  nextUrl.searchParams.delete('section');
  nextUrl.searchParams.delete('market');
  nextUrl.hash = anchor;
  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}

export function canonicalAppAnchorUrl(currentUrl: URL): string {
  return appAnchorUrl(currentUrl, appAnchorFromUrl(currentUrl));
}
