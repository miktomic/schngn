<script lang="ts">
  let { small = false, alt = 'SCHNGN', motto = false }: { small?: boolean; alt?: string; motto?: boolean } = $props();
</script>

<span class="logo-lockup" class:small>
  <img
    class:small
    class="schngn-logo"
    src="/brand/schngn-wordmark.png"
    alt={alt}
    width="864"
    height="156"
    decoding="async"
    draggable="false"
  />
  {#if motto}<span class="brand-motto" lang="en" dir="ltr">Never Overstay</span>{/if}
</span>

<style>
  .logo-lockup {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: 10px;
  }

  .schngn-logo {
    display: block;
    width: clamp(130px, 16vw, 164px);
    height: auto;
    flex: 0 0 auto;
    mix-blend-mode: multiply;
  }

  .schngn-logo.small {
    width: 112px;
  }

  .brand-motto {
    max-width: 9ch;
    border-inline-start: 1px solid var(--line);
    color: var(--safe);
    padding-inline-start: 10px;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1.05;
    text-wrap: balance;
  }

  .logo-lockup.small .brand-motto { font-size: 0.7rem; }
</style>
