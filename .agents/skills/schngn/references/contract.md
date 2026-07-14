# Calculation contract

Read this reference before preparing a SCHNGN request or interpreting a result.

## Input model

A stay is exactly:

```json
{ "entryDate": "2026-01-01", "exitDate": "2026-01-12" }
```

Dates must be real calendar dates in `YYYY-MM-DD` form. Entry cannot follow exit. Unknown fields are rejected. Each stay-list field accepts at most 100 stays.

Every range means uninterrupted physical presence inside the Schengen Area. Both boundary days count. Split travel into separate ranges when at least one full calendar day is spent outside Schengen. Country metadata never changes the calculation.

## Operations

### Usage on a reference date

MCP: `calculate_schengen_usage`

```json
{
  "stays": [{ "entryDate": "2026-01-01", "exitDate": "2026-01-12" }],
  "referenceDate": "2026-02-01",
  "includeCountedDays": false
}
```

Use `includeCountedDays: true` only when exact counted-date evidence is useful. The result includes the rolling window, `daysUsed`, `daysRemaining`, `overLimit`, `overBy`, and status.

### Check a proposed stay

MCP: `check_schengen_stay`

```json
{
  "existingStays": [{ "entryDate": "2026-01-01", "exitDate": "2026-01-12" }],
  "candidateStay": { "entryDate": "2026-03-01", "exitDate": "2026-03-20" }
}
```

The operation checks every included candidate day. `safeThroughDate` is the last checked candidate date before the first violation, or the requested exit when the full candidate fits. It is not the furthest possible extension.

### Find the latest safe exit

MCP: `latest_safe_schengen_exit`

```json
{
  "existingStays": [{ "entryDate": "2026-01-01", "exitDate": "2026-01-12" }],
  "entryDate": "2026-03-01"
}
```

Use `latestSafeExitDate` for the furthest calculated exit from the supplied entry. A null value means the entry day itself is already over the ordinary allowance.

## Equivalent surfaces

| Purpose | TypeScript | CLI | Loopback REST |
|---|---|---|---|
| Usage | `calculateUsage` | `schngn usage` | `POST /v1/calculations/usage` |
| Stay check | `checkStay` | `schngn check-stay` | `POST /v1/calculations/stay-check` |
| Latest exit | `latestSafeExit` | `schngn latest-exit` | `POST /v1/calculations/latest-safe-exit` |

All successful results include `schemaVersion`, `ruleSet`, `advisory`, and `result`. Status values are calculator states only: `within_limit`, `near_limit`, `at_limit`, and `over_limit`.

## Scope limits

SCHNGN models ordinary short stays. It does not interpret residence permits, long-stay or national visas, bilateral waivers, nationality-specific rights, work or study status, asylum, temporary protection, EES or ETIAS transition issues, or border discretion.
