import { useEffect, useRef } from "react";
import { useNotificationsMutations } from "@teincfood/rn-notifications";
import { eventsService } from "@teincfood/core";

const DEBOUNCE_MS = 400;

/**
 * Subscribes to the global Phoenix `events:{user_id}` channel (connected in
 * _layout via useEventsConnection) and triggers a silent refetch of the
 * notifications list whenever the backend emits a `notification_created`
 * event. Reuses the lib's refetch bridge so new in-app notifications appear
 * in realtime without adding a dedicated channel join.
 */
export function useNotificationsRealtime() {
  const { invalidate } = useNotificationsMutations();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = eventsService.on("notification_created", () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        invalidate();
      }, DEBOUNCE_MS);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      unsubscribe();
    };
  }, [invalidate]);
}