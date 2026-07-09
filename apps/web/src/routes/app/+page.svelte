<script lang="ts">
  import { browser } from '$app/environment';
  import { FactCard, SchngnMark, StatusChip, TimelineLedger } from '$lib/design';
  import { onMount } from 'svelte';
  import { calculateUsageOnDate, type Trip } from '@schngn/engine';
  import { buildDashboardState } from '$lib/dashboard/dashboardState';
  import {
    deleteTripById,
    emptyTripForm,
    formatTripRange,
    inclusiveTripDays,
    toEngineTrips,
    tripToForm,
    upsertTrip,
    type EditableTrip,
    type TripFormInput,
    type TripValidationErrors
  } from '$lib/trips/tripCrud';
  import { importTripsFromJson, tripsToBackupJson } from '$lib/import-export/tripBackup';
  import { clearTripsFromStorage, createDefaultTrips, loadTripsFromStorage, saveTripsToStorage } from '$lib/trips/tripStorage';

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

  let active: ScreenKey = 'dashboard';
  let editingTripId: string | null = null;
  let tripForm: TripFormInput = emptyTripForm('booked');
  let formErrors: TripValidationErrors = {};
  let storageWarning = '';
  let storageSource: 'defaults' | 'storage' = 'defaults';
  let importMessage = '';
  let importError = '';

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

  let trips: EditableTrip[] = createDefaultTrips();

  $: engineTrips = toEngineTrips(trips);
  $: riskTrips = [
    ...engineTrips,
    {
      label: 'Spain what-if',
      countryCode: 'ES',
      entryDate: '2026-07-01',
      exitDate: '2026-07-19'
    } satisfies Trip
  ];
  $: dashboardState = buildDashboardState(trips);
  $: dashboardStatusTone = (dashboardState.statusTone === 'risk' ? 'risk' : dashboardState.statusTone === 'close' ? 'whatif' : 'safe') as
    | 'safe'
    | 'risk'
    | 'whatif';
  $: dashboardTextClass = dashboardState.statusTone === 'risk' ? 'risk-text' : dashboardState.statusTone === 'close' ? 'close-text' : 'safe-text';
  $: riskUsage = calculateUsageOnDate(riskTrips, '2026-10-13');
  $: proofRows = trips.map((trip) => ({
    label: trip.label ?? trip.countryCode ?? 'Schengen trip',
    dates: formatTripRange(trip),
    days: inclusiveTripDays(trip),
    tone: trip.status
  }));

  const returnRows = [
    { date: 'Oct 22', days: '+3 days', source: 'France May 1-3 leaves the window' },
    { date: 'Oct 31', days: '+6 days', source: 'France May 4-9 leaves the window' },
    { date: 'Nov 8', days: '+3 days', source: 'France May 10-12 leaves the window' }
  ];

  onMount(() => {
    const result = loadTripsFromStorage(window.localStorage);
    trips = result.trips;
    storageSource = result.source;
    storageWarning = result.warning ?? '';
  });

  function persistTrips(nextTrips: EditableTrip[]): void {
    trips = nextTrips;
    if (!browser) return;
    saveTripsToStorage(window.localStorage, nextTrips);
  }

  function startAddTrip(): void {
    editingTripId = null;
    tripForm = emptyTripForm('booked');
    formErrors = {};
    active = 'trip';
  }

  function startEditTrip(trip: EditableTrip): void {
    editingTripId = trip.id;
    tripForm = tripToForm(trip);
    formErrors = {};
    active = 'trip';
  }

  function saveTrip(): void {
    const result = upsertTrip(trips, { ...tripForm, id: editingTripId ?? tripForm.id });
    formErrors = result.errors;
    if (Object.keys(result.errors).length > 0) return;

    persistTrips(result.trips);
    storageSource = 'storage';
    storageWarning = '';
    editingTripId = null;
    tripForm = emptyTripForm('booked');
    active = 'trips';
  }

  function deleteTrip(id: string): void {
    persistTrips(deleteTripById(trips, id));
    storageSource = 'storage';
    storageWarning = '';
  }

  function exportTrips(): void {
    if (!browser) return;

    const json = tripsToBackupJson(trips);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `schngn-trips-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    importMessage = 'Exported JSON backup. Keep it somewhere private; it contains your trip dates.';
    importError = '';
  }

  async function importTrips(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const result = importTripsFromJson(await file.text());
    input.value = '';

    if (result.ok === false) {
      importError = result.error;
      importMessage = '';
      return;
    }

    persistTrips(result.trips);
    storageSource = 'storage';
    storageWarning = '';
    importError = '';
    importMessage = `Imported ${result.trips.length} trips from JSON. Your calculation has been refreshed on this device.`;
  }

  function clearLocalTrips(): void {
    if (browser) clearTripsFromStorage(window.localStorage);
    trips = createDefaultTrips();
    storageSource = 'defaults';
    storageWarning = '';
    importMessage = 'Local trip data cleared from this browser. Bundled example trips are shown now.';
    importError = '';
  }

  function statusLabel(status: EditableTrip['status']): string {
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
        <SchngnMark />
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
        <StatusChip tone={dashboardStatusTone} label={dashboardState.statusLabel} />
        <h1 id="safe-heading" class={`verdict ${dashboardTextClass}`}>{dashboardState.heroMetric}</h1>
        <div class="facts two">
          <FactCard label="Latest safe exit" value={dashboardState.latestSafeExitLabel} />
          <FactCard label="Days used" value={dashboardState.daysUsedLabel} tone={dashboardState.statusTone === 'risk' ? 'ink' : 'safe'} />
        </div>
        <TimelineLedger label="Rolling 180-day window" mode={dashboardState.statusTone === 'risk' ? 'risk' : 'safe'} />
        <section class="panel mint" aria-labelledby="why-safe-heading">
          <h2 id="why-safe-heading">Why this answer</h2>
          <p>{dashboardState.whyCopy}</p>
          <p class="micro-safe">{dashboardState.actionCopy}</p>
        </section>
        <button class="secondary-button" type="button" onclick={() => (active = 'proof')}>Show calculation</button>
        <button class="primary-button" type="button" onclick={() => (active = 'report')}>Border-ready report</button>
      </section>
    {:else if active === 'risk'}
      <section class="screen" aria-labelledby="risk-heading">
        <StatusChip tone="risk" label="Action required" />
        <h1 id="risk-heading" class="verdict risk-text">{riskUsage.overBy} days over limit</h1>
        <section class="panel risk-panel" aria-labelledby="first-fix-heading">
          <h2 id="first-fix-heading">First fix</h2>
          <p>Leave Italy by Oct 9 or shorten the July what-if trip by {riskUsage.overBy} counted days.</p>
        </section>
        <TimelineLedger label="Risk rolling 180-day proof" mode="risk" />
        <section class="cause-row">
          <span>Which date causes it</span>
          <strong>Oct 10 becomes day 91 in the active window.</strong>
        </section>
        <button class="primary-button risk-action" type="button" onclick={() => (active = 'planner')}>Fix unsafe plan</button>
        <button class="secondary-button" type="button" onclick={() => (active = 'proof')}>Show calculation</button>
      </section>
    {:else if active === 'trip'}
      <section class="screen" aria-labelledby="trip-heading">
        <h1 id="trip-heading" class="screen-title">{editingTripId ? 'Edit trip' : 'Add trip'}</h1>
        <form class="trip-form" aria-label="Trip form" onsubmit={(event) => { event.preventDefault(); saveTrip(); }}>
          <label>
            <span>Label</span>
            <input bind:value={tripForm.label} placeholder="Italy" />
          </label>
          <label>
            <span>Country</span>
            <input bind:value={tripForm.countryCode} aria-describedby="country-help" placeholder="IT" />
            <small id="country-help">Use a Schengen country code such as IT, FR, ES, CH, or leave blank for manual Schengen entry.</small>
          </label>
          <label>
            <span>Entry date</span>
            <input type="date" bind:value={tripForm.entryDate} aria-describedby="entry-help" aria-invalid={formErrors.entryDate ? 'true' : undefined} />
            <small id="entry-help">Entry day counts.</small>
            {#if formErrors.entryDate}<strong class="field-error">{formErrors.entryDate}</strong>{/if}
          </label>
          <label>
            <span>Exit date</span>
            <input type="date" bind:value={tripForm.exitDate} aria-describedby="exit-help" aria-invalid={formErrors.exitDate ? 'true' : undefined} />
            <small id="exit-help">Exit day counts. Same-day entry/exit is valid.</small>
            {#if formErrors.exitDate}<strong class="field-error">{formErrors.exitDate}</strong>{/if}
          </label>
          <fieldset>
            <legend>Trip status</legend>
            <label class:selected={tripForm.status === 'past'} class="toggle"><input type="radio" bind:group={tripForm.status} value="past" /> Past</label>
            <label class:selected={tripForm.status === 'booked'} class="toggle"><input type="radio" bind:group={tripForm.status} value="booked" /> Booked</label>
            <label class:selected={tripForm.status === 'what-if'} class="toggle"><input type="radio" bind:group={tripForm.status} value="what-if" /> What-if</label>
          </fieldset>
        </form>
        <section class="panel mint">
          <h2>{formErrors.exitDate || formErrors.entryDate ? 'Fix the highlighted dates' : 'Trip will be counted immediately'}</h2>
          <p>Equal entry/exit dates are allowed as one counted day. Cyprus and Ireland are excluded; Iceland, Norway, Liechtenstein, and Switzerland are included.</p>
        </section>
        <div class="form-actions">
          <button class="primary-button" type="button" onclick={saveTrip}>Save trip</button>
          <button class="secondary-button" type="button" onclick={() => { editingTripId = null; tripForm = emptyTripForm('booked'); formErrors = {}; active = 'trips'; }}>Cancel</button>
        </div>
      </section>
    {:else if active === 'trips'}
      <section class="screen" aria-labelledby="trips-heading">
        <h1 id="trips-heading" class="screen-title">Trips</h1>
        <p class="micro-safe">Stored locally on this device.</p>
        <div class="trip-list">
          {#each trips as trip (trip.id)}
            <article class:booked={trip.status === 'booked'} class:past={trip.status === 'past'}>
              <span class="state-strip {trip.status}"></span>
              <div>
                <h2>{trip.label}</h2>
                <p>{formatTripRange(trip)} · {inclusiveTripDays(trip)}d</p>
              </div>
              <strong>{statusLabel(trip.status)}</strong>
              <button type="button" aria-label={`Edit ${trip.label}`} onclick={() => startEditTrip(trip)}>Edit</button>
              <button class="delete" type="button" aria-label={`Delete ${trip.label}`} onclick={() => deleteTrip(trip.id)}>Delete</button>
            </article>
          {/each}
        </div>
        <button class="primary-button" type="button" onclick={startAddTrip}>Add trip</button>
      </section>
    {:else if active === 'planner'}
      <section class="screen" aria-labelledby="planner-heading">
        <h1 id="planner-heading" class="screen-title">Planner</h1>
        <StatusChip tone="whatif" label="What-if mode" />
        <TimelineLedger label="Planner timeline" mode="planner" />
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
        <TimelineLedger label="Returning days forecast" mode="returns" />
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
            <SchngnMark small />
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
          <p>Stored only in this browser. Trips, dates, and calculated timelines stay on this device unless you export a JSON file.</p>
          <p>Export JSON before switching devices or clearing this browser. Import the same file later to restore your trips manually.</p>
          {#if storageWarning}
            <p class="storage-warning">{storageWarning}</p>
          {:else if importError}
            <p class="storage-warning">{importError}</p>
          {:else if importMessage}
            <p class="micro-safe">{importMessage}</p>
          {:else if storageSource === 'storage'}
            <p class="micro-safe">Loaded from this browser's local storage.</p>
          {:else}
            <p class="micro-safe">Using bundled example trips until you save your own.</p>
          {/if}
        </section>
        <button class="secondary-button" type="button" onclick={exportTrips}>Export JSON</button>
        <label class="secondary-button import-button" for="trip-import-file">Import JSON</label>
        <input id="trip-import-file" class="visually-hidden" aria-label="Import JSON file" type="file" accept="application/json,.json" onchange={importTrips} />
        <button class="secondary-button danger-outline" type="button" onclick={clearLocalTrips}>Clear local data</button>
        <section class="panel paper-panel">
          <h2>Analytics never include trip dates</h2>
          <p>Allowed events are aggregate only: page view, calculator start, trip count bucket, simulation run, and intent clicks.</p>
        </section>
      </section>
    {:else if active === 'waitlist'}
      <section class="screen" aria-labelledby="waitlist-heading">
        <div class="brand report-brand">
          <SchngnMark small />
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


  .local-chip {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid color-mix(in srgb, var(--safe), var(--line) 35%);
    border-radius: 6px;
    background: var(--safe-bg);
    color: var(--safe);
    padding: 7px 10px;
    font-size: 0.82rem;
    font-weight: 760;
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
  .close-text { color: var(--whatif); }
  .risk-text { color: var(--risk); }

  .facts {
    gap: 8px;
  }

  .facts.two > * {
    flex: 1;
  }

  .facts :global(.fact-card) {
    flex: 1;
  }

  .panel,
  .report-preview {
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    padding: 14px;
  }

  .window-label,
  .cause-row span,
  .trip-form small,
  .muted-copy {
    color: var(--muted);
  }

  .window-label,
  .cause-row span {
    display: block;
    font-size: 0.78rem;
    font-weight: 750;
  }

  .mono-range {
    display: block;
    margin-top: 5px;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-weight: 700;
  }

  .panel h2,
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

  .import-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
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

  .storage-warning {
    color: var(--risk);
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

  .state-strip.booked {
    background: var(--booked);
  }

  .state-strip.what-if {
    background: var(--whatif);
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
