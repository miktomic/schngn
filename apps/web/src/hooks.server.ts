import { redirect, type Handle } from '@sveltejs/kit';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeDirection,
  localeFromPath,
  localizedPath,
  stripLocalePrefix
} from './lib/i18n';

export const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy':
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), publickey-credentials-create=(self), publickey-credentials-get=(self), usb=()'
} as const;

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.hostname === 'www.schngn.com') {
    event.url.hostname = 'schngn.com';
    throw redirect(308, event.url.toString());
  }

  const pathLocale = localeFromPath(event.url.pathname);
  const unprefixedPath = stripLocalePrefix(event.url.pathname);
  const preferredLocale = event.cookies?.get(LOCALE_COOKIE);
  if (
    pathLocale === DEFAULT_LOCALE &&
    event.url.pathname === unprefixedPath &&
    ['/', '/app', '/accuracy', '/explainer', '/faq', '/agents', '/contact'].includes(unprefixedPath) &&
    isLocale(preferredLocale) &&
    preferredLocale !== DEFAULT_LOCALE
  ) {
    throw redirect(307, `${localizedPath(unprefixedPath, preferredLocale)}${event.url.search}`);
  }

  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace(
      '<html lang="en">',
      `<html lang="${pathLocale}" dir="${localeDirection(pathLocale)}">`
    )
  });
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
};
