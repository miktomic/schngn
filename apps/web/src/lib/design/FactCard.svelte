<script lang="ts">
  type FactTone = 'safe' | 'ink';
  let { label, value, tone = 'ink' }: { label: string; value: string; tone?: FactTone } = $props();
</script>

<article class="fact-card">
  <span>{label}</span>
  <strong class:safe={tone === 'safe'}>{value}</strong>
</article>

<style>
  .fact-card {
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    padding: 14px;
  }

  .fact-card span {
    display: block;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 750;
  }

  .fact-card strong {
    display: block;
    margin-top: 5px;
    color: var(--ink);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-weight: 700;
  }

  .fact-card strong.safe {
    color: var(--safe);
  }
</style>
