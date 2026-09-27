import { Platform, AppState } from "react-native";
import { useEffect, useRef } from "react";
import { usePathname } from "expo-router";
import {
  initObservability,
  createReactNativeAdapter,
  getObservability,
} from "@teincfood/observability";
import { mmkvStorage } from "@/utils/storage";
import { appVersion } from "@/utils/constants";
import { useAuthStore } from "@/stores/auth.store";

let started = false;

/**
 * Initializes @teincfood/observability once at app bootstrap (called from
 * app/_layout module scope — fire-and-forget, idempotent). Telemetry flows
 * to the shared collector; with no endpoint configured the library safely
 * no-ops (console in dev, silent in prod). Init failures never break startup.
 */
export function ensureObservability(): void {
  if (started) return;
  started = true;
  void initObservability({
    app: "teincfood-business",
    appVersion: appVersion ?? "1.0.0",
    env:
      process.env.EXPO_PUBLIC_APP_ENV === "development" ||
      process.env.EXPO_PUBLIC_APP_ENV === "testing" ||
      process.env.EXPO_PUBLIC_APP_ENV === "staging"
        ? (process.env.EXPO_PUBLIC_APP_ENV as
            | "development"
            | "testing"
            | "staging")
        : "production",
    ...(process.env.EXPO_PUBLIC_TELEMETRY_URL
      ? { endpoint: process.env.EXPO_PUBLIC_TELEMETRY_URL }
      : {}),
    ...(process.env.EXPO_PUBLIC_TELEMETRY_KEY
      ? { apiKey: process.env.EXPO_PUBLIC_TELEMETRY_KEY }
      : {}),
    adapter: createReactNativeAdapter({
      storage: {
        getItem: (k: string) => mmkvStorage.getString(k) ?? null,
        setItem: (k: string, v: string) => {
          mmkvStorage.set(k, v);
        },
        removeItem: (k: string) => {
          mmkvStorage.delete(k);
        },
      },
      platform: Platform.OS === "ios" ? "ios" : "android",
      ...(typeof Platform.Version === "string" || typeof Platform.Version === "number"
        ? { osVersion: String(Platform.Version) }
        : {}),
    }),
  })
    .then((obs) => {
      // User scope follows auth; cleared on logout.
      const syncContext = () => {
        try {
          const user = useAuthStore.getState().user as unknown as
            | { id?: string }
            | null;
          if (user?.id) obs.setContext({ userId: user.id });
          else obs.setContext({ clearUser: true });
        } catch {}
      };
      try {
        syncContext();
        useAuthStore.subscribe(syncContext as never);
      } catch {}
      // App lifecycle breadcrumbs + flush on background.
      try {
        obs.event("app.started", { cold_start: true });
        AppState.addEventListener("change", (state) => {
          try {
            if (state === "active") obs.event("app.foregrounded");
            else if (state === "background") {
              obs.event("app.backgrounded");
              void obs.flush();
            }
          } catch {}
        });
      } catch {}
      console.debug("[observability] initialized", {
        endpoint: process.env.EXPO_PUBLIC_TELEMETRY_URL ?? "(none)",
        session: obs.sessionId,
      });
    })
    .catch((error) => {
      console.debug("[observability] init failed (non-fatal)", error);
    });
}

export { getObservability };

export type TelemetryAttributes = Record<
  string,
  string | number | boolean | undefined
>;

/** Fire-and-forget domain event. Never throws, safe before init. */
export function trackEvent(name: string, attrs?: TelemetryAttributes): void {
  try {
    getObservability()?.event(name, attrs as never);
  } catch {}
}

const SCREEN_NAMES: Record<string, string> = {
  pos: "POS",
  kyc: "KYC",
  faq: "FAQ",
  kitchen: "Kitchen",
  display: "Display",
  deliveries: "Deliveries",
  orders: "Orders",
  menu: "Menu",
  wallet: "Wallet",
  businesses: "Businesses",
  riders: "Riders",
  vehicles: "Vehicles",
  members: "Members",
  analytics: "Analytics",
  dashboard: "Dashboard",
  settings: "Settings",
  profile: "Profile",
  notifications: "Notifications",
  invitations: "Invitations",
  messages: "Messages",
  chat: "Chat",
  map: "Map",
  login: "Login",
  signup: "Signup",
  verification: "Verification",
  role: "RoleSelect",
  onboarding: "Onboarding",
  splash: "Splash",
};

function isIdSegment(seg: string): boolean {
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg) ||
    /^[0-9]{2,}$/.test(seg) ||
    (seg.length >= 16 && /^[0-9a-zA-Z_-]+$/.test(seg))
  ) {
    return true;
  }
  // Coded ids (BIZ-001, order_123) — contain digits plus a separator.
  // Pure slugs (operating-hours) have no digits and are kept.
  return /[0-9]/.test(seg) && /[-_]/.test(seg);
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

/** Role group prefix so seller/rider/fleet screens stay distinct. */
function rolePrefix(pathname: string): string {
  if (pathname.includes("(seller)")) return "Seller";
  if (pathname.includes("(rider)")) return "Rider";
  if (pathname.includes("(fleet)")) return "Fleet";
  if (pathname.includes("(communication)")) return "";
  return "";
}

/**
 * Maps an expo-router pathname to a human screen name + normalized template.
 * Role groups become prefixes (SellerPOS, RiderDeliveries); id-like segments
 * collapse to {id}.
 */
export function describeRoute(pathname: string): {
  screen: string;
  route_template: string;
} {
  if (pathname.includes("(auth)")) {
    const segs = pathname.split("/").filter((s) => s.length > 0 && !s.startsWith("("));
    const head = segs[0] ?? "index";
    return {
      screen: SCREEN_NAMES[head] ?? capitalize(head),
      route_template: `/(auth)/${head}`,
    };
  }
  if (pathname === "/" || pathname === "/index") {
    return { screen: "Launch", route_template: "/" };
  }

  const prefix = rolePrefix(pathname);
  const segs = pathname.split("/").filter((s) => s.length > 0 && !s.startsWith("("));
  if (segs.length === 0) return { screen: `${prefix}Home` || "Launch", route_template: "/" };

  const [head, ...rest] = segs;
  const template: string[] = [head];
  let refiner = "";
  for (const seg of rest) {
    if (isIdSegment(seg)) {
      template.push("{id}");
    } else {
      template.push(seg);
      // Screen name takes at most one static sub-segment
      // (settings/printer, never settings/printer/advanced).
      if (!refiner) refiner = capitalize(seg);
    }
  }
  const screen = `${prefix}${SCREEN_NAMES[head] ?? capitalize(head)}${refiner}`;
  return { screen, route_template: `/${template.join("/")}` };
}

/**
 * Emits screen.view with human screen name + normalized template.
 * Mount once inside the root layout.
 */
export function useScreenTracking(): void {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    try {
      const { screen, route_template } = describeRoute(pathname);
      trackEvent("screen.view", {
        screen,
        route: route_template,
        ...(first.current ? { cold_start: true } : {}),
      });
    } catch {}
    first.current = false;
  }, [pathname]);
}

/**
 * Runs fn inside a span. Falls back to running fn directly when telemetry
 * is uninitialized. Critical paths (checkout/payment) force sampling.
 */
export async function traceOp<T>(  name: string,
  fn: (span: never) => T | Promise<T>,
  sampled?: boolean,
): Promise<T> {
  const run = () => fn(undefined as never);
  try {
    const obs = getObservability();
    if (!obs) return run();
    return obs.trace(
      name,
      fn as never,
      ...(sampled === undefined ? [] : [{ sampled }]),
    ) as Promise<T>;
  } catch {
    return run();
  }
}
