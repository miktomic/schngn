# Local runtime setup

Read this reference only when no SCHNGN MCP tool is available or the user asks how to install another interface.

## Before installing

Ask permission before downloading or globally installing executable code. SCHNGN requires Node 24 or newer. No API key or SCHNGN account is required.

## MCP for Codex

Install the published runtime:

```bash
npm install --global @schngn/agent
schngn version
```

Register its stdio server:

```bash
codex mcp add schngn -- schngn-mcp
codex mcp get schngn --json
```

Start a new agent task after registration. If a graphical client cannot resolve the global binary, configure the absolute `schngn-mcp` executable path instead of wrapping it in a login shell.

MCP clients use different configuration formats. Do not present one client's JSON or TOML shape as universal. SCHNGN supports local stdio MCP only, not URL, SSE, or remote transports.

## One-shot CLI

After permission to download the package, an agent may avoid a global install:

```bash
npx --yes --package @schngn/agent schngn version
```

Calculation commands read strict JSON from stdin or `--input <file>` and write one JSON result to stdout:

```bash
npx --yes --package @schngn/agent schngn usage --input request.json
```

Do not put private travel dates directly in shell history. Use stdin or a permission-restricted temporary input file and avoid retaining it after the calculation.

## Other local interfaces

- TypeScript: install `@schngn/capability` and import `calculateUsage`, `checkStay`, or `latestSafeExit`.
- REST/OpenAPI: run `schngn-api`; it listens on `http://127.0.0.1:37491` and exposes `/openapi.json`.
- OpenAPI without a server: run `schngn openapi`.

The SCHNGN runtime performs no persistence, telemetry, logging, account access, or outbound requests. The surrounding agent host may still transmit tool inputs and results to its model provider.
