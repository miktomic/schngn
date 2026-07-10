export type AppSection =
  | 'dashboard'
  | 'trip'
  | 'trips'
  | 'planner'
  | 'proof'
  | 'returns'
  | 'report'
  | 'privacy'
  | 'waitlist';

const APP_SECTIONS = new Set<AppSection>([
  'dashboard',
  'trip',
  'trips',
  'planner',
  'proof',
  'returns',
  'report',
  'privacy',
  'waitlist'
]);

const TRIP_DEPENDENT_SECTIONS = new Set<AppSection>(['proof', 'returns', 'report']);

export function appSectionFromUrl(url: URL): AppSection {
  const section = url.searchParams.get('section');
  return section && APP_SECTIONS.has(section as AppSection) ? (section as AppSection) : 'dashboard';
}

export function appSectionUrl(currentUrl: URL, section: AppSection): string {
  const nextUrl = new URL(currentUrl);
  if (section === 'dashboard') nextUrl.searchParams.delete('section');
  else nextUrl.searchParams.set('section', section);
  return `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
}

export function isAppSectionAvailable(section: AppSection, hasTrips: boolean): boolean {
  return hasTrips || !TRIP_DEPENDENT_SECTIONS.has(section);
}
