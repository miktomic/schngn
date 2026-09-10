import { readAgentTrips } from '$lib/agent/remote';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = ({ url, platform }) => {
  const value = url.searchParams.get('offset') ?? '0';
  return readAgentTrips(platform?.env ?? {}, /^\d+$/.test(value) ? Number(value) : NaN);
};
