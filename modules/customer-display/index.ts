import {
  requireOptionalNativeModule,
  EventEmitter,
} from "expo-modules-core";

/**
 * Native customer-display module (Android). Presents the customer screen on a
 * secondary display via Android's Presentation API. All model rendering stays
 * on the native side; JS only pushes the shared model JSON.
 *
 * `requireOptionalNativeModule` (not `requireNativeModule`) so the app still
 * runs on platforms/builds without the native module (iOS, Expo Go, before a
 * native rebuild) — the driver just reports unsupported.
 */
export interface CustomerDisplayCapabilities {
  supported: boolean;
  displays: number;
  reason?: string | null;
}

interface CustomerDisplayNativeModule {
  getCapabilities(): Promise<CustomerDisplayCapabilities>;
  open(): Promise<boolean>;
  close(): Promise<boolean>;
  update(modelJson: string): Promise<boolean>;
}

export const CustomerDisplayNative =
  requireOptionalNativeModule<CustomerDisplayNativeModule>("CustomerDisplay");

const emitter = CustomerDisplayNative
  ? new EventEmitter<{
      onDisplayChanged: (caps: CustomerDisplayCapabilities) => void;
    }>(CustomerDisplayNative as never)
  : null;

export function addDisplayChangedListener(
  cb: (caps: CustomerDisplayCapabilities) => void,
): () => void {
  if (!emitter) return () => {};
  const sub = emitter.addListener("onDisplayChanged", cb);
  return () => sub.remove();
}
