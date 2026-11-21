import { useCallback, useEffect, useState } from "react";
import {
  listBusinessDevices,
  revokeBusinessDevice,
  type BusinessDevice,
} from "@/services/offline-devices.service";

export type { BusinessDevice } from "@/services/offline-devices.service";

/**
 * Lists and revokes business-linked terminals. Owners, super-admins and
 * managers are allowed by the backend; callers should gate `enabled` with the
 * matching capability/role check so cashiers never see the management UI.
 */
export function useBusinessDevices(
  businessId: string | null | undefined,
  enabled: boolean,
) {
  const [devices, setDevices] = useState<BusinessDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId || !enabled) return;

    setLoading(true);
    setError(null);
    try {
      const rows = await listBusinessDevices(businessId);
      setDevices(
        [...rows].sort((a, b) => {
          if (a.online !== b.online) return a.online ? -1 : 1;
          return (
            Date.parse(b.last_seen ?? "1970-01-01") -
            Date.parse(a.last_seen ?? "1970-01-01")
          );
        }),
      );
    } catch (err) {
      console.debug("[useBusinessDevices] failed to list terminals", err);
      setError(
        err instanceof Error
          ? err.message
          : "Connect to the internet to manage terminals.",
      );
    } finally {
      setLoading(false);
    }
  }, [businessId, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = useCallback(
    async (deviceUuid: string) => {
      if (!businessId) throw new Error("Select a business first");
      console.debug("[useBusinessDevices] revoking terminal", {
        businessId,
        deviceUuid,
      });
      const updated = await revokeBusinessDevice(businessId, deviceUuid);
      await load();
      return updated;
    },
    [businessId, load],
  );

  return { devices, loading, error, reload: load, revoke };
}
