# `@schngn/agent`

Local agent interfaces for SCHNGN's ordinary Schengen 90/180-day calculator: a strict JSON CLI, loopback HTTP/OpenAPI service, and stdio MCP server.

Requires Node 24 or newer.

## MCP quick start

```bash
npm install --global @schngn/agent
schngn version
codex mcp add schngn -- schngn-mcp
codex mcp get schngn --json
```

Start a new agent task after registration. The server exposes three read-only tools:

- `calculate_schengen_usage`
- `check_schengen_stay`
- `latest_safe_schengen_exit`

## Other local interfaces

```bash
schngn usage --input request.json
schngn check-stay --input request.json
schngn latest-exit --input request.json
schngn-api
```

The HTTP service listens only on `http://127.0.0.1:37491` and publishes its schema at `/openapi.json`. MCP uses stdio only. There is no hosted SCHNGN calculation endpoint.

The SCHNGN process performs no persistence, telemetry, logging, account access, or outbound requests. Your agent host or model provider may still receive tool inputs and results under its own policies.

This package covers ordinary short-stay planning only. It is not legal advice or a guarantee of entry. See the [agent setup guide](https://schngn.com/agents) for schemas, privacy boundaries, and client-specific setup.
