import { useAuthStore } from "@/stores/auth.store";
import { probeCloud, useConnectivityStore } from "@/stores/connectivity.store";

/**
 * Offline-safe session termination.
 *
 * The business app is designed to keep working while the cloud is
 * unreachable. A failed refresh must therefore never clear a local session on
 * its own: first prove the device can reach the backend and that `/api/health`
 * is answering. Only then is a rejected/expired refresh token a real session
 * failure worth a logout.
 *
 * When the health check fails (offline, captive portal, backend outage), the
 * session is kept and a pending logout is retried as soon as connectivity and
 * cloud reachability return. A successful refresh or a new login cancels the
 * pending logout so a recovered session is never signed out later.
 */

let logoutInFlight: Promise<boolean> | null = null;
let sessionEndPending = false;
let watchingConnectivity = false;
let watchingAuth = false;

export function logoutAfterSessionFailure(): Promise<boolean> {
  if (logoutInFlight) return logoutInFlight;

  logoutInFlight = run().finally(() => {
    logoutInFlight = null;
  });
  return logoutInFlight;
}

async function run(): Promise<boolean> {
  watchAuthChanges();

  const auth = useAuthStore.getState();
  if (!auth.user) {
    sessionEndPending = false;
    return false;
  }
  const userId = auth.user.id;
  const attemptedRefreshToken = auth.refreshToken;

  if (!useConnectivityStore.getState().isOnline) {
    deferLogout("device is offline");
    return false;
  }

  const reachable = await probeCloud();
  if (!reachable) {
    deferLogout("cloud health check failed");
    return false;
  }

  // The user may have logged out, or a new login/another refresh may have
  // replaced the session while the health probe was in flight.
  const current = useAuthStore.getState();
  if (
    !current.user ||
    current.user.id !== userId ||
    (attemptedRefreshToken &&
      current.refreshToken !== attemptedRefreshToken)
  ) {
    sessionEndPending = false;
    return false;
  }

  sessionEndPending = false;
  console.warn(
    "[session] Refresh token was rejected while the backend is healthy — signing out",
  );
  current.clearAuth();
  return true;
}

function deferLogout(reason: string): void {
  sessionEndPending = true;
  watchConnectivityChanges();
  console.debug(
    `[session] Refresh failed but ${reason} — keeping the offline session`,
  );
}

function watchConnectivityChanges(): void {
  if (watchingConnectivity) return;
  watchingConnectivity = true;

  useConnectivityStore.subscribe((state) => {
    if (!sessionEndPending || logoutInFlight) return;
    if (state.isOnline && state.isCloudReachable !== "unreachable") {
      void logoutAfterSessionFailure();
    }
  });
}

function watchAuthChanges(): void {
  if (watchingAuth) return;
  watchingAuth = true;

  useAuthStore.subscribe((state, prev) => {
    if (!state.user) {
      sessionEndPending = false;
      return;
    }
    // A successful refresh rotates the refresh token; a fresh login also
    // writes a new one. Either way the previous failure is no longer relevant.
    if (
      (state.refreshToken && state.refreshToken !== prev.refreshToken) ||
      (state.accessToken && state.accessToken !== prev.accessToken)
    ) {
      sessionEndPending = false;
    }
  });
}
