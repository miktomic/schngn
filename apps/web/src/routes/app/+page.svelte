<script lang="ts">
  import { browser } from '$app/environment';
  import { env } from '$env/dynamic/public';
  import { onMount } from 'svelte';
  import { FactCard, SchngnLogo, StatusChip, TimelineLedger } from '$lib/design';
  import { buildDashboardState } from '$lib/dashboard/dashboardState';
  import { buildTripSimulationState, emptyProposedTrip, type ProposedTripInput } from '$lib/simulator/tripSimulator';
  import { buildReturningDaysForecast } from '$lib/returns/returningDays';
  import { buildExplanationState } from '$lib/explanation/explanationState';
  import { FOOTER_DISCLAIMER_COPY, FULL_DISCLAIMER_COPY, OFFICIAL_SOURCE_LINKS } from '$lib/legal/legalCopy';
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
    formatTripRange,
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

  const screens: { key: NavScreen; label: string; requiresTrips?: boolean }[] = [
    { key: 'dashboard', label: 'Overview' },
    { key: 'trips', label: 'Trips' },
    { key: 'planner', label: 'Planner' },
    { key: 'proof', label: 'Proof', requiresTrips: true },
    { key: 'returns', label: 'Returns', requiresTrips: true },
    { key: 'report', label: 'Report', requiresTrips: true },
    { key: 'privacy', label: 'Account' }
  ];

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
  let simulatorForm: ProposedTripInput = emptySimulationForm();
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
  $: dashboardState = buildDashboardState(trips);
  $: dashboardStatusTone = (dashboardState.statusTone === 'risk' ? 'risk' : dashboardState.statusTone === 'close' ? 'whatif' : 'safe') as
    | 'safe'
    | 'risk'
    | 'whatif';
  $: dashboardTextClass = dashboardState.statusTone === 'risk' ? 'risk-text' : dashboardState.statusTone === 'close' ? 'close-text' : 'safe-text';
  $: simulationState = buildTripSimulationState(trips, simulatorForm);
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
  $: simulatorStatusTone = (simulationState.statusTone === 'risk' ? 'risk' : simulationState.statusTone === 'close' ? 'whatif' : 'safe') as
    | 'safe'
    | 'risk'
    | 'whatif';
  $: returningForecast = buildReturningDaysForecast(trips, { referenceDate: dashboardState.referenceDate, horizonDays: 30 });
  $: explanationState = buildExplanationState(trips, dashboardState.referenceDate);
  $: pdfFakeDoorState = buildPdfReportFakeDoorState(pdfIntentMessageVisible);
  $: unlockFakeDoorState = buildUnlockFakeDoorState(unlockPrice, unlockIntentMessageVisible);
  $: pendingDeleteTrip = trips.find((trip) => trip.id === pendingDeleteTripId) ?? null;
  $: accountSignedIn = clerkAuth?.available === true && clerkAuth.isSignedIn && clerkAuth.userId !== null;
  $: accountEmail = clerkAuth?.available === true ? clerkAuth.email : null;
  $: accountStatusLabel = accountHeaderLabel(accountState, accountSignedIn);

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
        accountError = 'Account updates could not be monitored safely. Local-only mode is still available.';
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
        accountError = 'Your account session could not be verified. Retry or sign in again; local trips are unchanged.';
      }
      return;
    }

    const result = await getAccountTrips(context.token);
    if (!isCurrentAccountIdentity(context)) return;
    if (result.ok === false) {
      accountState = 'error';
      accountError = result.code === 'unauthorized'
        ? 'Your session expired. Sign in again to access account trips.'
        : 'Account trips could not be reached. Your local trips are unchanged.';
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
      applyCloudSnapshot(result.snapshot, context.userId, 'Restored the account copy because this browser had no complete saved snapshot.');
      return;
    }
    if (!localTripsDurable && result.snapshot.revision > 0) {
      accountState = 'conflict';
      accountError = 'This browser could not provide a reliable saved trip copy. Choose the account copy to recover it, or explicitly replace the account only if this tab is correct.';
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
      applyCloudSnapshot(result.snapshot, context.userId, 'Loaded your saved account trips on this device.');
      return;
    }
    if (reconciliation.action === 'push_local') {
      await enqueueAccountWrite(trips, result.snapshot.revision, 'Offline changes are now synced.', localTripsDurable);
      return;
    }
    if (reconciliation.action === 'synced') {
      accountSnapshot = result.snapshot;
      accountState = 'synced';
      return;
    }

    accountState = 'conflict';
    accountError = 'This browser and your account both contain changes. Choose which copy to keep; SCHNGN will not overwrite either automatically.';
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
            accountError = 'Your account session could not be verified. Local trips are unchanged.';
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
          accountError = 'Trips remain saved on this device, but account sync could not finish.';
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
        accountError = localPersisted
          ? 'Account trips were saved, but sync status could not be stored safely in this browser.'
          : 'Account trips were saved, but this browser did not persist the matching local copy. Reload to restore the account copy.';
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
      accountError = 'Another device changed these account trips first. Choose the account copy or replace it with this device.';
      return false;
    }

    accountState = 'error';
    accountError = result.code === 'unauthorized'
      ? 'Your session expired. Sign in again before syncing.'
      : 'Trips remain saved on this device, but account sync could not finish. Retry when you are online.';
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
      accountError = 'Account trips are available in this tab, but could not be stored safely in this browser.';
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
      `${trips.length} ${pluralize('trip', trips.length)} now ${trips.length === 1 ? 'syncs' : 'sync'} with your account.`
    );
    if (saved) accountConsent = false;
  }

  function useAccountTrips(): void {
    const identity = captureAccountIdentity();
    if (!identity) return;
    applyCloudSnapshot(accountSnapshot, identity.userId, 'This device now uses the account copy.');
  }

  async function replaceAccountTrips(): Promise<void> {
    if (accountSnapshot.revision === 0 && !accountConsent) return;
    const saved = await enqueueAccountWrite(trips, accountSnapshot.revision, 'The account copy now matches this device.');
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
        accountError = 'Your account session could not be verified. No account data was deleted.';
      }
      return;
    }

    const result = await deleteAccountData(context.token);
    accountDeleteInProgress = false;
    pendingAccountWrites = Math.max(0, pendingAccountWrites - 1);
    if (!isCurrentAccountIdentity(context)) return;
    if (result.ok === false) {
      accountState = 'error';
      accountError = result.code === 'unauthorized'
        ? 'Your session expired. Sign in again before deleting account data.'
        : 'Cloud trip data could not be deleted. Nothing was changed on this device.';
      return;
    }

    accountSnapshot = { trips: [], revision: 0, updatedAt: null, consentVersion: null };
    accountDeleteConfirmationVisible = false;
    signOutClearConfirmationVisible = false;
    accountConsent = false;
    accountState = 'offer_sync';
    accountError = '';
    accountNotice = 'Cloud trip data was deleted. Trips on this browser remain local-only.';
  }

  async function startAccountSignUp(): Promise<void> {
    const auth = clerkAuth;
    if (!auth?.available) return;
    try {
      await auth.redirectToSignUp({ redirectUrl: accountReturnUrl() });
    } catch {
      accountError = 'The secure sign-up page could not be opened. Try again.';
    }
  }

  async function startAccountSignIn(): Promise<void> {
    const auth = clerkAuth;
    if (!auth?.available) return;
    try {
      await auth.redirectToSignIn({ redirectUrl: accountReturnUrl() });
    } catch {
      accountError = 'The secure sign-in page could not be opened. Try again.';
    }
  }

  async function manageClerkAccount(): Promise<void> {
    const auth = clerkAuth;
    if (!auth?.available || !auth.isSignedIn) return;
    try {
      await auth.redirectToUserProfile();
    } catch {
      accountError = 'The secure account portal could not be opened. Try again.';
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
      accountError = clearBrowser
        ? 'Trips were cleared from this browser, but sign-out did not complete. Try signing out again before sharing this device.'
        : 'Sign-out did not complete. Your trips and account session are unchanged.';
      return;
    }
    accountSignOutInProgress = false;
    pendingAccountWrites = Math.max(0, pendingAccountWrites - 1);
    await synchronizeClerkIdentity();
    accountNotice = clearBrowser
      ? 'Signed out and cleared trip data from this browser.'
      : 'Signed out. Trips remain on this browser unless you clear them.';
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
    formErrors = result.errors;
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
    importMessage = 'Exported a private JSON backup containing your trip dates.';
    importError = '';
  }

  async function importTrips(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > MAX_TRIP_BACKUP_BYTES) {
      input.value = '';
      importError = 'Import file is too large.';
      importMessage = '';
      return;
    }

    const result = importTripsFromJson(await file.text());
    input.value = '';
    if (result.ok === false) {
      importError = result.error;
      importMessage = '';
      return;
    }

    const persisted = persistTrips(result.trips);
    importError = '';
    importMessage = persisted
      ? `Imported ${result.trips.length} ${pluralize('trip', result.trips.length)}. The calculation has been refreshed on this device.`
      : `Imported ${result.trips.length} ${pluralize('trip', result.trips.length)} into this tab, but browser storage failed.`;
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
      accountNotice = 'Local trips were cleared. Your account copy is unchanged; choose which copy to keep before sync resumes.';
    }
    clearConfirmationVisible = false;
    pendingDeleteTripId = null;
    importMessage = 'Trip data is now cleared from this tab.';
    importError = '';
    setActiveScreen('privacy');
  }

  function statusLabel(status: EditableTrip['status']): string {
    if (status === 'past') return 'Past, counted';
    if (status === 'booked') return 'Booked, counted';
    return 'What-if';
  }

  function runSimulation(): void {
    simulationSubmitted = true;
    if (simulationState.valid) trackSimulationRun('planner');
  }

  function clearSimulation(): void {
    simulatorForm = emptySimulationForm();
    simulationSubmitted = false;
  }

  function simulationChanged(): void {
    simulationSubmitted = false;
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
    return SCHENGEN_COUNTRY_OPTIONS.find((country) => country.code === code)?.name ?? null;
  }

  function displayRoute(trip: EditableTrip): string {
    const entry = countryName(trip.entryCountryCode);
    const exit = countryName(trip.exitCountryCode);
    if (entry && exit) return `${entry} → ${exit}`;
    if (entry) return `Entered via ${entry}`;
    if (exit) return `Left via ${exit}`;
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
      waitlistError = 'The request could not reach SCHNGN. Check your connection and try again; your email was not confirmed as saved.';
    }
  }

  function waitlistRecoveryCopy(status: number): string {
    if (status === 400) return 'Check the email address and consent, then try again.';
    if (status === 413) return 'The request was rejected as too large. Reload this page and try again.';
    if (status === 415) return 'The service could not read the request. Reload this page and try again.';
    if (status === 429) return 'Too many attempts were made. Wait a few minutes, then try again.';
    if (status >= 500) return 'The waitlist service is temporarily unavailable. Try again later; your email was not confirmed as saved.';
    return 'The email could not be saved. Review the form and try again.';
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
    if (screen === 'planner') return 'planner';
    return 'app';
  }

  function formatDate(isoDate: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(`${isoDate}T00:00:00.000Z`)
    );
  }

  function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);
    const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
    const startLabel = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' }),
      timeZone: 'UTC'
    }).format(start);
    return `${startLabel}–${formatDate(endDate)}`;
  }

  function pluralize(word: string, count: number): string {
    return count === 1 ? word : `${word}s`;
  }

  function accountHeaderLabel(state: AccountState, signedIn: boolean): string {
    if (state === 'loading') return 'Account…';
    if (state === 'unavailable') return 'Local only';
    if (!signedIn || state === 'guest') return 'Sign in';
    if (state === 'syncing') return 'Syncing…';
    if (state === 'synced') return 'Synced';
    if (state === 'error') return 'Sync paused';
    if (state === 'conflict' || state === 'paused') return 'Review sync';
    return 'Account ready';
  }

  function formatAccountUpdatedAt(value: string | null): string {
    if (!value) return 'Not synced yet';
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>SCHNGN app — private Schengen planner</title>
  <meta name="description" content="Calculate Schengen 90/180-day plans locally, with optional consented account sync." />
</svelte:head>

<main class="app-shell">
  <section class="workspace" aria-labelledby="app-title">
    <header class="app-header">
      <div class="brand" id="app-title">
        <SchngnLogo />
      </div>
      <button
        class:attention={accountState === 'conflict' || accountState === 'paused' || accountState === 'error'}
        class:synced={accountState === 'synced' || accountState === 'syncing'}
        class="account-chip"
        type="button"
        aria-label={`Open Account — ${accountStatusLabel}`}
        onclick={() => setActiveScreen('privacy')}
      >
        <span aria-hidden="true"></span>{accountStatusLabel}
      </button>
    </header>

    <nav class="screen-tabs" aria-label="App sections">
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
        <strong>Browser storage needs attention</strong>
        <span>{storageWarning}</span>
      </aside>
    {/if}

    {#if disclaimerNoticeVisible}
      <aside class="disclaimer-notice" aria-labelledby="disclaimer-heading">
        <div>
          <h2 id="disclaimer-heading">Planning calculator only</h2>
          <p>{FULL_DISCLAIMER_COPY}</p>
          <div class="official-links" aria-label="Official source links">
            {#each OFFICIAL_SOURCE_LINKS as source}
              <a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>
            {/each}
          </div>
        </div>
        <button class="secondary-button compact" type="button" onclick={() => (disclaimerNoticeVisible = false)}>Dismiss</button>
      </aside>
    {/if}

    {#if active === 'dashboard'}
      <section class="screen" aria-labelledby="overview-heading">
        {#if !hasLoadedTrips}
          <div class="loading-state" aria-live="polite">
            <span class="loading-line" aria-hidden="true"></span>
            <h1 id="overview-heading" class="screen-title">Loading your trips…</h1>
            <p>Reading local data from this browser.</p>
          </div>
        {:else if trips.length === 0}
          <StatusChip tone="safe" label="No trip data stored" />
          <h1 id="overview-heading" class="screen-title">Start with your travel dates</h1>
          <p class="intro-copy">Add past and booked stays to get a real 90/180-day answer. SCHNGN starts empty, so no example itinerary can affect your result.</p>
          <section class="panel mint" aria-labelledby="first-step-heading">
            <h2 id="first-step-heading">Your first useful result</h2>
            <p>Add entry and exit dates for one stay. Both days count. Your dates remain in this browser.</p>
          </section>
          <div class="button-row">
            <button class="primary-button" type="button" onclick={startAddTrip}>Add your first trip</button>
            <button class="secondary-button" type="button" onclick={() => setActiveScreen('planner')}>Try a what-if plan</button>
          </div>
        {:else}
          <StatusChip tone={dashboardStatusTone} label={dashboardState.statusLabel} />
          <h1 id="overview-heading" class={`verdict ${dashboardTextClass}`}>{dashboardState.heroMetric}</h1>
          <div class="facts two">
            <FactCard label="Latest safe exit" value={dashboardState.latestSafeExitLabel} />
            <FactCard label="Days used" value={dashboardState.daysUsedLabel} tone={dashboardState.statusTone === 'risk' ? 'ink' : 'safe'} />
          </div>
          <TimelineLedger
            label="Rolling 180-day window"
            mode={dashboardState.statusTone === 'risk' ? 'risk' : 'safe'}
            {trips}
            referenceDate={dashboardState.referenceDate}
          />
          <section class:risk-panel={dashboardState.statusTone === 'risk'} class:mint={dashboardState.statusTone !== 'risk'} class="panel" aria-labelledby="why-heading">
            <h2 id="why-heading">{dashboardState.statusTone === 'risk' ? 'What needs attention' : 'Why this answer'}</h2>
            <p>{dashboardState.whyCopy}</p>
            <p class:micro-risk={dashboardState.statusTone === 'risk'} class:micro-safe={dashboardState.statusTone !== 'risk'}>{dashboardState.actionCopy}</p>
          </section>
          <div class="button-row">
            <button class="primary-button" type="button" onclick={startAddTrip}>Add trip</button>
            <button class="secondary-button" type="button" onclick={() => setActiveScreen('proof')}>Show calculation</button>
            <button class="secondary-button" type="button" onclick={() => setActiveScreen('planner')}>Plan another trip</button>
          </div>
        {/if}
      </section>
    {:else if active === 'trip'}
      <section class="screen" aria-labelledby="trip-heading">
        <div class="section-heading">
          <p>Trips</p>
          <h1 id="trip-heading" class="screen-title">{editingTripId ? 'Edit Schengen stay' : 'Add a Schengen stay'}</h1>
        </div>
        <p class="intro-copy">Enter when you crossed into and out of the Schengen Area. Travel between Schengen countries is one stay.</p>
        <form class="trip-form" aria-label="Trip form" novalidate onsubmit={(event) => { event.preventDefault(); saveTrip(); }}>
          <label for="trip-label">
            <span>Trip label <small>Optional</small></span>
          </label>
          <input
            id="trip-label"
            bind:value={tripForm.label}
            maxlength={MAX_TRIP_LABEL_LENGTH}
            placeholder="Summer trip"
            aria-describedby={formErrors.label ? 'trip-label-help trip-label-error' : 'trip-label-help'}
            aria-invalid={formErrors.label ? 'true' : undefined}
          />
          <small id="trip-label-help">Up to {MAX_TRIP_LABEL_LENGTH} characters. If blank, the entry and exit countries become the label.</small>
          {#if formErrors.label}<strong id="trip-label-error" class="field-error">{formErrors.label}</strong>{/if}

          <div class="date-fields">
            <div class="field-group">
              <label for="trip-entry"><span>Entered Schengen</span></label>
              <input
                id="trip-entry"
                type="date"
                bind:value={tripForm.entryDate}
                aria-describedby={formErrors.entryDate ? 'entry-help entry-error' : 'entry-help'}
                aria-invalid={formErrors.entryDate ? 'true' : undefined}
              />
              <small id="entry-help">The entry day counts.</small>
              {#if formErrors.entryDate}<strong id="entry-error" class="field-error">{formErrors.entryDate}</strong>{/if}
            </div>
            <div class="field-group">
              <label for="trip-exit"><span>Left Schengen</span></label>
              <input
                id="trip-exit"
                type="date"
                value={tripForm.exitDate}
                oninput={updateTripExitDate}
                aria-describedby={formErrors.exitDate ? 'exit-help exit-error' : 'exit-help'}
                aria-invalid={formErrors.exitDate ? 'true' : undefined}
              />
              <small id="exit-help">The exit day counts. Same-day stays are valid.</small>
              {#if formErrors.exitDate}<strong id="exit-error" class="field-error">{formErrors.exitDate}</strong>{/if}
            </div>
          </div>

          <div class="date-fields optional-border-fields">
            <div class="field-group">
              <label for="trip-entry-country"><span>Entered via <small>Optional</small></span></label>
              <select
                id="trip-entry-country"
                value={tripForm.entryCountryCode}
                onchange={updateTripEntryCountry}
                aria-describedby={formErrors.entryCountryCode ? 'trip-border-help trip-entry-country-error' : 'trip-border-help'}
                aria-invalid={formErrors.entryCountryCode ? 'true' : undefined}
              >
                <option value="">Choose if useful</option>
                {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{country.name}</option>{/each}
              </select>
              {#if formErrors.entryCountryCode}<strong id="trip-entry-country-error" class="field-error">{formErrors.entryCountryCode}</strong>{/if}
            </div>
            <div class="field-group">
              <label for="trip-exit-country"><span>Left via <small>Optional</small></span></label>
              <select
                id="trip-exit-country"
                bind:value={tripForm.exitCountryCode}
                aria-describedby={formErrors.exitCountryCode ? 'trip-border-help trip-exit-country-error' : 'trip-border-help'}
                aria-invalid={formErrors.exitCountryCode ? 'true' : undefined}
              >
                <option value="">Choose if useful</option>
                {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{country.name}</option>{/each}
              </select>
              {#if formErrors.exitCountryCode}<strong id="trip-exit-country-error" class="field-error">{formErrors.exitCountryCode}</strong>{/if}
            </div>
          </div>
          <small id="trip-border-help">Optional — these countries provide context but do not affect the calculation.</small>

          <section class="outside-breaks" aria-labelledby="trip-breaks-heading">
            <div class="outside-breaks-heading">
              <div>
                <h2 id="trip-breaks-heading">Time outside Schengen</h2>
                <p>Add a break only if you left the Schengen Area and later returned during this trip.</p>
              </div>
              {#if tripForm.outsideBreaks.length === 0}
                <button class="secondary-button compact-button" type="button" onclick={addTripOutsideBreak}>Add time outside</button>
              {/if}
            </div>
            {#each tripForm.outsideBreaks as outsideBreak, index (outsideBreak.id)}
              <fieldset class="outside-break" aria-labelledby={`trip-break-${outsideBreak.id}-legend`}>
                <div class="outside-break-title">
                  <legend id={`trip-break-${outsideBreak.id}-legend`}>Outside-Schengen break {index + 1}</legend>
                  <button type="button" class="text-button delete" onclick={() => removeTripOutsideBreak(outsideBreak.id)}>Remove break</button>
                </div>
                <div class="date-fields">
                  <div class="field-group">
                    <label for={`trip-break-left-${outsideBreak.id}`}><span>Left Schengen</span></label>
                    <input id={`trip-break-left-${outsideBreak.id}`} type="date" bind:value={outsideBreak.leftDate} aria-invalid={formErrors.breakFields?.[outsideBreak.id]?.leftDate ? 'true' : undefined} />
                    {#if formErrors.breakFields?.[outsideBreak.id]?.leftDate}<strong class="field-error">{formErrors.breakFields[outsideBreak.id].leftDate}</strong>{/if}
                  </div>
                  <div class="field-group">
                    <label for={`trip-break-return-${outsideBreak.id}`}><span>Re-entered Schengen</span></label>
                    <input id={`trip-break-return-${outsideBreak.id}`} type="date" bind:value={outsideBreak.reentryDate} aria-invalid={formErrors.breakFields?.[outsideBreak.id]?.reentryDate ? 'true' : undefined} />
                    {#if formErrors.breakFields?.[outsideBreak.id]?.reentryDate}<strong class="field-error">{formErrors.breakFields[outsideBreak.id].reentryDate}</strong>{/if}
                  </div>
                </div>
              </fieldset>
            {/each}
            {#if tripForm.outsideBreaks.length > 0 && tripForm.outsideBreaks.length < MAX_OUTSIDE_BREAKS}
              <button class="secondary-button add-break-button" type="button" onclick={addTripOutsideBreak}>+ Add another outside-Schengen break</button>
            {/if}
            {#if formErrors.outsideBreaks}<strong class="field-error">{formErrors.outsideBreaks}</strong>{/if}
          </section>

          {#if tripFormIsPast}
            <section class="inferred-trip-status" aria-live="polite">
              <strong>Past trip</strong>
              <span>The final exit is before today, so this trip will be counted as past automatically.</span>
            </section>
          {:else}
            <fieldset class="trip-status-options" aria-describedby={formErrors.status ? 'status-error' : undefined}>
              <legend>Trip status</legend>
              <label class:selected={tripForm.status === 'booked'} class="toggle"><input type="radio" bind:group={tripForm.status} value="booked" /> Booked</label>
              <label class:selected={tripForm.status === 'what-if'} class="toggle"><input type="radio" bind:group={tripForm.status} value="what-if" /> What-if</label>
            </fieldset>
          {/if}
          {#if formErrors.status}<strong id="status-error" class="field-error">{formErrors.status}</strong>{/if}
          {#if tripFormPreview}
            <section class="trip-form-summary" aria-live="polite">
              <strong>{displayRoute(tripFormPreview)}</strong>
              <span>{formatTripRange({ entryDate: tripEntryDate(tripFormPreview), exitDate: tripExitDate(tripFormPreview) })} · {countTripSchengenDays(tripFormPreview)} Schengen {pluralize('day', countTripSchengenDays(tripFormPreview))}{countTripOutsideDays(tripFormPreview) > 0 ? ` · ${countTripOutsideDays(tripFormPreview)} ${pluralize('day', countTripOutsideDays(tripFormPreview))} outside` : ''}</span>
            </section>
          {/if}
          <div class="trip-form-timeline">
            <TimelineLedger
              label="Your 180-day allocation"
              mode="planner"
              trips={tripFormTimelineTrips}
              referenceDate={tripFormTimelineReferenceDate}
            />
          </div>
          {#if outsideWindowConfirmationVisible}
            <section class="outside-window-confirmation" role="alert" aria-labelledby="outside-window-heading">
              <h2 id="outside-window-heading">This trip is outside today’s 180-day window</h2>
              <p>It ended before {formatDate(tripFormWindowStartDate)}, so it will not change today’s day allocation. You can still keep it in your history.</p>
              <div class="button-row compact-actions">
                <button class="primary-button" type="button" onclick={() => saveTrip(true)}>Save anyway</button>
                <button class="secondary-button" type="button" onclick={() => { outsideWindowConfirmationVisible = false; }}>Keep editing</button>
              </div>
            </section>
          {/if}
          {#if formErrors.tripCount}
            <strong class="field-error form-error" aria-live="polite">{formErrors.tripCount}</strong>
          {/if}
          {#if !outsideWindowConfirmationVisible}
            <div class="form-actions">
              <button class="primary-button" type="submit">Save trip</button>
              <button class="secondary-button" type="button" onclick={cancelTripForm}>Cancel</button>
            </div>
          {/if}
        </form>
      </section>
    {:else if active === 'trips'}
      <section class="screen" aria-labelledby="trips-heading">
        <div class="section-heading with-action">
          <div>
            <p>{accountState === 'synced' || accountState === 'syncing' ? 'Account-synced trip history' : 'Trip history on this device'}</p>
            <h1 id="trips-heading" class="screen-title">Trips</h1>
          </div>
          <button class="primary-button" type="button" onclick={startAddTrip} disabled={trips.length >= MAX_TRIP_COUNT}>Add trip</button>
        </div>
        {#if trips.length === 0}
          <section class="empty-state" aria-labelledby="empty-trips-heading">
            <h2 id="empty-trips-heading">No trips saved yet</h2>
            <p>Add past and booked travel to calculate your real rolling window, or use Planner for an unsaved what-if.</p>
            <div class="button-row">
              <button class="primary-button" type="button" onclick={startAddTrip}>Add your first trip</button>
              <button class="secondary-button" type="button" onclick={() => setActiveScreen('planner')}>Open planner</button>
            </div>
          </section>
        {:else}
          <p class="list-summary">
            {trips.length} {pluralize('trip', trips.length)} stored on this device{accountState === 'synced' || accountState === 'syncing' ? ' and synced to your account.' : '.'}
          </p>
          <div class="trip-list">
            {#each trips as trip (trip.id)}
              <article class:booked={trip.status === 'booked'} class:past={trip.status === 'past'}>
                <span class="state-strip {trip.status}" aria-hidden="true"></span>
                <div class="trip-copy">
                  <h2>{displayTripName(trip)}</h2>
                  {#if trip.label}<p class="trip-route">{displayRoute(trip)}</p>{/if}
                  <p>{formatTripRange({ entryDate: tripEntryDate(trip), exitDate: tripExitDate(trip) })} · {countTripSchengenDays(trip)} Schengen {pluralize('day', countTripSchengenDays(trip))}{countTripOutsideDays(trip) > 0 ? ` · ${countTripOutsideDays(trip)} ${pluralize('day', countTripOutsideDays(trip))} outside` : ''}</p>
                  <strong>{statusLabel(trip.status)}</strong>
                </div>
                <div class="trip-actions">
                  <button type="button" aria-label={`Edit ${displayTripName(trip)}`} onclick={() => startEditTrip(trip)}>Edit</button>
                  <button class="delete" type="button" aria-label={`Delete ${displayTripName(trip)}`} onclick={() => requestDeleteTrip(trip.id)}>Delete</button>
                </div>
              </article>
              {#if pendingDeleteTrip?.id === trip.id}
                <section class="confirm-panel" aria-live="polite" aria-labelledby={`delete-${trip.id}-heading`}>
                  <div>
                    <h2 id={`delete-${trip.id}-heading`}>Delete {displayTripName(trip)}?</h2>
                    <p>This removes it from this browser and recalculates every result.</p>
                  </div>
                  <div class="button-row">
                    <button class="danger-button" type="button" onclick={deletePendingTrip}>Delete trip</button>
                    <button class="secondary-button" type="button" onclick={() => (pendingDeleteTripId = null)}>Keep trip</button>
                  </div>
                </section>
              {/if}
            {/each}
          </div>
          {#if trips.length >= MAX_TRIP_COUNT}
            <p class="storage-warning">This device has reached the {MAX_TRIP_COUNT}-trip limit. Export a backup before removing older entries.</p>
          {/if}
        {/if}
      </section>
    {:else if active === 'planner'}
      <section class="screen" aria-labelledby="planner-heading">
        <div class="section-heading">
          <p>Unsaved what-if</p>
          <h1 id="planner-heading" class="screen-title">Can I book this?</h1>
        </div>
        <p class="intro-copy">Test a possible stay against the trips on this device. The simulation is separate from your saved trips.</p>
        <form class="trip-form" aria-label="Future trip simulator" novalidate onsubmit={(event) => { event.preventDefault(); runSimulation(); }}>
          <label for="simulation-label"><span>Simulation label <small>Optional</small></span></label>
          <input
            id="simulation-label"
            bind:value={simulatorForm.label}
            maxlength={MAX_TRIP_LABEL_LENGTH}
            placeholder="Spring in Portugal"
            oninput={simulationChanged}
            aria-describedby={simulationSubmitted && simulationState.errors.label ? 'simulation-label-error' : undefined}
            aria-invalid={simulationSubmitted && simulationState.errors.label ? 'true' : undefined}
          />
          {#if simulationSubmitted && simulationState.errors.label}
            <strong id="simulation-label-error" class="field-error">{simulationState.errors.label}</strong>
          {/if}

          <div class="date-fields">
            <div class="field-group">
              <label for="simulation-entry"><span>Entered Schengen</span></label>
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
              <label for="simulation-exit"><span>Left Schengen</span></label>
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
              <label for="simulation-entry-country"><span>Entered via <small>Optional</small></span></label>
              <select id="simulation-entry-country" bind:value={simulatorForm.entryCountryCode} oninput={simulationChanged} aria-invalid={simulationSubmitted && simulationState.errors.entryCountryCode ? 'true' : undefined}>
                <option value="">Choose if useful</option>
                {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{country.name}</option>{/each}
              </select>
              {#if simulationSubmitted && simulationState.errors.entryCountryCode}<strong class="field-error">{simulationState.errors.entryCountryCode}</strong>{/if}
            </div>
            <div class="field-group">
              <label for="simulation-exit-country"><span>Left via <small>Optional</small></span></label>
              <select id="simulation-exit-country" bind:value={simulatorForm.exitCountryCode} oninput={simulationChanged} aria-invalid={simulationSubmitted && simulationState.errors.exitCountryCode ? 'true' : undefined}>
                <option value="">Choose if useful</option>
                {#each SCHENGEN_COUNTRY_OPTIONS as country}<option value={country.code}>{country.name}</option>{/each}
              </select>
              {#if simulationSubmitted && simulationState.errors.exitCountryCode}<strong class="field-error">{simulationState.errors.exitCountryCode}</strong>{/if}
            </div>
          </div>
          <small>Optional — these countries provide context but do not affect the calculation.</small>

          <section class="outside-breaks" aria-labelledby="simulation-breaks-heading">
            <div class="outside-breaks-heading">
              <div>
                <h2 id="simulation-breaks-heading">Time outside Schengen</h2>
                <p>Add a break if this plan leaves Schengen and later returns.</p>
              </div>
              {#if simulatorForm.outsideBreaks.length === 0}
                <button class="secondary-button compact-button" type="button" onclick={addSimulationOutsideBreak}>Add time outside</button>
              {/if}
            </div>
            {#each simulatorForm.outsideBreaks as outsideBreak, index (outsideBreak.id)}
              <fieldset class="outside-break">
                <div class="outside-break-title">
                  <legend>Outside-Schengen break {index + 1}</legend>
                  <button type="button" class="text-button delete" onclick={() => removeSimulationOutsideBreak(outsideBreak.id)}>Remove break</button>
                </div>
                <div class="date-fields">
                  <div class="field-group">
                    <label for={`simulation-break-left-${outsideBreak.id}`}><span>Left Schengen</span></label>
                    <input id={`simulation-break-left-${outsideBreak.id}`} type="date" bind:value={outsideBreak.leftDate} oninput={simulationChanged} aria-invalid={simulationSubmitted && simulationState.errors.breakFields?.[outsideBreak.id]?.leftDate ? 'true' : undefined} />
                    {#if simulationSubmitted && simulationState.errors.breakFields?.[outsideBreak.id]?.leftDate}<strong class="field-error">{simulationState.errors.breakFields[outsideBreak.id].leftDate}</strong>{/if}
                  </div>
                  <div class="field-group">
                    <label for={`simulation-break-return-${outsideBreak.id}`}><span>Re-entered Schengen</span></label>
                    <input id={`simulation-break-return-${outsideBreak.id}`} type="date" bind:value={outsideBreak.reentryDate} oninput={simulationChanged} aria-invalid={simulationSubmitted && simulationState.errors.breakFields?.[outsideBreak.id]?.reentryDate ? 'true' : undefined} />
                    {#if simulationSubmitted && simulationState.errors.breakFields?.[outsideBreak.id]?.reentryDate}<strong class="field-error">{simulationState.errors.breakFields[outsideBreak.id].reentryDate}</strong>{/if}
                  </div>
                </div>
              </fieldset>
            {/each}
            {#if simulatorForm.outsideBreaks.length > 0 && simulatorForm.outsideBreaks.length < MAX_OUTSIDE_BREAKS}
              <button class="secondary-button add-break-button" type="button" onclick={addSimulationOutsideBreak}>+ Add another outside-Schengen break</button>
            {/if}
          </section>
          <div class="form-actions">
            <button class="primary-button" type="submit">Check this plan</button>
            <button class="secondary-button" type="button" onclick={clearSimulation}>Clear</button>
          </div>
        </form>

        {#if simulationSubmitted && simulationState.valid && simulationState.usage}
          <section class="simulation-result" aria-live="polite" aria-labelledby="simulation-result-heading">
            <StatusChip tone={simulatorStatusTone} label={simulationState.statusLabel} />
            <h2 id="simulation-result-heading" class={`result-heading ${simulationState.statusTone === 'risk' ? 'risk-text' : 'safe-text'}`}>
              {simulationState.latestSafeExitLabel}
            </h2>
            <div class="facts two">
              <FactCard label="Simulated days used" value={simulationState.daysUsedLabel} tone={simulationState.statusTone === 'risk' ? 'ink' : 'safe'} />
              <FactCard label="Max additional days" value={simulationState.maxStayLabel} />
            </div>
            <section class:mint={simulationState.statusTone !== 'risk'} class:risk-panel={simulationState.statusTone === 'risk'} class="panel">
              <p>{simulationState.summaryCopy}</p>
              <p class:micro-risk={simulationState.statusTone === 'risk'} class:micro-safe={simulationState.statusTone !== 'risk'}>{simulationState.firstFixCopy}</p>
            </section>
            <TimelineLedger
              label="What-if rolling window"
              mode={simulationState.statusTone === 'risk' ? 'risk' : 'planner'}
              {trips}
              simulation={simulationState.simulatedTrip}
              referenceDate={simulationState.usage.referenceDate}
            />
          </section>
        {:else if simulationSubmitted}
          <section class="panel risk-panel" aria-live="polite">
            <h2>Add valid dates</h2>
            <p>Fix the highlighted fields, then check this plan again.</p>
          </section>
        {/if}

        <section class="panel whatif-panel">
          <h2>Need more planning power?</h2>
          <p>{unlockFakeDoorState.helperCopy}</p>
          <button class="secondary-button" type="button" onclick={recordUnlockBuyIntent}>{unlockFakeDoorState.buttonLabel}</button>
        </section>
        {#if unlockFakeDoorState.showIntentMessage}
          <section class="panel mint" aria-live="polite">
            <h2>Unlock request noted</h2>
            <p>{unlockFakeDoorState.messageCopy}</p>
            <p class="micro-safe">No payment was taken. No trip dates or planner timeline were sent.</p>
          </section>
        {/if}
      </section>
    {:else if active === 'proof'}
      <section class="screen" id="proof" aria-labelledby="proof-heading">
        <div class="section-heading">
          <p>Inspectable evidence</p>
          <h1 id="proof-heading" class="screen-title">Calculation proof</h1>
        </div>
        <section class="panel mint" aria-labelledby="explanation-heading">
          <h2 id="explanation-heading">{explanationState.heading}</h2>
          <p>{explanationState.summary}</p>
          <p class="micro-safe">{explanationState.verdictLine}</p>
        </section>
        <div>
          <p class="window-label">Active inclusive 180-day window</p>
          <p class="mono-range">{formatDateRange(dashboardState.usage.windowStart, dashboardState.usage.windowEnd)}</p>
        </div>
        <TimelineLedger label="Counted-day evidence" mode={dashboardState.statusTone === 'risk' ? 'risk' : 'safe'} {trips} referenceDate={dashboardState.referenceDate} />
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
              <h2>No counted stays in this window</h2>
              <p>Your saved trips fall outside the active window or use countries that do not count toward the Schengen short-stay allowance.</p>
            </section>
          {/each}
        </div>
        <section class="panel paper-panel">
          <h2>Rules used</h2>
          <ul class="rule-list">
            {#each explanationState.ruleBullets as bullet}<li>{bullet}</li>{/each}
          </ul>
        </section>
        <button class="secondary-button" type="button" onclick={() => setActiveScreen('returns')}>See when days return</button>
      </section>
    {:else if active === 'returns'}
      <section class="screen" aria-labelledby="returns-heading">
        <div class="section-heading">
          <p>Allowance forecast from {formatDate(dashboardState.referenceDate)}</p>
          <h1 id="returns-heading" class="screen-title">{returningForecast.summaryLabel}</h1>
        </div>
        <p class="window-label">{returningForecast.currentUsedLabel} on {formatDate(dashboardState.referenceDate)}</p>
        <TimelineLedger
          label="Returning-days forecast"
          mode="returns"
          {trips}
          referenceDate={dashboardState.referenceDate}
          returnDates={returningForecast.rows.map((row) => row.date)}
          horizonDays={returningForecast.horizonDays}
        />
        <section class="panel mint">
          <h2>{returningForecast.nextReturnLabel}</h2>
          <p>Each listed day is a counted Schengen presence day aging out of the inclusive 180-day window. New travel can still use the returned allowance.</p>
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
              <h2>No days return during this forecast</h2>
              <p>No counted Schengen presence day leaves the window in the next {returningForecast.horizonDays} days.</p>
            </section>
          {/each}
        </div>
      </section>
    {:else if active === 'report'}
      <section class="screen" aria-labelledby="report-heading">
        <div class="section-heading">
          <p>Calculation summary</p>
          <h1 id="report-heading" class="screen-title">Border-ready report</h1>
        </div>
        <article class="report-preview" aria-label="Border-ready report">
          <div class="brand report-brand"><SchngnLogo small /></div>
          <h2>{dashboardState.statusLabel} · {dashboardState.heroMetric}</h2>
          <p class="mono-range">{dashboardState.daysUsedLabel} days used · {formatDateRange(dashboardState.usage.windowStart, dashboardState.usage.windowEnd)}</p>
          <p>{explanationState.summary}</p>
          <p>{FOOTER_DISCLAIMER_COPY}</p>
        </article>
        <section class="panel whatif-panel">
          <h2>{pdfFakeDoorState.messageTitle}</h2>
          <p>{pdfFakeDoorState.helperCopy}</p>
          <button class="primary-button" type="button" onclick={recordPdfBuyIntent}>{pdfFakeDoorState.buttonLabel}</button>
        </section>
        {#if pdfFakeDoorState.showIntentMessage}
          <section class="panel mint" aria-live="polite">
            <h2>Early-access request noted</h2>
            <p>{pdfFakeDoorState.messageCopy}</p>
            <p class="micro-safe">No payment was taken. No trip dates or report content were sent.</p>
          </section>
        {/if}
        <button class="secondary-button" type="button" onclick={() => setActiveScreen('waitlist')}>Join PDF export list</button>
      </section>
    {:else if active === 'privacy'}
      <section class="screen" aria-labelledby="privacy-heading">
        <div class="section-heading">
          <p>Optional account, private by default</p>
          <h1 id="privacy-heading" class="screen-title">Account & data</h1>
        </div>

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
                <p class="eyebrow">Account</p>
                <h2 id="account-heading">Checking sign-in…</h2>
              </div>
              <span class="account-state-badge neutral">Loading</span>
            </div>
            <p>Trips remain available from this browser while account status loads.</p>
          {:else if accountState === 'unavailable'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">Account</p>
                <h2 id="account-heading">Local mode is ready</h2>
              </div>
              <span class="account-state-badge neutral">Local only</span>
            </div>
            <p>Sign-in is unavailable in this build. The calculator still works and keeps trips in this browser.</p>
          {:else if accountState === 'guest'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">Account</p>
                <h2 id="account-heading">Keep using SCHNGN without an account</h2>
              </div>
              <span class="account-state-badge neutral">Local only</span>
            </div>
            <p>Signing up is optional. Clerk handles account identity. Until you sign in and explicitly turn on sync, no trip dates are sent to SCHNGN's database.</p>
            <div class="button-row account-actions">
              <button class="primary-button" type="button" onclick={startAccountSignUp}>Sign up</button>
              <button class="secondary-button" type="button" onclick={startAccountSignIn}>Sign in</button>
            </div>
          {:else if accountState === 'offer_sync'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">Signed in{accountEmail ? ` as ${accountEmail}` : ''}</p>
                <h2 id="account-heading">Choose whether to sync</h2>
              </div>
              <span class="account-state-badge neutral">Not syncing</span>
            </div>
            <p>Your account is ready, but no trip snapshot has been stored. Local-only remains the default until you consent below.</p>
            <label class="consent-row account-consent" for="account-sync-consent">
              <input id="account-sync-consent" bind:checked={accountConsent} type="checkbox" />
              <span><strong>Allow SCHNGN to store my saved trips for account sync.</strong> This sends the labels, countries, dates, and statuses for {trips.length} {pluralize('trip', trips.length)} to SCHNGN's Cloudflare D1 database.</span>
            </label>
            <button
              class="primary-button"
              type="button"
              disabled={!accountConsent}
              onclick={enableAccountSync}
            >Sync {trips.length} {pluralize('trip', trips.length)}</button>
          {:else if accountState === 'synced' || accountState === 'syncing'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">Signed in{accountEmail ? ` as ${accountEmail}` : ''}</p>
                <h2 id="account-heading">Trips are saved for repeat visits</h2>
              </div>
              <span class="account-state-badge safe">{accountState === 'syncing' ? 'Syncing…' : 'Synced'}</span>
            </div>
            <p>Changes save in this browser first, then sync to your account. The calculation still runs on this device.</p>
            <dl class="account-facts">
              <div><dt>Account copy</dt><dd>{accountSnapshot.trips.length} {pluralize('trip', accountSnapshot.trips.length)}</dd></div>
              <div><dt>Last saved</dt><dd>{formatAccountUpdatedAt(accountSnapshot.updatedAt)}</dd></div>
            </dl>
          {:else if accountState === 'conflict' || accountState === 'paused'}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">Signed in{accountEmail ? ` as ${accountEmail}` : ''}</p>
                <h2 id="account-heading">Choose which trip copy to keep</h2>
              </div>
              <span class="account-state-badge attention">Review needed</span>
            </div>
            <p>Your account has {accountSnapshot.trips.length} {pluralize('trip', accountSnapshot.trips.length)} and this browser has {trips.length}. Nothing will be overwritten until you choose.</p>
            {#if accountSnapshot.revision === 0}
              <label class="consent-row account-consent" for="account-conflict-sync-consent">
                <input id="account-conflict-sync-consent" bind:checked={accountConsent} type="checkbox" />
                <span><strong>Allow SCHNGN to store this browser's saved trips for account sync.</strong> This sends the labels, countries, dates, and statuses for {trips.length} {pluralize('trip', trips.length)} to SCHNGN's Cloudflare D1 database. These trips may come from a previously signed-in account on this device.</span>
              </label>
            {/if}
            <div class="account-choice-grid">
              <button class="secondary-button account-choice" type="button" onclick={useAccountTrips}>
                <strong>Use account trips</strong>
                <span>Replace this browser's copy with the saved account copy.</span>
              </button>
              <button class="secondary-button account-choice" type="button" disabled={accountSnapshot.revision === 0 && !accountConsent} onclick={replaceAccountTrips}>
                <strong>Replace account with this device</strong>
                <span>Keep this browser's copy and overwrite the account copy.</span>
              </button>
            </div>
          {:else}
            <div class="account-heading-row">
              <div>
                <p class="eyebrow">Signed in{accountEmail ? ` as ${accountEmail}` : ''}</p>
                <h2 id="account-heading">Account sync needs attention</h2>
              </div>
              <span class="account-state-badge attention">Sync paused</span>
            </div>
            <p>Your trips remain on this browser. Retry when your connection and account session are available.</p>
            <button class="primary-button" type="button" onclick={retryAccountSync}>Retry account sync</button>
          {/if}

          <div class="account-messages" aria-live="polite" aria-atomic="true">
            {#if accountError}<p class="storage-warning">{accountError}</p>{/if}
            {#if accountNotice}<p class="micro-safe">{accountNotice}</p>{/if}
          </div>

          {#if accountSignedIn}
            <div class="button-row account-actions">
              <button class="secondary-button" type="button" disabled={accountState === 'syncing'} onclick={manageClerkAccount}>Manage account</button>
              <button class="secondary-button" type="button" disabled={accountState === 'syncing'} onclick={signOutAccount}>Sign out</button>
              <button class="danger-outline" type="button" disabled={accountState === 'syncing'} onclick={() => (signOutClearConfirmationVisible = true)}>Sign out & clear this browser</button>
              {#if accountSnapshot.revision > 0}
                <button class="danger-outline" type="button" disabled={accountState === 'syncing'} onclick={() => (accountDeleteConfirmationVisible = true)}>Delete saved account trips</button>
              {/if}
            </div>
          {/if}

          {#if signOutClearConfirmationVisible && accountSignedIn}
            <section class="confirm-panel account-delete-confirm" aria-live="polite" aria-labelledby="sign-out-clear-heading">
              <div>
                <h2 id="sign-out-clear-heading">Sign out and clear this browser?</h2>
                <p>This removes {trips.length} local {pluralize('trip', trips.length)} before signing out. The account copy stays saved. Export first if you need an independent backup.</p>
              </div>
              <div class="button-row">
                <button class="danger-button" type="button" onclick={signOutAndClearAccount}>Sign out & clear trips</button>
                <button class="secondary-button" type="button" onclick={() => (signOutClearConfirmationVisible = false)}>Keep this browser signed in</button>
              </div>
            </section>
          {/if}

          {#if accountDeleteConfirmationVisible && accountSignedIn && accountSnapshot.revision > 0}
            <section class="confirm-panel account-delete-confirm" aria-live="polite" aria-labelledby="delete-account-trips-heading">
              <div>
                <h2 id="delete-account-trips-heading">Delete trips saved to this account?</h2>
                <p>This removes the account copy from active SCHNGN storage immediately. Cloudflare backup and Time Travel copies expire under the configured provider retention policy. The {trips.length} {pluralize('trip', trips.length)} in this browser remain here.</p>
              </div>
              <div class="button-row">
                <button class="danger-button" type="button" onclick={removeCloudAccountData}>Delete account trips</button>
                <button class="secondary-button" type="button" onclick={() => (accountDeleteConfirmationVisible = false)}>Keep account trips</button>
              </div>
            </section>
          {/if}

          {#if accountSignedIn}
            <p class="account-footnote">Manage account opens Clerk's secure account portal. Deleting the Clerk account also requests removal of its active SCHNGN trip data; a deletion guard is retained for 30 days to block late writes. Ordinary sign-out keeps this browser's trips, while the shared-device action clears them first.</p>
          {/if}
        </section>

        <section class="panel paper-panel" aria-labelledby="browser-data-heading">
          <div class="account-heading-row">
            <div>
              <p class="eyebrow">This device</p>
              <h2 id="browser-data-heading">Browser trip data</h2>
            </div>
            <span class="account-state-badge safe">Available offline</span>
          </div>
          <p>{accountState === 'synced' || accountState === 'syncing' ? 'A local copy keeps the calculator fast and available. Export a private backup whenever you want an independent copy.' : 'Trips, dates, and calculated timelines stay in this browser unless you explicitly turn on account sync or export a JSON file.'}</p>
          <p>Export before clearing browser data. Import the file later to restore trips manually.</p>
          {#if importError}
            <p class="storage-warning">{importError}</p>
          {:else if importMessage}
            <p class="micro-safe">{importMessage}</p>
          {:else if storageSource === 'storage'}
            <p class="micro-safe">Loaded from this browser's local storage.</p>
          {:else}
            <p class="micro-safe">No trip data is stored on this browser yet.</p>
          {/if}
        </section>
        <div class="button-row">
          <button class="secondary-button" type="button" onclick={exportTrips} disabled={trips.length === 0}>Export JSON</button>
          <button class="secondary-button" type="button" onclick={() => importInput.click()} aria-controls="trip-import-file">Import JSON</button>
          <input bind:this={importInput} id="trip-import-file" class="visually-hidden" aria-label="Import JSON file" type="file" accept="application/json,.json" onchange={importTrips} />
          <button class="danger-outline" type="button" onclick={requestClearLocalTrips} disabled={trips.length === 0 || pendingAccountWrites > 0 || accountState === 'loading' || accountState === 'syncing' || accountDeleteInProgress}>Clear local data</button>
        </div>
        {#if clearConfirmationVisible}
          <section class="confirm-panel" aria-live="polite" aria-labelledby="clear-heading">
            <div>
              <h2 id="clear-heading">Clear all local trip data?</h2>
              <p>This removes {trips.length} {pluralize('trip', trips.length)} from this browser. {accountSignedIn && accountSnapshot.revision > 0 ? 'The account copy stays saved and sync pauses until you choose which copy to keep.' : 'Export first if you may need them later.'}</p>
            </div>
            <div class="button-row">
              <button class="danger-button" type="button" onclick={clearLocalTrips}>Clear this browser</button>
              <button class="secondary-button" type="button" onclick={() => (clearConfirmationVisible = false)}>Keep my trips</button>
            </div>
          </section>
        {/if}
        <section class="panel paper-panel">
          <h2>Official sources</h2>
          <p>SCHNGN is not an EU service and does not imply official endorsement. Check official guidance before booking or travelling.</p>
          <div class="official-links stacked">
            {#each OFFICIAL_SOURCE_LINKS as source}<a href={source.href} target="_blank" rel="noreferrer">{source.label}</a>{/each}
          </div>
        </section>
        <section class="panel paper-panel">
          <h2>Analytics never include trip dates</h2>
          <p>Allowed events use aggregate buckets only. They do not include trip dates, country history, calculated personal timelines, account IDs, or email addresses. Waitlist email storage is separate from account trip sync.</p>
        </section>
      </section>
    {:else if active === 'waitlist'}
      <section class="screen narrow-screen" aria-labelledby="waitlist-heading">
        <button class="text-button" type="button" onclick={() => setActiveScreen('report')}>← Back to report</button>
        <div class="brand report-brand"><SchngnLogo small /></div>
        <h1 id="waitlist-heading" class="screen-title">Get PDF export updates</h1>
        <p class="intro-copy">Email-only capture. SCHNGN does not send your trips, dates, country history, or calculated personal timeline with this request.</p>
        <form class="trip-form" onsubmit={(event) => { event.preventDefault(); submitWaitlist(); }}>
          <label for="waitlist-email"><span>Email</span></label>
          <input id="waitlist-email" bind:value={waitlistEmail} autocomplete="email" maxlength="254" placeholder="name@example.com" type="email" required />
          <label class="consent-row" for="waitlist-consent">
            <input id="waitlist-consent" bind:checked={waitlistConsent} type="checkbox" required />
            <span>I agree to receive SCHNGN updates. Store my email only; do not send trip dates or history.</span>
          </label>
          <button class="primary-button" disabled={!waitlistEmail.trim() || !waitlistConsent || waitlistState === 'submitting' || waitlistState === 'stored'} type="submit">
            {waitlistState === 'submitting' ? 'Joining…' : waitlistState === 'error' || waitlistState === 'not_configured' ? 'Try again' : waitlistState === 'stored' ? 'Joined' : 'Join waitlist'}
          </button>
        </form>
        {#if waitlistState === 'stored'}
          <section class="panel mint" aria-live="polite"><h2>You are on the list</h2><p>Your email was stored. No trip data was sent.</p></section>
        {:else if waitlistState === 'not_configured'}
          <section class="panel whatif-panel" aria-live="polite">
            <h2>Email was not confirmed as saved</h2>
            <p>The waitlist storage is not configured. Your email remains in the form so you can retry after configuration is available.</p>
          </section>
        {:else if waitlistState === 'error'}
          <section class="panel risk-panel" aria-live="polite"><h2>Email could not be saved</h2><p>{waitlistError}</p></section>
        {/if}
      </section>
    {/if}

    <aside class="legal-footer" aria-label="Planning disclaimer"><p>{FOOTER_DISCLAIMER_COPY}</p></aside>
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
  .trip-list article.past { background: var(--surface); }

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
    .app-header { padding: 14px 16px; }
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
