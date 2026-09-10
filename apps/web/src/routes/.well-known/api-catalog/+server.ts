import { apiCatalog, discoveryResponse } from '$lib/agent/discovery';
export const GET = () => discoveryResponse(apiCatalog, 'application/linkset+json');
