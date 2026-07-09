<script lang="ts">
  import { SchngnMark } from '$lib/design';
</script>

<svelte:head>
  <title>SCHNGN - Schengen 90/180 planner</title>
  <meta
    name="description"
    content="A privacy-first Schengen 90/180-day calculator and trip planner for frequent travelers, second-home owners, and families."
  />
  <link rel="canonical" href="https://schngn.com/" />
  <meta property="og:url" content="https://schngn.com/" />
  <meta property="og:title" content="SCHNGN - Schengen 90/180 planner" />
  <meta
    property="og:description"
    content="A privacy-first Schengen 90/180-day calculator and trip planner."
  />
</svelte:head>

<main class="landing">
  <header class="topbar" aria-label="SCHNGN landing header">
    <a class="brand" href="/" aria-label="SCHNGN home">
      <SchngnMark />
      <span>SCHNGN</span>
    </a>
    <a class="toplink" href="/app">Open calculator</a>
  </header>

  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-copy">
      <p class="kicker">Local-first Schengen 90/180 tracker</p>
      <h1 id="hero-title">Know if your Schengen trip fits before you book it.</h1>
      <p class="lede">
        SCHNGN gives the answer first, then shows the rolling-window proof. Your trip dates stay on this device.
      </p>
      <div class="actions">
        <a class="primary" href="/app">Check Italy trip</a>
        <a class="secondary" href="/app">Show calculation</a>
      </div>
    </div>

    <aside class="answer-card" aria-label="Example safe answer">
      <div class="mini-header">
        <span class="mini-brand">SCHNGN</span>
        <span class="privacy">Local & private</span>
      </div>
      <span class="chip safe">Italy fits</span>
      <strong>15 safe buffer days</strong>
      <dl>
        <div>
          <dt>Must exit by</dt>
          <dd>Oct 13</dd>
        </div>
        <div>
          <dt>Days used</dt>
          <dd>75 / 90</dd>
        </div>
      </dl>
      <div class="timeline" aria-hidden="true">
        <span class="past"></span>
        <span class="booked"></span>
        <span class="whatif"></span>
        <span class="safe-segment"></span>
      </div>
      <p>France, Greece, and Italy are counted in the active 180-day window.</p>
    </aside>
  </section>

  <section class="principles" aria-label="Product principles">
    <article>
      <h2>Answer first</h2>
      <p>Safe, close, or over limit with the date that matters.</p>
    </article>
    <article>
      <h2>Proof second</h2>
      <p>Rolling 180-day window, inclusive counting, and days returning.</p>
    </article>
    <article>
      <h2>Private by default</h2>
      <p>Trips live in browser storage. Analytics never receive travel dates.</p>
    </article>
  </section>
</main>

<style>
  .landing {
    min-height: 100svh;
    padding: 20px clamp(16px, 4vw, 48px) 64px;
  }

  .topbar,
  .hero,
  .principles {
    max-width: 1120px;
    margin: 0 auto;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 64px;
    gap: 16px;
  }

  .brand,
  .toplink,
  .actions a {
    text-decoration: none;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--ink);
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: 0.05em;
  }


  .toplink,
  .primary,
  .secondary {
    border-radius: 10px;
    font-weight: 750;
  }

  .toplink {
    border: 1px solid var(--line);
    background: var(--surface);
    padding: 10px 14px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
    gap: clamp(28px, 6vw, 72px);
    align-items: center;
    padding: clamp(44px, 9vw, 92px) 0 48px;
  }

  .kicker {
    margin: 0 0 14px;
    color: var(--safe);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.83rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  h1 {
    max-width: 760px;
    margin: 0;
    color: var(--ink);
    font-size: clamp(2.7rem, 8vw, 5.3rem);
    line-height: 0.98;
    letter-spacing: -0.035em;
  }

  .lede {
    max-width: 580px;
    margin: 24px 0 0;
    color: var(--muted);
    font-size: clamp(1.08rem, 2vw, 1.28rem);
    line-height: 1.5;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 30px;
  }

  .actions a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    padding: 13px 18px;
  }

  .primary {
    background: var(--ink);
    color: var(--surface);
  }

  .secondary {
    border: 1px solid var(--ink);
    background: var(--surface);
    color: var(--ink);
  }

  .answer-card,
  .principles article {
    border: 1px solid var(--line);
    background: var(--surface);
  }

  .answer-card {
    border-radius: 18px;
    padding: 20px;
  }

  .mini-header,
  dl {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .mini-brand {
    font-weight: 850;
    letter-spacing: 0.06em;
  }

  .privacy,
  .chip {
    border-radius: 6px;
    padding: 6px 9px;
    font-size: 0.82rem;
    font-weight: 750;
  }

  .privacy,
  .safe {
    border: 1px solid color-mix(in srgb, var(--safe), var(--line) 35%);
    background: var(--safe-bg);
    color: var(--safe);
  }

  .chip {
    display: inline-flex;
    margin-top: 28px;
  }

  .answer-card strong {
    display: block;
    margin-top: 14px;
    color: var(--safe);
    font-size: clamp(2.3rem, 8vw, 3.6rem);
    line-height: 0.96;
    letter-spacing: -0.03em;
  }

  dl {
    margin: 20px 0 0;
  }

  dl div {
    flex: 1;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 12px;
    background: var(--paper);
  }

  dt {
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 750;
  }

  dd {
    margin: 5px 0 0;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 1.15rem;
    font-weight: 700;
  }

  .timeline {
    display: grid;
    grid-template-columns: 0.45fr 0.75fr 0.35fr 0.28fr;
    gap: 3px;
    height: 26px;
    margin-top: 18px;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: var(--paper);
    padding: 3px;
  }

  .timeline span {
    border-radius: 4px;
  }

  .past { background: var(--past); }
  .booked { background: var(--booked); }
  .whatif { background: var(--whatif); }
  .safe-segment { background: var(--safe); }

  .answer-card p {
    margin: 16px 0 0;
    color: var(--muted);
    line-height: 1.45;
  }

  .principles {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }

  .principles article {
    border-radius: 14px;
    padding: 20px;
  }

  .principles h2 {
    margin: 0;
    font-size: 1.15rem;
  }

  .principles p {
    margin: 8px 0 0;
    color: var(--muted);
    line-height: 1.45;
  }

  @media (max-width: 840px) {
    .hero,
    .principles {
      grid-template-columns: 1fr;
    }

    .hero {
      padding-top: 34px;
    }
  }
</style>
