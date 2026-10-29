import { useEffect } from "react";
import { AppState } from "react-native";
import * as Updates from "expo-updates";
import { useOTAUpdateStore } from "@/stores/otaUpdate.store";

const CHECK_INTERVAL_MS = 30 * 60 * 1000;
let lastCheckAt = 0;

export async function checkForOTAUpdate(): Promise<void> {
  if (__DEV__ || process.env.EXPO_PUBLIC_ENABLE_OTA === "false") return;
  if (!Updates.isEnabled) return;

  const state = useOTAUpdateStore.getState();
  if (state.phase === "downloading" || state.phase === "ready") return;
  if (state.phase === "checking") return;

  lastCheckAt = Date.now();
  state.beginCheck();

  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) {
      useOTAUpdateStore.getState().setIdle();
      return;
    }
    useOTAUpdateStore.getState().setAvailable();
  } catch {
    // Offline, wrong channel, or no published update. Retry later.
    useOTAUpdateStore.getState().setIdle();
  }
}

export async function installOTAUpdate(): Promise<void> {
  const state = useOTAUpdateStore.getState();
  if (state.phase === "downloading" || state.phase === "ready") return;

  state.beginDownload();
  try {
    await Updates.fetchUpdateAsync();
    useOTAUpdateStore.getState().setReady();
  } catch (error) {
    useOTAUpdateStore
      .getState()
      .setError(
        error instanceof Error
          ? error.message
          : "The update could not be downloaded.",
      );
  }
}

export async function restartForOTAUpdate(): Promise<void> {
  await Updates.reloadAsync();
}

/**
 * Background OTA check. The UI is a VS Code-style update notice with an
 * explicit Update button, not a blocking alert.
 */
export function useOTAUpdate() {
  useEffect(() => {
    void checkForOTAUpdate();

    const subscription = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      if (Date.now() - lastCheckAt < CHECK_INTERVAL_MS) return;
      if (useOTAUpdateStore.getState().dismissed) return;
      void checkForOTAUpdate();
    });

    return () => subscription.remove();
  }, []);
}

export default useOTAUpdate;
