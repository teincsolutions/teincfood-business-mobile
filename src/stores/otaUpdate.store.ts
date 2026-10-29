import { create } from "zustand";

export type OTAUpdatePhase =
  "idle" | "checking" | "available" | "downloading" | "ready" | "error";

interface OTAUpdateState {
  phase: OTAUpdatePhase;
  error: string | null;
  dismissed: boolean;
  beginCheck: () => void;
  setAvailable: () => void;
  dismiss: () => void;
  beginDownload: () => void;
  setReady: () => void;
  setError: (message: string) => void;
  setIdle: () => void;
}

export const useOTAUpdateStore = create<OTAUpdateState>((set) => ({
  phase: "idle",
  error: null,
  dismissed: false,
  beginCheck: () => set({ phase: "checking", error: null }),
  setAvailable: () =>
    set({ phase: "available", error: null, dismissed: false }),
  dismiss: () => set({ dismissed: true }),
  beginDownload: () =>
    set({ phase: "downloading", error: null, dismissed: false }),
  setReady: () => set({ phase: "ready", error: null }),
  setError: (message) => set({ phase: "error", error: message }),
  setIdle: () => set({ phase: "idle", error: null, dismissed: false }),
}));
