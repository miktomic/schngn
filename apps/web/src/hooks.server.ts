import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  if (event.url.hostname === 'www.schngn.com') {
    event.url.hostname = 'schngn.com';
    throw redirect(308, event.url.toString());
  }

  return resolve(event);
};
