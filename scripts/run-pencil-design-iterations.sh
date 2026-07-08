#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

unset PENCIL_AGENT_API_KEY
mkdir -p sketches/pencil/exports sketches/pencil/usage

COMMON_FILES=(
  --prompt-file docs/pencil-design-iteration-brief.md
  --prompt-file docs/outside-agent-compelling-mock-prompt.md
  --prompt-file docs/visionary-design-directions.md
  --prompt-file docs/money-shot-ui-plan.md
  --prompt-file docs/ui-ux-pro-max/schngn-synthesis-notes.md
)

run_variant() {
  local slug="$1"
  local prompt_file="sketches/pencil/prompts/${slug}.md"
  local pen="sketches/pencil/${slug}.pen"
  local png="sketches/pencil/exports/${slug}.png"
  local usage="sketches/pencil/usage/${slug}.json"

  echo "==> Pencil variant: ${slug}"
  pencil \
    --repo "$ROOT" \
    --out "$pen" \
    --prompt "$(cat "$prompt_file")" \
    "${COMMON_FILES[@]}" \
    --model gpt-5.5 \
    --export "$png" \
    --export-scale 2 \
    --usage "$usage"
}

run_variant ive-calm-permission-object
run_variant tufte-evidence-ledger
run_variant victor-explorable-simulator
run_variant rams-compliance-appliance
run_variant trust-instrument
run_variant synthesis-compelling-mock

echo "==> Pencil design iteration batch complete"
find sketches/pencil -maxdepth 3 -type f \( -name '*.pen' -o -name '*.png' -o -name '*.json' \) | sort
