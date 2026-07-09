<script lang="ts">
  type TimelineMode = 'safe' | 'risk' | 'planner' | 'returns';
  let { label, mode }: { label: string; mode: TimelineMode } = $props();
</script>

<section class="timeline-card" aria-label={label}>
  <div class="timeline-head">
    <h2>{label}</h2>
    <span>Apr 17-Oct 13</span>
  </div>
  <div class="timeline-rail {mode}" role="img" aria-label={`${label}: past, booked, what-if, risk, and safe segments shown with labels below.`}>
    <span class="past-seg"></span>
    <span class="booked-seg"></span>
    <span class="whatif-seg"></span>
    <span class="risk-seg"></span>
    <span class="safe-seg"></span>
  </div>
  <ul class="timeline-legend" aria-label="Timeline legend">
    <li><span class="past-dot"></span>Past</li>
    <li><span class="booked-dot"></span>Booked</li>
    <li><span class="whatif-dot"></span>What-if</li>
    <li><span class="risk-dot"></span>Risk</li>
    <li><span class="safe-dot"></span>Return</li>
  </ul>
</section>

<style>
  .timeline-card {
    display: grid;
    gap: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    padding: 14px;
  }

  .timeline-head,
  .timeline-legend {
    display: flex;
    align-items: center;
  }

  .timeline-head {
    justify-content: space-between;
    gap: 8px;
  }

  .timeline-card h2 {
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.2;
  }

  .timeline-head span {
    color: var(--ink);
    font-size: 0.82rem;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-weight: 700;
  }

  .timeline-rail {
    display: grid;
    grid-template-columns: 0.45fr 0.72fr 0.32fr 0.18fr 0.28fr;
    gap: 3px;
    min-height: 30px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    padding: 3px;
  }

  .timeline-rail span {
    border-radius: 4px;
  }

  .past-seg { background: var(--past); }
  .booked-seg { background: var(--booked); }
  .whatif-seg { background: var(--whatif); }
  .risk-seg { background: transparent; }
  .safe-seg { background: var(--safe); }

  .timeline-rail.risk .risk-seg,
  .timeline-rail.planner .risk-seg {
    background: var(--risk);
  }

  .timeline-rail.returns {
    grid-template-columns: 0.32fr 0.86fr 0.22fr;
  }

  .timeline-rail.returns .booked-seg,
  .timeline-rail.returns .whatif-seg {
    display: none;
  }

  .timeline-legend {
    flex-wrap: wrap;
    gap: 8px 12px;
    margin: 0;
    padding: 0;
    color: var(--muted);
    font-size: 0.76rem;
    list-style: none;
  }

  .timeline-legend li {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .timeline-legend span {
    width: 9px;
    height: 9px;
    border-radius: 2px;
  }

  .past-dot { background: var(--past); }
  .booked-dot { background: var(--booked); }
  .whatif-dot { background: var(--whatif); }
  .risk-dot { background: var(--risk); }
  .safe-dot { background: var(--safe); }
</style>
