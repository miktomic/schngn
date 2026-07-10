import { redirect, type Handle } from '@sveltejs/kit';

export const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy':
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), publickey-credentials-get=(), usb=()'
} as const;

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.hostname === 'www.schngn.com') {
    event.url.hostname = 'schngn.com';
    throw redirect(308, event.url.toString());
  }

  const response = await resolve(event);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }
  return response;
};
