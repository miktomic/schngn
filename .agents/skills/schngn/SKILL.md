---
name: schngn
description: Use SCHNGN's local calculation tools for ordinary Schengen 90/180-day planning. Trigger when a user asks how many Schengen days are used or remaining on a date, whether a proposed continuous stay fits, the latest safe exit for a planned entry, or how to connect SCHNGN through MCP, CLI, loopback REST/OpenAPI, or TypeScript. Also use when an agent must turn explicit Schengen stay ranges into a strict SCHNGN request. Do not use for residence permits, long-stay visas, bilateral waivers, nationality-specific rights, or legal advice.
---

# SCHNGN

Use the SCHNGN runtime instead of reproducing the 90/180-day calculation. Keep every answer within the ordinary short-stay model and preserve the planning-aid advisory returned by the tool.

## Workflow

1. Identify whether the user needs usage on a date, a candidate-stay check, or a latest-safe-exit calculation.
2. Prefer an available SCHNGN MCP tool. If none is available, read [references/setup.md](references/setup.md) and ask before downloading or installing the runtime.
3. Read [references/contract.md](references/contract.md) before shaping input or interpreting output.
4. Collect explicit continuous Schengen stay ranges. Do not infer missing dates, legal status, or country classification.
5. Call exactly one operation unless the user asks a question that genuinely needs more than one.
6. Report the direct result first, then the counted evidence and limitations that matter.

## Select the operation

- Use `calculate_schengen_usage` for days used and remaining on an explicit reference date.
- Use `check_schengen_stay` to test a proposed entry-to-exit range on every included day.
- Use `latest_safe_schengen_exit` to find the furthest calculated exit for a supplied entry date.

Use the equivalent CLI, REST, or TypeScript operation only when MCP is unavailable or the user explicitly requests that surface.

## Guardrails

- Treat entry and exit days as counted days.
- Represent only continuous physical presence inside Schengen. Split a journey around full calendar days outside Schengen.
- Keep country names, labels, account identifiers, and personal profile fields out of the request.
- Never silently substitute today's date. `referenceDate` is explicit.
- Never turn a planning result into a legal conclusion, visa interpretation, or guarantee of entry.
- Do not claim European Commission calculator-output parity or EU endorsement.
- Do not copy submitted dates into analytics, telemetry, operational logs, or unrelated notes.
- Explain that the SCHNGN process makes no outbound requests, while the user's agent host or model provider may still receive tool inputs and results under its own policies.

## Response pattern

Lead with one plain sentence such as "The proposed stay fits" or "The plan first exceeds the limit on 2026-04-01." Include the relevant used, remaining, or over-by evidence. Distinguish `safeThroughDate` from `latestSafeExitDate`; they answer different questions. End with the returned planning-aid limitation and recommend checking official guidance before booking or travel.
