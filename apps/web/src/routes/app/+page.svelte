<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { FactCard, SchngnLogo, StatusChip, TimelineLedger, WhatIfAdjuster } from '$lib/design';
  import LanguageSelector from '$lib/i18n/LanguageSelector.svelte';
  import { createTranslator, intlLocale, localeFromPath } from '$lib/i18n';
  import { createAppUiTranslator } from '$lib/i18n/appUi';
  import { createAppDeepUiTranslator } from '$lib/i18n/appDeepUi';
  import { createAppRuntimeUiTranslator, formatLocalizedCount } from '$lib/i18n/appRuntimeUi';
  import { createWhatIfUiTranslator } from '$lib/i18n/whatIfUi';
  import { createTripOnboardingTranslator } from '$lib/i18n/tripOnboardingUi';
  import {
    localizeDashboardState,
    localizePdfState,
    localizeReturningForecast,
    localizeSimulationState,
    localizeUnlockState
  } from '$lib/i18n/stateUi';
  import { buildDashboardState } from '$lib/dashboard/dashboardState';
  import { buildTripSimulationState, emptyProposedTrip, type ProposedTripInput } from '$lib/simulator/tripSimulator';
  import { addIsoDays, buildAdjustmentRange, type AdjustmentRange, type DateAdjustment } from '$lib/simulator/whatIfDates';
  import { buildReturningDaysForecast } from '$lib/returns/returningDays';
  import { buildExplanationState } from '$lib/explanation/explanationState';
  import { localizedLegalCopy, localizedOfficialSourceLinks } from '$lib/legal/legalCopy';
  import { buildPdfBuyIntentEvent, buildPdfReportFakeDoorState } from '$lib/fake-door/pdfReportFakeDoor';
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
    tripEntryDate,
    tripExitDate,
    tripRouteLabel,
    tripToForm,
    upsertTrip,
    type EditableTrip,
    type TripFormInput,
    type TripValidationErrors
  } from '$lib/trips/tripCrud';
  import { SCHENGEN_COUNTRY_OPTIONS } from '$lib/trips/countries';
  import { importTripsFromJson, MAX_TRIP_BACKUP_BYTES, tripsToBackupJson } from '$lib/import-export/tripBackup';
  import { clearTripsFromStorage, loadTripsFromStorage, saveTripsToStorage } from '$lib/trips/tripStorage';
  import { initializeClerkBrowserAuth, type ClerkBrowserAuth } from '$lib/auth/clerkBrowser';
  import {
    appSectionFromUrl,
    appSectionUrl,
    isAppSectionAvailable,
    type AppSection
  } from '$lib/navigation/appSection';
  import {
    deleteAccountData,
    getAccountTrips,
    putAccountTrips
  } from '$lib/account/accountClient';
  import {
    buildAccountSyncMetadata,
    buildPausedAccountSyncMetadata,
    clearAccountSyncMetadata,
    decideAccountReconciliation,
    loadAccountSyncMetadata,
    saveAccountSyncMetadata,
    shouldRestoreMissingLocalSnapshot,
    type AccountSyncMetadata,
    type AccountTripSnapshot
  } from '$lib/account/accountSync';

  type ScreenKey = AppSection;
  type NavScreen = Exclude<ScreenKey, 'trip' | 'waitlist'>;
  type WaitlistState = 'idle' | 'submitting' | 'stored' | 'not_configured' | 'error';
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

  $: locale = localeFromPath(page.url.pathname);
  $: t = createTranslator(locale);
  $: ui = createAppUiTranslator(locale);
  $: deep = createAppDeepUiTranslator(locale);
  $: rt = createAppRuntimeUiTranslator(locale);
  $: whatIfUi = createWhatIfUiTranslator(locale);
  $: tripOnboarding = createTripOnboardingTranslator(locale);
  $: legal = localizedLegalCopy(locale);
  $: officialSourceLinks = localizedOfficialSourceLinks(locale);
  $: screens = [
    { key: 'dashboard' as const, label: ui('navOverview') },
    { key: 'trips' as const, label: tripOnboarding('nav') },
    { key: 'proof' as const, label: ui('navProof'), requiresTrips: true },
    { key: 'returns' as const, label: ui('navReturns'), requiresTrips: true },
    { key: 'report' as const, label: ui('navReport'), requiresTrips: true },
    { key: 'privacy' as const, label: ui('navAccount') }
  ] satisfies { key: NavScreen; label: string; requiresTrips?: boolean }[];

  let active: ScreenKey = 'dashboard';
  let hasLoadedTrips = false;
  let trips: EditableTrip[] = [];
  let editingTripId: string | null = null;
  let pendingDeleteTripId: string | null = null;
  let clearConfirmationVisible = false;
  let tripForm: TripFormInput = emptyTripForm('booked');
  let formErrors: TripValidationErrors = {};
  let outsideWindowConfirmationVisible = false;
  let storageWarning = '';
  let storageSource: 'empty' | 'storage' = 'empty';
  let localTripsDurable = true;
  let hasLocalTripMutations = false;
  let importMessage = '';
  let importError = '';
  let importInput: HTMLInputElement;
  let disclaimerNoticeVisible = true;
  let pdfIntentMessageVisible = false;
  let unlockIntentMessageVisible = false;
  let market: UnlockMarket = 'eu';
  let unlockPrice = chooseUnlockPriceBucket('eu', 0.34);
  let waitlistEmail = '';
  let waitlistConsent = false;
  let waitlistState: WaitlistState = 'idle';
  let waitlistError = '';
  let simulationSubmitted = false;
  let simulationSaveNotice = '';
  let simulationOutsideWindowConfirmationVisible = false;
  let simulatorForm: ProposedTripInput = emptySimulationForm();
  let quickAdjustVisible = false;
  let quickAdjustSourceId: string | null = null;
  let quickAdjustRange: AdjustmentRange | null = null;
  let clerkAuth: ClerkBrowserAuth | null = null;
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

  $: visibleScreens = screens.filter((screen) => !screen.requiresTrips || trips.length > 0);
  $: dashboardState = localizeDashboardState(locale, buildDashboardState(trips));
  $: dashboardStatusTone = (dashboardState.statusTone === 'risk' ? 'risk' : dashboardState.statusTone === 'close' ? 'whatif' : 'safe') as
    | 'safe'
    | 'risk'
    | 'whatif';
  $: dashboardTextClass = dashboardState.statusTone === 'risk' ? 'risk-text' : dashboardState.statusTone === 'close' ? 'close-text' : 'safe-text';
  $: simulationBaseTrips = quickAdjustSourceId ? trips.filter((trip) => trip.id !== quickAdjustSourceId) : trips;
  $: simulationState = localizeSimulationState(locale, buildTripSimulationState(simulationBaseTrips, simulatorForm));
  $: tripFormPreviewResult = upsertTrip([], { ...tripForm, id: 'preview' });
  $: tripFormPreview = tripFormPreviewResult.trips[0] ?? null;
  $: tripFormToday = currentLocalIsoDate();
  $: tripFormTimelineTrips = tripFormPreview
    ? [...trips.filter((trip) => trip.id !== editingTripId), tripFormPreview]
    : trips.filter((trip) => trip.id !== editingTripId);
  $: tripFormTimelineReferenceDate = tripFormPreview && tripFormPreview.status !== 'past'
    ? tripExitDate(tripFormPreview)
    : tripFormToday;
  $: tripFormWindowStartDate = rollingWindowStartDate(tripFormToday);
  $: resolvedTripFormStatus = statusForTripDates(tripForm.status, tripForm.exitDate);
  $: tripFormIsPast = resolvedTripFormStatus === 'past';
  $: simulationSaveStatus = statusForTripDates('booked', simulatorForm.exitDate);
  $: simulatorStatusTone = (simulationState.statusTone === 'risk' ? 'risk' : simulationState.statusTone === 'close' ? 'whatif' : 'safe') as
    | 'safe'
    | 'risk'
    | 'whatif';
  $: returningForecast = localizeReturningForecast(locale, buildReturningDaysForecast(trips, { referenceDate: dashboardState.referenceDate, horizonDays: 30 }));
  $: explanationState = buildExplanationState(trips, dashboardState.referenceDate);
  $: pdfFakeDoorState = localizePdfState(locale, buildPdfReportFakeDoorState(pdfIntentMessageVisible));
  $: unlockFakeDoorState = localizeUnlockState(locale, buildUnlockFakeDoorState(unlockPrice, unlockIntentMessageVisible), unlockPrice.label);
  $: pendingDeleteTrip = trips.find((trip) => trip.id === pendingDeleteTripId) ?? null;
  $: accountSignedIn = clerkAuth?.available === true && clerkAuth.isSignedIn && clerkAuth.userId !== null;
  $: accountEmail = clerkAuth?.available === true ? clerkAuth.email : null;
  $: accountStatusLabel = accountHeaderLabel(accountState, accountSignedIn);
  $: localizedStorageWarning = storageWarning ? (locale === 'en' ? storageWarning : rt('accountGenericError')) : '';

  onMount(() => {
    const result = loadTripsFromStorage(window.localStorage);
    trips = result.trips;
    storageSource = result.source;
    storageWarning = result.warning ?? '';
    localTripsDurable = result.warning === undefined;
    market = new URL(window.location.href).searchParams.get('market') === 'uk' ? 'uk' : 'eu';
    unlockPrice = loadOrAssignUnlockPriceBucket(window.localStorage, { market });
    restoreActiveScreenFromUrl(false);
    hasLoadedTrips = true;
    trackPageView('app');
    void initializeAccount();
    const handlePopState = () => restoreActiveScreenFromUrl(true);
    window.addEventListener('popstate', handlePopState);
    return () => {
      accountIdentityEpoch += 1;
      unsubscribeClerk?.();
      unsubscribeClerk = null;
      window.removeEventListener('popstate', handlePopState);
    };
  });

  function persistTrips(
    nextTrips: EditableTrip[],
    options: { skipAccountSync?: boolean; fromAccount?: boolean } = {}
  ): boolean {
    trips = nextTrips;
    if (!options.fromAccount) hasLocalTripMutations = true;
    if (!browser) return true;

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

    if (!clerkAuth || !clerkAuth.available) {
      clerkAuth = await initializeClerkBrowserAuth(env.PUBLIC_CLERK_PUBLISHABLE_KEY);
    }
    const auth = clerkAuth;
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
    const auth = clerkAuth;
    if (!auth?.available) return;
    try {
      await auth.redirectToSignUp({ redirectUrl: accountReturnUrl() });
    } catch {
      accountError = rt('securePageError');
    }
  }

  async function startAccountSignIn(): Promise<void> {
    const auth = clerkAuth;
    if (!auth?.available) return;
    try {
      await auth.redirectToSignIn({ redirectUrl: accountReturnUrl() });
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

  function accountReturnUrl(): string {
    if (!browser) return '/app';
    const url = new URL(window.location.href);
    url.searchParams.set('account', 'connected');
    return `${url.pathname}${url.search}`;
  }

  function setActiveScreen(screen: ScreenKey): void {
    if (screen === active) return;
    active = screen;
    if (browser) {
      window.history.pushState(window.history.state, '', appSectionUrl(new URL(window.location.href), screen));
    }
    trackPageView(screen);
    if (screen === 'trip') trackCalculatorStart('trip_form');
  }

  function restoreActiveScreenFromUrl(trackView: boolean): void {
    if (!browser) return;
    const currentUrl = new URL(window.location.href);
    const requested = appSectionFromUrl(currentUrl);
    const restored = isAppSectionAvailable(requested, trips.length > 0) ? requested : 'dashboard';
    const restoredUrl = appSectionUrl(currentUrl, restored);
    const currentPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;

    if (restoredUrl !== currentPath) window.history.replaceState(window.history.state, '', restoredUrl);
    if (active === restored) return;
    active = restored;
    if (trackView) trackPageView(restored);
  }

  function startAddTrip(): void {
    editingTripId = null;
    tripForm = emptyTripForm('booked');
    formErrors = {};
    outsideWindowConfirmationVisible = false;
    setActiveScreen('trip');
  }

  function startEditTrip(trip: EditableTrip): void {
    editingTripId = trip.id;
    const form = tripToForm(trip);
    tripForm = { ...form, status: statusForTripDates(form.status, form.exitDate) };
    formErrors = {};
    outsideWindowConfirmationVisible = false;
    pendingDeleteTripId = null;
    setActiveScreen('trip');
  }

  function cancelTripForm(): void {
    editingTripId = null;
    tripForm = emptyTripForm('booked');
    formErrors = {};
    outsideWindowConfirmationVisible = false;
    setActiveScreen(trips.length > 0 ? 'trips' : 'dashboard');
  }

  function saveTrip(confirmOutsideWindow = false): void {
    const result = upsertTrip(trips, { ...tripForm, id: editingTripId ?? tripForm.id });
    formErrors = localizeValidationErrors(result.errors);
    if (Object.keys(result.errors).length > 0) {
      outsideWindowConfirmationVisible = false;
      return;
    }

    if (
      !confirmOutsideWindow &&
      editingTripId === null &&
      tripFormPreview &&
      isTripBeforeRollingWindow(tripFormPreview, tripFormToday)
    ) {
      outsideWindowConfirmationVisible = true;
      return;
    }

    const wasAdding = editingTripId === null;
    outsideWindowConfirmationVisible = false;
    persistTrips(result.trips);
    if (wasAdding) {
      trackAnalyticsEvent('trip_added', {
        source: 'trip_form',
        trip_count_bucket: buildTripCountBucket(result.trips.length)
      });
    }
    editingTripId = null;
    tripForm = emptyTripForm('booked');
    setActiveScreen('trips');
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

  function updateTripEntryCountry(event: Event): void {
    const entryCountryCode = (event.currentTarget as HTMLSelectElement).value;
    tripForm = {
      ...tripForm,
      entryCountryCode,
      exitCountryCode: tripForm.exitCountryCode || entryCountryCode
    };
  }

  function requestDeleteTrip(id: string): void {
    pendingDeleteTripId = id;
  }

  function deletePendingTrip(): void {
    if (!pendingDeleteTripId) return;
    persistTrips(deleteTripById(trips, pendingDeleteTripId));
    pendingDeleteTripId = null;
    if (trips.length === 0) setActiveScreen('trips');
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
    setActiveScreen('privacy');
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
    quickAdjustSourceId = null;
    quickAdjustVisible = false;
    quickAdjustRange = null;
  }

  function openQuickAdjuster(): void {
    const target = dashboardState.targetTrip;
    if (!target) return;
    simulationSaveNotice = '';
    simulationOutsideWindowConfirmationVisible = false;
    const form = tripToForm(target);
    simulatorForm = {
      label: form.label || displayRoute(target),
      entryCountryCode: form.entryCountryCode,
      exitCountryCode: form.exitCountryCode,
      entryDate: form.entryDate,
      exitDate: form.exitDate,
      outsideBreaks: form.outsideBreaks
    };
    quickAdjustSourceId = target.id;
    quickAdjustRange = buildAdjustmentRange(form.entryDate, form.exitDate);
    quickAdjustVisible = true;
    simulationSubmitted = true;
    trackSimulationRun('dashboard');
  }

  function closeQuickAdjuster(): void {
    quickAdjustVisible = false;
    quickAdjustSourceId = null;
    quickAdjustRange = null;
    simulatorForm = emptySimulationForm();
    simulationSubmitted = false;
    simulationSaveNotice = '';
    simulationOutsideWindowConfirmationVisible = false;
  }

  function adjustQuickTrip(adjustment: DateAdjustment): void {
    simulationSaveNotice = '';
    simulationOutsideWindowConfirmationVisible = false;
    simulatorForm = {
      ...simulatorForm,
      entryDate: adjustment.entryDate,
      exitDate: adjustment.exitDate,
      outsideBreaks: adjustment.mode === 'move' && adjustment.moveDays !== 0
        ? simulatorForm.outsideBreaks.map((outsideBreak) => ({
            ...outsideBreak,
            leftDate: outsideBreak.leftDate ? addIsoDays(outsideBreak.leftDate, adjustment.moveDays) : '',
            reentryDate: outsideBreak.reentryDate ? addIsoDays(outsideBreak.reentryDate, adjustment.moveDays) : ''
          }))
        : simulatorForm.outsideBreaks
    };
    simulationSubmitted = true;
  }

  function simulationChanged(): void {
    simulationSubmitted = false;
    simulationSaveNotice = '';
    simulationOutsideWindowConfirmationVisible = false;
  }

  function openCombinedPlanner(): void {
    setActiveScreen('trips');
    if (!browser) return;
    window.requestAnimationFrame(() => {
      document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
      id: quickAdjustSourceId ?? undefined,
      status: savedStatus
    });
    if (Object.keys(result.errors).length > 0) return;

    if (
      !confirmOutsideWindow &&
      quickAdjustSourceId === null &&
      isTripBeforeRollingWindow(simulationState.simulatedTrip, tripFormToday)
    ) {
      simulationOutsideWindowConfirmationVisible = true;
      return;
    }

    const wasAdding = quickAdjustSourceId === null;
    const persisted = persistTrips(result.trips);
    if (wasAdding) {
      trackAnalyticsEvent('trip_added', {
        source: 'planner',
        trip_count_bucket: buildTripCountBucket(result.trips.length)
      });
    }
    simulatorForm = emptySimulationForm();
    simulationSubmitted = false;
    simulationOutsideWindowConfirmationVisible = false;
    quickAdjustSourceId = null;
    quickAdjustVisible = false;
    quickAdjustRange = null;
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
    return tripRouteLabel(trip);
  }

  function displayTripName(trip: EditableTrip): string {
    return trip.label || displayRoute(trip);
  }

  function trackPageView(screen: ScreenKey | 'app'): void {
    trackAnalyticsEvent('page_view', { source: screenToAnalyticsSource(screen) });
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

  async function submitWaitlist(): Promise<void> {
    if (!waitlistEmail.trim() || !waitlistConsent || waitlistState === 'submitting') return;
    waitlistState = 'submitting';
    waitlistError = '';

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail.trim(), consent: true, source: 'waitlist' })
      });

      if (!response.ok) {
        waitlistState = 'error';
        waitlistError = waitlistRecoveryCopy(response.status);
        return;
      }

      const result = (await response.json().catch(() => ({ stored: false }))) as { stored?: boolean };
      if (result.stored === true) {
        waitlistState = 'stored';
        trackAnalyticsEvent('waitlist_signup', { source: 'waitlist' });
      } else {
        waitlistState = 'not_configured';
      }
    } catch {
      waitlistState = 'error';
      waitlistError = rt('waitlistNetwork');
    }
  }

  function waitlistRecoveryCopy(status: number): string {
    if (status === 400) return rt('waitlistInvalid');
    if (status === 429) return rt('waitlistRate');
    if (status >= 500) return rt('waitlistUnavailable');
    return rt('waitlistFailed');
  }

  function recordPdfBuyIntent(): void {
    const event = buildPdfBuyIntentEvent();
    trackAnalyticsEvent(event.name, event.props);
    pdfIntentMessageVisible = true;
  }

  function recordUnlockBuyIntent(): void {
    const event = buildUnlockBuyIntentEvent(unlockPrice, 'planner');
    trackAnalyticsEvent(event.name, event.props);
    unlockIntentMessageVisible = true;
  }

  function analyticsVerdict(): AnalyticsVerdict {
    if (!simulationState.valid || !simulationState.usage) return 'empty';
    if (simulationState.usage.overLimit) return 'over_limit';
    if (simulationState.usage.daysRemaining === 0) return 'at_limit';
    return simulationState.statusTone === 'close' ? 'close' : 'safe';
  }

  function screenToAnalyticsSource(screen: ScreenKey | 'app'): AnalyticsSource {
    if (screen === 'trip') return 'trip_form';
    if (screen === 'dashboard') return 'dashboard';
    if (screen === 'report') return 'report';
    if (screen === 'waitlist') return 'waitlist';
    if (screen === 'privacy') return 'privacy';
    return 'app';
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

  function pluralize(word: string, count: number): string {
    if (word === 'trip' || word === 'day') return formatLocalizedCount(locale, count, word).label;
    return count === 1 ? word : `${word}s`;
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
  <section class="workspace" aria-labelledby="app-title">
    <header class="app-header">
      <div class="brand" id="app-title">
        <SchngnLogo motto />
      </div>
      <div class="app-header-actions">
        <LanguageSelector label={t('common.language')} {locale} url={page.url} />
        <button
        class:attention={accountState === 'conflict' || accountState === 'paused' || accountState === 'error'}
        class:synced={accountState === 'synced' || accountState === 'syncing'}
        class="account-chip"
        type="button"
        aria-label={`${ui('openAccount')} — ${accountStatusLabel}`}
        onclick={() => setActiveScreen('privacy')}
      >
        <span aria-hidden="true"></span>{accountStatusLabel}
        </button>
      </div>
    </header>

    <nav class="screen-tabs" aria-label={ui('appSections')}>
      {#each visibleScreens as screen}
        <button
          type="button"
          class:active={active === screen.key}
          aria-current={active === screen.key ? 'page' : undefined}
          onclick={() => setActiveScreen(screen.key)}
        >
          {screen.label}
        </button>
      {/each}
    </nav>

    {#if storageWarning}
      <aside class="storage-alert" aria-live="polite">
        <strong>{ui('storageAttention')}</strong>
        <span>{localizedStorageWarning}</span>
      </aside>
    {/if}

    {#if disclaimerNoticeVisible}
      <aside class="disclaimer-notice" aria-labelledby="disclaimer-heading">
        <div>
          <h2 id="disclaimer-heading">{ui('planningOnly')}</h2>
          <p>{legal.full}</p>
          <div class="official-links" aria-label={ui('officialSources')}>
            {#each officialSourceLinks as source}
              <a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
            {/each}
          </div>
        </div>
        <button class="secondary-button compact" type="button" onclick={() => (disclaimerNoticeVisible = false)}>{ui('dismiss')}</button>
      </aside>
    {/if}

    {#if active === 'dashboard'}
      <section class="screen" aria-labelledby="overview-heading">
        {#if !hasLoadedTrips}
          <div class="loading-state" aria-live="polite">
            <span class="loading-line" aria-hidden="true"></span>
            <h1 id="overview-heading" class="screen-title">{ui('loadingTrips')}</h1>
            <p>{ui('readingLocal')}</p>
          </div>
        {:else if trips.length === 0}
          <StatusChip tone="safe" label={tripOnboarding('step')} />
          <h1 id="overview-heading" class="screen-title">{tripOnboarding('title')}</h1>
          <p class="intro-copy">{tripOnboarding('copy')}</p>
          <section class="panel mint onboarding-steps" aria-labelledby="first-step-heading">
            <h2 id="first-step-heading">{ui('firstResult')}</h2>
            <ol>
              <li>{tripOnboarding('pastAction')}</li>
              <li>{tripOnboarding('bookedAction')}</li>
            </ol>
          </section>
          <div class="button-row">
            <button class="primary-button" type="button" onclick={startAddTrip}>{ui('addFirst')}</button>
            <button class="text-button" type="button" onclick={openCombinedPlanner}>{tripOnboarding('noHistory')}</button>
          </div>
        {:else}
          <StatusChip tone={dashboardStatusTone} label={dashboardState.statusLabel} />
          <h1 id="overview-heading" class={`verdict ${dashboardTextClass}`}>{dashboardState.heroMetric}</h1>
          <div class="facts two">
            <FactCard label={ui('latestSafeExit')} value={dashboardState.latestSafeExitLabel} />
            <FactCard label={ui('daysUsed')} value={dashboardState.daysUsedLabel} tone={dashboardState.statusTone === 'risk' ? 'ink' : 'safe'} />
          </div>
          <TimelineLedger
            label={ui('rollingWindow')}
            {locale}
            mode={dashboardState.statusTone === 'risk' ? 'risk' : 'safe'}
            {trips}
            referenceDate={dashboardState.referenceDate}
          />
          <section class:risk-panel={dashboardState.statusTone === 'risk'} class:mint={dashboardState.statusTone !== 'risk'} class="panel" aria-labelledby="why-heading">
            <h2 id="why-heading">{dashboardState.statusTone === 'risk' ? ui('needsAttention') : ui('whyAnswer')}</h2>
            <p>{dashboardState.whyCopy}</p>
            <p class:micro-risk={dashboardState.statusTone === 'risk'} class:micro-safe={dashboardState.statusTone !== 'risk'}>{dashboardState.actionCopy}</p>
          </section>
          {#if quickAdjustVisible && quickAdjustRange && simulationState.valid && simulationState.usage && simulationState.simulatedTrip}
            <section class="quick-adjust-panel" aria-labelledby="quick-adjust-heading">
              <div class="quick-adjust-heading">
                <div>
                  <p>{deep('unsavedWhatIf')}</p>
                  <h2 id="quick-adjust-heading">{whatIfUi('title')}</h2>
                </div>
                <button class="text-button" type="button" onclick={closeQuickAdjuster}>{whatIfUi('close')}</button>
              </div>
              <StatusChip tone={simulatorStatusTone} label={simulationState.statusLabel} />
              <div class="quick-adjust-answer" aria-live="polite" aria-atomic="true">
                <strong class:quick-risk={simulationState.statusTone === 'risk'}>{simulationState.latestSafeExitLabel}</strong>
                <span>{simulationState.summaryCopy}</span>
              </div>
              <WhatIfAdjuster
                entryDate={simulatorForm.entryDate}
                exitDate={simulatorForm.exitDate}
                range={quickAdjustRange}
                {locale}
                onDatesChange={adjustQuickTrip}
              />
              <TimelineLedger
                label={deep('whatIfWindow')}
                {locale}
                mode={simulationState.statusTone === 'risk' ? 'risk' : 'planner'}
                trips={simulationBaseTrips}
                simulation={simulationState.simulatedTrip}
                referenceDate={simulationState.usage.referenceDate}
              />
            </section>
          {/if}
          <div class="button-row">
            <button class="primary-button" type="button" onclick={startAddTrip}>{ui('addTrip')}</button>
            {#if dashboardState.targetTrip && !quickAdjustVisible}<button class="secondary-button what-if-action" type="button" onclick={openQuickAdjuster}>{whatIfUi('adjust')}</button>{/if}
            <button class="secondary-button" type="button" onclick={() => setActiveScreen('proof')}>{ui('showCalculation')}</button>
            <button class="secondary-button" type="button" onclick={openCombinedPlanner}>{ui('planAnother')}</button>
          </div>
        {/if}
      </section>
    {:else if active === 'trip'}
      <section class="screen" aria-labelledby="trip-heading">
        <div class="section-heading">
          <p>{ui('navTrips')}</p>
          <h1 id="trip-heading" class="screen-title">{editingTripId ? deep('editStay') : deep('addStay')}</h1>
        </div>
        <p class="intro-copy">{deep('tripIntro')}</p>
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
              <input
                id="trip-exit"
                type="date"
                value={tripForm.exitDate}
                oninput={updateTripExitDate}
                aria-describedby={formErrors.exitDate ? 'exit-help exit-error' : 'exit-help'}
                aria-invalid={formErrors.exitDate ? 'true' : undefined}
              />
              <small id="exit-help">{deep('exitCounts')}</small>
              {#if formErrors.exitDate}<strong id="exit-error" class="field-error">{formErrors.exitDate}</strong>{/if}
            </div>
          </div>

          <div class="date-fields optional-border-fields">
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
            <div class="field-group">
              <label for="trip-exit-country"><span>{deep('leftVia')} <small>{deep('optional')}</small></span></label>
              <select
                id="trip-exit-country"
                bind:value={tripForm.exitCountryCode}
                aria-describedby={formErrors.exitCountryCode ? 'trip-border-help trip-exit-country-error' : 'trip-border-help'}
                aria-invalid={formErrors.exitCountryCode ? 'true' : undefined}
              >
                <option value="">{deep('chooseUseful')}</option>
                {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{countryName(country.code)}</option>{/each}
              </select>
              {#if formErrors.exitCountryCode}<strong id="trip-exit-country-error" class="field-error">{formErrors.exitCountryCode}</strong>{/if}
            </div>
          </div>
          <small id="trip-border-help">{deep('borderContext')}</small>

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

          {#if tripFormIsPast}
            <section class="inferred-trip-status" aria-live="polite">
              <strong>{deep('pastTrip')}</strong>
              <span>{deep('pastAuto')}</span>
            </section>
          {:else}
            <fieldset class="trip-status-options" aria-describedby={formErrors.status ? 'status-error' : undefined}>
              <legend>{deep('tripStatus')}</legend>
              <label class:selected={tripForm.status === 'booked'} class="toggle"><input type="radio" bind:group={tripForm.status} value="booked" /> {deep('booked')}</label>
              <label class:selected={tripForm.status === 'what-if'} class="toggle what-if-toggle"><input type="radio" bind:group={tripForm.status} value="what-if" /> {deep('whatIf')}</label>
            </fieldset>
          {/if}
          {#if formErrors.status}<strong id="status-error" class="field-error">{formErrors.status}</strong>{/if}
          {#if tripFormPreview}
            <section class="trip-form-summary" aria-live="polite">
              <strong>{displayRoute(tripFormPreview)}</strong>
              <span>{formatDateRange(tripEntryDate(tripFormPreview), tripExitDate(tripFormPreview))} · {countTripSchengenDays(tripFormPreview)} {rt('schengen')} {pluralize('day', countTripSchengenDays(tripFormPreview))}{countTripOutsideDays(tripFormPreview) > 0 ? ` · ${countTripOutsideDays(tripFormPreview)} ${pluralize('day', countTripOutsideDays(tripFormPreview))} ${rt('outside')}` : ''}</span>
            </section>
          {/if}
          <div class="trip-form-timeline">
            <TimelineLedger
              label={deep('allocation')}
              {locale}
              mode="planner"
              trips={tripFormTimelineTrips}
              referenceDate={tripFormTimelineReferenceDate}
            />
          </div>
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
      </section>
    {:else if active === 'trips'}
      <section class="screen" aria-labelledby="trips-heading">
        <div class="section-heading with-action">
          <div>
            <p>{accountState === 'synced' || accountState === 'syncing' ? deep('syncedHistory') : deep('deviceHistory')}</p>
            <h1 id="trips-heading" class="screen-title">{tripOnboarding('nav')}</h1>
          </div>
          <button class="primary-button" type="button" onclick={startAddTrip} disabled={trips.length >= MAX_TRIP_COUNT}>{ui('addTrip')}</button>
        </div>
        {#if trips.length === 0}
          <section class="empty-state" aria-labelledby="empty-trips-heading">
            <p class="onboarding-kicker">{tripOnboarding('step')}</p>
            <h2 id="empty-trips-heading">{tripOnboarding('title')}</h2>
            <p>{tripOnboarding('copy')}</p>
            <ol class="onboarding-list">
              <li>{tripOnboarding('pastAction')}</li>
              <li>{tripOnboarding('bookedAction')}</li>
            </ol>
            <div class="button-row">
              <button class="primary-button" type="button" onclick={startAddTrip}>{ui('addFirst')}</button>
              <button class="text-button" type="button" onclick={openCombinedPlanner}>{tripOnboarding('noHistory')}</button>
            </div>
          </section>
        {:else}
          <p class="list-summary">
            {rt('storedSummary', { count: tripCount(trips.length), synced: accountState === 'synced' || accountState === 'syncing' ? rt('syncedSuffix') : '.' })}
          </p>
          <div class="trip-list">
            {#each trips as trip (trip.id)}
              <article class:booked={trip.status === 'booked'} class:past={trip.status === 'past'} class:whatif={trip.status === 'what-if'}>
                <span class="state-strip {trip.status}" aria-hidden="true"></span>
                <div class="trip-copy">
                  <h2>{displayTripName(trip)}</h2>
                  {#if trip.label}<p class="trip-route">{displayRoute(trip)}</p>{/if}
                  <p>{formatDateRange(tripEntryDate(trip), tripExitDate(trip))} · {countTripSchengenDays(trip)} {rt('schengen')} {pluralize('day', countTripSchengenDays(trip))}{countTripOutsideDays(trip) > 0 ? ` · ${countTripOutsideDays(trip)} ${pluralize('day', countTripOutsideDays(trip))} ${rt('outside')}` : ''}</p>
                  <strong>{statusLabel(trip.status)}</strong>
                </div>
                <div class="trip-actions">
                  <button type="button" aria-label={`${deep('edit')} ${displayTripName(trip)}`} onclick={() => startEditTrip(trip)}>{deep('edit')}</button>
                  <button class="delete" type="button" aria-label={`${deep('delete')} ${displayTripName(trip)}`} onclick={() => requestDeleteTrip(trip.id)}>{deep('delete')}</button>
                </div>
              </article>
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
            {/each}
          </div>
          {#if trips.length >= MAX_TRIP_COUNT}
            <p class="storage-warning">{rt('limitReached', { max: MAX_TRIP_COUNT })}</p>
          {/if}
        {/if}
        <section class="trips-timeline" aria-labelledby="trips-timeline-heading">
          <div>
            <h2 id="trips-timeline-heading">{tripOnboarding('timelineTitle')}</h2>
            <p>{tripOnboarding('timelineHelp')}</p>
          </div>
          <TimelineLedger
            label={ui('rollingWindow')}
            {locale}
            mode={dashboardState.statusTone === 'risk' ? 'risk' : 'safe'}
            {trips}
            referenceDate={dashboardState.referenceDate}
          />
        </section>
        <section class="combined-planner" id="planner" aria-labelledby="planner-heading">
        <div class="section-heading">
          <p>{deep('unsavedWhatIf')}</p>
          <h2 id="planner-heading" class="combined-section-title">{tripOnboarding('plannerTitle')}</h2>
        </div>
        <p class="intro-copy">{deep('plannerIntro')}</p>
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
                  disabled={quickAdjustSourceId === null && trips.length >= MAX_TRIP_COUNT}
                >{tripOnboarding(simulationSaveStatus === 'past' ? 'savePast' : 'saveBooked')}</button>
                <button class="secondary-button" type="button" onclick={continueSimulation}>{tripOnboarding('keepExperimenting')}</button>
              </div>
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
          <button class="secondary-button" type="button" onclick={recordUnlockBuyIntent}>{unlockFakeDoorState.buttonLabel}</button>
        </section>
        {#if unlockFakeDoorState.showIntentMessage}
          <section class="panel mint" aria-live="polite">
            <h2>{rt('unlockNoted')}</h2>
            <p>{unlockFakeDoorState.messageCopy}</p>
            <p class="micro-safe">{rt('noPaymentPlanner')}</p>
          </section>
        {/if}
        </section>
      </section>
    {:else if active === 'proof'}
      <section class="screen" id="proof" aria-labelledby="proof-heading">
        <div class="section-heading">
          <p>{deep('proofEyebrow')}</p>
          <h1 id="proof-heading" class="screen-title">{deep('proofTitle')}</h1>
        </div>
        {#if locale !== 'en'}<p class="translation-note">{t('common.reviewedEnglishNotice')}</p>{/if}
        <section class="panel mint" aria-labelledby="explanation-heading" lang="en" dir="ltr">
          <h2 id="explanation-heading">{explanationState.heading}</h2>
          <p>{explanationState.summary}</p>
          <p class="micro-safe">{explanationState.verdictLine}</p>
        </section>
        <div>
          <p class="window-label">{deep('activeWindow')}</p>
          <p class="mono-range">{formatDateRange(dashboardState.usage.windowStart, dashboardState.usage.windowEnd)}</p>
        </div>
        <TimelineLedger label={deep('countedEvidence')} {locale} mode={dashboardState.statusTone === 'risk' ? 'risk' : 'safe'} {trips} referenceDate={dashboardState.referenceDate} />
        <div class="ledger">
          {#each explanationState.countedTripRows as row}
            <article>
              <div>
                <h2>{row.label}</h2>
                <p>{row.rangeLabel}</p>
              </div>
              <strong>{row.daysLabel}</strong>
            </article>
          {:else}
            <section class="empty-state compact-empty">
              <h2>{deep('noCounted')}</h2>
              <p>{rt('noCountedCopy')}</p>
            </section>
          {/each}
        </div>
        <section class="panel paper-panel" lang="en" dir="ltr">
          <h2>{deep('rulesUsed')}</h2>
          <ul class="rule-list">
            {#each explanationState.ruleBullets as bullet}<li>{bullet}</li>{/each}
          </ul>
        </section>
        <button class="secondary-button" type="button" onclick={() => setActiveScreen('returns')}>{deep('seeReturns')}</button>
      </section>
    {:else if active === 'returns'}
      <section class="screen" aria-labelledby="returns-heading">
        <div class="section-heading">
          <p>{rt('allowanceFrom', { date: formatDate(dashboardState.referenceDate) })}</p>
          <h1 id="returns-heading" class="screen-title">{returningForecast.summaryLabel}</h1>
        </div>
        <p class="window-label">{rt('usedOn', { used: returningForecast.currentUsedLabel, date: formatDate(dashboardState.referenceDate) })}</p>
        <TimelineLedger
          label={deep('returnsForecast')}
          {locale}
          mode="returns"
          {trips}
          referenceDate={dashboardState.referenceDate}
          returnDates={returningForecast.rows.map((row) => row.date)}
          horizonDays={returningForecast.horizonDays}
        />
        <section class="panel mint">
          <h2>{returningForecast.nextReturnLabel}</h2>
          <p>{rt('returnExplain')}</p>
        </section>
        <div class="return-list">
          {#each returningForecast.rows as row}
            <article>
              <strong>{row.dateLabel}</strong>
              <span>{row.daysLabel}</span>
              <p>{row.source}</p>
            </article>
          {:else}
            <section class="empty-state compact-empty">
              <h2>{rt('noReturnTitle')}</h2>
              <p>{rt('noReturnCopy', { days: returningForecast.horizonDays })}</p>
            </section>
          {/each}
        </div>
      </section>
    {:else if active === 'report'}
      <section class="screen" aria-labelledby="report-heading">
        <div class="section-heading">
          <p>{deep('reportEyebrow')}</p>
          <h1 id="report-heading" class="screen-title">{deep('reportTitle')}</h1>
        </div>
        {#if locale !== 'en'}<p class="translation-note">{t('common.reviewedEnglishNotice')}</p>{/if}
        <article class="report-preview" aria-label={deep('reportTitle')} lang="en" dir="ltr">
          <div class="brand report-brand"><SchngnLogo small /></div>
          <h2>{dashboardState.statusLabel} · {dashboardState.heroMetric}</h2>
          <p class="mono-range">{dashboardState.daysUsedLabel} days used · {formatDateRange(dashboardState.usage.windowStart, dashboardState.usage.windowEnd)}</p>
          <p>{explanationState.summary}</p>
          <p>{legal.footer}</p>
        </article>
        <section class="panel whatif-panel">
          <h2>{pdfFakeDoorState.messageTitle}</h2>
          <p>{pdfFakeDoorState.helperCopy}</p>
          <button class="primary-button" type="button" onclick={recordPdfBuyIntent}>{pdfFakeDoorState.buttonLabel}</button>
        </section>
        {#if pdfFakeDoorState.showIntentMessage}
          <section class="panel mint" aria-live="polite">
            <h2>{rt('requestNoted')}</h2>
            <p>{pdfFakeDoorState.messageCopy}</p>
            <p class="micro-safe">{rt('noPaymentReport')}</p>
          </section>
        {/if}
        <button class="secondary-button" type="button" onclick={() => setActiveScreen('waitlist')}>{rt('joinPdf')}</button>
      </section>
    {:else if active === 'privacy'}
      <section class="screen" aria-labelledby="privacy-heading">
        <div class="section-heading">
          <p>{deep('accountEyebrow')}</p>
          <h1 id="privacy-heading" class="screen-title">{deep('accountTitle')}</h1>
        </div>
        {#if locale !== 'en'}<p class="translation-note">{t('common.reviewedEnglishNotice')}</p>{/if}

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
              <button class="primary-button" type="button" onclick={startAccountSignUp}>{deep('signUp')}</button>
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
        <section class="panel paper-panel">
          <h2>{rt('officialSources')}</h2>
          <p>{rt('officialCopy')}</p>
          <div class="official-links stacked">
            {#each officialSourceLinks as source}<a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>{/each}
          </div>
        </section>
        <section class="panel paper-panel">
          <h2>{rt('analyticsTitle')}</h2>
          <p>{rt('analyticsCopy')}</p>
        </section>
      </section>
    {:else if active === 'waitlist'}
      <section class="screen narrow-screen" aria-labelledby="waitlist-heading">
        <button class="text-button" type="button" onclick={() => setActiveScreen('report')}>{rt('backReport')}</button>
        <div class="brand report-brand"><SchngnLogo small /></div>
        <h1 id="waitlist-heading" class="screen-title">{deep('waitlistTitle')}</h1>
        <p class="intro-copy">{deep('waitlistIntro')}</p>
        <form class="trip-form" onsubmit={(event) => { event.preventDefault(); submitWaitlist(); }}>
          <label for="waitlist-email"><span>{deep('email')}</span></label>
          <input id="waitlist-email" bind:value={waitlistEmail} autocomplete="email" maxlength="254" placeholder="name@example.com" type="email" required />
          <label class="consent-row" for="waitlist-consent">
            <input id="waitlist-consent" bind:checked={waitlistConsent} type="checkbox" required />
            <span>{rt('waitlistConsent')}</span>
          </label>
          <button class="primary-button" disabled={!waitlistEmail.trim() || !waitlistConsent || waitlistState === 'submitting' || waitlistState === 'stored'} type="submit">
            {waitlistState === 'submitting' ? deep('joining') : waitlistState === 'error' || waitlistState === 'not_configured' ? deep('tryAgain') : waitlistState === 'stored' ? deep('joined') : deep('join')}
          </button>
        </form>
        {#if waitlistState === 'stored'}
          <section class="panel mint" aria-live="polite"><h2>{deep('onList')}</h2><p>{deep('emailSaved')}</p></section>
        {:else if waitlistState === 'not_configured'}
          <section class="panel whatif-panel" aria-live="polite">
            <h2>{rt('emailNotConfirmed')}</h2>
            <p>{rt('waitlistUnconfigured')}</p>
          </section>
        {:else if waitlistState === 'error'}
          <section class="panel risk-panel" aria-live="polite"><h2>{deep('notSaved')}</h2><p>{waitlistError}</p></section>
        {/if}
      </section>
    {/if}

    <aside class="legal-footer" aria-label={rt('disclaimerAria')}><p>{legal.footer}</p></aside>
  </section>
</main>

<style>
  .app-shell {
    min-height: 100svh;
    padding: 18px;
  }

  .workspace {
    width: min(100%, 960px);
    margin: 0 auto;
    border: 1px solid var(--control-line);
    border-radius: 14px;
    background: var(--surface);
  }

  .app-header,
  .brand,
  .screen-tabs,
  .facts,
  .button-row,
  .form-actions,
  .trip-actions,
  .return-list article {
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
    gap: 10px;
    min-width: 0;
  }

  .brand {
    min-width: 0;
  }

  .account-chip {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    gap: 7px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    padding: 8px 11px;
    font-size: 0.84rem;
    font-weight: 760;
  }

  .account-chip > span {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--muted);
  }

  .account-chip.synced {
    border-color: color-mix(in srgb, var(--safe), var(--line) 35%);
    background: var(--safe-bg);
    color: var(--safe);
  }

  .account-chip.synced > span { background: var(--safe); }

  .account-chip.attention {
    border-color: color-mix(in srgb, var(--whatif), var(--line) 20%);
    background: var(--whatif-bg);
    color: var(--whatif);
  }

  .account-chip.attention > span { background: var(--whatif); }

  .screen-tabs {
    gap: 4px;
    overflow-x: auto;
    padding: 10px 14px;
    border-bottom: 1px solid var(--line);
    scrollbar-width: thin;
  }

  .screen-tabs button {
    min-height: 44px;
    flex: 0 0 auto;
    border: 1px solid transparent;
    border-radius: 8px;
    background: transparent;
    color: var(--muted);
    padding: 10px 12px;
    font-size: 0.94rem;
    font-weight: 720;
  }

  .screen-tabs button:hover {
    background: var(--paper);
    color: var(--ink);
  }

  .screen-tabs button.active {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--surface);
  }

  .screen {
    display: grid;
    width: min(100%, 760px);
    min-width: 0;
    margin: 0 auto;
    align-content: start;
    gap: 20px;
    padding: 28px 24px 36px;
  }

  .narrow-screen {
    width: min(100%, 600px);
  }

  .disclaimer-notice,
  .storage-alert,
  .legal-footer {
    width: min(calc(100% - 32px), 760px);
    margin: 16px auto 0;
    border-radius: 10px;
    padding: 14px;
  }

  .disclaimer-notice {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    border: 1px solid color-mix(in srgb, var(--whatif), var(--line) 35%);
    background: var(--whatif-bg);
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

  .disclaimer-notice h2,
  .legal-footer p,
  .section-heading h1,
  .section-heading p {
    margin: 0;
  }

  .disclaimer-notice p,
  .legal-footer p {
    max-width: 72ch;
    margin: 6px 0 0;
    color: var(--muted);
    line-height: 1.45;
    text-wrap: pretty;
  }

  .translation-note {
    font-size: 0.82rem;
  }

  .official-links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .official-links.stacked {
    display: grid;
  }

  .official-links a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--surface);
    color: var(--ink);
    padding: 8px 10px;
    font-size: 0.88rem;
    font-weight: 740;
    text-decoration: none;
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
  .report-preview,
  .empty-state,
  .confirm-panel {
    min-width: 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    padding: 16px;
  }

  .panel h2,
  .report-preview h2,
  .empty-state h2,
  .confirm-panel h2,
  .trip-list h2,
  .ledger h2 {
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.3;
    overflow-wrap: anywhere;
    text-wrap: pretty;
  }

  .panel p,
  .report-preview p,
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

  .quick-adjust-panel {
    display: grid;
    gap: 16px;
    min-width: 0;
    border: 1px solid color-mix(in srgb, var(--whatif), var(--line) 30%);
    border-radius: 12px;
    background: var(--whatif-bg);
    padding: 16px;
  }

  .quick-adjust-heading {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  .quick-adjust-heading p,
  .quick-adjust-heading h2 {
    margin: 0;
  }

  .quick-adjust-heading p {
    margin-bottom: 3px;
    color: var(--whatif);
    font-size: 0.78rem;
    font-weight: 760;
  }

  .quick-adjust-heading h2 {
    font-size: 1.25rem;
    line-height: 1.25;
  }

  .quick-adjust-answer {
    display: grid;
    grid-template-columns: minmax(140px, auto) 1fr;
    align-items: baseline;
    gap: 8px 16px;
  }

  .quick-adjust-answer strong {
    color: var(--safe);
    font-size: 1.35rem;
    line-height: 1.15;
  }

  .quick-adjust-answer strong.quick-risk { color: var(--risk); }

  .quick-adjust-answer span {
    color: var(--muted);
    line-height: 1.45;
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
  .text-button,
  .trip-actions button {
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

  .trip-form-timeline { margin-top: 8px; }

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

  .inferred-trip-status {
    display: grid;
    gap: 3px;
    margin-top: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    padding: 12px;
  }

  .inferred-trip-status strong { color: var(--ink); }

  .inferred-trip-status span {
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.45;
  }

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

  .field-group {
    display: grid;
    min-width: 0;
    gap: 6px;
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

  input::placeholder { color: #596761; }
  input[aria-invalid='true'],
  select[aria-invalid='true'] { border-color: var(--risk); }

  fieldset {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin: 10px 0 0;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px;
  }

  fieldset.trip-status-options { grid-template-columns: repeat(2, minmax(0, 1fr)); }

  legend {
    padding: 0 5px;
    color: var(--muted);
    font-weight: 740;
  }

  .toggle {
    display: flex;
    min-height: 44px;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    border-radius: 8px;
    color: var(--muted);
    font-weight: 720;
  }

  .toggle.selected {
    border-color: var(--booked);
    background: var(--booked-bg);
    color: var(--booked);
  }

  .toggle.what-if-toggle.selected {
    border-color: var(--whatif);
    background: var(--whatif-bg);
    color: var(--whatif);
  }

  .toggle:has(input:focus-visible) { outline: 3px solid var(--safe); outline-offset: 2px; }
  .toggle input {
    position: absolute;
    width: 1px;
    height: 1px;
    min-height: 0;
    margin: -1px;
    overflow: hidden;
    opacity: 0;
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
  .ledger,
  .return-list,
  .simulation-result {
    display: grid;
    gap: 10px;
    min-width: 0;
  }

  .trip-list article,
  .ledger article {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    padding: 12px;
    content-visibility: auto;
    contain-intrinsic-size: 76px;
  }

  .trip-list article.booked { background: var(--booked-bg); }
  .trip-list article.whatif { background: var(--whatif-bg); }
  .trip-list article.past { background: var(--surface); }

  .onboarding-steps ol,
  .onboarding-list {
    display: grid;
    gap: 8px;
    margin: 12px 0 0;
    padding-inline-start: 24px;
  }

  .onboarding-steps li::marker,
  .onboarding-list li::marker {
    color: var(--safe);
    font-weight: 800;
  }

  .onboarding-kicker {
    margin: 0;
    color: var(--safe);
    font-weight: 750;
  }

  .trips-timeline {
    display: grid;
    gap: 12px;
    margin-top: 28px;
    padding-top: 24px;
    border-top: 1px solid var(--line);
  }

  .trips-timeline h2,
  .trips-timeline p {
    margin: 0;
  }

  .trips-timeline p {
    margin-top: 4px;
    color: var(--muted);
  }

  .combined-planner {
    display: grid;
    gap: 16px;
    scroll-margin-top: 16px;
    margin-top: 30px;
    border-top: 2px solid var(--whatif);
    padding-top: 26px;
  }

  .combined-section-title {
    margin: 0;
    color: var(--whatif);
    font-size: 1.65rem;
    line-height: 1.15;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }

  .simulation-save-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .trip-copy,
  .ledger article > div {
    min-width: 0;
    flex: 1;
  }

  .trip-list p,
  .ledger p {
    margin: 3px 0 0;
    color: var(--muted);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
    font-size: 0.8rem;
    overflow-wrap: anywhere;
  }

  .trip-list .trip-route {
    color: var(--ink);
    font-family: 'Source Sans 3', ui-sans-serif, system-ui, sans-serif;
    font-size: 0.85rem;
    font-weight: 650;
  }

  .trip-copy strong,
  .ledger strong {
    display: block;
    margin-top: 5px;
    color: var(--booked);
    font-size: 0.8rem;
  }

  .trip-list article.whatif .trip-copy strong { color: var(--whatif); }

  .trip-actions {
    flex: 0 0 auto;
    gap: 4px;
  }

  .trip-actions button {
    border: 0;
    background: transparent;
    color: var(--ink);
    padding-inline: 10px;
  }

  .trip-actions button.delete { color: var(--risk); }

  .state-strip {
    width: 5px;
    height: 48px;
    flex: 0 0 auto;
    border-radius: 3px;
    background: var(--past);
  }

  .state-strip.booked { background: var(--booked); }
  .state-strip.what-if { background: var(--whatif); }
  .state-strip.past { background: var(--past); }

  .confirm-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .compact-empty { padding: 14px; }

  .return-list article {
    min-width: 0;
    justify-content: space-between;
    gap: 12px;
    border-bottom: 1px solid var(--line);
    padding: 12px 0;
  }

  .return-list span {
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--safe), var(--line) 35%);
    border-radius: 6px;
    background: var(--safe-bg);
    color: var(--safe);
    padding: 6px 8px;
    font-weight: 760;
  }

  .return-list p {
    max-width: 42ch;
    margin: 0;
    color: var(--muted);
    font-size: 0.88rem;
    overflow-wrap: anywhere;
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

  .report-preview {
    display: grid;
    gap: 10px;
    border-color: var(--ink);
  }

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
    .screen { padding: 24px 16px 32px; }
    .screen-title { font-size: 2rem; }
    .verdict { font-size: 2.6rem; }
    .disclaimer-notice { flex-direction: column; }
    .date-fields { grid-template-columns: 1fr; }
    .outside-breaks-heading { align-items: stretch; flex-direction: column; }
    .outside-breaks-heading .compact-button { width: 100%; }
    .section-heading.with-action { align-items: flex-start; flex-direction: column; }
    .trip-list article { align-items: flex-start; flex-wrap: wrap; }
    .trip-actions { width: 100%; justify-content: flex-end; border-top: 1px solid var(--line); padding-top: 6px; }
    .confirm-panel { align-items: stretch; flex-direction: column; }
    .account-choice-grid { grid-template-columns: 1fr; }
    .return-list article { align-items: flex-start; flex-wrap: wrap; }
    .return-list p { width: 100%; max-width: none; }
    .quick-adjust-answer { grid-template-columns: 1fr; }
    .simulation-save-actions { grid-template-columns: 1fr; }
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
