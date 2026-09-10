import type { RequestHandler } from '@sveltejs/kit';
import { handleRemoteMcp } from '$lib/agent/remote';
export const POST: RequestHandler = ({ request, platform }) => handleRemoteMcp(request, platform?.env ?? {});
export const GET = POST;
export const DELETE = POST;
