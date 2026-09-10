<script lang="ts">
  import { onMount } from 'svelte';
  import type { Locale } from '$lib/i18n';
  import { explainerUi } from '$lib/i18n/explainerUi';
  import { movingWindowUi } from '$lib/i18n/movingWindowUi';
  import { createAppUiTranslator } from '$lib/i18n/appUi';
  import { formatLocalizedCount } from '$lib/i18n/countUi';
  import { currentLocalIsoDate, type EditableTrip } from '$lib/trips/tripCrud';
  import { shiftDate } from '$lib/timeline/movingWindow';
  import TimelineLedger from './TimelineLedger.svelte';

  let { locale }: { locale: Locale } = $props();
  let today = $state(currentLocalIsoDate());
  let include = $state(false);
  let ready = $state(false);
  let copy = $derived(movingWindowUi(locale));
  let explainer = $derived(explainerUi(locale));
  let ui = $derived(createAppUiTranslator(locale));
  let examples = $derived<EditableTrip[]>([
    { id: 'moving-earlier', entryCountryCode: 'FR', label: explainer.sampleOne, status: 'past', stays: [{ entryDate: shiftDate(today, -160), exitDate: shiftDate(today, -146) }] },
    { id: 'moving-recent', entryCountryCode: 'IT', label: explainer.sampleTwo, status: 'past', stays: [{ entryDate: shiftDate(today, -95), exitDate: shiftDate(today, -86) }] },
    { id: 'moving-whatif', label: copy.whatIf, status: 'what-if', stays: [{ entryDate: today, exitDate: shiftDate(today, 64) }] },
    { id: 'moving-planned', entryCountryCode: 'ES', label: copy.planned, status: 'booked', stays: [{ entryDate: shiftDate(today, 80), exitDate: shiftDate(today, 109) }] }
  ]);
  let trips = $derived(examples.filter(trip => include || trip.id !== 'moving-whatif'));
  onMount(() => { today = currentLocalIsoDate(); ready = true; });
</script>

<section class="moving-example" aria-labelledby="moving-example-title">
  <h2 id="moving-example-title">{copy.explore}</h2>
  <p>{copy.example}</p>
  <label class="include-example"><input type="checkbox" disabled={!ready} bind:checked={include} />{copy.include} · {formatLocalizedCount(locale, 65, 'day').text}</label>
  <TimelineLedger interactive {trips} {locale} {today} initialDate={today} referenceDate={shiftDate(today, 109)} resultLabel={copy.plannedExit} label={ui('rollingWindow')} mode="planner" tripName={(trip) => trip.label ?? copy.planned} />
</section>

<style>
  .moving-example { margin-block: 40px; max-width: 900px; }
  h2 { margin: 0; font-size: 1.75rem; line-height: 1.2; text-wrap: balance; }
  p { margin-block: 8px; color: var(--muted); }
  .include-example { display: flex; align-items: center; gap: 10px; min-height: 44px; padding-block: 12px; font-weight: 650; }
  input { width: 20px; height: 20px; accent-color: var(--safe); flex-shrink: 0; }
  input:focus-visible { outline: 3px solid var(--safe); outline-offset: 3px; }
</style>
