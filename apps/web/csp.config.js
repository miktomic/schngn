/**
 * Browser origins required by SCHNGN's production integrations.
 *
 * Clerk's production publishable key resolves to the custom Frontend API
 * subdomain below. Keep this exact rather than widening it to all Clerk tenants.
 */
export const CLERK_FRONTEND_API_ORIGIN = 'https://clerk.schngn.com';
export const CLOUDFLARE_CHALLENGE_ORIGIN = 'https://challenges.cloudflare.com';
export const CLERK_IMAGE_ORIGIN = 'https://img.clerk.com';
export const PLAUSIBLE_ORIGIN = 'https://plausible.io';

const CLERK_DEVELOPMENT_FRONTEND_API_ORIGIN = 'https://*.clerk.accounts.dev';
const LOCAL_VITE_WEBSOCKET_ORIGINS = ['ws://127.0.0.1:*', 'ws://localhost:*'];

/**
 * @param {{ development?: boolean }} [options]
 * @returns {NonNullable<NonNullable<import('@sveltejs/kit').Config['kit']>['csp']>['directives']}
 */
export function createCspDirectives({ development = false } = {}) {
  const clerkFrontendOrigins = [
    CLERK_FRONTEND_API_ORIGIN,
    ...(development ? [CLERK_DEVELOPMENT_FRONTEND_API_ORIGIN] : [])
  ];

  return {
    'default-src': ['self'],
    'base-uri': ['self'],
    'form-action': ['self'],
    'frame-ancestors': ['none'],
    'object-src': ['none'],
    'script-src': ['self', ...clerkFrontendOrigins, CLOUDFLARE_CHALLENGE_ORIGIN],
    'script-src-attr': ['none'],
    // Clerk renders runtime CSS-in-JS and SCHNGN has data-driven inline CSS variables.
    'style-src': ['self', 'unsafe-inline'],
    'style-src-attr': ['unsafe-inline'],
    'connect-src': [
      'self',
      ...clerkFrontendOrigins,
      PLAUSIBLE_ORIGIN,
      ...(development ? LOCAL_VITE_WEBSOCKET_ORIGINS : [])
    ],
    'img-src': ['self', 'data:', CLERK_IMAGE_ORIGIN],
    'font-src': ['self'],
    'manifest-src': ['self'],
    'media-src': ['none'],
    'frame-src': [CLOUDFLARE_CHALLENGE_ORIGIN],
    'worker-src': ['self', 'blob:'],
    ...(development ? {} : { 'upgrade-insecure-requests': true })
  };
}
