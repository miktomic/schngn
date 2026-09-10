import { agentOpenApi, discoveryResponse } from '$lib/agent/discovery';
export const GET = () => discoveryResponse(agentOpenApi, 'application/vnd.oai.openapi+json');
