// Deprecated — single global @teincfood/core useSyncReconciliation + useEventsConnection now handles all realtime.
// Kept as no-op shim for backward compat; per-screen rootKey removed.
export function useOrderRealtimeUpdates(_rootKey?: readonly unknown[]): void {}
