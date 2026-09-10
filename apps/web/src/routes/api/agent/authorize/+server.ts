import type { RequestHandler } from '@sveltejs/kit';
import { handleAgentConsent } from '$lib/agent/consent';
export const GET: RequestHandler = ({ request, platform }) => handleAgentConsent(request, platform?.env ?? {});
export const POST = GET;
