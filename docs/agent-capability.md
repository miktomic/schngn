# SCHNGN agent capability

SCHNGN exposes its ordinary Schengen 90/180-day calculator to local agents through one shared TypeScript capability, a JSON CLI, a loopback REST API, and an MCP stdio server. Every surface is deterministic and uses the same strict request and response schemas. There is no hosted SCHNGN calculation endpoint.

## Distribution status

The MIT-licensed `@schngn/engine`, `@schngn/capability`, and `@schngn/agent` packages are published publicly on npm. The initial registry release was confirmed on 2026-07-14:

```bash
npm install --global @schngn/agent
schngn version
codex mcp add schngn -- schngn-mcp
npx skills add miktomic/schngn --skill schngn
```

The last command installs the repository-backed SCHNGN skill so compatible agents learn when to use the local tools, how to shape requests, and when to refuse legal-status questions. It does not install or replace the calculation runtime.

## Build from source

Use Node 24+ and Bun 1.3.14 from the repository root:

```bash
bun install
bun run build:agent
```

This builds `@schngn/engine`, `@schngn/capability`, and the Node-targeted files in `apps/agent/dist/`. Run the focused checks with:

```bash
bun run test:capability
bun run test:agent
```

## Surface map

| Operation | TypeScript | JSON CLI | Loopback REST | MCP tool |
|---|---|---|---|---|
| Usage on a date | `calculateUsage` | `usage` | `POST /v1/calculations/usage` | `calculate_schengen_usage` |
| Check a proposed stay | `checkStay` | `check-stay` | `POST /v1/calculations/stay-check` | `check_schengen_stay` |
| Find latest safe exit | `latestSafeExit` | `latest-exit` | `POST /v1/calculations/latest-safe-exit` | `latest_safe_schengen_exit` |

## TypeScript API

Code in this workspace can import the functions, Zod schemas, types, and version constants from `@schngn/capability`. External TypeScript consumers can install that package directly from npm.

```ts
import {
  CalculateUsageInputSchema,
  calculateUsage,
  checkStay,
  latestSafeExit
} from '@schngn/capability';

const request = CalculateUsageInputSchema.parse({
  stays: [{ entryDate: '2026-01-01', exitDate: '2026-03-31' }],
  referenceDate: '2026-03-31',
  includeCountedDays: false
});

const usage = calculateUsage(request);
```

The operations validate again at their public boundary. Invalid direct calls throw `CapabilityValidationError`, whose safe issue codes and schema paths do not include submitted values.

## JSON CLI

Calculation commands read JSON from stdin by default and write one JSON result to stdout. They also accept `--input <file>` or `-i <file>`.

```bash
node apps/agent/dist/cli.js usage <<'JSON'
{
  "stays": [{ "entryDate": "2026-01-01", "exitDate": "2026-03-31" }],
  "referenceDate": "2026-03-31",
  "includeCountedDays": false
}
JSON
```

```bash
node apps/agent/dist/cli.js check-stay <<'JSON'
{
  "existingStays": [{ "entryDate": "2026-01-01", "exitDate": "2026-03-30" }],
  "candidateStay": { "entryDate": "2026-04-01", "exitDate": "2026-04-02" }
}
JSON
```

```bash
node apps/agent/dist/cli.js latest-exit <<'JSON'
{
  "existingStays": [],
  "entryDate": "2026-10-01"
}
JSON
```

Other commands are `openapi`, `serve [--port <number>]`, `mcp`, `help`, and `version`. The root shortcuts `bun run agent:cli`, `bun run agent:api`, and `bun run agent:mcp` run the TypeScript sources directly.

On success the CLI exits `0`. Invalid input, malformed JSON, unavailable or oversized input, bad options, and unknown commands produce safe JSON on stderr and exit `2`, leaving stdout empty. Unexpected failures exit `1`. Input is capped at 64 KiB.

## Loopback REST API

Start the built API on its default address, `http://127.0.0.1:37491`:

```bash
node apps/agent/dist/api.js
```

The server accepts only loopback hosts, rejects non-loopback `Origin` headers, and does not enable CORS. It cannot bind to a remote interface.

| Method and path | Purpose |
|---|---|
| `GET /healthz` | Readiness and schema/rule versions |
| `GET /openapi.json` | OpenAPI 3.1 discovery document |
| `POST /v1/calculations/usage` | Usage on an explicit reference date |
| `POST /v1/calculations/stay-check` | Candidate safety on every included day |
| `POST /v1/calculations/latest-safe-exit` | Latest safe exit for an entry date |

POST requests require `Content-Type: application/json`, accept no query string, and are capped at 64 KiB. Responses are JSON with `Cache-Control: no-store` and `Vary: *`. The OpenAPI document is also available without starting a server:

```bash
node apps/agent/dist/cli.js openapi
```

Valid calculations return HTTP `200`. Invalid requests return `400`, oversized requests `413`, and the wrong content type `415`. Local-boundary, method, and route failures use `403`, `405`, and `404`. Error bodies contain safe codes and schema paths, never submitted trip values.

## MCP stdio server

The MCP server uses stdio and advertises three read-only, idempotent, closed-world tools:

- `calculate_schengen_usage`: `{ stays, referenceDate, includeCountedDays? }`
- `check_schengen_stay`: `{ existingStays, candidateStay }`
- `latest_safe_schengen_exit`: `{ existingStays, entryDate }`

After a global npm install, register the stdio server with Codex:

```bash
codex mcp add schngn -- schngn-mcp
codex mcp get schngn --json
```

MCP clients use different configuration formats, so do not treat one client's JSON or TOML shape as universal. Configure other clients to launch the local `schngn-mcp` executable over stdio. When running from a source checkout instead, point the client at `node /absolute/path/to/schngn/apps/agent/dist/mcp.js`.

Successful tools return the same object in `structuredContent` and as serialized JSON text for compatibility. Invalid arguments return `isError: true` with `INVALID_ARGUMENTS`; unexpected calculation failures use `CALCULATION_FAILED`. The server never echoes invalid values or stack traces. Stdout is reserved exclusively for MCP protocol messages.

## Input and output contract

A stay is exactly `{ entryDate, exitDate }`. Dates must be real calendar dates in `YYYY-MM-DD` form, entry cannot follow exit, unknown fields are rejected, and a request may contain at most 100 stays. Labels, countries, account owners, emails, and identity fields are not accepted.

Each range must represent continuous physical presence inside Schengen. Split a journey into separate stays around full calendar-day gaps outside Schengen. Entry and exit days both count. Country metadata never changes the math. `referenceDate` is always explicit; the capability does not infer “today” from a machine clock.

Every successful response has this envelope:

```json
{
  "schemaVersion": "1",
  "ruleSet": "ordinary-schengen-90-180/v1",
  "advisory": {},
  "result": {}
}
```

`includeCountedDays` defaults to `false`; enabling it adds the exact counted dates. `daysRemaining` and `minimumDaysRemaining` stop at zero, while `overBy` preserves the amount over the allowance. A null latest safe exit means the proposed entry day is already over the limit.

For `checkStay`, `safeThroughDate` is the last checked candidate date before the first violation, or the requested exit when the entire candidate fits. It is not a maximum extension; use `latestSafeExit` when the agent needs the furthest calculated exit from an entry date.

Statuses have narrow calculator meanings:

- `within_limit`: more than seven days remain.
- `near_limit`: one through seven days remain.
- `at_limit`: exactly 90 days are used.
- `over_limit`: more than 90 days are used.

These statuses are planning results, not legal findings or border decisions.

## Privacy and scope

The SCHNGN runtime performs no outbound network calls, analytics, logging, account access, or persistence. The TypeScript API and CLI run in-process, MCP uses stdio, and REST listens only on loopback. SCHNGN itself does not transmit tool inputs or results.

That local runtime boundary does not make the surrounding agent private by default. A cloud-backed agent host or model provider may receive and retain MCP tool arguments and results under its own policies. Review the host's data controls before supplying travel history, and do not copy dates into agent logs or telemetry.

There is deliberately no hosted SCHNGN API or remote MCP endpoint. Sending anonymous trip history to SCHNGN infrastructure would require a separately approved consent, authentication, authorization, retention, and operational-logging design.

SCHNGN models ordinary short stays under the Schengen 90/180-day rule. It does not account for residence permits, long-stay or national visas, bilateral waivers, nationality-specific exceptions, work, study, asylum or temporary-protection status, EES/ETIAS transition issues, or border-officer discretion. It is a planning aid, not legal advice or a guarantee of entry; verify with official sources before booking or travelling.
