import type { PlausibleConfig, PlausibleRequestPayload } from '@plausible-analytics/tracker';
import { ALLOWED_ANALYTICS_EVENTS, assertSafeAnalyticsEvent, type AnalyticsEventName } from './privacyAnalytics';

export const PLAUSIBLE_DOMAIN = 'schngn.com';

type PlausibleWindow = Window & {
  plausible?: (...args: unknown[]) => void;
};

type PlausibleTrackerModule = {
  init(config: PlausibleConfig): void;
};

export type PlausibleInitializationStatus = 'initialized' | 'intercepted' | 'disabled' | 'failed';

const ALLOWED_PATHS = new Set(['/', '/app', '/accuracy']);

export function sanitizePlausiblePayload(payload: PlausibleRequestPayload): PlausibleRequestPayload | null {
  if (!ALLOWED_ANALYTICS_EVENTS.includes(payload.n as AnalyticsEventName)) return null;

  try {
    assertSafeAnalyticsEvent(payload.n as AnalyticsEventName, payload.p ?? {});
  } catch {
    return null;
  }

  let pathname = '/other';
  try {
    const candidate = new URL(payload.u, `https://${PLAUSIBLE_DOMAIN}`).pathname;
    if (ALLOWED_PATHS.has(candidate)) pathname = candidate;
  } catch {
    // Keep the aggregate fallback path.
  }

  return {
    n: payload.n,
    u: `https://${PLAUSIBLE_DOMAIN}${pathname}`,
    d: PLAUSIBLE_DOMAIN,
    ...(payload.p ? { p: payload.p } : {})
  };
}

export async function initializePlausibleAnalytics(
  targetWindow: Window | undefined = globalThis.window,
  loadTracker: () => Promise<PlausibleTrackerModule> = () => import('@plausible-analytics/tracker')
): Promise<PlausibleInitializationStatus> {
  if (!targetWindow) return 'disabled';

  const plausibleWindow = targetWindow as PlausibleWindow;
  if (typeof plausibleWindow.plausible === 'function') return 'intercepted';
  if (targetWindow.location.hostname !== PLAUSIBLE_DOMAIN) return 'disabled';

  const queuedEvents: unknown[][] = [];
  const queue = (...args: unknown[]) => queuedEvents.push(args);
  plausibleWindow.plausible = queue;

  try {
    const tracker = await loadTracker();
    tracker.init({
      domain: PLAUSIBLE_DOMAIN,
      autoCapturePageviews: false,
      captureOnLocalhost: false,
      formSubmissions: false,
      outboundLinks: false,
      fileDownloads: false,
      bindToWindow: true,
      logging: false,
      transformRequest: sanitizePlausiblePayload
    });

    const plausible = plausibleWindow.plausible;
    if (plausible && plausible !== queue) {
      for (const args of queuedEvents) plausible(...args);
    }
  } catch {
    if (plausibleWindow.plausible === queue) delete plausibleWindow.plausible;
    return 'failed';
  }

  return 'initialized';
}
