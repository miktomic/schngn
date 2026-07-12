<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, pushState, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { latestSafeExitDate } from '@schngn/engine';
  import { FactCard, SchengenCountryGuide, SchngnLogo, StatusChip, TimelineLedger, TripAdjustPanel, TripMiniTimeline } from '$lib/design';
  import BilateralPassportCheck from '$lib/design/BilateralPassportCheck.svelte';
  import LanguageSelector from '$lib/i18n/LanguageSelector.svelte';
  import { createTranslator, intlLocale, localeFromPath, localizedPath } from '$lib/i18n';
  import { createAppUiTranslator } from '$lib/i18n/appUi';
  import { createAppDeepUiTranslator } from '$lib/i18n/appDeepUi';
  import { createBilateralUiTranslator } from '$lib/i18n/bilateralUi';
  import { createAppRuntimeUiTranslator, formatLocalizedCount, formatLocalizedOutsideDays, formatLocalizedSchengenDays } from '$lib/i18n/appRuntimeUi';
  import { createWhatIfUiTranslator } from '$lib/i18n/whatIfUi';
  import {
    createTripCardUiTranslator,
    formatTripCardOverage,
    formatTripCardToggleLabel
  } from '$lib/i18n/tripCardUi';
  import { createTripOnboardingTranslator } from '$lib/i18n/tripOnboardingUi';
  import { createSinglePageUiTranslator } from '$lib/i18n/singlePageUi';
  import { createOngoingStayUiTranslator } from '$lib/i18n/ongoingStayUi';
  import { createSignupValueUiTranslator } from '$lib/i18n/signupValueUi';
  import { contactUi } from '$lib/i18n/contactUi';
  import {
    localizeDashboardState,
    localizeSimulationState,
    localizeUnlockState
  } from '$lib/i18n/stateUi';
  import { buildDashboardState } from '$lib/dashboard/dashboardState';
  import { buildTripSimulationState, emptyProposedTrip, type ProposedTripInput } from '$lib/simulator/tripSimulator';
  import { type AdjustmentRange, type DateAdjustment } from '$lib/simulator/whatIfDates';
  import {
    applySavedTripDateAdjustment,
    commitSavedTripAdjustment,
    createSavedTripAdjustmentDraft,
    hasSavedTripAdjustmentChanges,
    savedTripAdjustmentBounds
  } from '$lib/simulator/savedTripAdjustment';
  import { buildReturningDaysForecast } from '$lib/returns/returningDays';
  import { buildExplanationState } from '$lib/explanation/explanationState';
  import { localizedLegalCopy } from '$lib/legal/legalCopy';
  import {
    buildUnlockBuyIntentEvent,
    buildUnlockFakeDoorState,
    chooseUnlockPriceBucket,
    loadOrAssignUnlockPriceBucket,
    type UnlockMarket
  } from '$lib/fake-door/unlockFakeDoor';
  import {
    buildSafeBufferBucket,
    buildTripCountBucket,
    trackAnalyticsEvent,
    type AnalyticsSource,
    type AnalyticsVerdict
  } from '$lib/analytics/privacyAnalytics';
  import {
    countTripOutsideDays,
    countTripSchengenDays,
    createOutsideBreak,
    currentLocalIsoDate,
    deleteTripById,
    emptyTripForm,
    MAX_TRIP_COUNT,
    MAX_TRIP_LABEL_LENGTH,
    MAX_OUTSIDE_BREAKS,
    isTripBeforeRollingWindow,
    rollingWindowStartDate,
    statusForTripDates,
    toEngineTrips,
    tripEntryDate,
    tripExitDate,
    upsertTrip,
    type EditableTrip,
    type TripFormInput,
    type TripValidationErrors
  } from '$lib/trips/tripCrud';
  import { SCHENGEN_COUNTRY_OPTIONS } from '$lib/trips/countries';
  import { assignTripColors, buildTripCardStates } from '$lib/trips/tripCardState';
  import { importTripsFromJson, MAX_TRIP_BACKUP_BYTES, tripsToBackupJson } from '$lib/import-export/tripBackup';
  import { clearTripsFromStorage, loadTripsFromStorage, saveTripsToStorage } from '$lib/trips/tripStorage';
  import { initializeClerkBrowserAuth, redirectToClerkSignUp, type ClerkBrowserAuth } from '$lib/auth/clerkBrowser';
  import { APP_ANCHORS, appAnchorFromUrl, appAnchorUrl, appResourceFromUrl, canonicalAppAnchorUrl, type AppAnchor } from '$lib/navigation/appAnchor';
  import {
    deleteAccountData,
    getAccountTrips,
    putAccountTrips
  } from '$lib/account/accountClient';
  import {
    buildAccountSyncMetadata,
    buildPausedAccountSyncMetadata,
    clearAccountSignupSyncIntent,
    clearAccountSyncMetadata,
    decideAccountReconciliation,
    hasAccountSignupSyncIntent,
    loadAccountSyncMetadata,
    saveAccountSignupSyncIntent,
    saveAccountSyncMetadata,
    shouldRestoreMissingLocalSnapshot,
    type AccountSyncMetadata,
    type AccountTripSnapshot
  } from '$lib/account/accountSync';

  type AccountState =
    | 'loading'
    | 'unavailable'
    | 'guest'
    | 'offer_sync'
    | 'syncing'
    | 'synced'
    | 'conflict'
    | 'paused'
    | 'error';
  type AccountIdentity = { userId: string; sessionId: string; epoch: number };
  type AccountRequestContext = AccountIdentity & { token: string };
  const EMPTY_HISTORY_STORAGE_KEY = 'schngn-no-previous-history-v1';
  const SECOND_PLANNER_ENABLED = false;

  $: locale = localeFromPath(page.url.pathname);
  $: t = createTranslator(locale);
  $: ui = createAppUiTranslator(locale);
  $: deep = createAppDeepUiTranslator(locale);
  $: bilateralUi = createBilateralUiTranslator(locale);
  $: rt = createAppRuntimeUiTranslator(locale);
  $: whatIfUi = createWhatIfUiTranslator(locale);
  $: tripOnboarding = createTripOnboardingTranslator(locale);
  $: singlePage = createSinglePageUiTranslator(locale);
  $: tripCardUi = createTripCardUiTranslator(locale);
  $: ongoingStay = createOngoingStayUiTranslator(locale);
  $: signupValue = createSignupValueUiTranslator(locale);
  $: contactCopy = contactUi(locale);
  $: legal = localizedLegalCopy(locale);

  let currentAnchor: AppAnchor = 'timeline';
  let hasLoadedTrips = false;
  let trips: EditableTrip[] = [];
  let tripEditorVisible = false;
  let historyConfirmedEmpty = false;
  let olderTripsVisible = false;
  let accountDetailsOpen = false;
  let pendingDeleteTripId: string | null = null;
  let clearConfirmationVisible = false;
  let tripForm: TripFormInput = emptyTripForm('booked');
  let tripExitCountryExplicit = false;
  let formErrors: TripValidationErrors = {};
  let outsideWindowConfirmationVisible = false;
  let storageWarning = '';
  let storageSource: 'empty' | 'storage' = 'empty';
  let localTripsDurable = true;
  let hasLocalTripMutations = false;
  let importMessage = '';
  let importError = '';
  let importInput: HTMLInputElement;
  let tripDialog: HTMLDialogElement;
  let unlockIntentMessageVisible = false;
  let market: UnlockMarket = 'eu';
  let unlockPrice = chooseUnlockPriceBucket('eu', 0.34);
  let simulationSubmitted = false;
  let simulationSaveNotice = '';
  let simulationOutsideWindowConfirmationVisible = false;
  let simulatorForm: ProposedTripInput = emptySimulationForm();
  let quickAdjustVisible = false;
  let quickAdjustSourceId: string | null = null;
  let quickAdjustRange: AdjustmentRange | null = null;
  let quickAdjustForm: ProposedTripInput = emptySimulationForm();
  let quickAdjustNotice = '';
  let quickAdjustError = '';
  let clerkAuth: ClerkBrowserAuth | null = null;
  let clerkAuthInitialization: Promise<ClerkBrowserAuth> | null = null;
  let signupOpening = false;
  let signupError = '';
  let accountState: AccountState = 'loading';
  let accountError = '';
  let accountNotice = '';
  let accountConsent = false;
  let accountSnapshot: AccountTripSnapshot = {
    trips: [],
    revision: 0,
    updatedAt: null,
    consentVersion: null
  };
  let accountMetadata: AccountSyncMetadata | null = null;
  let accountDeleteConfirmationVisible = false;
  let signOutClearConfirmationVisible = false;
  let accountWriteQueue: Promise<void> = Promise.resolve();
  let pendingAccountWrites = 0;
  let accountConflictEpoch = 0;
  let accountIdentityEpoch = 0;
  let observedClerkIdentity = '';
  let unsubscribeClerk: (() => void) | null = null;
  let accountDeleteInProgress = false;
  let accountSignOutInProgress = false;

  $: tripFormToday = currentLocalIsoDate();
  $: dashboardState = localizeDashboardState(locale, buildDashboardState(trips, undefined, tripFormToday));
  $: dashboardStatusTone = (dashboardState.statusTone === 'risk' ? 'risk' : dashboardState.statusTone === 'close' ? 'whatif' : 'safe') as
    | 'safe'
    | 'risk'
    | 'whatif';
  $: dashboardTextClass = dashboardState.statusTone === 'risk' ? 'risk-text' : dashboardState.statusTone === 'close' ? 'close-text' : 'safe-text';
  $: simulationBaseTrips = trips;
  $: simulationState = localizeSimulationState(locale, buildTripSimulationState(simulationBaseTrips, simulatorForm, tripFormToday));
  $: quickAdjustSourceTrip = quickAdjustSourceId ? trips.find((trip) => trip.id === quickAdjustSourceId) ?? null : null;
  $: quickAdjustHasChanges = quickAdjustSourceTrip
    ? hasSavedTripAdjustmentChanges(quickAdjustSourceTrip, quickAdjustForm, tripFormToday)
    : false;
  $: quickAdjustBaseTrips = quickAdjustSourceId ? trips.filter((trip) => trip.id !== quickAdjustSourceId) : trips;
  $: quickAdjustState = localizeSimulationState(locale, buildTripSimulationState(quickAdjustBaseTrips, quickAdjustForm, tripFormToday));
  $: quickAdjustBounds = savedTripAdjustmentBounds(quickAdjustForm);
  $: tripFormPreviewResult = upsertTrip([], { ...tripForm, id: 'preview' });
  $: tripFormPreview = tripFormPreviewResult.trips[0] ?? null;
  $: ongoingLeaveByDate = calculateOngoingLeaveBy(tripFormPreview);
  $: tripFormWindowStartDate = rollingWindowStartDate(tripFormToday);
  $: currentTrips = trips.filter((trip) => !isTripBeforeRollingWindow(trip, tripFormToday));
  $: olderTrips = trips.filter((trip) => isTripBeforeRollingWindow(trip, tripFormToday));
  $: visibleTrips = olderTripsVisible ? [...currentTrips, ...olderTrips] : currentTrips;
  $: quickAdjustPreviewTrip = quickAdjustSourceTrip && quickAdjustState.simulatedTrip
    ? {
        ...quickAdjustSourceTrip,
        label: quickAdjustState.simulatedTrip.label,
        entryCountryCode: quickAdjustState.simulatedTrip.entryCountryCode,
        exitCountryCode: quickAdjustState.simulatedTrip.exitCountryCode,
        stays: quickAdjustState.simulatedTrip.stays
      }
    : null;
  $: tripCardPreviewTrips = visibleTrips.map((trip) => trip.id === quickAdjustPreviewTrip?.id ? quickAdjustPreviewTrip : trip);
  $: tripCardCalculationTrips = quickAdjustPreviewTrip ? [...quickAdjustBaseTrips, quickAdjustPreviewTrip] : trips;
  $: tripColors = assignTripColors(trips);
  $: tripCardStates = buildTripCardStates(tripCardCalculationTrips, tripCardPreviewTrips, tripFormToday);
  $: historyReady = trips.length > 0 || historyConfirmedEmpty;
  $: resolvedTripFormStatus = tripForm.ongoing ? 'booked' : statusForTripDates(tripForm.status, tripForm.exitDate);
  $: tripFormIsPast = resolvedTripFormStatus === 'past';
  $: simulationSaveStatus = statusForTripDates('booked', simulatorForm.exitDate);
  $: simulatorStatusTone = (simulationState.statusTone === 'risk' ? 'risk' : simulationState.statusTone === 'close' ? 'whatif' : 'safe') as
    | 'safe'
    | 'risk'
    | 'whatif';
  $: quickAdjustStatusTone = (quickAdjustState.statusTone === 'risk' ? 'risk' : quickAdjustState.statusTone === 'close' ? 'whatif' : 'safe') as
    | 'safe'
    | 'risk'
    | 'whatif';
  $: timelineReturningForecast = buildReturningDaysForecast(trips, { referenceDate: dashboardState.referenceDate, horizonDays: 180 });
  $: explanationState = buildExplanationState(trips, dashboardState.referenceDate, locale);
  $: unlockFakeDoorState = localizeUnlockState(locale, buildUnlockFakeDoorState(unlockPrice, unlockIntentMessageVisible), unlockPrice.label);
  $: pendingDeleteTrip = trips.find((trip) => trip.id === pendingDeleteTripId) ?? null;
  $: accountSignedIn = clerkAuth?.available === true && clerkAuth.isSignedIn && clerkAuth.userId !== null;
  $: accountEmail = clerkAuth?.available === true ? clerkAuth.email : null;
  $: accountStatusLabel = accountHeaderLabel(accountState, accountSignedIn);
  $: headerAccountLabel = accountSignedIn ? deep('signOut') : signupValue('compactButton');
  $: localizedStorageWarning = storageWarning ? (locale === 'en' ? storageWarning : rt('accountGenericError')) : '';

  onMount(() => {
    const result = loadTripsFromStorage(window.localStorage);
    trips = result.trips;
    historyConfirmedEmpty = !result.trips.some((trip) => trip.status === 'past')
      && window.localStorage.getItem(EMPTY_HISTORY_STORAGE_KEY) === 'true';
    storageSource = result.source;
    storageWarning = result.warning ?? '';
    localTripsDurable = result.warning === undefined;
    market = new URL(window.location.href).searchParams.get('market') === 'uk' ? 'uk' : 'eu';
    unlockPrice = loadOrAssignUnlockPriceBucket(window.localStorage, { market });
    const initialUrl = new URL(window.location.href);
    const resourceDestination = appResourceFromUrl(initialUrl);
    if (resourceDestination) {
      void goto(resourceDestinationUrl(initialUrl, resourceDestination), { replaceState: true });
      return;
    }
    const shouldRestoreAnchor = Boolean(initialUrl.hash || initialUrl.searchParams.has('section'));
    const canonicalUrl = canonicalAppAnchorUrl(initialUrl);
    currentAnchor = appAnchorFromUrl(initialUrl);
    openAnchorDisclosure(currentAnchor);
    if (`${initialUrl.pathname}${initialUrl.search}${initialUrl.hash}` !== canonicalUrl) {
      window.requestAnimationFrame(() => replaceState(canonicalUrl, page.state));
    }
    hasLoadedTrips = true;
    trackPageView();
    void initializeAccount();
    if (shouldRestoreAnchor) window.requestAnimationFrame(() => scrollToAnchor(currentAnchor, false, false));
    const handleLocationChange = () => {
      const nextUrl = new URL(window.location.href);
      const nextCanonicalUrl = canonicalAppAnchorUrl(nextUrl);
      currentAnchor = appAnchorFromUrl(nextUrl);
      openAnchorDisclosure(currentAnchor);
      if (`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}` !== nextCanonicalUrl) {
        replaceState(nextCanonicalUrl, page.state);
      }
      scrollToAnchor(currentAnchor, false, false);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      accountIdentityEpoch += 1;
      unsubscribeClerk?.();
      unsubscribeClerk = null;
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  });

  function persistTrips(
    nextTrips: EditableTrip[],
    options: { skipAccountSync?: boolean; fromAccount?: boolean } = {}
  ): boolean {
    trips = nextTrips;
    const hasPastTrips = nextTrips.some((trip) => trip.status === 'past');
    if (hasPastTrips) historyConfirmedEmpty = false;
    if (!options.fromAccount) hasLocalTripMutations = true;
    if (!browser) return true;
    if (hasPastTrips) window.localStorage.removeItem(EMPTY_HISTORY_STORAGE_KEY);

    const result = saveTripsToStorage(window.localStorage, nextTrips);
    if (result.ok === true) {
      storageSource = 'storage';
      storageWarning = '';
      localTripsDurable = true;
      if (!options.skipAccountSync && !accountDeleteInProgress && !accountSignOutInProgress && (accountState === 'synced' || accountState === 'syncing')) {
        queueAccountSync(nextTrips, true);
      }
      return true;
    }

    storageWarning = `${result.error} Changes remain available in this tab.`;
    localTripsDurable = false;
    if (!options.skipAccountSync && !accountDeleteInProgress && !accountSignOutInProgress && (accountState === 'synced' || accountState === 'syncing')) {
      queueAccountSync(nextTrips, false);
    }
    return false;
  }

  async function initializeAccount(): Promise<void> {
    accountState = 'loading';
    accountError = '';
    accountNotice = '';

    const auth = await ensureClerkAuth();
    if (!auth.available) {
      accountState = 'unavailable';
      return;
    }

    if (!unsubscribeClerk) {
      observedClerkIdentity = clerkIdentityKey(auth);
      try {
        unsubscribeClerk = auth.subscribe(() => {
          clerkAuth = clerkAuth;
          void synchronizeClerkIdentity();
        });
      } catch {
        accountState = 'unavailable';
        accountError = rt('accountGenericError');
        return;
      }
    }

    const identity = captureAccountIdentity();
    if (!identity) {
      clearSignupSyncIntentOnCancelledReturn();
      accountState = 'guest';
      return;
    }

    const context = await resolveAccountRequestContext(identity);
    if (!context) {
      if (isCurrentAccountIdentity(identity)) {
        accountState = 'error';
        accountError = rt('sessionExpired');
      }
      return;
    }

    const result = await getAccountTrips(context.token);
    if (!isCurrentAccountIdentity(context)) return;
    if (result.ok === false) {
      accountState = 'error';
      accountError = result.code === 'unauthorized' ? rt('sessionExpired') : rt('accountGenericError');
      return;
    }

    accountSnapshot = result.snapshot;
    accountMetadata = browser ? loadAccountSyncMetadata(window.localStorage) : null;
    if (signupSyncRequested()) {
      const belongsToAnotherAccount = accountMetadata !== null && accountMetadata.userId !== context.userId;
      if (result.snapshot.revision === 0 && !belongsToAnotherAccount && localTripsDurable) {
        const saved = await enqueueAccountWrite(trips, 0, ui('synced'), true);
        if (saved) clearSignupSyncIntent();
        return;
      }
      clearSignupSyncIntent();
    }
    if (shouldRestoreMissingLocalSnapshot({
      userId: context.userId,
      localTrips: trips,
      cloud: result.snapshot,
      metadata: accountMetadata,
      storageSource,
      hasLocalMutations: hasLocalTripMutations
    })) {
      applyCloudSnapshot(result.snapshot, context.userId, rt('syncedCopy'));
      return;
    }
    if (!localTripsDurable && result.snapshot.revision > 0) {
      accountState = 'conflict';
      accountError = rt('conflictError');
      return;
    }
    const reconciliation = decideAccountReconciliation({
      userId: context.userId,
      localTrips: trips,
      cloud: result.snapshot,
      metadata: accountMetadata
    });

    if (reconciliation.action === 'offer_initial_sync') {
      accountState = 'offer_sync';
      return;
    }
    if (reconciliation.action === 'load_cloud') {
      applyCloudSnapshot(result.snapshot, context.userId, rt('syncedCopy'));
      return;
    }
    if (reconciliation.action === 'push_local') {
      await enqueueAccountWrite(trips, result.snapshot.revision, ui('synced'), localTripsDurable);
      return;
    }
    if (reconciliation.action === 'synced') {
      accountSnapshot = result.snapshot;
      accountState = 'synced';
      return;
    }

    accountState = 'conflict';
    accountError = rt('conflictError');
  }

  async function ensureClerkAuth(): Promise<ClerkBrowserAuth> {
    if (clerkAuth?.available) return clerkAuth;
    if (!clerkAuthInitialization) {
      clerkAuthInitialization = initializeClerkBrowserAuth(env.PUBLIC_CLERK_PUBLISHABLE_KEY)
        .then((auth) => {
          clerkAuth = auth;
          return auth;
        });
    }
    try {
      return await clerkAuthInitialization;
    } finally {
      clerkAuthInitialization = null;
    }
  }

  function queueAccountSync(nextTrips: EditableTrip[], localPersisted: boolean): void {
    if (!accountSignedIn || (accountSnapshot.revision < 1 && accountState !== 'syncing')) return;
    void enqueueAccountWrite(nextTrips, undefined, '', localPersisted);
  }

  function enqueueAccountWrite(
    nextTrips: EditableTrip[],
    expectedRevision?: number,
    successNotice = '',
    localPersisted = localTripsDurable
  ): Promise<boolean> {
    const identity = captureAccountIdentity();
    if (!identity) return Promise.resolve(false);
    const conflictEpoch = accountConflictEpoch;
    pendingAccountWrites += 1;
    accountState = 'syncing';
    const operation = accountWriteQueue
      .then(async () => {
        if (conflictEpoch !== accountConflictEpoch || !isCurrentAccountIdentity(identity)) return false;
        const context = await resolveAccountRequestContext(identity);
        if (!context) {
          if (isCurrentAccountIdentity(identity)) {
            accountState = 'error';
            accountError = rt('sessionExpired');
          }
          return false;
        }
        return writeAccountTrips(
          nextTrips,
          expectedRevision ?? accountSnapshot.revision,
          context,
          successNotice,
          localPersisted
        );
      })
      .catch(() => {
        if (isCurrentAccountIdentity(identity)) {
          accountState = 'error';
          accountError = rt('syncFailed');
        }
        return false;
      });

    accountWriteQueue = operation
      .then(() => undefined)
      .finally(() => {
        pendingAccountWrites = Math.max(0, pendingAccountWrites - 1);
        if (pendingAccountWrites === 0 && accountState === 'syncing') accountState = 'synced';
      });

    return operation;
  }

  async function writeAccountTrips(
    nextTrips: EditableTrip[],
    expectedRevision: number,
    context: AccountRequestContext,
    successNotice = '',
    localPersisted = true
  ): Promise<boolean> {
    accountState = 'syncing';
    accountError = '';
    accountNotice = '';
    const result = await putAccountTrips(context.token, nextTrips, expectedRevision);
    if (!isCurrentAccountIdentity(context)) return false;
    if (result.ok === true) {
      accountSnapshot = result.snapshot;
      if (!localPersisted || !recordSyncedSnapshot(result.snapshot, context.userId)) {
        accountState = 'error';
        accountError = rt('accountGenericError');
        return false;
      }
      accountState = pendingAccountWrites > 0 ? 'syncing' : 'synced';
      if (successNotice) accountNotice = successNotice;
      return true;
    }
    if (result.code === 'conflict') {
      accountSnapshot = result.snapshot;
      accountConflictEpoch += 1;
      accountState = 'conflict';
      accountError = rt('conflictError');
      return false;
    }

    accountState = 'error';
    accountError = result.code === 'unauthorized' ? rt('sessionExpired') : rt('syncFailed');
    return false;
  }

  function recordSyncedSnapshot(snapshot: AccountTripSnapshot, userId: string): boolean {
    accountSnapshot = snapshot;
    if (!browser) return false;
    accountMetadata = buildAccountSyncMetadata(userId, snapshot);
    const result = saveAccountSyncMetadata(window.localStorage, accountMetadata);
    if (result.ok === false) {
      storageWarning = result.error;
      return false;
    }
    return true;
  }

  function applyCloudSnapshot(snapshot: AccountTripSnapshot, userId: string, notice = ''): void {
    const persisted = persistTrips(snapshot.trips, { skipAccountSync: true, fromAccount: true });
    accountSnapshot = snapshot;
    if (!persisted || !recordSyncedSnapshot(snapshot, userId)) {
      accountState = 'error';
      accountError = rt('accountGenericError');
      return;
    }
    hasLocalTripMutations = false;
    accountState = 'synced';
    accountError = '';
    accountNotice = notice;
  }

  async function enableAccountSync(): Promise<void> {
    if (!accountConsent || !accountSignedIn) return;
    const saved = await enqueueAccountWrite(
      trips,
      accountSnapshot.revision,
      ui('synced')
    );
    if (saved) accountConsent = false;
  }

  function useAccountTrips(): void {
    const identity = captureAccountIdentity();
    if (!identity) return;
    applyCloudSnapshot(accountSnapshot, identity.userId, rt('useAccountCopy'));
  }

  async function replaceAccountTrips(): Promise<void> {
    if (accountSnapshot.revision === 0 && !accountConsent) return;
    const saved = await enqueueAccountWrite(trips, accountSnapshot.revision, rt('replaceAccountCopy'));
    if (saved) accountConsent = false;
  }

  async function retryAccountSync(): Promise<void> {
    await initializeAccount();
  }

  async function removeCloudAccountData(): Promise<void> {
    const identity = captureAccountIdentity();
    if (!identity) return;
    accountDeleteInProgress = true;
    pendingAccountWrites += 1;
    accountState = 'syncing';
    await accountWriteQueue;
    const context = await resolveAccountRequestContext(identity);
    if (!context) {
      accountDeleteInProgress = false;
      pendingAccountWrites = Math.max(0, pendingAccountWrites - 1);
      if (isCurrentAccountIdentity(identity)) {
        accountState = 'error';
        accountError = rt('sessionExpired');
      }
      return;
    }

    const result = await deleteAccountData(context.token);
    accountDeleteInProgress = false;
    pendingAccountWrites = Math.max(0, pendingAccountWrites - 1);
    if (!isCurrentAccountIdentity(context)) return;
    if (result.ok === false) {
      accountState = 'error';
      accountError = result.code === 'unauthorized' ? rt('sessionExpired') : rt('accountGenericError');
      return;
    }

    accountSnapshot = { trips: [], revision: 0, updatedAt: null, consentVersion: null };
    accountDeleteConfirmationVisible = false;
    signOutClearConfirmationVisible = false;
    accountConsent = false;
    accountState = 'offer_sync';
    accountError = '';
    accountNotice = rt('cloudDeleted');
  }

  async function startAccountSignUp(): Promise<void> {
    if (signupOpening) return;
    signupOpening = true;
    accountError = '';
    signupError = '';
    try {
      if (browser) {
        const intent = saveAccountSignupSyncIntent(window.sessionStorage);
        if (intent.ok === false) {
          accountError = intent.error;
          signupError = rt('securePageError');
          return;
        }
      }
      const result = await redirectToClerkSignUp(
        env.PUBLIC_CLERK_PUBLISHABLE_KEY,
        { redirectUrl: accountReturnUrl('signup') }
      );
      if (result.ok === false) {
        clearSignupSyncIntent();
        accountState = 'unavailable';
        signupError = rt('securePageError');
        accountError = signupError;
      }
    } catch {
      clearSignupSyncIntent();
      accountError = rt('securePageError');
      signupError = accountError;
    } finally {
      signupOpening = false;
    }
  }

  async function startAccountSignIn(): Promise<void> {
    const auth = clerkAuth;
    if (!auth?.available) {
      accountDetailsOpen = true;
      navigateToAnchor('account');
      return;
    }
    try {
      await auth.redirectToSignIn({ redirectUrl: accountReturnUrl('signin') });
    } catch {
      accountError = rt('securePageError');
    }
  }

  async function manageClerkAccount(): Promise<void> {
    const auth = clerkAuth;
    if (!auth?.available || !auth.isSignedIn) return;
    try {
      await auth.redirectToUserProfile();
    } catch {
      accountError = rt('securePageError');
    }
  }

  async function signOutAccount(): Promise<void> {
    await signOutAccountAndMaybeClear(false);
  }

  async function signOutAndClearAccount(): Promise<void> {
    await signOutAccountAndMaybeClear(true);
  }

  async function signOutAccountAndMaybeClear(clearBrowser: boolean): Promise<void> {
    const auth = clerkAuth;
    if (!auth?.available || !auth.isSignedIn || accountSignOutInProgress) return;
    accountSignOutInProgress = true;
    pendingAccountWrites += 1;
    accountState = 'syncing';
    await accountWriteQueue;
    if (clearBrowser && !clearBrowserTripsBeforeSignOut()) {
      accountSignOutInProgress = false;
      pendingAccountWrites = Math.max(0, pendingAccountWrites - 1);
      accountState = accountSnapshot.revision > 0 ? 'synced' : 'offer_sync';
      return;
    }
    signOutClearConfirmationVisible = false;
    try {
      await auth.signOut();
    } catch {
      accountSignOutInProgress = false;
      pendingAccountWrites = Math.max(0, pendingAccountWrites - 1);
      accountState = 'error';
      accountError = rt('accountGenericError');
      return;
    }
    accountSignOutInProgress = false;
    pendingAccountWrites = Math.max(0, pendingAccountWrites - 1);
    await synchronizeClerkIdentity();
    accountNotice = clearBrowser ? rt('signedOutCleared') : rt('signedOut');
  }

  function clearBrowserTripsBeforeSignOut(): boolean {
    if (!browser) return false;
    const metadataResult = clearAccountSyncMetadata(window.localStorage);
    if (metadataResult.ok === false) {
      storageWarning = `${metadataResult.error} Sign-out was cancelled so shared-device data is not left in an uncertain state.`;
      return false;
    }
    accountMetadata = null;

    const tripResult = clearTripsFromStorage(window.localStorage);
    if (tripResult.ok === false) {
      storageWarning = `${tripResult.error} Sign-out was cancelled; clear this browser again before sharing the device.`;
      return false;
    }

    trips = [];
    historyConfirmedEmpty = false;
    window.localStorage.removeItem(EMPTY_HISTORY_STORAGE_KEY);
    hasLocalTripMutations = true;
    localTripsDurable = true;
    storageSource = 'empty';
    storageWarning = '';
    return true;
  }

  async function synchronizeClerkIdentity(): Promise<void> {
    const auth = clerkAuth;
    if (!auth?.available) return;
    clerkAuth = auth;
    const nextIdentity = clerkIdentityKey(auth);
    if (nextIdentity === observedClerkIdentity) return;

    observedClerkIdentity = nextIdentity;
    accountIdentityEpoch += 1;
    accountConflictEpoch += 1;
    accountSnapshot = { trips: [], revision: 0, updatedAt: null, consentVersion: null };
    accountConsent = false;
    accountDeleteConfirmationVisible = false;
    accountDeleteInProgress = false;
    accountSignOutInProgress = false;
    accountError = '';
    accountNotice = '';

    if (!auth.isSignedIn || !auth.userId || !auth.sessionId) {
      accountState = 'guest';
      return;
    }

    await initializeAccount();
  }

  function captureAccountIdentity(): AccountIdentity | null {
    const auth = clerkAuth;
    if (!auth?.available || !auth.isSignedIn || !auth.userId || !auth.sessionId) return null;
    return { userId: auth.userId, sessionId: auth.sessionId, epoch: accountIdentityEpoch };
  }

  async function resolveAccountRequestContext(identity: AccountIdentity): Promise<AccountRequestContext | null> {
    if (!isCurrentAccountIdentity(identity)) return null;
    const auth = clerkAuth;
    if (!auth?.available) return null;
    try {
      const token = await auth.getToken();
      if (!token || !isCurrentAccountIdentity(identity)) return null;
      return { ...identity, token };
    } catch {
      return null;
    }
  }

  function isCurrentAccountIdentity(identity: AccountIdentity): boolean {
    const auth = clerkAuth;
    return Boolean(
      auth?.available &&
      auth.isSignedIn &&
      identity.epoch === accountIdentityEpoch &&
      identity.userId === auth.userId &&
      identity.sessionId === auth.sessionId
    );
  }

  function clerkIdentityKey(auth: Extract<ClerkBrowserAuth, { available: true }>): string {
    return auth.isSignedIn && auth.userId && auth.sessionId ? `${auth.userId}:${auth.sessionId}` : 'signed-out';
  }

  function accountReturnUrl(mode: 'signup' | 'signin'): string {
    if (!browser) return '/app';
    const url = new URL(window.location.href);
    url.searchParams.delete('section');
    url.searchParams.set('account', mode === 'signup' ? 'signup' : 'connected');
    url.hash = 'account';
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function signupSyncRequested(): boolean {
    return Boolean(
      browser &&
      page.url.searchParams.get('account') === 'signup' &&
      hasAccountSignupSyncIntent(window.sessionStorage)
    );
  }

  function clearSignupSyncIntent(): void {
    if (!browser) return;
    const result = clearAccountSignupSyncIntent(window.sessionStorage);
    if (result.ok === false) storageWarning = result.error;
  }

  function clearSignupSyncIntentOnCancelledReturn(): void {
    if (browser && page.url.searchParams.get('account') === 'signup') clearSignupSyncIntent();
  }

  function navigateToAnchor(anchor: AppAnchor, openDisclosure = false): void {
    currentAnchor = anchor;
    if (openDisclosure || anchor === 'account') openAnchorDisclosure(anchor);
    if (browser) pushState(appAnchorUrl(new URL(window.location.href), anchor), page.state);
    scrollToAnchor(anchor, true, true);
  }

  function skipToAnswer(event: MouseEvent): void {
    event.preventDefault();
    if (!browser) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('status')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    document.getElementById('status-heading')?.focus({ preventScroll: true });
  }

  function scrollToAnchor(anchor: AppAnchor, focus = true, smooth = true): void {
    if (!browser) return;
    window.requestAnimationFrame(() => {
      const section = document.getElementById(anchor);
      if (!section) return;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      section.scrollIntoView({ behavior: smooth && !reducedMotion ? 'smooth' : 'auto', block: 'start' });
      const headingId = anchor === 'account' ? 'account-section-heading' : `${anchor}-heading`;
      if (focus) document.getElementById(headingId)?.focus({ preventScroll: true });
    });
  }

  function openAnchorDisclosure(anchor: AppAnchor): void {
    if (anchor === 'account') accountDetailsOpen = true;
  }

  function selectAnchor(event: Event): void {
    const anchor = (event.currentTarget as HTMLSelectElement).value;
    if (anchor === 'explainer' || anchor === 'faq' || anchor === 'contact') {
      window.location.assign(localizedPath(`/${anchor}`, locale));
      return;
    }
    if (APP_ANCHORS.includes(anchor as AppAnchor)) navigateToAnchor(anchor as AppAnchor);
  }

  function resourceDestinationUrl(url: URL, resource: 'explainer' | 'faq'): string {
    const query = new URLSearchParams(url.search);
    query.delete('section');
    const search = query.size > 0 ? `?${query.toString()}` : '';
    return `${localizedPath(`/${resource}`, locale)}${search}`;
  }

  function startAddTrip(): void {
    if (protectUnsavedQuickAdjustment()) return;
    resetQuickAdjuster();
    pendingDeleteTripId = null;
    tripForm = emptyTripForm('booked');
    tripExitCountryExplicit = false;
    formErrors = {};
    outsideWindowConfirmationVisible = false;
    tripEditorVisible = true;
    navigateToAnchor('trips');
    trackCalculatorStart('trip_form');
    openTripDialogAfterRender();
  }

  function cancelTripForm(): void {
    tripForm = emptyTripForm('booked');
    tripExitCountryExplicit = false;
    formErrors = {};
    outsideWindowConfirmationVisible = false;
    if (tripDialog?.open) tripDialog.close();
    tripEditorVisible = false;
    focusElementAfterRender('add-trip-button', 'trips-heading');
  }

  function saveTrip(confirmOutsideWindow = false): void {
    const result = upsertTrip(trips, tripForm);
    formErrors = localizeValidationErrors(result.errors);
    if (Object.keys(result.errors).length > 0) {
      outsideWindowConfirmationVisible = false;
      return;
    }

    if (
      !confirmOutsideWindow &&
      tripFormPreview &&
      isTripBeforeRollingWindow(tripFormPreview, tripFormToday)
    ) {
      outsideWindowConfirmationVisible = true;
      return;
    }

    const savedTripId = result.trips.find((trip) => trip.id === tripForm.id)?.id
      ?? result.trips.find((trip) => tripEntryDate(trip) === tripForm.entryDate
        && (tripForm.ongoing ? trip.ongoing : tripExitDate(trip) === tripForm.exitDate))?.id;
    outsideWindowConfirmationVisible = false;
    persistTrips(result.trips);
    trackAnalyticsEvent('trip_added', {
      source: 'trip_form',
      trip_count_bucket: buildTripCountBucket(result.trips.length)
    });
    tripForm = emptyTripForm('booked');
    tripExitCountryExplicit = false;
    if (tripDialog?.open) tripDialog.close();
    tripEditorVisible = false;
    focusElementAfterRender(savedTripId ? `trip-trigger-${savedTripId}` : 'trips-heading', 'trips-heading');
  }

  function updateTripExitDate(event: Event): void {
    const exitDate = (event.currentTarget as HTMLInputElement).value;
    outsideWindowConfirmationVisible = false;
    tripForm = {
      ...tripForm,
      exitDate,
      status: statusForTripDates(tripForm.status, exitDate)
    };
  }

  function updateOngoingStay(event: Event): void {
    const ongoing = (event.currentTarget as HTMLInputElement).checked;
    outsideWindowConfirmationVisible = false;
    tripForm = {
      ...tripForm,
      ongoing,
      exitDate: ongoing ? '' : tripForm.exitDate,
      exitCountryCode: ongoing ? '' : tripForm.exitCountryCode,
      status: ongoing ? 'booked' : tripForm.status
    };
    if (ongoing) tripExitCountryExplicit = false;
  }

  function calculateOngoingLeaveBy(preview: EditableTrip | null): string | null {
    if (!preview?.ongoing) return null;
    const finalStay = preview.stays.at(-1);
    if (!finalStay) return null;
    return latestSafeExitDate(
      [...toEngineTrips(trips, tripFormToday), ...preview.stays.slice(0, -1)],
      finalStay.entryDate
    );
  }

  function updateTripEntryCountry(event: Event): void {
    const entryCountryCode = (event.currentTarget as HTMLSelectElement).value;
    tripForm = {
      ...tripForm,
      entryCountryCode,
      exitCountryCode: tripExitCountryExplicit ? tripForm.exitCountryCode : entryCountryCode
    };
  }

  function updateTripExitCountry(event: Event): void {
    const exitCountryCode = (event.currentTarget as HTMLSelectElement).value;
    tripForm = {
      ...tripForm,
      exitCountryCode
    };
    tripExitCountryExplicit = Boolean(exitCountryCode);
  }

  function confirmTripExitCountry(): void {
    tripExitCountryExplicit = true;
    focusElementAfterRender('trip-passport-country', 'trip-exit-country');
  }

  function requestDeleteTrip(id: string): void {
    pendingDeleteTripId = id;
  }

  function deletePendingTrip(): void {
    if (!pendingDeleteTripId) return;
    if (quickAdjustSourceId === pendingDeleteTripId) resetQuickAdjuster();
    persistTrips(deleteTripById(trips, pendingDeleteTripId));
    pendingDeleteTripId = null;
  }

  function exportTrips(): void {
    if (!browser || trips.length === 0) return;

    const json = tripsToBackupJson(trips);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `schngn-trips-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    importMessage = rt('exported');
    importError = '';
  }

  async function importTrips(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > MAX_TRIP_BACKUP_BYTES) {
      input.value = '';
      importError = rt('importTooLarge');
      importMessage = '';
      return;
    }

    const result = importTripsFromJson(await file.text());
    input.value = '';
    if (result.ok === false) {
      importError = rt('accountGenericError');
      importMessage = '';
      return;
    }

    const persisted = persistTrips(result.trips);
    importError = '';
    importMessage = persisted
      ? rt('imported', { count: tripCount(result.trips.length) })
      : rt('importedTemporary', { count: tripCount(result.trips.length) });
  }

  function requestClearLocalTrips(): void {
    if (accountState === 'loading' || accountState === 'syncing' || accountDeleteInProgress || accountSignOutInProgress) return;
    clearConfirmationVisible = true;
  }

  function clearLocalTrips(): void {
    if (accountState === 'loading' || accountState === 'syncing' || accountDeleteInProgress || accountSignOutInProgress) return;
    if (browser) {
      if (accountSignedIn && accountSnapshot.revision > 0) {
        const identity = captureAccountIdentity();
        if (!identity) return;
        const pausedMetadata = buildPausedAccountSyncMetadata(identity.userId, accountSnapshot);
        const metadataResult = saveAccountSyncMetadata(window.localStorage, pausedMetadata);
        if (metadataResult.ok === false) {
          storageWarning = `${metadataResult.error} Local clearing was cancelled so the account copy cannot be overwritten accidentally.`;
          return;
        }
        accountMetadata = pausedMetadata;
      } else {
        const metadataResult = clearAccountSyncMetadata(window.localStorage);
        if (metadataResult.ok === false) {
          storageWarning = `${metadataResult.error} Local clearing was cancelled so old sync state is not left behind.`;
          return;
        }
        accountMetadata = null;
      }

      const result = clearTripsFromStorage(window.localStorage);
      localTripsDurable = result.ok;
      if (result.ok === false) {
        storageWarning = `${result.error} Existing saved trips may return after reload; account sync remains paused.`;
      } else {
        storageWarning = '';
      }
    }
    trips = [];
    hasLocalTripMutations = true;
    storageSource = 'empty';
    if (browser && accountSignedIn && accountSnapshot.revision > 0) {
      accountState = 'paused';
      accountNotice = rt('conflictError');
    }
    clearConfirmationVisible = false;
    pendingDeleteTripId = null;
    importMessage = rt('cleared');
    importError = '';
    historyConfirmedEmpty = false;
    if (browser) window.localStorage.removeItem(EMPTY_HISTORY_STORAGE_KEY);
    accountDetailsOpen = true;
    navigateToAnchor('account');
  }

  function statusLabel(status: EditableTrip['status']): string {
    if (status === 'past') return deep('pastTrip');
    if (status === 'booked') return deep('booked');
    return deep('whatIf');
  }

  function localizeValidationErrors(errors: TripValidationErrors): TripValidationErrors {
    if (locale === 'en') return errors;
    const message = deep('fixFields');
    return Object.fromEntries(Object.entries(errors).map(([key, value]) => [key,
      key === 'breakFields' && value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value).map(([id, fields]) => [id, Object.fromEntries(Object.keys(fields as object).map((field) => [field, message]))]))
        : message
    ])) as TripValidationErrors;
  }

  function runSimulation(): void {
    simulationSaveNotice = '';
    simulationOutsideWindowConfirmationVisible = false;
    simulationSubmitted = true;
    if (simulationState.valid) trackSimulationRun('planner');
  }

  function clearSimulation(): void {
    simulatorForm = emptySimulationForm();
    simulationSubmitted = false;
    simulationSaveNotice = '';
    simulationOutsideWindowConfirmationVisible = false;
  }

  function openQuickAdjuster(target: EditableTrip | null = dashboardState.targetTrip): void {
    if (!target) return;
    if (isTripBeforeRollingWindow(target, tripFormToday)) olderTripsVisible = true;
    const draft = createSavedTripAdjustmentDraft(target, tripFormToday);
    quickAdjustForm = draft.form;
    quickAdjustSourceId = target.id;
    quickAdjustRange = draft.range;
    quickAdjustVisible = true;
    quickAdjustNotice = '';
    quickAdjustError = '';
    trackSimulationRun('dashboard');
    if (currentAnchor === 'trips') scrollToAnchor('trips', false, true);
    else navigateToAnchor('trips');
    focusElementAfterRender('quick-adjust-heading');
  }

  function toggleQuickAdjuster(target: EditableTrip): void {
    if (quickAdjustVisible && quickAdjustSourceId === target.id) {
      if (protectUnsavedQuickAdjustment()) return;
      closeQuickAdjuster();
      return;
    }
    if (protectUnsavedQuickAdjustment()) return;
    openQuickAdjuster(target);
  }

  function protectUnsavedQuickAdjustment(): boolean {
    if (!quickAdjustVisible || !quickAdjustHasChanges) return false;
    quickAdjustError = whatIfUi('finishEditing');
    focusElementAfterRender('quick-adjust-heading');
    return true;
  }

  function closeQuickAdjuster(): void {
    const returnId = quickAdjustSourceId ? `trip-trigger-${quickAdjustSourceId}` : 'trips-heading';
    resetQuickAdjuster();
    focusElementAfterRender(returnId, 'trips-heading');
  }

  function resetQuickAdjuster(): void {
    quickAdjustVisible = false;
    quickAdjustSourceId = null;
    quickAdjustRange = null;
    quickAdjustForm = emptySimulationForm();
    quickAdjustError = '';
    quickAdjustNotice = '';
  }

  function adjustQuickTrip(adjustment: DateAdjustment): void {
    quickAdjustNotice = '';
    quickAdjustError = '';
    quickAdjustForm = applySavedTripDateAdjustment(quickAdjustForm, adjustment);
  }

  function updateQuickTripForm(form: ProposedTripInput): void {
    quickAdjustNotice = '';
    quickAdjustError = '';
    quickAdjustForm = form;
  }

  function saveQuickAdjustment(): void {
    if (!quickAdjustSourceId || !quickAdjustState.valid || !quickAdjustHasChanges) return;
    const adjustedTripId = quickAdjustSourceId;
    const returnId = `trip-trigger-${adjustedTripId}`;
    const result = commitSavedTripAdjustment(trips, quickAdjustSourceId, quickAdjustForm, tripFormToday);
    if (!result.updated) {
      quickAdjustError = whatIfUi('unavailable');
      return;
    }

    const persisted = persistTrips(result.trips);
    const adjustedTrip = result.trips.find((trip) => trip.id === adjustedTripId);
    if (adjustedTrip && isTripBeforeRollingWindow(adjustedTrip, tripFormToday)) olderTripsVisible = true;
    quickAdjustVisible = false;
    quickAdjustSourceId = null;
    quickAdjustRange = null;
    quickAdjustForm = emptySimulationForm();
    quickAdjustError = '';
    quickAdjustNotice = persisted
      ? whatIfUi('updated')
      : rt('importedTemporary', { count: tripCount(result.trips.length) });
    focusElementAfterRender(returnId, 'trips-heading');
  }

  function simulationChanged(): void {
    simulationSubmitted = false;
    simulationSaveNotice = '';
    simulationOutsideWindowConfirmationVisible = false;
  }

  function toggleOlderTrips(): void {
    if (olderTripsVisible && quickAdjustSourceTrip && isTripBeforeRollingWindow(quickAdjustSourceTrip, tripFormToday)) {
      resetQuickAdjuster();
    }
    olderTripsVisible = !olderTripsVisible;
  }

  function focusElementAfterRender(id: string, fallbackId?: string): void {
    if (!browser) return;
    window.requestAnimationFrame(() => {
      const element = document.getElementById(id) ?? (fallbackId ? document.getElementById(fallbackId) : null);
      element?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      element?.focus({ preventScroll: true });
    });
  }

  function openTripDialogAfterRender(): void {
    if (!browser) return;
    window.requestAnimationFrame(() => {
      if (!tripDialog?.open) tripDialog?.showModal();
      document.getElementById('trip-heading')?.focus({ preventScroll: true });
    });
  }

  function confirmNoPreviousTrips(): void {
    historyConfirmedEmpty = true;
    if (browser) window.localStorage.setItem(EMPTY_HISTORY_STORAGE_KEY, 'true');
    navigateToAnchor('timeline');
  }

  function continueSimulation(): void {
    simulationSubmitted = false;
    simulationSaveNotice = '';
    simulationOutsideWindowConfirmationVisible = false;
    if (!browser) return;
    window.requestAnimationFrame(() => {
      document.getElementById('simulation-entry')?.focus();
    });
  }

  function saveSimulationAsBooked(confirmOutsideWindow = false): void {
    if (!simulationState.valid || !simulationState.simulatedTrip) return;
    const savedStatus = simulationSaveStatus;
    const result = upsertTrip(trips, {
      ...simulatorForm,
      status: savedStatus
    });
    if (Object.keys(result.errors).length > 0) return;

    if (
      !confirmOutsideWindow &&
      isTripBeforeRollingWindow(simulationState.simulatedTrip, tripFormToday)
    ) {
      simulationOutsideWindowConfirmationVisible = true;
      return;
    }

    const persisted = persistTrips(result.trips);
    trackAnalyticsEvent('trip_added', {
      source: 'planner',
      trip_count_bucket: buildTripCountBucket(result.trips.length)
    });
    simulatorForm = emptySimulationForm();
    simulationSubmitted = false;
    simulationOutsideWindowConfirmationVisible = false;
    simulationSaveNotice = persisted
      ? tripOnboarding(savedStatus === 'past' ? 'savedPast' : 'savedBooked')
      : rt('importedTemporary', { count: tripCount(result.trips.length) });
  }

  function emptySimulationForm(): ProposedTripInput {
    return emptyProposedTrip();
  }

  function addTripOutsideBreak(): void {
    if (tripForm.outsideBreaks.length >= MAX_OUTSIDE_BREAKS) return;
    tripForm = { ...tripForm, outsideBreaks: [...tripForm.outsideBreaks, createOutsideBreak(tripForm.outsideBreaks.length)] };
  }

  function removeTripOutsideBreak(id: string): void {
    tripForm = { ...tripForm, outsideBreaks: tripForm.outsideBreaks.filter((outsideBreak) => outsideBreak.id !== id) };
    if (formErrors.breakFields?.[id]) {
      const breakFields = { ...formErrors.breakFields };
      delete breakFields[id];
      formErrors = { ...formErrors, breakFields };
    }
  }

  function addSimulationOutsideBreak(): void {
    if (simulatorForm.outsideBreaks.length >= MAX_OUTSIDE_BREAKS) return;
    simulatorForm = { ...simulatorForm, outsideBreaks: [...simulatorForm.outsideBreaks, createOutsideBreak(simulatorForm.outsideBreaks.length)] };
    simulationChanged();
  }

  function removeSimulationOutsideBreak(id: string): void {
    simulatorForm = { ...simulatorForm, outsideBreaks: simulatorForm.outsideBreaks.filter((outsideBreak) => outsideBreak.id !== id) };
    simulationChanged();
  }

  function countryName(code: string | undefined): string | null {
    if (!code) return null;
    return new Intl.DisplayNames([intlLocale(locale)], { type: 'region' }).of(code)
      ?? SCHENGEN_COUNTRY_OPTIONS.find((country) => country.code === code)?.name
      ?? null;
  }

  function displayRoute(trip: EditableTrip): string {
    const entry = countryName(trip.entryCountryCode);
    const exit = countryName(trip.exitCountryCode);
    if (entry && exit) return `${entry} → ${exit}`;
    if (entry) return `${deep('enteredVia')} ${entry}`;
    if (exit) return `${deep('leftVia')} ${exit}`;
    return formatLocalizedCount(locale, 1, 'trip').label;
  }

  function displayTripName(trip: EditableTrip): string {
    return trip.label || displayRoute(trip);
  }

  function tripCardPreview(trip: EditableTrip): EditableTrip {
    return quickAdjustPreviewTrip?.id === trip.id ? quickAdjustPreviewTrip : trip;
  }

  function tripCardTimelineLabel(trip: EditableTrip): string {
    return [
      tripCardUi('timelineLabel'),
      displayTripName(trip),
      formatDateRange(tripEntryDate(trip), tripExitDate(trip))
    ].join(' · ');
  }

  function tripCardToggleLabel(trip: EditableTrip, expanded: boolean): string {
    const context = [
      displayTripName(trip),
      trip.label ? displayRoute(trip) : null,
      formatDateRange(tripEntryDate(trip), tripExitDate(trip)),
      formatLocalizedCount(locale, countTripSchengenDays(trip), 'day').text,
      countTripOutsideDays(trip) > 0 ? formatLocalizedOutsideDays(locale, countTripOutsideDays(trip)) : null
    ].filter(Boolean).join(' · ');
    return formatTripCardToggleLabel(locale, context, expanded);
  }

  function trackPageView(): void {
    trackAnalyticsEvent('page_view', { source: 'app' });
  }

  function trackCalculatorStart(source: AnalyticsSource): void {
    trackAnalyticsEvent('calculator_start', {
      source,
      trip_count_bucket: buildTripCountBucket(trips.length)
    });
  }

  function trackSimulationRun(source: AnalyticsSource): void {
    trackAnalyticsEvent('simulation_run', {
      source,
      trip_count_bucket: buildTripCountBucket(trips.length),
      verdict: analyticsVerdict(),
      safe_buffer_bucket: buildSafeBufferBucket(simulationState.usage?.daysRemaining ?? 0)
    });
  }

  function recordUnlockBuyIntent(): void {
    const event = buildUnlockBuyIntentEvent(unlockPrice, 'planner');
    trackAnalyticsEvent(event.name, event.props);
    unlockIntentMessageVisible = true;
    if (!accountSignedIn) void startAccountSignUp();
  }

  function analyticsVerdict(): AnalyticsVerdict {
    if (!simulationState.valid || !simulationState.usage) return 'empty';
    if (simulationState.usage.overLimit) return 'over_limit';
    if (simulationState.usage.daysRemaining === 0) return 'at_limit';
    return simulationState.statusTone === 'close' ? 'close' : 'safe';
  }

  function formatDate(isoDate: string): string {
    return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(`${isoDate}T00:00:00.000Z`)
    );
  }

  function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
    const startLabel = new Intl.DateTimeFormat(intlLocale(locale), {
      day: 'numeric',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' }),
      timeZone: 'UTC'
    }).format(start);
    return `${startLabel}–${formatDate(endDate)}`;
  }

  function tripCount(count: number): string {
    return formatLocalizedCount(locale, count, 'trip').text;
  }

  function accountHeaderLabel(state: AccountState, signedIn: boolean): string {
    if (state === 'loading') return ui('accountLoading');
    if (state === 'unavailable') return ui('localOnly');
    if (!signedIn || state === 'guest') return ui('signIn');
    if (state === 'syncing') return ui('syncing');
    if (state === 'synced') return ui('synced');
    if (state === 'error') return ui('syncPaused');
    if (state === 'conflict' || state === 'paused') return ui('reviewSync');
    return ui('accountReady');
  }

  function formatAccountUpdatedAt(value: string | null): string {
    if (!value) return rt('notSynced');
    return new Intl.DateTimeFormat(intlLocale(locale), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>{ui('headTitle')}</title>
  <meta name="description" content={ui('headDescription')} />
</svelte:head>

<main class="app-shell">
  <a class="skip-link" href="#status" onclick={skipToAnswer}>{singlePage('skipToContent')}</a>
  <section class="workspace" aria-labelledby="app-title">
    <header class="app-header">
      <div class="brand" id="app-title">
        <SchngnLogo motto />
      </div>
      <div class="app-header-actions">
        <LanguageSelector label={t('common.language')} {locale} url={page.url} />
        <button
          class="account-chip"
          class:signed-in={accountSignedIn}
          type="button"
          disabled={accountSignOutInProgress || signupOpening}
          aria-busy={accountSignOutInProgress || signupOpening ? 'true' : undefined}
          onclick={() => accountSignedIn ? void signOutAccount() : void startAccountSignUp()}
        >
          {headerAccountLabel}
        </button>
        {#if signupError}<p class="header-auth-error" role="alert">{signupError}</p>{/if}
      </div>
    </header>

    <nav class="anchor-nav" aria-label={ui('appSections')}>
      <div class="anchor-links">
        <span>{singlePage('jumpTo')}</span>
        <a href={appAnchorUrl(page.url, 'timeline')} aria-current={currentAnchor === 'timeline' ? 'location' : undefined} onclick={(event) => { event.preventDefault(); navigateToAnchor('timeline'); }}>{singlePage('timeline')}</a>
        <a href={appAnchorUrl(page.url, 'trips')} aria-current={currentAnchor === 'trips' ? 'location' : undefined} onclick={(event) => { event.preventDefault(); navigateToAnchor('trips'); }}>{singlePage('trips')}</a>
        <a href={localizedPath('/explainer', locale)}>{singlePage('explainer')}</a>
        <a href={localizedPath('/faq', locale)}>{singlePage('faq')}</a>
        <a href={localizedPath('/contact', locale)}>{contactCopy.nav}</a>
        <a href={appAnchorUrl(page.url, 'account')} aria-current={currentAnchor === 'account' ? 'location' : undefined} onclick={(event) => { event.preventDefault(); navigateToAnchor('account'); }}>{singlePage('account')}</a>
      </div>
      <label class="anchor-select" for="app-anchor-select">
        <span>{singlePage('jumpTo')}</span>
        <select id="app-anchor-select" value={currentAnchor} onchange={selectAnchor}>
          <option value="timeline">{singlePage('timeline')}</option>
          <option value="trips">{singlePage('trips')}</option>
          <option value="explainer">{singlePage('explainer')}</option>
          <option value="faq">{singlePage('faq')}</option>
          <option value="contact">{contactCopy.nav}</option>
          <option value="account">{singlePage('account')}</option>
        </select>
      </label>
    </nav>

    {#if storageWarning}
      <aside class="storage-alert" aria-live="polite">
        <strong>{ui('storageAttention')}</strong>
        <span>{localizedStorageWarning}</span>
      </aside>
    {/if}

    <div class="single-page-content" id="main-content">
      <section class="screen answer-section" id="status" aria-labelledby="status-heading">
        {#if !hasLoadedTrips}
          <div class="loading-state" aria-live="polite">
            <span class="loading-line" aria-hidden="true"></span>
            <h1 id="status-heading" class="screen-title" tabindex="-1">{ui('loadingTrips')}</h1>
            <p>{ui('readingLocal')}</p>
          </div>
        {:else if !historyReady}
          <StatusChip tone="safe" label={tripOnboarding('step')} />
          <h1 id="status-heading" class="screen-title" tabindex="-1">{tripOnboarding('title')}</h1>
          <p class="intro-copy">{tripOnboarding('copy')}</p>
          <div class="button-row">
            <button class="secondary-button" type="button" onclick={confirmNoPreviousTrips}>{tripOnboarding('noHistory')}</button>
          </div>
        {:else}
          <StatusChip tone={dashboardStatusTone} label={dashboardState.statusLabel} />
          <h1 id="status-heading" class={`verdict ${dashboardTextClass}`} tabindex="-1">{dashboardState.heroMetric}</h1>
          <div class="facts two">
            <FactCard label={ui('latestSafeExit')} value={dashboardState.latestSafeExitLabel} />
            <FactCard label={ui('daysUsed')} value={dashboardState.daysUsedLabel} tone={dashboardState.statusTone === 'risk' ? 'ink' : 'safe'} />
          </div>
          <section class:risk-panel={dashboardState.statusTone === 'risk'} class:mint={dashboardState.statusTone !== 'risk'} class="panel" aria-labelledby="why-heading">
            <h2 id="why-heading">{dashboardState.statusTone === 'risk' ? ui('needsAttention') : ui('whyAnswer')}</h2>
            <p>{dashboardState.whyCopy}</p>
            <p class:micro-risk={dashboardState.statusTone === 'risk'} class:micro-safe={dashboardState.statusTone !== 'risk'}>{dashboardState.actionCopy}</p>
          </section>
          {#if trips.length === 0}
            <p class="history-assumption">{singlePage('historyAssumption')}</p>
          {/if}
          <div class="button-row">
            {#if dashboardState.targetTrip && !quickAdjustVisible}<button class="secondary-button what-if-action" type="button" onclick={() => openQuickAdjuster()}>{whatIfUi('adjust')}</button>{/if}
          </div>
        {/if}
      </section>

      <div class="workspace-flow">
      {#if tripEditorVisible}
      <dialog
        bind:this={tripDialog}
        class="trip-dialog"
        id="trip-editor"
        aria-labelledby="trip-heading"
        oncancel={(event) => { event.preventDefault(); cancelTripForm(); }}
      >
        <div class="section-heading">
          <p>{ui('navTrips')}</p>
          <h2 id="trip-heading" class="screen-title" tabindex="-1">{deep('addStay')}</h2>
        </div>
        <p class="intro-copy">{tripOnboarding('copy')}</p>
        <form class="trip-form" aria-label={rt('tripFormAria')} novalidate onsubmit={(event) => { event.preventDefault(); saveTrip(); }}>
          <label for="trip-label">
            <span>{deep('tripLabel')} <small>{deep('optional')}</small></span>
          </label>
          <input
            id="trip-label"
            bind:value={tripForm.label}
            maxlength={MAX_TRIP_LABEL_LENGTH}
            placeholder={deep('summerTrip')}
            aria-describedby={formErrors.label ? 'trip-label-help trip-label-error' : 'trip-label-help'}
            aria-invalid={formErrors.label ? 'true' : undefined}
          />
          <small id="trip-label-help">{rt('labelHelp', { max: MAX_TRIP_LABEL_LENGTH })}</small>
          {#if formErrors.label}<strong id="trip-label-error" class="field-error">{formErrors.label}</strong>{/if}

          <div class="date-fields">
            <div class="field-group">
              <label for="trip-entry"><span>{deep('entered')}</span></label>
              <input
                id="trip-entry"
                type="date"
                bind:value={tripForm.entryDate}
                aria-describedby={formErrors.entryDate ? 'entry-help entry-error' : 'entry-help'}
                aria-invalid={formErrors.entryDate ? 'true' : undefined}
              />
              <small id="entry-help">{deep('entryCounts')}</small>
              {#if formErrors.entryDate}<strong id="entry-error" class="field-error">{formErrors.entryDate}</strong>{/if}
            </div>
            <div class="field-group">
              <label for="trip-exit"><span>{deep('left')}</span></label>
              {#if tripForm.ongoing}
                <output id="trip-exit" class="ongoing-departure" aria-live="polite">
                  <span>{ongoingStay('leaveBy')}</span>
                  <strong>{ongoingLeaveByDate ? formatDate(ongoingLeaveByDate) : ongoingStay('calculating')}</strong>
                </output>
              {:else}
                <input
                  id="trip-exit"
                  type="date"
                  value={tripForm.exitDate}
                  oninput={updateTripExitDate}
                  aria-describedby={formErrors.exitDate ? 'exit-help exit-error' : 'exit-help'}
                  aria-invalid={formErrors.exitDate ? 'true' : undefined}
                />
                <small id="exit-help">{deep('exitCounts')}</small>
              {/if}
              {#if formErrors.exitDate}<strong id="exit-error" class="field-error">{formErrors.exitDate}</strong>{/if}
            </div>
          </div>

          <label class="consent-row ongoing-stay-control" for="trip-ongoing">
            <input id="trip-ongoing" type="checkbox" checked={tripForm.ongoing} onchange={updateOngoingStay} />
            <span><strong>{ongoingStay('label')}</strong><small>{ongoingStay('help')}</small></span>
          </label>

          <div class="date-fields optional-border-fields" class:single-field={tripForm.ongoing}>
            <div class="field-group">
              <label for="trip-entry-country"><span>{deep('enteredVia')} <small>{deep('optional')}</small></span></label>
              <select
                id="trip-entry-country"
                value={tripForm.entryCountryCode}
                onchange={updateTripEntryCountry}
                aria-describedby={formErrors.entryCountryCode ? 'trip-border-help trip-entry-country-error' : 'trip-border-help'}
                aria-invalid={formErrors.entryCountryCode ? 'true' : undefined}
              >
                <option value="">{deep('chooseUseful')}</option>
                {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{countryName(country.code)}</option>{/each}
              </select>
              {#if formErrors.entryCountryCode}<strong id="trip-entry-country-error" class="field-error">{formErrors.entryCountryCode}</strong>{/if}
            </div>
            {#if !tripForm.ongoing}
              <div class="field-group">
                <label for="trip-exit-country"><span>{deep('leftVia')} <small>{deep('optional')}</small></span></label>
                <select
                  id="trip-exit-country"
                  value={tripForm.exitCountryCode}
                  onchange={updateTripExitCountry}
                  aria-describedby={formErrors.exitCountryCode ? 'trip-border-help trip-exit-country-error' : 'trip-border-help'}
                  aria-invalid={formErrors.exitCountryCode ? 'true' : undefined}
                >
                  <option value="">{deep('chooseUseful')}</option>
                  {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{countryName(country.code)}</option>{/each}
                </select>
                {#if formErrors.exitCountryCode}<strong id="trip-exit-country-error" class="field-error">{formErrors.exitCountryCode}</strong>{/if}
              </div>
            {/if}
          </div>
          <small id="trip-border-help">{deep('borderContext')}</small>
          <SchengenCountryGuide {locale} presentation="popover" />
          {#if !tripForm.ongoing && resolvedTripFormStatus !== 'past' && !tripExitCountryExplicit && tripForm.exitCountryCode}
            <button
              class="secondary-button compact-button"
              type="button"
              onclick={confirmTripExitCountry}
            >{bilateralUi('confirmExitCountry')}</button>
          {/if}
          {#if !tripForm.ongoing && resolvedTripFormStatus !== 'past' && tripExitCountryExplicit && tripForm.exitCountryCode}
            <BilateralPassportCheck
              hostCountryCode={tripForm.exitCountryCode}
              asOf={tripForm.exitDate > tripFormToday ? tripForm.exitDate : tripFormToday}
              selectId="trip-passport-country"
              {locale}
            />
          {/if}

          <section class="outside-breaks" aria-labelledby="trip-breaks-heading">
            <div class="outside-breaks-heading">
              <div>
                <h2 id="trip-breaks-heading">{deep('outsideTime')}</h2>
                <p>{deep('outsideTripHelp')}</p>
              </div>
              {#if tripForm.outsideBreaks.length === 0}
                <button class="secondary-button compact-button" type="button" onclick={addTripOutsideBreak}>{deep('addOutside')}</button>
              {/if}
            </div>
            {#each tripForm.outsideBreaks as outsideBreak, index (outsideBreak.id)}
              <fieldset class="outside-break" aria-labelledby={`trip-break-${outsideBreak.id}-legend`}>
                <div class="outside-break-title">
                  <legend id={`trip-break-${outsideBreak.id}-legend`}>{rt('outsideBreak', { number: index + 1 })}</legend>
                  <button type="button" class="text-button delete" onclick={() => removeTripOutsideBreak(outsideBreak.id)}>{deep('removeBreak')}</button>
                </div>
                <div class="date-fields">
                  <div class="field-group">
                    <label for={`trip-break-left-${outsideBreak.id}`}><span>{deep('left')}</span></label>
                    <input id={`trip-break-left-${outsideBreak.id}`} type="date" bind:value={outsideBreak.leftDate} aria-invalid={formErrors.breakFields?.[outsideBreak.id]?.leftDate ? 'true' : undefined} />
                    {#if formErrors.breakFields?.[outsideBreak.id]?.leftDate}<strong class="field-error">{formErrors.breakFields[outsideBreak.id].leftDate}</strong>{/if}
                  </div>
                  <div class="field-group">
                    <label for={`trip-break-return-${outsideBreak.id}`}><span>{deep('reentered')}</span></label>
                    <input id={`trip-break-return-${outsideBreak.id}`} type="date" bind:value={outsideBreak.reentryDate} aria-invalid={formErrors.breakFields?.[outsideBreak.id]?.reentryDate ? 'true' : undefined} />
                    {#if formErrors.breakFields?.[outsideBreak.id]?.reentryDate}<strong class="field-error">{formErrors.breakFields[outsideBreak.id].reentryDate}</strong>{/if}
                  </div>
                </div>
              </fieldset>
            {/each}
            {#if tripForm.outsideBreaks.length > 0 && tripForm.outsideBreaks.length < MAX_OUTSIDE_BREAKS}
              <button class="secondary-button add-break-button" type="button" onclick={addTripOutsideBreak}>{rt('addAnotherBreak')}</button>
            {/if}
            {#if formErrors.outsideBreaks}<strong class="field-error">{formErrors.outsideBreaks}</strong>{/if}
          </section>

          {#if tripFormPreview}
            <section class="trip-form-summary" aria-live="polite">
              <strong><bdi>{displayRoute(tripFormPreview)}</bdi></strong>
              <span><bdi>{formatDateRange(tripEntryDate(tripFormPreview), tripExitDate(tripFormPreview))}</bdi> · <bdi>{formatLocalizedSchengenDays(locale, countTripSchengenDays(tripFormPreview))}{countTripOutsideDays(tripFormPreview) > 0 ? ` · ${formatLocalizedOutsideDays(locale, countTripOutsideDays(tripFormPreview))}` : ''}</bdi></span>
            </section>
          {/if}
          {#if outsideWindowConfirmationVisible}
            <section class="outside-window-confirmation" role="alert" aria-labelledby="outside-window-heading">
              <h2 id="outside-window-heading">{deep('outsideWindow')}</h2>
              <p>{rt('endedBefore', { date: formatDate(tripFormWindowStartDate) })}</p>
              <div class="button-row compact-actions">
                <button class="primary-button" type="button" onclick={() => saveTrip(true)}>{deep('saveAnyway')}</button>
                <button class="secondary-button" type="button" onclick={() => { outsideWindowConfirmationVisible = false; }}>{deep('keepEditing')}</button>
              </div>
            </section>
          {/if}
          {#if formErrors.tripCount}
            <strong class="field-error form-error" aria-live="polite">{formErrors.tripCount}</strong>
          {/if}
          {#if !outsideWindowConfirmationVisible}
            <div class="form-actions">
              <button class="primary-button" type="submit">{deep('saveTrip')}</button>
              <button class="secondary-button" type="button" onclick={cancelTripForm}>{deep('cancel')}</button>
            </div>
          {/if}
        </form>
      </dialog>
      {/if}

      <section class="screen timeline-section" id="timeline" aria-labelledby="timeline-heading">
        <div class="timeline-intro">
          <h2 id="timeline-heading" class="screen-title" tabindex="-1">{tripOnboarding('timelineTitle')}</h2>
          <p class="timeline-source">{singlePage('savedResult')}</p>
          <p>{tripOnboarding('timelineHelp')}</p>
        </div>
        {#if historyReady}
          <TimelineLedger
            headingId="canonical-timeline-heading"
            label={ui('rollingWindow')}
            {locale}
            mode={dashboardState.statusTone === 'risk' ? 'risk' : 'safe'}
            {trips}
            referenceDate={dashboardState.referenceDate}
            returnDates={timelineReturningForecast.rows.map((row) => row.date)}
            horizonDays={timelineReturningForecast.horizonDays}
          />
          {#if quickAdjustNotice}<p class="micro-safe" aria-live="polite">{quickAdjustNotice}</p>{/if}
        {/if}
      </section>

      <section class="screen trips-section" id="trips" aria-labelledby="trips-heading">
        <div class="section-heading">
          <div>
            <h2 id="trips-heading" class="screen-title" tabindex="-1">{tripOnboarding('nav')}</h2>
          </div>
        </div>
        {#if trips.length === 0}
          <section class="empty-state" aria-labelledby="empty-trips-heading">
            <h2 id="empty-trips-heading">{singlePage('noPreviousTrips')}</h2>
            <p>{tripOnboarding('copy')}</p>
            <button class="secondary-button" type="button" onclick={confirmNoPreviousTrips}>{tripOnboarding('noHistory')}</button>
          </section>
        {:else}
          <p class="list-summary">
            {tripCount(trips.length)}
          </p>
          <div class="trip-list">
            {#each visibleTrips as trip (trip.id)}
              <article
                id={`trip-row-${trip.id}`}
                class:expanded={quickAdjustVisible && quickAdjustSourceId === trip.id}
                style={`--trip-color:${tripColors[trip.id] ?? '#1f6fa9'}`}
              >
                <button
                  id={`trip-trigger-${trip.id}`}
                  class="trip-summary-trigger"
                  type="button"
                  aria-label={tripCardToggleLabel(tripCardPreview(trip), quickAdjustVisible && quickAdjustSourceId === trip.id)}
                  aria-expanded={quickAdjustVisible && quickAdjustSourceId === trip.id}
                  aria-controls={quickAdjustVisible && quickAdjustSourceId === trip.id ? 'quick-adjust-panel' : undefined}
                  onclick={() => toggleQuickAdjuster(trip)}
                >
                  <span class="trip-card-heading">
                    <span class="trip-color-dot" aria-hidden="true"></span>
                    <span class="trip-copy">
                      <strong><bdi>{displayTripName(tripCardPreview(trip))}</bdi></strong>
                      <span class="trip-day-count"><bdi>{formatLocalizedCount(locale, countTripSchengenDays(tripCardPreview(trip)), 'day').text}</bdi></span>
                      {#if tripCardPreview(trip).label}<span class="trip-route"><bdi>{displayRoute(tripCardPreview(trip))}</bdi></span>{/if}
                      <span class="trip-dates">
                        {#if tripCardPreview(trip).ongoing}
                          <bdi>{formatDate(tripEntryDate(tripCardPreview(trip)))} – {ongoingStay('ongoing')}</bdi>
                        {:else}
                          <bdi>{formatDateRange(tripEntryDate(tripCardPreview(trip)), tripExitDate(tripCardPreview(trip)))}</bdi>
                        {/if}
                        {#if countTripOutsideDays(tripCardPreview(trip)) > 0}<span aria-hidden="true"> · </span><bdi>{formatLocalizedOutsideDays(locale, countTripOutsideDays(tripCardPreview(trip)))}</bdi>{/if}
                      </span>
                    </span>
                    {#if tripCardPreview(trip).ongoing || tripCardStates[trip.id]?.completed || (tripCardStates[trip.id]?.overBy ?? 0) > 0}
                      <span
                        class="trip-card-status"
                        class:completed={tripCardStates[trip.id]?.completed}
                        class:over-limit={(tripCardStates[trip.id]?.overBy ?? 0) > 0}
                      >{tripCardPreview(trip).ongoing && (tripCardStates[trip.id]?.overBy ?? 0) === 0 ? ongoingStay('ongoing') : formatTripCardOverage(locale, tripCardStates[trip.id]?.overBy ?? 0, tripCardStates[trip.id]?.completed ?? false)}</span>
                    {/if}
                  </span>
                  <TripMiniTimeline
                    trip={tripCardPreview(trip)}
                    color={tripColors[trip.id] ?? '#1f6fa9'}
                    {locale}
                    referenceDate={dashboardState.referenceDate}
                    label={tripCardTimelineLabel(tripCardPreview(trip))}
                  />
                </button>
                <div class="trip-card-actions">
                  <button
                    class="trip-expand-action"
                    type="button"
                    aria-label={tripCardToggleLabel(tripCardPreview(trip), quickAdjustVisible && quickAdjustSourceId === trip.id)}
                    aria-expanded={quickAdjustVisible && quickAdjustSourceId === trip.id}
                    aria-controls={quickAdjustVisible && quickAdjustSourceId === trip.id ? 'quick-adjust-panel' : undefined}
                    onclick={() => toggleQuickAdjuster(trip)}
                  >
                    {quickAdjustVisible && quickAdjustSourceId === trip.id ? tripCardUi('collapseAction') : tripCardUi('expandAction')}
                    <span aria-hidden="true">{quickAdjustVisible && quickAdjustSourceId === trip.id ? '▴' : '▾'}</span>
                  </button>
                  <button
                    class="trip-delete-action"
                    type="button"
                    aria-label={`${deep('delete')} ${displayTripName(trip)}`}
                    onclick={() => requestDeleteTrip(trip.id)}
                  >{deep('delete')}</button>
                </div>
                {#if quickAdjustVisible && quickAdjustSourceId === trip.id && quickAdjustRange && quickAdjustSourceTrip}
                  <TripAdjustPanel
                    panelId="quick-adjust-panel"
                    headingId="quick-adjust-heading"
                    accentColor={tripColors[trip.id] ?? '#1f6fa9'}
                    blockingMessage={quickAdjustError}
                    entryDate={quickAdjustForm.entryDate}
                    entryMax={quickAdjustBounds.entryMax}
                    exitDate={quickAdjustForm.exitDate}
                    exitMin={quickAdjustBounds.exitMin}
                    hasChanges={quickAdjustHasChanges}
                    form={quickAdjustForm}
                    locale={locale}
                    range={quickAdjustRange}
                    state={quickAdjustState}
                    sourceName={displayTripName(tripCardPreview(quickAdjustSourceTrip))}
                    onDatesChange={adjustQuickTrip}
                    onFormChange={updateQuickTripForm}
                    onSave={saveQuickAdjustment}
                    onClose={closeQuickAdjuster}
                  />
                {/if}
                {#if pendingDeleteTrip?.id === trip.id}
                  <section class="confirm-panel" aria-live="polite" aria-labelledby={`delete-${trip.id}-heading`}>
                    <div>
                      <h2 id={`delete-${trip.id}-heading`}>{rt('deleteNamed', { name: displayTripName(trip) })}</h2>
                      <p>{rt('removeRecalculate')}</p>
                    </div>
                    <div class="button-row">
                      <button class="danger-button" type="button" onclick={deletePendingTrip}>{deep('deleteTrip')}</button>
                      <button class="secondary-button" type="button" onclick={() => (pendingDeleteTripId = null)}>{deep('keepTrip')}</button>
                    </div>
                  </section>
                {/if}
              </article>
            {/each}
          </div>
          {#if olderTrips.length > 0}
            <button class="secondary-button older-trips-toggle" type="button" aria-expanded={olderTripsVisible} onclick={toggleOlderTrips}>
              {olderTripsVisible ? singlePage('hideOlder') : singlePage('showOlder')}
            </button>
          {/if}
          {#if trips.length >= MAX_TRIP_COUNT}
            <p class="storage-warning">{rt('limitReached', { max: MAX_TRIP_COUNT })}</p>
          {/if}
        {/if}
        <div class="add-trip-footer">
          <button id="add-trip-button" class="primary-button" type="button" aria-haspopup="dialog" aria-controls="trip-editor" onclick={startAddTrip} disabled={trips.length >= MAX_TRIP_COUNT}>{tripOnboarding('addNew')}</button>
        </div>
      </section>

      {#if SECOND_PLANNER_ENABLED}
      <section class="screen plan-section combined-planner" id="plan" aria-labelledby="plan-heading">
        <div class="section-heading">
          <p>{deep('unsavedWhatIf')}</p>
          <h2 id="plan-heading" class="screen-title" tabindex="-1">{tripOnboarding('plannerTitle')}</h2>
        </div>
        <p class="intro-copy">{deep('plannerIntro')}</p>
        {#if historyReady}
        <form class="trip-form" aria-label={rt('futureSimulatorAria')} novalidate onsubmit={(event) => { event.preventDefault(); runSimulation(); }}>
          <label for="simulation-label"><span>{deep('simulationLabel')} <small>{deep('optional')}</small></span></label>
          <input
            id="simulation-label"
            bind:value={simulatorForm.label}
            maxlength={MAX_TRIP_LABEL_LENGTH}
            placeholder={deep('springPortugal')}
            oninput={simulationChanged}
            aria-describedby={simulationSubmitted && simulationState.errors.label ? 'simulation-label-error' : undefined}
            aria-invalid={simulationSubmitted && simulationState.errors.label ? 'true' : undefined}
          />
          {#if simulationSubmitted && simulationState.errors.label}
            <strong id="simulation-label-error" class="field-error">{simulationState.errors.label}</strong>
          {/if}

          <div class="date-fields">
            <div class="field-group">
              <label for="simulation-entry"><span>{deep('entered')}</span></label>
              <input
                id="simulation-entry"
                type="date"
                bind:value={simulatorForm.entryDate}
                oninput={simulationChanged}
                aria-describedby={simulationSubmitted && simulationState.errors.entryDate ? 'simulation-entry-error' : undefined}
                aria-invalid={simulationSubmitted && simulationState.errors.entryDate ? 'true' : undefined}
              />
              {#if simulationSubmitted && simulationState.errors.entryDate}
                <strong id="simulation-entry-error" class="field-error">{simulationState.errors.entryDate}</strong>
              {/if}
            </div>
            <div class="field-group">
              <label for="simulation-exit"><span>{deep('left')}</span></label>
              <input
                id="simulation-exit"
                type="date"
                bind:value={simulatorForm.exitDate}
                oninput={simulationChanged}
                aria-describedby={simulationSubmitted && simulationState.errors.exitDate ? 'simulation-exit-error' : undefined}
                aria-invalid={simulationSubmitted && simulationState.errors.exitDate ? 'true' : undefined}
              />
              {#if simulationSubmitted && simulationState.errors.exitDate}
                <strong id="simulation-exit-error" class="field-error">{simulationState.errors.exitDate}</strong>
              {/if}
            </div>
          </div>

          <div class="date-fields optional-border-fields">
            <div class="field-group">
              <label for="simulation-entry-country"><span>{deep('enteredVia')} <small>{deep('optional')}</small></span></label>
              <select id="simulation-entry-country" bind:value={simulatorForm.entryCountryCode} oninput={simulationChanged} aria-invalid={simulationSubmitted && simulationState.errors.entryCountryCode ? 'true' : undefined}>
                <option value="">{deep('chooseUseful')}</option>
                {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{countryName(country.code)}</option>{/each}
              </select>
              {#if simulationSubmitted && simulationState.errors.entryCountryCode}<strong class="field-error">{simulationState.errors.entryCountryCode}</strong>{/if}
            </div>
            <div class="field-group">
              <label for="simulation-exit-country"><span>{deep('leftVia')} <small>{deep('optional')}</small></span></label>
              <select id="simulation-exit-country" bind:value={simulatorForm.exitCountryCode} oninput={simulationChanged} aria-invalid={simulationSubmitted && simulationState.errors.exitCountryCode ? 'true' : undefined}>
                <option value="">{deep('chooseUseful')}</option>
                {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{countryName(country.code)}</option>{/each}
              </select>
              {#if simulationSubmitted && simulationState.errors.exitCountryCode}<strong class="field-error">{simulationState.errors.exitCountryCode}</strong>{/if}
            </div>
          </div>
          <small>{deep('borderContext')}</small>
          <SchengenCountryGuide {locale} presentation="popover" />

          <section class="outside-breaks" aria-labelledby="simulation-breaks-heading">
            <div class="outside-breaks-heading">
              <div>
                <h2 id="simulation-breaks-heading">{deep('outsideTime')}</h2>
                <p>{deep('outsidePlanHelp')}</p>
              </div>
              {#if simulatorForm.outsideBreaks.length === 0}
                <button class="secondary-button compact-button" type="button" onclick={addSimulationOutsideBreak}>{deep('addOutside')}</button>
              {/if}
            </div>
            {#each simulatorForm.outsideBreaks as outsideBreak, index (outsideBreak.id)}
              <fieldset class="outside-break">
                <div class="outside-break-title">
                  <legend>{rt('outsideBreak', { number: index + 1 })}</legend>
                  <button type="button" class="text-button delete" onclick={() => removeSimulationOutsideBreak(outsideBreak.id)}>{deep('removeBreak')}</button>
                </div>
                <div class="date-fields">
                  <div class="field-group">
                    <label for={`simulation-break-left-${outsideBreak.id}`}><span>{deep('left')}</span></label>
                    <input id={`simulation-break-left-${outsideBreak.id}`} type="date" bind:value={outsideBreak.leftDate} oninput={simulationChanged} aria-invalid={simulationSubmitted && simulationState.errors.breakFields?.[outsideBreak.id]?.leftDate ? 'true' : undefined} />
                    {#if simulationSubmitted && simulationState.errors.breakFields?.[outsideBreak.id]?.leftDate}<strong class="field-error">{simulationState.errors.breakFields[outsideBreak.id].leftDate}</strong>{/if}
                  </div>
                  <div class="field-group">
                    <label for={`simulation-break-return-${outsideBreak.id}`}><span>{deep('reentered')}</span></label>
                    <input id={`simulation-break-return-${outsideBreak.id}`} type="date" bind:value={outsideBreak.reentryDate} oninput={simulationChanged} aria-invalid={simulationSubmitted && simulationState.errors.breakFields?.[outsideBreak.id]?.reentryDate ? 'true' : undefined} />
                    {#if simulationSubmitted && simulationState.errors.breakFields?.[outsideBreak.id]?.reentryDate}<strong class="field-error">{simulationState.errors.breakFields[outsideBreak.id].reentryDate}</strong>{/if}
                  </div>
                </div>
              </fieldset>
            {/each}
            {#if simulatorForm.outsideBreaks.length > 0 && simulatorForm.outsideBreaks.length < MAX_OUTSIDE_BREAKS}
              <button class="secondary-button add-break-button" type="button" onclick={addSimulationOutsideBreak}>{rt('addAnotherBreak')}</button>
            {/if}
          </section>
          <div class="form-actions">
            <button class="primary-button" type="submit">{deep('checkPlan')}</button>
            <button class="secondary-button" type="button" onclick={clearSimulation}>{deep('clear')}</button>
          </div>
        </form>

        {#if simulationSaveNotice}
          <section class="panel mint" aria-live="polite">
            <p class="micro-safe">{simulationSaveNotice}</p>
          </section>
        {/if}

        {#if simulationSubmitted && simulationState.valid && simulationState.usage}
          <section class="simulation-result" aria-live="polite" aria-labelledby="simulation-result-heading">
            <StatusChip tone={simulatorStatusTone} label={simulationState.statusLabel} />
            <h2 id="simulation-result-heading" class={`result-heading ${simulationState.statusTone === 'risk' ? 'risk-text' : 'safe-text'}`}>
              {simulationState.latestSafeExitLabel}
            </h2>
            <div class="facts two">
              <FactCard label={deep('simulatedUsed')} value={simulationState.daysUsedLabel} tone={simulationState.statusTone === 'risk' ? 'ink' : 'safe'} />
              <FactCard label={deep('maxAdditional')} value={simulationState.maxStayLabel} />
            </div>
            <section class:mint={simulationState.statusTone !== 'risk'} class:risk-panel={simulationState.statusTone === 'risk'} class="panel">
              <p>{simulationState.summaryCopy}</p>
              <p class:micro-risk={simulationState.statusTone === 'risk'} class:micro-safe={simulationState.statusTone !== 'risk'}>{simulationState.firstFixCopy}</p>
            </section>
            <TimelineLedger
              headingId="planner-preview-timeline-heading"
              label={deep('whatIfWindow')}
              {locale}
              mode={simulationState.statusTone === 'risk' ? 'risk' : 'planner'}
              trips={simulationBaseTrips}
              simulation={simulationState.simulatedTrip}
              referenceDate={simulationState.usage.referenceDate}
            />
            {#if simulationOutsideWindowConfirmationVisible}
              <section class="outside-window-confirmation" role="alert" aria-labelledby="simulation-outside-window-heading">
                <h2 id="simulation-outside-window-heading">{deep('outsideWindow')}</h2>
                <p>{rt('endedBefore', { date: formatDate(tripFormWindowStartDate) })}</p>
                <div class="button-row compact-actions">
                  <button class="primary-button" type="button" onclick={() => saveSimulationAsBooked(true)}>{deep('saveAnyway')}</button>
                  <button class="secondary-button" type="button" onclick={() => { simulationOutsideWindowConfirmationVisible = false; }}>{deep('keepEditing')}</button>
                </div>
              </section>
            {:else}
              <div class="simulation-save-actions">
                <button
                  class:primary-button={simulationState.statusTone === 'safe'}
                  class:secondary-button={simulationState.statusTone !== 'safe'}
                  type="button"
                  onclick={() => saveSimulationAsBooked()}
                  disabled={trips.length >= MAX_TRIP_COUNT}
                >{tripOnboarding(simulationSaveStatus === 'past' ? 'savePast' : 'saveBooked')}</button>
                <button class="secondary-button" type="button" onclick={continueSimulation}>{tripOnboarding('keepExperimenting')}</button>
              </div>
              {#if trips.length >= MAX_TRIP_COUNT}
                <p class="storage-warning">{rt('limitReached', { max: MAX_TRIP_COUNT })}</p>
              {/if}
            {/if}
          </section>
        {:else if simulationSubmitted}
          <section class="panel risk-panel" aria-live="polite">
            <h2>{deep('validDates')}</h2>
            <p>{deep('fixFields')}</p>
          </section>
        {/if}

        <section class="panel whatif-panel">
          <h2>{rt('needPlanningPower')}</h2>
          <p>{unlockFakeDoorState.helperCopy}</p>
          <button
            class="secondary-button"
            type="button"
            disabled={!accountSignedIn && signupOpening}
            onclick={() => accountSignedIn ? recordUnlockBuyIntent() : void startAccountSignUp()}
          >{accountSignedIn ? unlockFakeDoorState.buttonLabel : signupValue('compactButton')}</button>
        </section>
        {#if unlockFakeDoorState.showIntentMessage}
          <section class="panel mint" aria-live="polite">
            <h2>{rt('unlockNoted')}</h2>
            <p>{unlockFakeDoorState.messageCopy}</p>
            <p class="micro-safe">{rt('noPaymentPlanner')}</p>
          </section>
        {/if}
        {:else}
          <section class="history-gate panel" aria-labelledby="plan-history-gate-heading">
            <h2 id="plan-history-gate-heading">{tripOnboarding('title')}</h2>
            <p>{tripOnboarding('copy')}</p>
            <button class="secondary-button" type="button" onclick={confirmNoPreviousTrips}>{singlePage('noPreviousTrips')}</button>
          </section>
        {/if}
      </section>
      {/if}

      {#if !accountSignedIn}
        <section class="signup-value-section" aria-labelledby="signup-value-heading">
          <div>
            <h2 id="signup-value-heading">{signupValue('title')}</h2>
            <p>{signupValue('copy')}</p>
          </div>
          <button class="primary-button" type="button" disabled={signupOpening} aria-busy={signupOpening ? 'true' : undefined} onclick={startAccountSignUp}>{signupValue('button')}</button>
        </section>
      {/if}

      <section class="screen account-section" id="account" aria-labelledby="account-section-heading">
        <details class="section-disclosure" bind:open={accountDetailsOpen}>
          <summary class="disclosure-summary">
            <div class="section-heading">
              <p>{singlePage('accountSummary')}</p>
              <h2 id="account-section-heading" class="screen-title" tabindex="-1">{deep('accountTitle')}</h2>
            </div>
          </summary>
          <div class="disclosure-body">
        <section
          class:mint={accountState === 'synced'}
          class:whatif-panel={accountState === 'offer_sync' || accountState === 'conflict' || accountState === 'paused'}
          class:risk-panel={accountState === 'error'}
          class="panel account-panel"
          aria-labelledby="account-heading"
          aria-busy={accountState === 'loading' || accountState === 'syncing'}
        >
          {#if accountState === 'loading'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">{ui('navAccount')}</p>
                <h2 id="account-heading">{rt('checkingSignIn')}</h2>
              </div>
              <span class="account-state-badge neutral">{deep('loading')}</span>
            </div>
            <p>{rt('accountLoadingCopy')}</p>
          {:else if accountState === 'unavailable'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">{ui('navAccount')}</p>
                <h2 id="account-heading">{deep('localMode')}</h2>
              </div>
              <span class="account-state-badge neutral">{deep('localOnly')}</span>
            </div>
            <p>{rt('signInUnavailable')}</p>
          {:else if accountState === 'guest'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">{ui('navAccount')}</p>
                <h2 id="account-heading">{rt('guestTitle')}</h2>
              </div>
              <span class="account-state-badge neutral">{deep('localOnly')}</span>
            </div>
            <p>{rt('guestCopy')}</p>
            <div class="button-row account-actions">
              <button class="primary-button" type="button" disabled={signupOpening} aria-busy={signupOpening ? 'true' : undefined} onclick={startAccountSignUp}>{signupValue('compactButton')}</button>
              <button class="secondary-button" type="button" onclick={startAccountSignIn}>{deep('signIn')}</button>
            </div>
          {:else if accountState === 'offer_sync'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">{accountEmail ? rt('signedInAs', { email: accountEmail }) : rt('signedIn')}</p>
                <h2 id="account-heading">{rt('chooseSync')}</h2>
              </div>
              <span class="account-state-badge neutral">{rt('notSyncing')}</span>
            </div>
            <p>{rt('chooseSyncCopy')}</p>
            <label class="consent-row account-consent" for="account-sync-consent">
              <input id="account-sync-consent" bind:checked={accountConsent} type="checkbox" />
              <span><strong>{rt('consentSync')}</strong> {rt('consentDetails', { count: tripCount(trips.length) })}</span>
            </label>
            <button
              class="primary-button"
              type="button"
              disabled={!accountConsent}
              onclick={enableAccountSync}
            >{rt('syncCount', { count: tripCount(trips.length) })}</button>
          {:else if accountState === 'synced' || accountState === 'syncing'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">{accountEmail ? rt('signedInAs', { email: accountEmail }) : rt('signedIn')}</p>
                <h2 id="account-heading">{rt('savedRepeat')}</h2>
              </div>
              <span class="account-state-badge safe">{accountState === 'syncing' ? ui('syncing') : ui('synced')}</span>
            </div>
            <p>{rt('syncedCopy')}</p>
            <dl class="account-facts">
              <div><dt>{rt('accountCopy')}</dt><dd>{tripCount(accountSnapshot.trips.length)}</dd></div>
              <div><dt>{rt('lastSaved')}</dt><dd>{formatAccountUpdatedAt(accountSnapshot.updatedAt)}</dd></div>
            </dl>
          {:else if accountState === 'conflict' || accountState === 'paused'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">{accountEmail ? rt('signedInAs', { email: accountEmail }) : rt('signedIn')}</p>
                <h2 id="account-heading">{rt('chooseCopy')}</h2>
              </div>
              <span class="account-state-badge attention">{rt('reviewNeeded')}</span>
            </div>
            <p>{rt('conflictCopy', { account: tripCount(accountSnapshot.trips.length), local: tripCount(trips.length) })}</p>
            {#if accountSnapshot.revision === 0}
              <label class="consent-row account-consent" for="account-conflict-sync-consent">
                <input id="account-conflict-sync-consent" bind:checked={accountConsent} type="checkbox" />
                <span><strong>{rt('consentSync')}</strong> {rt('consentDetails', { count: tripCount(trips.length) })}</span>
              </label>
            {/if}
            <div class="account-choice-grid">
              <button class="secondary-button account-choice" type="button" onclick={useAccountTrips}>
                <strong>{rt('useAccount')}</strong>
                <span>{rt('useAccountCopy')}</span>
              </button>
              <button class="secondary-button account-choice" type="button" disabled={accountSnapshot.revision === 0 && !accountConsent} onclick={replaceAccountTrips}>
                <strong>{rt('replaceAccount')}</strong>
                <span>{rt('replaceAccountCopy')}</span>
              </button>
            </div>
          {:else}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">{accountEmail ? rt('signedInAs', { email: accountEmail }) : rt('signedIn')}</p>
                <h2 id="account-heading">{rt('syncAttention')}</h2>
              </div>
              <span class="account-state-badge attention">{ui('syncPaused')}</span>
            </div>
            <p>{rt('retryCopy')}</p>
            <button class="primary-button" type="button" onclick={retryAccountSync}>{deep('retrySync')}</button>
          {/if}

          <div class="account-messages" aria-live="polite" aria-atomic="true">
            {#if accountError}<p class="storage-warning">{accountError}</p>{/if}
            {#if accountNotice}<p class="micro-safe">{accountNotice}</p>{/if}
          </div>

          {#if accountSignedIn}
            <div class="button-row account-actions">
              <button class="secondary-button" type="button" disabled={accountState === 'syncing'} onclick={manageClerkAccount}>{deep('manageAccount')}</button>
              <button class="secondary-button" type="button" disabled={accountState === 'syncing'} onclick={signOutAccount}>{deep('signOut')}</button>
              <button class="danger-outline" type="button" disabled={accountState === 'syncing'} onclick={() => (signOutClearConfirmationVisible = true)}>{rt('signOutClear')}</button>
              {#if accountSnapshot.revision > 0}
                <button class="danger-outline" type="button" disabled={accountState === 'syncing'} onclick={() => (accountDeleteConfirmationVisible = true)}>{rt('deleteSaved')}</button>
              {/if}
            </div>
          {/if}

          {#if signOutClearConfirmationVisible && accountSignedIn}
            <section class="confirm-panel account-delete-confirm" aria-live="polite" aria-labelledby="sign-out-clear-heading">
              <div>
                <h2 id="sign-out-clear-heading">{rt('signOutClearTitle')}</h2>
                <p>{rt('signOutClearCopy', { count: tripCount(trips.length) })}</p>
              </div>
              <div class="button-row">
                <button class="danger-button" type="button" onclick={signOutAndClearAccount}>{rt('signOutClearAction')}</button>
                <button class="secondary-button" type="button" onclick={() => (signOutClearConfirmationVisible = false)}>{rt('keepSignedIn')}</button>
              </div>
            </section>
          {/if}

          {#if accountDeleteConfirmationVisible && accountSignedIn && accountSnapshot.revision > 0}
            <section class="confirm-panel account-delete-confirm" aria-live="polite" aria-labelledby="delete-account-trips-heading">
              <div>
                <h2 id="delete-account-trips-heading">{rt('deleteAccountTitle')}</h2>
                <p>{rt('deleteAccountCopy', { count: tripCount(trips.length) })}</p>
              </div>
              <div class="button-row">
                <button class="danger-button" type="button" onclick={removeCloudAccountData}>{rt('deleteAccountAction')}</button>
                <button class="secondary-button" type="button" onclick={() => (accountDeleteConfirmationVisible = false)}>{rt('keepAccount')}</button>
              </div>
            </section>
          {/if}

          {#if accountSignedIn}
            <p class="account-footnote">{rt('accountFootnote')}</p>
          {/if}
        </section>

        <section class="panel paper-panel" aria-labelledby="browser-data-heading">
          <div class="account-heading-row">
            <div>
              <p class="eyebrow">{rt('thisDevice')}</p>
              <h2 id="browser-data-heading">{rt('browserData')}</h2>
            </div>
            <span class="account-state-badge safe">{deep('availableOffline')}</span>
          </div>
          <p>{accountState === 'synced' || accountState === 'syncing' ? rt('localSyncedCopy') : rt('localOnlyCopy')}</p>
          <p>{rt('exportBeforeClear')}</p>
          {#if importError}
            <p class="storage-warning">{importError}</p>
          {:else if importMessage}
            <p class="micro-safe">{importMessage}</p>
          {:else if storageSource === 'storage'}
            <p class="micro-safe">{rt('loadedLocal')}</p>
          {:else}
            <p class="micro-safe">{rt('noLocal')}</p>
          {/if}
        </section>
        <div class="button-row">
          <button class="secondary-button" type="button" onclick={exportTrips} disabled={trips.length === 0}>{deep('exportJson')}</button>
          <button class="secondary-button" type="button" onclick={() => importInput.click()} aria-controls="trip-import-file">{deep('importJson')}</button>
          <input bind:this={importInput} id="trip-import-file" class="visually-hidden" aria-label={rt('importAria')} type="file" accept="application/json,.json" onchange={importTrips} />
          <button class="danger-outline" type="button" onclick={requestClearLocalTrips} disabled={trips.length === 0 || pendingAccountWrites > 0 || accountState === 'loading' || accountState === 'syncing' || accountDeleteInProgress}>{deep('clearLocal')}</button>
        </div>
        {#if clearConfirmationVisible}
          <section class="confirm-panel" aria-live="polite" aria-labelledby="clear-heading">
            <div>
              <h2 id="clear-heading">{rt('clearTitle')}</h2>
              <p>{accountSignedIn && accountSnapshot.revision > 0 ? rt('clearCopyAccount', { count: tripCount(trips.length) }) : rt('clearCopyLocal', { count: tripCount(trips.length) })}</p>
            </div>
            <div class="button-row">
              <button class="danger-button" type="button" onclick={clearLocalTrips}>{rt('clearBrowser')}</button>
              <button class="secondary-button" type="button" onclick={() => (clearConfirmationVisible = false)}>{rt('keepTrips')}</button>
            </div>
          </section>
        {/if}
          </div>
        </details>
      </section>
      </div>
    </div>

    <aside class="legal-footer" aria-label={rt('disclaimerAria')}><p>{legal.footer}</p></aside>
  </section>
</main>

<style>
  .app-shell {
    min-height: 100svh;
    padding: 18px;
  }

  .workspace {
    width: min(100%, 1180px);
    margin: 0 auto;
    border: 1px solid var(--control-line);
    border-radius: 14px;
    background: var(--surface);
  }

  .app-header,
  .brand,
  .anchor-links,
  .facts,
  .button-row,
  .form-actions {
    display: flex;
    align-items: center;
  }

  .app-header {
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--line);
  }

  .app-header-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 10px;
    min-width: 0;
  }

  .header-auth-error {
    flex-basis: 100%;
    max-width: 38ch;
    margin: 0;
    color: var(--risk);
    font-size: 0.78rem;
    font-weight: 650;
    line-height: 1.35;
    text-align: end;
  }

  .brand {
    min-width: 0;
  }

  .account-chip {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--ink);
    border-radius: 8px;
    background: var(--ink);
    color: var(--surface);
    padding: 8px 14px;
    font-size: 0.84rem;
    font-weight: 760;
  }

  .account-chip.signed-in { background: var(--surface); color: var(--ink); }
  .account-chip:hover:not(:disabled) { filter: brightness(1.08); }
  .account-chip:focus-visible { outline: 3px solid var(--safe); outline-offset: 2px; }
  .account-chip:disabled { cursor: progress; opacity: 0.62; }

  .account-chip.synced {
    border-color: color-mix(in srgb, var(--safe), var(--line) 35%);
    background: var(--safe-bg);
    color: var(--safe);
  }

  .account-chip.attention {
    border-color: color-mix(in srgb, var(--whatif), var(--line) 20%);
    background: var(--whatif-bg);
    color: var(--whatif);
  }

  .skip-link {
    position: fixed;
    z-index: 100;
    inset-block-start: 8px;
    inset-inline-start: 8px;
    translate: 0 -160%;
    border: 2px solid var(--ink);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    padding: 10px 14px;
    font-weight: 760;
  }

  .skip-link:focus { translate: 0; }

  .anchor-nav {
    position: sticky;
    z-index: 20;
    top: 0;
    border-bottom: 1px solid var(--line);
    background: color-mix(in srgb, var(--surface), transparent 3%);
  }

  .anchor-links {
    gap: 4px;
    overflow-x: auto;
    padding: 8px 14px;
    scrollbar-width: thin;
  }

  .anchor-links > span {
    flex: 0 0 auto;
    color: var(--muted);
    padding-inline: 6px;
    font-size: 0.78rem;
    font-weight: 760;
    text-transform: uppercase;
  }

  .anchor-links a {
    display: inline-flex;
    min-height: 40px;
    flex: 0 0 auto;
    align-items: center;
    border: 1px solid transparent;
    border-radius: 8px;
    color: var(--muted);
    padding: 8px 10px;
    font-size: 0.9rem;
    font-weight: 720;
    text-decoration: none;
  }

  .anchor-links a:hover { background: var(--paper); color: var(--ink); }

  .anchor-links a[aria-current='location'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--surface);
  }

  .anchor-select { display: none; }

  .single-page-content {
    display: grid;
    grid-template-columns: minmax(290px, 0.72fr) minmax(0, 1.35fr);
    align-items: start;
  }

  .screen {
    display: grid;
    width: 100%;
    min-width: 0;
    align-content: start;
    gap: 20px;
    padding: 28px 24px 36px;
    border-bottom: 1px solid var(--line);
    scroll-margin-top: 72px;
  }

  .answer-section {
    position: sticky;
    top: 72px;
    grid-column: 1;
    grid-row: 1;
    border-inline-end: 1px solid var(--line);
    background: var(--surface);
  }

  .workspace-flow {
    min-width: 0;
    grid-column: 2;
    grid-row: 1;
  }

  .trip-dialog {
    width: min(calc(100% - 32px), 760px);
    max-width: none;
    max-height: min(90dvh, 900px);
    margin: auto;
    overflow-y: auto;
    border: 1px solid var(--control-line);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    padding: clamp(18px, 3vw, 28px);
  }

  .trip-dialog::backdrop {
    background: rgb(10 32 27 / 56%);
  }

  .trip-dialog > .intro-copy {
    margin-top: 10px;
  }

  .timeline-section { gap: 14px; }

  .timeline-intro {
    display: grid;
    gap: 4px;
  }

  .timeline-intro > p {
    max-width: 70ch;
    margin: 0;
    color: var(--muted);
    line-height: 1.45;
  }

  .timeline-intro > .timeline-source {
    color: var(--safe);
    font-size: 0.82rem;
    font-weight: 760;
  }

  .timeline-intro h2 {
    margin: 0;
    color: var(--ink);
    text-wrap: balance;
  }

  .plan-section { border-top: 2px solid var(--whatif); }

  .narrow-screen {
    width: min(100%, 600px);
  }

  .storage-alert,
  .legal-footer {
    width: min(calc(100% - 32px), 1120px);
    margin: 16px auto 0;
    border-radius: 10px;
    padding: 14px;
  }

  .storage-alert {
    display: grid;
    gap: 4px;
    border: 1px solid var(--risk);
    background: var(--risk-bg);
    color: var(--risk);
  }

  .storage-alert span {
    color: var(--ink);
    line-height: 1.45;
  }

  .legal-footer {
    margin-bottom: 18px;
    border: 1px solid var(--line);
    background: var(--paper);
  }

  .legal-footer p,
  .section-heading p {
    margin: 0;
  }

  .legal-footer p {
    max-width: 72ch;
    margin: 6px 0 0;
    color: var(--muted);
    line-height: 1.45;
    text-wrap: pretty;
  }

  .compact {
    min-height: 44px;
    flex: 0 0 auto;
    padding: 8px 12px;
  }

  .section-heading {
    display: grid;
    gap: 5px;
    min-width: 0;
  }

  .section-heading > p {
    color: var(--muted);
    font-size: 0.9rem;
    font-weight: 700;
  }

  .section-heading.with-action {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .section-disclosure {
    min-width: 0;
  }

  .disclosure-summary {
    display: flex;
    min-height: 64px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    cursor: pointer;
    list-style: none;
  }

  .disclosure-summary::-webkit-details-marker { display: none; }

  .disclosure-summary::after {
    content: '+';
    display: grid;
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font-size: 1.35rem;
    font-weight: 620;
  }

  .section-disclosure[open] > .disclosure-summary::after { content: '−'; }

  .disclosure-body {
    display: grid;
    gap: 20px;
    padding-top: 20px;
  }

  .history-assumption {
    margin: -8px 0 0;
    border-radius: 6px;
    background: var(--safe-bg);
    color: var(--muted);
    padding: 8px 10px;
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .screen-title,
  .verdict,
  .result-heading {
    max-width: 100%;
    margin: 0;
    color: var(--ink);
    letter-spacing: -0.025em;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }

  .screen-title {
    font-size: 2.35rem;
    line-height: 1.08;
  }

  .verdict {
    font-size: 3.35rem;
    line-height: 1;
  }

  .result-heading {
    font-size: 2rem;
    line-height: 1.08;
  }

  .intro-copy,
  .list-summary {
    max-width: 70ch;
    margin: 0;
    color: var(--muted);
    line-height: 1.55;
    text-wrap: pretty;
  }

  .safe-text { color: var(--safe); }
  .risk-text { color: var(--risk); }
  .close-text { color: var(--whatif); }

  .facts,
  .button-row,
  .form-actions {
    flex-wrap: wrap;
    gap: 10px;
  }

  .facts :global(.fact-card) {
    min-width: min(180px, 100%);
    flex: 1;
  }

  .panel,
  .empty-state,
  .confirm-panel {
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    padding: 16px;
  }

  .panel h2,
  .empty-state h2,
  .confirm-panel h2,
  .trip-list h2 {
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.3;
    overflow-wrap: anywhere;
    text-wrap: pretty;
  }

  .panel p,
  .empty-state p,
  .confirm-panel p {
    max-width: 72ch;
    margin: 8px 0 0;
    line-height: 1.5;
    overflow-wrap: anywhere;
    text-wrap: pretty;
  }

  .mint {
    border-color: color-mix(in srgb, var(--safe), var(--line) 40%);
    background: var(--surface-mint);
  }

  .risk-panel,
  .confirm-panel {
    border-color: var(--risk);
    background: var(--risk-bg);
  }

  .whatif-panel {
    border-color: color-mix(in srgb, var(--whatif), var(--line) 30%);
    background: var(--whatif-bg);
  }

  .what-if-action {
    border-color: var(--whatif);
    background: var(--whatif-bg);
    color: var(--whatif);
  }

  .paper-panel { background: var(--paper); }

  .account-panel {
    display: grid;
    gap: 14px;
  }

  .account-heading-row {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .account-heading-row > div { min-width: 0; }

  .eyebrow {
    margin: 0 0 4px !important;
    color: var(--muted);
    font-size: 0.78rem;
    font-weight: 780;
    letter-spacing: 0.06em;
    overflow-wrap: anywhere;
    text-transform: uppercase;
  }

  .account-state-badge {
    display: inline-flex;
    min-height: 32px;
    flex: 0 0 auto;
    align-items: center;
    border: 1px solid var(--line);
    border-radius: 7px;
    background: var(--surface);
    color: var(--muted);
    padding: 5px 8px;
    font-size: 0.76rem;
    font-weight: 780;
  }

  .account-state-badge.safe {
    border-color: color-mix(in srgb, var(--safe), var(--line) 35%);
    background: var(--safe-bg);
    color: var(--safe);
  }

  .account-state-badge.attention {
    border-color: color-mix(in srgb, var(--whatif), var(--line) 30%);
    background: var(--whatif-bg);
    color: var(--whatif);
  }

  .account-consent {
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--surface);
    padding: 12px 10px;
  }

  .account-consent strong {
    display: block;
    margin-bottom: 3px;
    color: var(--ink);
  }

  .account-actions { margin-top: 2px; }

  .account-facts {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    margin: 0;
  }

  .account-facts > div {
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    padding: 10px;
  }

  .account-facts dt {
    color: var(--muted);
    font-size: 0.76rem;
    font-weight: 700;
  }

  .account-facts dd {
    margin: 4px 0 0;
    color: var(--ink);
    font-size: 0.9rem;
    font-weight: 760;
    overflow-wrap: anywhere;
  }

  .account-choice-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .account-choice {
    display: grid;
    height: 100%;
    align-content: start;
    gap: 5px;
    text-align: left;
  }

  .account-choice span {
    color: var(--muted);
    font-size: 0.82rem;
    font-weight: 520;
    line-height: 1.4;
  }

  .account-messages:empty { display: none; }

  .account-footnote {
    padding-top: 10px;
    border-top: 1px solid var(--line);
    color: var(--muted);
    font-size: 0.82rem;
  }

  .account-delete-confirm { margin-top: 2px; }

  .primary-button,
  .secondary-button,
  .danger-button,
  .danger-outline,
  .text-button {
    min-height: 44px;
    border-radius: 10px;
    padding: 10px 14px;
    font-weight: 760;
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

  .danger-button {
    border: 1px solid var(--risk);
    background: var(--risk);
    color: var(--surface);
  }

  .danger-outline {
    border: 1px solid var(--risk);
    background: var(--surface);
    color: var(--risk);
  }

  .text-button {
    justify-self: start;
    border: 0;
    background: transparent;
    color: var(--ink);
    padding-inline: 4px;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .trip-form {
    display: grid;
    gap: 8px;
  }

  .outside-breaks {
    display: grid;
    gap: 12px;
    margin-top: 12px;
    border-block: 1px solid var(--line);
    padding-block: 16px;
  }

  .outside-breaks-heading,
  .outside-break-title {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .outside-breaks h2 {
    margin: 0;
    font-size: 1rem;
  }

  .outside-breaks p {
    max-width: 62ch;
    margin: 4px 0 0;
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  fieldset.outside-break {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    margin: 0;
    border-color: var(--line);
    background: var(--paper);
    padding: 12px;
  }

  .outside-break-title legend {
    padding: 0;
    color: var(--ink);
  }

  .outside-break-title .text-button {
    min-height: 36px;
    color: var(--risk);
    padding-block: 4px;
  }

  .compact-button {
    min-height: 40px;
    flex: 0 0 auto;
    padding-block: 8px;
  }

  .add-break-button {
    width: 100%;
    border-style: dashed;
    color: var(--safe);
  }

  .trip-form-summary {
    display: grid;
    gap: 3px;
    margin-top: 8px;
    border: 1px solid color-mix(in srgb, var(--safe), var(--line) 38%);
    border-radius: 10px;
    background: var(--safe-bg);
    padding: 12px;
  }

  .trip-form-summary strong { color: var(--ink); }

  .trip-form-summary span {
    color: var(--safe);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.8rem;
    line-height: 1.45;
  }

  .outside-window-confirmation {
    display: grid;
    gap: 8px;
    margin-top: 8px;
    border: 1px solid color-mix(in srgb, var(--whatif), var(--line) 35%);
    border-radius: 10px;
    background: var(--whatif-bg);
    padding: 14px;
  }

  .outside-window-confirmation h2 {
    margin: 0;
    color: var(--ink);
    font-size: 1rem;
  }

  .outside-window-confirmation p {
    max-width: 65ch;
    margin: 0;
    color: var(--ink);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .compact-actions { margin-top: 2px; }

  .trip-form > label,
  .field-group label {
    margin-top: 6px;
    color: var(--ink);
    font-weight: 740;
  }

  label small,
  .trip-form > small,
  .field-group small,
  .window-label {
    color: var(--muted);
    font-weight: 500;
  }

  .date-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .date-fields.single-field { grid-template-columns: 1fr; }

  .field-group {
    display: grid;
    min-width: 0;
    gap: 6px;
    align-content: start;
  }

  input,
  select {
    width: 100%;
    min-width: 0;
    min-height: 48px;
    border: 1px solid var(--control-line);
    border-radius: 10px;
    background: var(--surface);
    color: var(--ink);
    padding: 10px 12px;
  }

  /* Keep native date controls aligned with text fields without exceeding their grid cell. */
  input[type='date'] {
    max-inline-size: 100%;
    padding-inline: 12px 8px;
  }

  input::placeholder { color: #596761; }
  input[aria-invalid='true'],
  select[aria-invalid='true'] { border-color: var(--risk); }

  .ongoing-stay-control {
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
    padding: 10px 12px;
  }

  .ongoing-stay-control strong,
  .ongoing-stay-control small {
    display: block;
  }

  .ongoing-stay-control strong { color: var(--ink); }
  .ongoing-stay-control small { margin-top: 2px; }

  .ongoing-departure {
    display: grid;
    align-content: center;
    min-height: 48px;
    border: 1px solid color-mix(in srgb, var(--safe), var(--control-line) 55%);
    border-radius: 10px;
    background: var(--safe-bg);
    padding: 8px 12px;
    color: var(--safe);
  }

  .ongoing-departure span { font-size: 0.78rem; font-weight: 700; }
  .ongoing-departure strong { font-size: 1rem; }

  fieldset {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 10px 0 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px;
  }

  legend {
    padding: 0 5px;
    color: var(--muted);
    font-weight: 740;
  }

  .consent-row {
    display: grid;
    grid-template-columns: 44px 1fr;
    align-items: start;
    gap: 8px;
    color: var(--muted);
    line-height: 1.45;
  }

  .consent-row input {
    width: 22px;
    min-height: 22px;
    margin: 3px 0 0 8px;
  }

  .field-error,
  .storage-warning,
  .micro-risk {
    color: var(--risk);
    font-size: 0.9rem;
    font-weight: 760;
  }

  .form-error { margin-top: 4px; }

  .micro-safe,
  .micro-risk {
    margin-top: 10px !important;
  }

  .micro-safe {
    color: var(--safe);
    font-size: 0.9rem;
    font-weight: 760;
  }

  .trip-list,
  .simulation-result {
    display: grid;
    gap: 10px;
    min-width: 0;
  }

  .trip-list article {
    position: relative;
    display: grid;
    min-width: 0;
    gap: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: color-mix(in srgb, var(--paper), var(--trip-color) 4%);
    padding: 12px;
  }

  .trip-list article.expanded {
    border-color: color-mix(in srgb, var(--trip-color), var(--line) 18%);
    background: color-mix(in srgb, var(--paper), var(--trip-color) 7%);
  }

  .onboarding-kicker {
    margin: 0;
    color: var(--safe);
    font-weight: 750;
  }

  .combined-planner {
    display: grid;
    gap: 16px;
  }

  .simulation-save-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .trip-copy {
    display: grid;
    min-width: 0;
    gap: 2px;
  }

  .trip-copy > span {
    color: var(--muted);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.8rem;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .trip-copy > .trip-day-count {
    width: fit-content;
    max-width: 100%;
    color: var(--ink);
    font-size: 1.35rem;
    font-weight: 780;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.015em;
    line-height: 1.15;
  }

  .trip-copy > strong {
    color: var(--ink);
    font-size: 1.05rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .trip-copy .trip-route {
    color: var(--ink);
    font-family: 'Source Sans 3', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.85rem;
    font-weight: 650;
  }

  .trip-summary-trigger {
    display: grid;
    min-width: 0;
    min-height: 68px;
    gap: 12px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--ink);
    padding: 4px;
    text-align: start;
  }

  .trip-summary-trigger:hover {
    background: color-mix(in srgb, var(--surface), transparent 42%);
  }

  .trip-summary-trigger:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--trip-color), transparent 35%);
    outline-offset: 2px;
  }

  .trip-card-heading {
    display: grid;
    min-width: 0;
    grid-template-columns: 10px minmax(0, 1fr);
    align-items: start;
    gap: 4px 10px;
  }

  .trip-color-dot {
    width: 10px;
    height: 10px;
    margin-top: 5px;
    border-radius: 50%;
    background: var(--trip-color);
  }

  .trip-card-status {
    display: inline-flex;
    width: fit-content;
    min-height: 24px;
    grid-column: 2;
    align-items: center;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--muted);
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 760;
    line-height: 1.25;
  }

  .trip-card-status.over-limit {
    border-color: color-mix(in srgb, var(--risk), var(--line) 34%);
    background: var(--risk-bg);
    color: var(--risk);
  }

  .trip-card-status.completed.over-limit {
    border-color: color-mix(in srgb, var(--whatif), var(--line) 36%);
    background: var(--whatif-bg);
    color: var(--whatif);
  }

  .trip-card-actions {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    padding-top: 2px;
  }

  .trip-expand-action,
  .trip-delete-action {
    min-height: 44px;
    border-radius: 7px;
    padding: 6px 9px;
    font: inherit;
    font-weight: 740;
  }

  .trip-expand-action {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid var(--line);
    background: var(--surface);
    color: var(--ink);
  }

  .trip-expand-action:hover {
    border-color: color-mix(in srgb, var(--trip-color), var(--line) 34%);
    background: color-mix(in srgb, var(--surface), var(--trip-color) 7%);
  }

  .trip-expand-action:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--trip-color), transparent 35%);
    outline-offset: 1px;
  }

  .trip-delete-action {
    border: 0;
    background: transparent;
    color: var(--risk);
  }

  .trip-delete-action:hover {
    background: var(--risk-bg);
  }

  .trip-delete-action:focus-visible {
    outline: 3px solid color-mix(in srgb, var(--risk), transparent 40%);
    outline-offset: 1px;
  }

  .trip-list :global(.trip-adjust-panel),
  .trip-list .confirm-panel {
    min-width: 0;
  }

  .older-trips-toggle { justify-self: start; }

  .add-trip-footer {
    display: flex;
    justify-content: flex-end;
    padding-top: 18px;
    border-top: 1px solid var(--line);
  }

  .confirm-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }


  .window-label {
    margin: 0;
    font-size: 0.86rem;
    font-weight: 700;
  }

  .mono-range {
    display: block;
    margin: 5px 0 0;
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.9rem;
    font-weight: 650;
    overflow-wrap: anywhere;
  }

  .rule-list {
    margin: 10px 0 0;
    padding-inline-start: 20px;
    color: var(--muted);
    line-height: 1.5;
  }

  .signup-value-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border-top: 1px solid var(--line);
    background: var(--surface-mint);
    padding: 24px 32px;
  }

  .signup-value-section h2 { margin: 0; font-size: 1.35rem; }
  .signup-value-section p { max-width: 68ch; margin: 6px 0 0; color: var(--muted); line-height: 1.5; }
  .signup-value-section button { flex: 0 0 auto; }

  .loading-state {
    display: grid;
    gap: 12px;
    padding-block: 20px;
  }

  .loading-state p { margin: 0; color: var(--muted); }
  .loading-line { width: 64px; height: 6px; border-radius: 3px; background: var(--line); }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    .app-shell { padding: 0; }
    .workspace { min-height: 100svh; border-width: 0; border-radius: 0; }
    .app-header { align-items: flex-start; flex-direction: column; padding: 14px 16px; }
    .app-header-actions { width: 100%; flex-wrap: wrap; justify-content: space-between; }
    .anchor-links { display: none; }
    .anchor-select {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
    }
    .anchor-select > span {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 760;
      text-transform: uppercase;
    }
    .anchor-select select { min-height: 42px; padding-block: 7px; }
    .single-page-content { display: block; }
    .screen { padding: 24px 16px 32px; scroll-margin-top: 66px; }
    .answer-section {
      position: static;
      border-inline-end: 0;
    }
    .screen-title { font-size: 2rem; }
    .verdict { font-size: 2.6rem; }
    .date-fields { grid-template-columns: 1fr; }
    .outside-breaks-heading { align-items: stretch; flex-direction: column; }
    .outside-breaks-heading .compact-button { width: 100%; }
    .section-heading.with-action { align-items: flex-start; flex-direction: column; }
    .trip-summary-trigger { width: 100%; }
    .trip-card-actions > * { flex: 1; }
    .add-trip-footer > button { width: 100%; }
    .trip-dialog {
      width: calc(100% - 20px);
      max-height: calc(100dvh - 20px);
      padding: 18px 16px;
    }
    .confirm-panel { align-items: stretch; flex-direction: column; }
    .signup-value-section { align-items: stretch; flex-direction: column; padding: 22px 18px; }
    .signup-value-section button { width: 100%; }
    .account-choice-grid { grid-template-columns: 1fr; }
    .simulation-save-actions { grid-template-columns: 1fr; }
  }

  @media (min-width: 641px) and (max-width: 900px) {
    .single-page-content { grid-template-columns: minmax(250px, 0.8fr) minmax(0, 1.2fr); }
    .screen { padding-inline: 18px; }
    .verdict { font-size: 2.75rem; }
    .anchor-links > span { display: none; }
  }

  @media (max-width: 380px) {
    .account-chip { font-size: 0.76rem; }
    fieldset { grid-template-columns: 1fr; }
    .account-heading-row { align-items: stretch; flex-direction: column; }
    .account-state-badge { align-self: flex-start; }
    .account-facts { grid-template-columns: 1fr; }
    .button-row > *,
    .form-actions > * { width: 100%; }
  }
</style>
