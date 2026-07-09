# EC-rule rolling-window fixtures

`rolling-180-fixtures.json` contains 50 deterministic fixtures for the SCHNGN engine correctness gate.

These fixtures encode the public Schengen 90/180-day rule semantics used by the European Commission short-stay calculator:

- entry and exit days both count;
- the relevant period is the inclusive 180-day window ending on the reference date;
- overlapping or duplicate trips are de-duplicated by physical day;
- Ireland and Cyprus do not count for Schengen short-stay allowance;
- non-EU Schengen members Iceland, Norway, Liechtenstein, and Switzerland do count;
- Bulgaria and Romania are counted for the MVP baseline;
- non-Schengen country codes such as `GB`, `US`, and `TR` do not count when present in imported data;
- missing `countryCode` counts as Schengen, preserving manual-entry behavior.

The fixtures are generated from an independent day-set oracle, not from the production engine. They are deliberately boring. Boring is the correct emotional register for border math.
