# `@schngn/capability`

Strict, versioned TypeScript operations over the SCHNGN calculation engine. Use it when an application or local agent needs validated inputs, stable outputs, and fixed planning-aid metadata.

```bash
npm install @schngn/capability
```

```ts
import { calculateUsage } from '@schngn/capability';

const response = calculateUsage({
  stays: [{ entryDate: '2026-01-01', exitDate: '2026-01-12' }],
  referenceDate: '2026-02-01',
  includeCountedDays: false
});
```

The public operations are `calculateUsage`, `checkStay`, and `latestSafeExit`. Requests accept only explicit continuous Schengen stay ranges and real `YYYY-MM-DD` dates. Unknown fields are rejected.

The package performs no persistence, telemetry, logging, account access, or outbound requests. A surrounding agent host may still transmit inputs and results to its model provider.

SCHNGN models ordinary short stays only. It does not interpret residence permits, long-stay visas, bilateral waivers, nationality-specific rights, or border discretion. Verify important plans with official guidance.

See the [agent setup guide](https://schngn.com/agents) for the full contract and other local interfaces.
