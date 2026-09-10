import { handleA2a } from '$lib/agent/a2a';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = ({ request, platform }) => handleA2a(request, platform?.env ?? {});
export const GET = POST;
