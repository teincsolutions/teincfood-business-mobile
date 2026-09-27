import { Platform } from "react-native";
import type {
  CustomerDisplayDriver,
  CustomerDisplayModel,
  CustomerDisplayCapabilities,
} from "@teincfood/core";
import {
  CustomerDisplayNative,
  addDisplayChangedListener,
} from "../../modules/customer-display";

/**
 * Android customer-display driver. Delegates hardware (secondary display via
 * Presentation) and rendering to the native module; JS only pushes the shared
 * model JSON. Falls back to a no-op driver on unsupported platforms or when the
 * native module isn't present (iOS, Expo Go, pre-rebuild).
 */
class AndroidCustomerDisplayDriver implements CustomerDisplayDriver {
  async capabilities() {
    try {
      if (!CustomerDisplayNative) {
        return {
          supported: false,
          displays: 1,
          reason: "Customer display native module is not available in this build.",
        };
      }
      const caps = await CustomerDisplayNative.getCapabilities();
      return {
        supported: !!caps.supported,
        displays: caps.displays ?? 1,
        reason: caps.reason ?? undefined,
      };
    } catch (err) {
      return {
        supported: false,
        displays: 1,
        reason: err instanceof Error ? err.message : "Display API unavailable",
      };
    }
  }

  async open(): Promise<void> {
    try {
      await CustomerDisplayNative?.open();
    } catch (err) {
      console.warn("[CustomerDisplay] open failed", err);
    }
  }

  async close(): Promise<void> {
    try {
      await CustomerDisplayNative?.close();
    } catch {
      // already closed
    }
  }

  push(model: CustomerDisplayModel): void {
    if (!CustomerDisplayNative) return;
    void CustomerDisplayNative.update(JSON.stringify(model)).catch(
      () => undefined,
    );
  }

  onCapabilitiesChanged(
    cb: (caps: CustomerDisplayCapabilities) => void,
  ): () => void {
    return addDisplayChangedListener((caps) =>
      cb({
        supported: caps.supported,
        displays: caps.displays,
        reason: caps.reason ?? undefined,
      }),
    );
  }
}

class NoopCustomerDisplayDriver implements CustomerDisplayDriver {
  async capabilities() {
    return {
      supported: false,
      displays: 1,
      reason: "The customer display is only available on Android POS devices.",
    };
  }
  async open(): Promise<void> {}
  async close(): Promise<void> {}
  push(): void {}
  onCapabilitiesChanged(): () => void {
    return () => {};
  }
}

export const customerDisplayDriver: CustomerDisplayDriver =
  Platform.OS === "android"
    ? new AndroidCustomerDisplayDriver()
    : new NoopCustomerDisplayDriver();
