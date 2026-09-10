import { a2aCard, discoveryResponse } from '$lib/agent/discovery';
export const GET = () => discoveryResponse(a2aCard, 'application/json');
