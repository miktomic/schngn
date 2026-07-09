<script lang="ts">
  let { small = false }: { small?: boolean } = $props();
</script>

<span class:small class="schngn-mark" aria-hidden="true">
  <span></span><span></span><span></span><span></span><span></span><span></span>
</span>

<style>
  .schngn-mark {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    border-radius: 8px;
    background: var(--ink);
  }

  .schngn-mark.small {
    width: 30px;
    height: 30px;
  }

  .schngn-mark span {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--star-gold);
  }

  .schngn-mark span:nth-child(1) { left: 8px; top: 9px; }
  .schngn-mark span:nth-child(2) { left: 16px; top: 5px; }
  .schngn-mark span:nth-child(3) { left: 25px; top: 11px; }
  .schngn-mark span:nth-child(4) { left: 24px; top: 22px; }
  .schngn-mark span:nth-child(5) { left: 14px; top: 27px; }
  .schngn-mark span:nth-child(6) { left: 7px; top: 19px; }

  .schngn-mark.small span:nth-child(1) { left: 7px; top: 8px; }
  .schngn-mark.small span:nth-child(2) { left: 14px; top: 5px; }
  .schngn-mark.small span:nth-child(3) { left: 22px; top: 10px; }
  .schngn-mark.small span:nth-child(4) { left: 21px; top: 20px; }
  .schngn-mark.small span:nth-child(5) { left: 13px; top: 24px; }
  .schngn-mark.small span:nth-child(6) { left: 6px; top: 17px; }
</style>
