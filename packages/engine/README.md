# `@schngn/engine`

Pure TypeScript date arithmetic for the ordinary Schengen 90/180-day rule. The package has no browser, Cloudflare, persistence, telemetry, or network dependency.

Most integrations should use [`@schngn/capability`](https://www.npmjs.com/package/@schngn/capability), which adds strict versioned schemas and fixed advisory metadata.

```bash
npm install @schngn/engine
```

```ts
import { calculateUsageOnDate } from '@schngn/engine';

const result = calculateUsageOnDate(
  [{ entryDate: '2026-01-01', exitDate: '2026-01-12' }],
  '2026-02-01'
);
```

Each stay range represents continuous physical presence inside Schengen. Entry and exit days both count. This is calculation software for planning, not legal advice or a guarantee of entry.

See the [agent setup guide](https://schngn.com/agents) for the CLI, loopback OpenAPI, and MCP interfaces.
