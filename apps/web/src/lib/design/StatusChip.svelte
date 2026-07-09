<script lang="ts">
  type StatusTone = 'safe' | 'risk' | 'whatif';
  let { tone, label }: { tone: StatusTone; label: string } = $props();
</script>

<span class="status-chip {tone}"><span aria-hidden="true"></span>{label}</span>

<style>
  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    width: fit-content;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 0.82rem;
    font-weight: 760;
  }

  .status-chip.safe {
    border: 1px solid color-mix(in srgb, var(--safe), var(--line) 35%);
    background: var(--safe-bg);
    color: var(--safe);
  }

  .status-chip.risk {
    border: 1px solid var(--risk);
    background: var(--risk-bg);
    color: var(--risk);
  }

  .status-chip.whatif {
    border: 1px solid var(--whatif);
    background: var(--whatif-bg);
    color: var(--whatif);
  }

  .status-chip span {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: currentColor;
  }
</style>
