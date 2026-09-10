import { mcpCard, discoveryResponse } from '$lib/agent/discovery';
export const GET = () => discoveryResponse(mcpCard, 'application/json');
