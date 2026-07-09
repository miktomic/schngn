<script lang="ts">
  import { SchngnMark } from '$lib/design';
</script>

<svelte:head>
  <title>Schengen 90/180 calculator for UK second-home owners | SCHNGN</title>
  <meta
    name="description"
    content="Plan Europe trips around the Schengen 90/180-day rule with a private calculator built for UK second-home owners and frequent travellers."
  />
  <link rel="canonical" href="https://schngn.com/" />
  <meta property="og:url" content="https://schngn.com/" />
  <meta property="og:title" content="Schengen 90/180 calculator for UK second-home owners | SCHNGN" />
  <meta
    property="og:description"
    content="A private Schengen 90/180 calculator for UK second-home owners planning Europe stays."
  />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Schengen 90/180 calculator for UK second-home owners | SCHNGN" />
  <meta
    name="twitter:description"
    content="Check whether your next Europe stay fits the Schengen 90/180-day rule. Your dates stay in this browser."
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
      <p class="kicker">For UK second-home owners</p>
      <h1 id="hero-title">Plan Europe stays without guessing your 90 days.</h1>
      <p class="lede">
        A private Schengen 90/180 calculator for frequent Europe trips, family visits, and second-home planning.
      </p>
      <div class="actions" aria-label="Landing page actions">
        <a class="primary" href="/app">See if your Europe trip fits</a>
        <a class="secondary" href="/app">Open calculator</a>
      </div>
      <p class="trust-line">Your dates stay in this browser. Validated against official-rule fixtures. Not legal advice. Not an EU service.</p>
      <a class="evidence-link" href="/accuracy">Accuracy evidence</a>
    </div>

    <aside class="answer-card" aria-label="Example safe answer">
      <div class="mini-header">
        <span class="mini-brand">SCHNGN</span>
        <span class="privacy">Local & private</span>
      </div>
      <span class="chip safe">France fits</span>
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
      <p>France, Spain, Italy, and Greece are counted inside the active 180-day window.</p>
    </aside>
  </section>

  <section class="audience" aria-label="Who SCHNGN is for">
    <div>
      <h2>Built for the second-home pattern.</h2>
      <p>
        Multiple short stays, family calendars, ferry bookings, and old entry dates make mental math fragile. SCHNGN turns those dates into one answer and a proof trail.
      </p>
    </div>
    <ul aria-label="Second-home planning benefits">
      <li>
        <strong>Check before booking</strong>
        <span>Try a future stay without changing saved trips.</span>
      </li>
      <li>
        <strong>See days coming back</strong>
        <span>Understand when old Schengen days leave the 180-day window.</span>
      </li>
      <li>
        <strong>Keep travel private</strong>
        <span>Trips live in browser storage unless you export JSON yourself.</span>
      </li>
    </ul>
  </section>
</main>

<style>
  .landing {
    min-height: 100svh;
    padding: 20px clamp(16px, 4vw, 48px) 64px;
  }

  .topbar,
  .hero,
  .audience {
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
    color: var(--ink);
    padding: 10px 14px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
    gap: clamp(28px, 6vw, 72px);
    align-items: center;
    padding: clamp(44px, 9vw, 88px) 0 48px;
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
    font-size: clamp(2.65rem, 7.4vw, 5.1rem);
    line-height: 0.98;
    letter-spacing: -0.035em;
  }

  .lede {
    max-width: 600px;
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

  .trust-line {
    max-width: 520px;
    margin: 18px 0 0;
    color: var(--muted);
    font-size: 0.96rem;
    line-height: 1.45;
  }

  .evidence-link {
    display: inline-flex;
    margin-top: 10px;
    color: var(--safe);
    font-weight: 750;
    text-decoration: none;
  }

  .answer-card,
  .audience {
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

  .audience {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: clamp(20px, 4vw, 52px);
    align-items: start;
    border-radius: 18px;
    padding: clamp(22px, 5vw, 40px);
  }

  .audience h2 {
    max-width: 420px;
    margin: 0;
    color: var(--ink);
    font-size: clamp(2rem, 5vw, 3.2rem);
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .audience p {
    max-width: 520px;
    margin: 18px 0 0;
    color: var(--muted);
    line-height: 1.55;
  }

  .audience ul {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .audience li {
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--paper);
    padding: 16px;
  }

  .audience strong,
  .audience span {
    display: block;
  }

  .audience strong {
    color: var(--ink);
  }

  .audience span {
    margin-top: 5px;
    color: var(--muted);
    line-height: 1.45;
  }

  @media (max-width: 840px) {
    .hero,
    .audience {
      grid-template-columns: 1fr;
    }

    .hero {
      padding-top: 34px;
    }
  }
</style>
