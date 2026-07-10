import type { Reroute } from '@sveltejs/kit';
import { stripLocalePrefix } from '$lib/i18n';

export const reroute: Reroute = ({ url }) => stripLocalePrefix(url.pathname);
