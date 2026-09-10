import { mcpCard, discoveryResponse } from '$lib/agent/discovery';
// Compatibility with the older SEP-1649 discovery shape still used by clients.
// The current experimental card remains available at /mcp/server-card.
export const GET = () => discoveryResponse({
  ...mcpCard,
  serverInfo: { name: mcpCard.name, version: mcpCard.version },
  endpoint: mcpCard.remotes[0].url,
  capabilities: { tools: {}, resources: {} }
}, 'application/json');
