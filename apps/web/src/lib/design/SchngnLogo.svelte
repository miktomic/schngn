<script lang="ts">
  let { small = false, alt = 'SCHNGN' }: { small?: boolean; alt?: string } = $props();
</script>

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

<style>
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
</style>
