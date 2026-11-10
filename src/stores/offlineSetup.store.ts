import { create } from "zustand";
import { accountStorage } from "@/utils/storage";

const STORAGE_KEY = "offline_setup_skipped_businesses";

function readSkipped(): Record<string, boolean> {
  try {
    const raw = accountStorage.getString(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

interface OfflineSetupState {
  skipped: Record<string, boolean>;
  skip: (businessId: string) => void;
  clear: (businessId: string) => void;
  reload: () => void;
}

export const useOfflineSetupStore = create<OfflineSetupState>((set, get) => ({
  skipped: readSkipped(),
  skip: (businessId) => {
    const skipped = { ...get().skipped, [businessId]: true };
    accountStorage.set(STORAGE_KEY, JSON.stringify(skipped));
    set({ skipped });
  },
  clear: (businessId) => {
    const skipped = { ...get().skipped };
    delete skipped[businessId];
    accountStorage.set(STORAGE_KEY, JSON.stringify(skipped));
    set({ skipped });
  },
  reload: () => set({ skipped: readSkipped() }),
}));
