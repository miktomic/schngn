import type { RequestHandler } from '@sveltejs/kit';
import { handleAgentConnections } from '$lib/agent/connections';
export const GET: RequestHandler = ({ request, platform }) => handleAgentConnections(request, platform?.env ?? {});
export const POST = GET;
