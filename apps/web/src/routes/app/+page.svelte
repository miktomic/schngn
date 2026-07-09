<script lang="ts">
  import { calculateUsageOnDate, classifyVerdict, latestSafeExitDate, type Trip } from '@schngn/engine';

  const trips: Trip[] = [
    { label: 'France', countryCode: 'FR', entryDate: '2026-05-01', exitDate: '2026-05-15' },
    { label: 'Greece · committed', countryCode: 'GR', entryDate: '2026-08-03', exitDate: '2026-08-18' },
    { label: 'Italy · what-if', countryCode: 'IT', entryDate: '2026-10-01', exitDate: '2026-10-13' }
  ];

  const usage = calculateUsageOnDate(trips, '2026-10-13');
  const verdict = classifyVerdict(usage);
  const safeExit = latestSafeExitDate(trips.slice(0, 2), '2026-10-01', 'IT');
</script>

<svelte:head>
  <title>SCHNGN app shell</title>
  <meta name="description" content="SCHNGN local-first calculator shell." />
</svelte:head>

<main class="shell">
  <section class="phone" aria-labelledby="status-heading">
    <header>
      <strong>SCHNGN</strong>
      <span>Local & private</span>
    </header>

    <p class="status-label">{verdict.label}</p>
    <h1 id="status-heading">Italy fits</h1>

    <div class="hero-metric" aria-label="Safe buffer days">
      <span>{usage.daysRemaining}</span>
      <small>safe buffer days</small>
    </div>

    <dl class="summary">
      <div>
        <dt>Must exit by</dt>
        <dd>{safeExit}</dd>
      </div>
      <div>
        <dt>Days used</dt>
        <dd>{usage.daysUsed} / 90</dd>
      </div>
    </dl>

    <section class="timeline" aria-label="Rolling 180 day window">
      <div class="track">
        <span class="segment france" title="France May 1–15"></span>
        <span class="segment greece" title="Greece Aug 3–18"></span>
        <span class="segment italy" title="Italy Oct 1–13"></span>
      </div>
      <div class="legend">
        <span>France</span>
        <span>Greece</span>
        <span>Italy</span>
      </div>
    </section>

    <section id="why" class="explain">
      <h2>Why safe?</h2>
      <p>
        Entry and exit days both count. On Oct 13, your rolling 180-day window uses
        {usage.daysUsed} days, leaving {usage.daysRemaining} days before the 90-day limit.
      </p>
    </section>

    <button type="button">Border-ready report</button>
  </section>
</main>

<style>
  .shell {
    display: grid;
    min-height: 100svh;
    place-items: center;
    padding: 22px;
    background: radial-gradient(circle at top, #f8fbff 0, #edf4f8 42%, #dceaf2 100%);
  }

  .phone {
    width: min(100%, 410px);
    border: 1px solid #d6e1ea;
    border-radius: 34px;
    background: #fbfdff;
    padding: 22px;
    box-shadow: 0 28px 90px rgba(15, 42, 74, 0.16);
  }

  header,
  .summary,
  .legend {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  header strong {
    color: #0f2a4a;
    letter-spacing: 0.08em;
  }

  header span {
    border: 1px solid #bddbd5;
    border-radius: 999px;
    padding: 7px 10px;
    color: #25605a;
    font-size: 0.82rem;
    font-weight: 800;
  }

  .status-label {
    margin: 34px 0 8px;
    color: #25745f;
    font-weight: 900;
  }

  h1 {
    margin: 0;
    color: #10243b;
    font-size: clamp(3rem, 14vw, 4.9rem);
    line-height: 0.9;
    letter-spacing: -0.07em;
  }

  .hero-metric {
    margin-top: 26px;
    border-radius: 28px;
    background: linear-gradient(135deg, #0f2a4a, #214d78);
    color: white;
    padding: 24px;
  }

  .hero-metric span,
  .hero-metric small {
    display: block;
  }

  .hero-metric span {
    font-size: 4.6rem;
    font-weight: 900;
    line-height: 0.9;
  }

  .hero-metric small {
    margin-top: 8px;
    color: #dbeafe;
    font-size: 1.1rem;
    font-weight: 800;
  }

  .summary {
    margin-top: 14px;
  }

  .summary div {
    flex: 1;
    border: 1px solid #dce6ee;
    border-radius: 20px;
    padding: 16px;
    background: white;
  }

  dt {
    color: #65748a;
    font-size: 0.78rem;
    font-weight: 800;
    text-transform: uppercase;
  }

  dd {
    margin: 7px 0 0;
    color: #10243b;
    font-size: 1.3rem;
    font-weight: 900;
  }

  .timeline,
  .explain {
    margin-top: 18px;
    border: 1px solid #dce6ee;
    border-radius: 22px;
    background: white;
    padding: 16px;
  }

  .track {
    position: relative;
    height: 18px;
    overflow: hidden;
    border-radius: 999px;
    background: #e8eef5;
  }

  .segment {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 999px;
  }

  .france {
    left: 4%;
    width: 12%;
    background: #61a5fa;
  }

  .greece {
    left: 58%;
    width: 13%;
    background: #2563eb;
  }

  .italy {
    left: 86%;
    width: 10%;
    background: #16a34a;
  }

  .legend {
    margin-top: 10px;
    color: #5c6a7d;
    font-size: 0.85rem;
    font-weight: 800;
  }

  .explain h2 {
    margin: 0 0 8px;
    font-size: 1.05rem;
  }

  .explain p {
    margin: 0;
    color: #4e5d72;
    line-height: 1.45;
  }

  button {
    width: 100%;
    min-height: 52px;
    margin-top: 18px;
    border: 0;
    border-radius: 18px;
    background: #10243b;
    color: white;
    font-weight: 900;
  }
</style>
