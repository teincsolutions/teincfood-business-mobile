// @ts-nocheck
import { useRouter, useSegments } from "expo-router";
import { YStack, Text, Spinner } from "tamagui";
import { useStartupReadiness } from "@teincfood/core";
import { Button } from "@/components/ui/Button";
import { routeCapabilities } from "@/constants/route-capabilities";

/**
 * Surfaces that need the full offline reference cache to function. This is a
 * POS/order-*creation* precondition (device lease + menu/tax/hours/entitlement)
 * — it must never block read-only order browsing/detail, which works fine from
 * the local read-model even without a lease. Settings / business management
 * stay reachable even when readiness is false, so an operator can configure
 * operating hours offline and recover.
 */
const ORDER_SURFACE_CAPABILITIES = new Set(["orders_create"]);

/** Route groups like `(drawer)` are URL-transparent — drop them for matching. */
function normalizeSegments(segments: string[]): string[] {
  return segments.filter((s) => !(s.startsWith("(") && s.endsWith(")")));
}

function requiredCapabilityFor(segments: string[]): string | null {
  const path = `/${normalizeSegments(segments).join("/")}`;
  if (routeCapabilities[path]) return routeCapabilities[path];
  const prefix = Object.keys(routeCapabilities)
    .filter((route) => path.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
  return prefix ? routeCapabilities[prefix] : null;
}

/**
 * Blocks POS/Orders until the required offline data (menu, taxes, hours,
 * capabilities, entitlement proof, device lease) is cached. Shows an explicit
 * "preparing" state with retry instead of letting the seller hit a guard
 * (HOURS_NOT_SYNCED / no device leased) at order-tap time.
 */
export function StartupReadinessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const segments = useSegments();
  const router = useRouter();
  const { readiness, checking, recheck } = useStartupReadiness({
    timeoutMs: 15000,
  });

  const requiredCap = requiredCapabilityFor(segments as unknown as string[]);
  const isOrderSurface =
    requiredCap !== null && ORDER_SURFACE_CAPABILITIES.has(requiredCap);

  // Non-order surfaces (dashboard, settings, menu, etc.) are never blocked.
  if (!isOrderSurface) return <>{children}</>;

  if (readiness === null || (checking && !readiness.ready)) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$3"
        padding="$4"
      >
        <Spinner size="large" />
        <Text color="$color">Preparing offline data…</Text>
      </YStack>
    );
  }

  if (!readiness.ready) {
    const lease = readiness.leaseError;
    const terminalLimit =
      lease?.code === "TERMINAL_LIMIT_REACHED" ||
      lease?.code === "DEVICE_LIMIT_REACHED";
    const needsTerminal = terminalLimit || readiness.needsLease;
    const title =
      lease?.code === "TERMINAL_LIMIT_REACHED" ||
      lease?.code === "DEVICE_LIMIT_REACHED"
        ? "Terminal limit reached"
        : readiness.needsLease
          ? "Terminal not activated"
          : "Offline data incomplete";
    const message =
      lease?.code === "TERMINAL_LIMIT_REACHED"
        ? `${lease.message} Remove an old terminal or choose a plan with more terminals, then retry.`
        : lease?.code === "DEVICE_LIMIT_REACHED"
          ? `${lease.message} Remove an old terminal, then retry.`
          : readiness.needsLease
            ? "This device needs a terminal number before it can take orders. If every slot is in use, remove an unused terminal, then retry."
            : readiness.network?.isOnline
              ? "We couldn't finish syncing the menu, taxes, hours and terminal details. Check your connection and retry."
              : "Connect to the internet once so the menu, taxes, hours and device number can sync before taking orders.";

    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$3"
        padding="$6"
      >
        <Text fontSize="$7" fontWeight="700" textAlign="center">
          {title}
        </Text>
        <Text color="$color" textAlign="center">
          {message}
        </Text>
        {needsTerminal ? (
          <Button
            variant="outline"
            onPress={() =>
              router.push("/(seller)/settings/offline-device" as any)
            }
          >
            Manage terminals
          </Button>
        ) : null}
        <Button
          variant="primary"
          onPress={() => void recheck()}
          disabled={checking}
        >
          {checking ? "Retrying…" : "Retry"}
        </Button>
      </YStack>
    );
  }

  return <>{children}</>;
}
