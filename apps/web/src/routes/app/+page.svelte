<script lang="ts">
  import { calculateUsageOnDate, type Trip } from '@schngn/engine';

  type ScreenKey =
    | 'dashboard'
    | 'risk'
    | 'trip'
    | 'trips'
    | 'planner'
    | 'proof'
    | 'returns'
    | 'report'
    | 'privacy'
    | 'waitlist';

  interface AppTrip extends Trip {
    status: 'past' | 'booked' | 'what-if';
    days: number;
  }

  let active: ScreenKey = 'dashboard';

  const screens: { key: ScreenKey; label: string }[] = [
    { key: 'dashboard', label: 'Safe' },
    { key: 'risk', label: 'Risk' },
    { key: 'trip', label: 'Add trip' },
    { key: 'trips', label: 'Trips' },
    { key: 'planner', label: 'Planner' },
    { key: 'proof', label: 'Proof' },
    { key: 'returns', label: 'Returns' },
    { key: 'report', label: 'Report' },
    { key: 'privacy', label: 'Privacy' },
    { key: 'waitlist', label: 'Waitlist' }
  ];

  const baseTrips: AppTrip[] = [
    { label: 'France', countryCode: 'FR', entryDate: '2026-05-01', exitDate: '2026-05-12', status: 'past', days: 12 },
    { label: 'Germany', countryCode: 'DE', entryDate: '2026-06-10', exitDate: '2026-06-27', status: 'past', days: 18 },
    { label: 'Greece', countryCode: 'GR', entryDate: '2026-08-03', exitDate: '2026-08-18', status: 'booked', days: 16 },
    { label: 'Italy', countryCode: 'IT', entryDate: '2026-09-15', exitDate: '2026-10-13', status: 'booked', days: 29 }
  ];

  const riskTrips: Trip[] = [
    ...baseTrips,
    {
      label: 'Spain what-if',
      countryCode: 'ES',
      entryDate: '2026-07-01',
      exitDate: '2026-07-19'
    }
  ];

  const safeUsage = calculateUsageOnDate(baseTrips, '2026-10-13');
  const riskUsage = calculateUsageOnDate(riskTrips, '2026-10-13');

  const proofRows = [
    { label: 'France', dates: 'May 1-12', days: 12, tone: 'past' },
    { label: 'Germany', dates: 'Jun 10-27', days: 18, tone: 'past' },
    { label: 'Greece', dates: 'Aug 3-18', days: 16, tone: 'booked' },
    { label: 'Italy', dates: 'Sep 15-Oct 13', days: 29, tone: 'booked' }
  ];

  const returnRows = [
    { date: 'Oct 22', days: '+3 days', source: 'France May 1-3 leaves the window' },
    { date: 'Oct 31', days: '+6 days', source: 'France May 4-9 leaves the window' },
    { date: 'Nov 8', days: '+3 days', source: 'France May 10-12 leaves the window' }
  ];

  function statusLabel(status: AppTrip['status']): string {
    if (status === 'past') return 'Past, counted';
    if (status === 'booked') return 'Booked, counted';
    return 'What-if';
  }
</script>

<svelte:head>
  <title>SCHNGN app - local Schengen planner</title>
  <meta name="description" content="SCHNGN local-first Schengen 90/180 calculator shell." />
</svelte:head>

<main class="app-shell">
  <section class="device" aria-labelledby="app-title">
    <header class="app-header">
      <div class="brand" id="app-title">
        <span class="mark" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </span>
        <span>SCHNGN</span>
      </div>
      <span class="local-chip">Local & private</span>
    </header>

    <nav class="screen-tabs" aria-label="MVP screens">
      {#each screens as screen}
        <button
          type="button"
          class:active={active === screen.key}
          aria-pressed={active === screen.key}
          onclick={() => (active = screen.key)}
        >
          {screen.label}
        </button>
      {/each}
    </nav>

    {#if active === 'dashboard'}
      <section class="screen" aria-labelledby="safe-heading">
        {@render StatusChip('safe', 'Italy fits')}
        <h1 id="safe-heading" class="verdict safe-text">15 safe buffer days</h1>
        <div class="facts two">
          {@render Fact('Must exit by', 'Oct 13')}
          {@render Fact('Days used', `${safeUsage.daysUsed} / 90`, 'safe')}
        </div>
        {@render Timeline('Rolling 180-day window', 'safe')}
        <section class="panel mint" aria-labelledby="why-safe-heading">
          <h2 id="why-safe-heading">Why this is safe</h2>
          <p>
            France, Germany, Greece, and Italy total {safeUsage.daysUsed} counted days in the Apr 17-Oct 13 window.
            {safeUsage.daysRemaining} days remain before the 90-day limit.
          </p>
        </section>
        <button class="secondary-button" type="button" onclick={() => (active = 'proof')}>Show calculation</button>
        <button class="primary-button" type="button" onclick={() => (active = 'report')}>Border-ready report</button>
      </section>
    {:else if active === 'risk'}
      <section class="screen" aria-labelledby="risk-heading">
        {@render StatusChip('risk', 'Action required')}
        <h1 id="risk-heading" class="verdict risk-text">{riskUsage.overBy} days over limit</h1>
        <section class="panel risk-panel" aria-labelledby="first-fix-heading">
          <h2 id="first-fix-heading">First fix</h2>
          <p>Leave Italy by Oct 9 or shorten the July what-if trip by {riskUsage.overBy} counted days.</p>
        </section>
        {@render Timeline('Risk rolling 180-day proof', 'risk')}
        <section class="cause-row">
          <span>Which date causes it</span>
          <strong>Oct 10 becomes day 91 in the active window.</strong>
        </section>
        <button class="primary-button risk-action" type="button" onclick={() => (active = 'planner')}>Fix unsafe plan</button>
        <button class="secondary-button" type="button" onclick={() => (active = 'proof')}>Show calculation</button>
      </section>
    {:else if active === 'trip'}
      <section class="screen" aria-labelledby="trip-heading">
        <h1 id="trip-heading" class="screen-title">Add trip</h1>
        <form class="trip-form" aria-label="Add trip demo form">
          <label>
            <span>Country</span>
            <input value="Italy" aria-describedby="country-help" />
            <small id="country-help">Schengen counted</small>
          </label>
          <label>
            <span>Entry date</span>
            <input value="Sep 15, 2026" aria-describedby="entry-help" />
            <small id="entry-help">Entry day counts</small>
          </label>
          <label>
            <span>Exit date</span>
            <input value="Oct 13, 2026" aria-describedby="exit-help" />
            <small id="exit-help">Exit day counts</small>
          </label>
          <fieldset>
            <legend>Trip status</legend>
            <label class="toggle selected"><input type="radio" checked name="status" /> Booked</label>
            <label class="toggle"><input type="radio" name="status" /> What-if</label>
          </fieldset>
        </form>
        <section class="panel mint">
          <h2>29 Schengen days will be counted</h2>
          <p>Cyprus and Ireland would be excluded. Iceland, Norway, Liechtenstein, and Switzerland are included.</p>
        </section>
        <button class="primary-button" type="button">Save trip</button>
      </section>
    {:else if active === 'trips'}
      <section class="screen" aria-labelledby="trips-heading">
        <h1 id="trips-heading" class="screen-title">Trips</h1>
        <p class="micro-safe">Stored locally on this device.</p>
        <div class="trip-list">
          {#each baseTrips as trip}
            <article class:booked={trip.status === 'booked'} class:past={trip.status === 'past'}>
              <span class="state-strip {trip.status}"></span>
              <div>
                <h2>{trip.label}</h2>
                <p>{trip.entryDate.slice(5)} to {trip.exitDate.slice(5)} · {trip.days}d</p>
              </div>
              <strong>{statusLabel(trip.status)}</strong>
              <button type="button">Edit</button>
              <button class="delete" type="button">Delete</button>
            </article>
          {/each}
        </div>
        <button class="primary-button" type="button" onclick={() => (active = 'trip')}>Add trip</button>
      </section>
    {:else if active === 'planner'}
      <section class="screen" aria-labelledby="planner-heading">
        <h1 id="planner-heading" class="screen-title">Planner</h1>
        {@render StatusChip('whatif', 'What-if mode')}
        {@render Timeline('Planner timeline', 'planner')}
        <section class="panel risk-panel">
          <h2>Unsafe from Oct 10</h2>
          <p>Adding the July what-if trip crosses the limit because the rolling 180-day lens still contains 75 booked counted days.</p>
        </section>
        <div class="facts two">
          <button class="secondary-button" type="button">Move earlier</button>
          <button class="secondary-button" type="button">Shorten 4 days</button>
        </div>
      </section>
    {:else if active === 'proof'}
      <section class="screen" id="proof" aria-labelledby="proof-heading">
        <h1 id="proof-heading" class="screen-title">Calculation proof</h1>
        <p class="window-label">Active 180-day window</p>
        <p class="mono-range">Apr 17-Oct 13, 2026</p>
        <div class="ledger">
          {#each proofRows as row}
            <article class={row.tone}>
              <span class="state-strip {row.tone}"></span>
              <div>
                <h2>{row.label}</h2>
                <p>{row.dates}</p>
              </div>
              <strong>{row.days} counted</strong>
            </article>
          {/each}
        </div>
        <section class="panel paper-panel">
          <h2>Inclusive counting</h2>
          <p>Entry and exit dates both count as physical presence days.</p>
        </section>
        <button class="secondary-button" type="button" onclick={() => (active = 'returns')}>Days returning soon</button>
      </section>
    {:else if active === 'returns'}
      <section class="screen" aria-labelledby="returns-heading">
        <h1 id="returns-heading" class="verdict safe-text">12 days return in the next 30 days</h1>
        {@render Timeline('Returning days forecast', 'returns')}
        <div class="return-list">
          {#each returnRows as row}
            <article>
              <strong>{row.date}</strong>
              <span>{row.days}</span>
              <p>{row.source}</p>
            </article>
          {/each}
        </div>
      </section>
    {:else if active === 'report'}
      <section class="screen" aria-labelledby="report-heading">
        <h1 id="report-heading" class="screen-title">Border-ready report</h1>
        <article class="report-preview">
          <div class="brand report-brand">
            <span class="mark small" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></span>
            <span>SCHNGN</span>
          </div>
          <h2>Italy fits · 15 safe buffer days</h2>
          <p class="mono-range">75 / 90 days used</p>
          <p>Trip ledger: France 12, Germany 18, Greece 16, Italy 29, prior counted 0.</p>
          <p>This is a calculation summary, not legal advice or an official document.</p>
        </article>
        <section class="panel whatif-panel">
          <h2>Export is not live yet</h2>
          <p>Join the list and we will email when PDF export is available.</p>
        </section>
        <button class="primary-button" type="button" onclick={() => (active = 'waitlist')}>Get PDF export updates</button>
      </section>
    {:else if active === 'privacy'}
      <section class="screen" aria-labelledby="privacy-heading">
        <h1 id="privacy-heading" class="screen-title">Privacy & data</h1>
        <section class="panel mint">
          <h2>Local-only trip storage</h2>
          <p>Trips, dates, and calculated timelines stay in browser storage unless you export a JSON file.</p>
        </section>
        <button class="secondary-button" type="button">Export JSON</button>
        <button class="secondary-button" type="button">Import JSON</button>
        <button class="secondary-button danger-outline" type="button">Clear local data</button>
        <section class="panel paper-panel">
          <h2>Analytics never include trip dates</h2>
          <p>Allowed events are aggregate only: page view, calculator start, trip count bucket, simulation run, and intent clicks.</p>
        </section>
      </section>
    {:else if active === 'waitlist'}
      <section class="screen" aria-labelledby="waitlist-heading">
        <div class="brand report-brand">
          <span class="mark small" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></span>
          <span>SCHNGN</span>
        </div>
        <h1 id="waitlist-heading" class="screen-title">Get PDF export updates</h1>
        <p class="muted-copy">Email-only capture. SCHNGN does not send your trips, dates, country history, or calculated personal timeline with this request.</p>
        <label class="email-label">
          <span>Email</span>
          <input type="email" placeholder="name@example.com" />
        </label>
        <button class="primary-button" type="button">Join waitlist</button>
        <section class="panel mint">
          <h2>You are on the list</h2>
          <p>We stored your email only.</p>
        </section>
        <section class="panel risk-panel">
          <h2>Email could not be saved</h2>
          <p>Try again. No trip data was sent.</p>
        </section>
      </section>
    {/if}
  </section>
</main>

{#snippet StatusChip(tone: 'safe' | 'risk' | 'whatif', label: string)}
  <span class="status-chip {tone}"><span aria-hidden="true"></span>{label}</span>
{/snippet}

{#snippet Fact(label: string, value: string, tone: 'safe' | 'ink' = 'ink')}
  <article class="fact">
    <span>{label}</span>
    <strong class:{tone}>{value}</strong>
  </article>
{/snippet}

{#snippet Timeline(label: string, mode: 'safe' | 'risk' | 'planner' | 'returns')}
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
{/snippet}

<style>
  .app-shell {
    min-height: 100svh;
    padding: 20px;
  }

  .device {
    width: min(100%, 1120px);
    margin: 0 auto;
    border: 1px solid var(--line);
    border-radius: 22px;
    background: color-mix(in srgb, var(--surface) 92%, var(--paper));
    padding: clamp(16px, 3vw, 28px);
  }

  .app-header,
  .brand,
  .screen-tabs,
  .facts,
  .timeline-head,
  .timeline-legend,
  .trip-list article,
  .ledger article,
  .return-list article {
    display: flex;
    align-items: center;
  }

  .app-header {
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--line);
  }

  .brand {
    gap: 10px;
    color: var(--ink);
    font-size: 1.2rem;
    font-weight: 850;
    letter-spacing: 0.05em;
  }

  .mark {
    position: relative;
    display: inline-block;
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    border-radius: 8px;
    background: var(--ink);
  }

  .mark.small {
    width: 30px;
    height: 30px;
  }

  .mark span {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--star-gold);
  }

  .mark span:nth-child(1) { left: 8px; top: 9px; }
  .mark span:nth-child(2) { left: 16px; top: 5px; }
  .mark span:nth-child(3) { left: 25px; top: 11px; }
  .mark span:nth-child(4) { left: 24px; top: 22px; }
  .mark span:nth-child(5) { left: 14px; top: 27px; }
  .mark span:nth-child(6) { left: 7px; top: 19px; }

  .local-chip,
  .status-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border-radius: 6px;
    padding: 7px 10px;
    font-size: 0.82rem;
    font-weight: 760;
  }

  .local-chip,
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

  .screen-tabs {
    gap: 8px;
    overflow-x: auto;
    padding: 16px 0;
  }

  .screen-tabs button {
    flex: 0 0 auto;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    padding: 9px 11px;
    font-size: 0.9rem;
    font-weight: 720;
  }

  .screen-tabs button.active {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--surface);
  }

  .screen {
    display: grid;
    width: min(100%, 420px);
    min-height: 720px;
    margin: 0 auto;
    align-content: start;
    gap: 18px;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--surface);
    padding: 20px;
  }

  .screen-title,
  .verdict {
    margin: 0;
    color: var(--ink);
    letter-spacing: -0.025em;
  }

  .screen-title {
    font-size: clamp(2rem, 8vw, 2.55rem);
    line-height: 1.05;
  }

  .verdict {
    font-size: clamp(2.7rem, 10vw, 3.75rem);
    line-height: 0.96;
  }

  .safe-text { color: var(--safe); }
  .risk-text { color: var(--risk); }

  .facts {
    gap: 8px;
  }

  .facts.two > * {
    flex: 1;
  }

  .fact,
  .panel,
  .timeline-card,
  .report-preview {
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    padding: 14px;
  }

  .fact span,
  .window-label,
  .cause-row span,
  .trip-form small,
  .muted-copy {
    color: var(--muted);
  }

  .fact span,
  .window-label,
  .cause-row span {
    display: block;
    font-size: 0.78rem;
    font-weight: 750;
  }

  .fact strong,
  .mono-range {
    display: block;
    margin-top: 5px;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-weight: 700;
  }

  .panel h2,
  .timeline-card h2,
  .trip-list h2,
  .ledger h2,
  .report-preview h2 {
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.2;
  }

  .panel p,
  .report-preview p,
  .muted-copy {
    margin: 8px 0 0;
    line-height: 1.45;
  }

  .mint {
    border-color: color-mix(in srgb, var(--safe), var(--line) 40%);
    background: var(--surface-mint);
  }

  .risk-panel {
    border-color: var(--risk);
    background: var(--risk-bg);
  }

  .whatif-panel {
    border-color: color-mix(in srgb, var(--whatif), var(--line) 30%);
    background: var(--whatif-bg);
  }

  .paper-panel {
    background: var(--paper);
  }

  .timeline-card {
    display: grid;
    gap: 10px;
  }

  .timeline-head {
    justify-content: space-between;
    gap: 8px;
  }

  .timeline-head span,
  .mono-range {
    color: var(--ink);
    font-size: 0.82rem;
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

  .primary-button,
  .secondary-button {
    min-height: 48px;
    border-radius: 10px;
    padding: 12px 14px;
    font-weight: 780;
  }

  .primary-button {
    border: 1px solid var(--ink);
    background: var(--ink);
    color: var(--surface);
  }

  .secondary-button {
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
  }

  .risk-action {
    border-color: var(--risk);
    background: var(--risk);
  }

  .danger-outline {
    border-color: var(--risk);
    color: var(--risk);
  }

  .cause-row {
    display: grid;
    gap: 5px;
    border: 1px solid var(--risk);
    border-radius: 10px;
    background: var(--risk-bg);
    padding: 12px;
  }

  .trip-form {
    display: grid;
    gap: 14px;
  }

  .trip-form label,
  .email-label {
    display: grid;
    gap: 6px;
    font-weight: 740;
  }

  input {
    min-height: 48px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    color: var(--ink);
    padding: 11px 12px;
  }

  fieldset {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px;
  }

  legend {
    padding: 0 5px;
    color: var(--muted);
    font-weight: 740;
  }

  .toggle {
    display: flex !important;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    border-radius: 8px;
    color: var(--whatif);
  }

  .toggle.selected {
    background: var(--booked-bg);
    color: var(--booked);
  }

  .toggle input {
    position: absolute;
    opacity: 0;
  }

  .micro-safe {
    margin: -8px 0 0;
    color: var(--safe);
    font-size: 0.9rem;
    font-weight: 760;
  }

  .trip-list,
  .ledger,
  .return-list {
    display: grid;
    gap: 10px;
  }

  .trip-list article,
  .ledger article {
    gap: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    padding: 12px;
  }

  .trip-list article.booked,
  .ledger article.booked {
    background: var(--booked-bg);
  }

  .trip-list article.past,
  .ledger article.past {
    background: var(--surface);
  }

  .trip-list article > div,
  .ledger article > div {
    flex: 1;
    min-width: 0;
  }

  .trip-list p,
  .ledger p {
    margin: 2px 0 0;
    color: var(--muted);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.78rem;
  }

  .trip-list strong,
  .ledger strong {
    color: var(--booked);
    font-size: 0.78rem;
    white-space: nowrap;
  }

  .trip-list button {
    border: 0;
    background: transparent;
    color: var(--ink);
    padding: 4px;
    font-size: 0.78rem;
    font-weight: 760;
  }

  .trip-list button.delete {
    color: var(--risk);
  }

  .state-strip {
    width: 4px;
    height: 44px;
    flex: 0 0 auto;
    border-radius: 3px;
    background: var(--past);
  }

  .state-strip.booked,
  .state-strip.booked,
  .state-strip.what-if {
    background: var(--booked);
  }

  .state-strip.past {
    background: var(--past);
  }

  .return-list article {
    justify-content: space-between;
    gap: 10px;
    border-bottom: 1px solid var(--line);
    padding: 10px 0;
  }

  .return-list span {
    border: 1px solid color-mix(in srgb, var(--safe), var(--line) 35%);
    border-radius: 6px;
    background: var(--safe-bg);
    color: var(--safe);
    padding: 6px 8px;
    font-weight: 760;
  }

  .return-list p {
    max-width: 150px;
    margin: 0;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .report-preview {
    display: grid;
    gap: 10px;
    border-color: var(--ink);
  }

  .report-brand {
    font-size: 1rem;
  }

  .email-label {
    margin-top: 4px;
  }

  @media (min-width: 900px) {
    .screen {
      width: min(100%, 760px);
      min-height: 620px;
    }

    .screen-tabs {
      flex-wrap: wrap;
      overflow: visible;
    }
  }

  @media (max-width: 520px) {
    .app-shell {
      padding: 10px;
    }

    .device,
    .screen {
      border-radius: 16px;
    }

    .app-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .facts,
    fieldset {
      grid-template-columns: 1fr;
      flex-direction: column;
    }

    .trip-list article,
    .ledger article {
      align-items: flex-start;
      flex-wrap: wrap;
    }
  }
</style>
