<script lang="ts">
  interface Props {
    command: string;
    copyLabel: string;
    copiedLabel: string;
    copyFailedLabel: string;
  }

  let { command, copyLabel, copiedLabel, copyFailedLabel }: Props = $props();
  let status = $state<'idle' | 'copied' | 'failed'>('idle');
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  async function copyCommand(): Promise<void> {
    if (resetTimer) clearTimeout(resetTimer);

    try {
      let copied = false;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(command);
          copied = true;
        } catch {
          copied = false;
        }
      }

      if (!copied) copied = copyWithFallback();
      if (!copied) throw new Error('Copy was not available');
      status = 'copied';
    } catch {
      status = 'failed';
    }

    resetTimer = setTimeout(() => {
      status = 'idle';
    }, 2400);
  }

  function copyWithFallback(): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = command;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  }
</script>

<div class="command-block" dir="ltr">
  <code>{command}</code>
  <button
    type="button"
    class:copied={status === 'copied'}
    aria-label={status === 'copied' ? copiedLabel : copyLabel}
    title={status === 'copied' ? copiedLabel : copyLabel}
    onclick={copyCommand}
  >
    {status === 'copied' ? copiedLabel : copyLabel}
  </button>
  <span class="sr-only" role="status" aria-live="polite">
    {status === 'copied' ? copiedLabel : status === 'failed' ? copyFailedLabel : ''}
  </span>
</div>

<style>
  .command-block {
    display: grid;
    min-width: 0;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 10px 10px 10px 14px;
    border: 1px solid var(--line);
    border-radius: 4px;
    background: var(--surface);
  }

  code {
    min-width: 0;
    color: var(--ink);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.82rem;
    font-weight: 620;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  button {
    display: inline-flex;
    min-width: 64px;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border: 1px solid var(--control-line);
    border-radius: 3px;
    background: transparent;
    color: var(--ink);
    font-size: 0.78rem;
    font-weight: 760;
  }

  button:hover,
  button.copied {
    border-color: var(--safe);
    background: var(--safe-bg);
    color: var(--safe);
  }

  @media (max-width: 480px) {
    .command-block {
      align-items: stretch;
      grid-template-columns: 1fr;
    }

    button {
      justify-self: start;
    }
  }
</style>
