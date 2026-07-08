# Pencil.dev setup for SCHNGN

Installed on 2026-07-08.

## Installed components

- Desktop app: `/Users/michael/Applications/Pencil.app`
- Bundle identifier: `dev.pencil.desktop`
- CLI package: `@pencil.dev/cli@0.2.8`
- CLI binary: `/Users/michael/.local/bin/pencil`

## Verification

```text
pencil version -> pencil 0.2.8
pencil status -> Not authenticated
sharp runtime -> sharp 0.34.5, vips 8.17.3
```

Desktop app code signature from install verification:

```text
Authority=Developer ID Application: High Agency Inc. (N438VX24T8)
Notarization Ticket=stapled
Identifier=dev.pencil.desktop
```

Downloaded ARM64 DMG from:

```text
https://www.pencil.dev/download/Pencil-mac-arm64.dmg
```

DMG SHA256 observed during install:

```text
6aa06b211c71bfcdcd7ef33e53713e55e1324eeaa25eec74c6aa67cdd623fcb4
```

## Auth status

Pencil CLI is installed but not authenticated yet.

To authenticate interactively:

```bash
pencil login
```

Alternative for automation:

```bash
export PENCIL_CLI_KEY=...
```

Do not commit or print the key.

## SCHNGN artifact convention

Save Pencil outputs here:

```text
sketches/pencil/
```

Example:

```bash
mkdir -p sketches/pencil
pencil \
  --repo /Users/michael/work/schngn \
  --out sketches/pencil/schngn-money-shot.pen \
  --prompt "Design a mobile SCHNGN money-shot screen that tells a traveler whether their planned Italy trip fits the Schengen 90/180 rule, shows why, and makes the risk state obvious." \
  --export sketches/pencil/schngn-money-shot.png \
  --export-scale 2
```

## Install note

The normal npm install hit a `sharp` source-build failure. The working install path was:

```bash
npm install -g @img/sharp-darwin-arm64@0.34.5 @img/sharp-libvips-darwin-arm64@1.2.4 @img/colour@1.0.0 node-addon-api --no-audit --no-fund --ignore-scripts
npm install -g @pencil.dev/cli --no-audit --no-fund --include=optional --ignore-scripts
```

Then verified `sharp` loads at runtime.
