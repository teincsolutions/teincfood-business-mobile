import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { phoenixSocket } from '@/services/phoenix-socket.service';
import * as riderService from '@/services/rider.service';

interface UseRiderLocationTrackingOptions {
  riderId: number | string | undefined;
  enabled: boolean;
}

export function useRiderLocationTracking({ riderId, enabled }: UseRiderLocationTrackingOptions) {
  const watcherRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    const channelTopic = riderId ? `location:rider:${riderId}` : null;
    if (!enabled || !channelTopic) return;

    let cancelled = false;

    const topic: string = channelTopic;

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      await phoenixSocket.connect().catch(() => {});

      try {
        await phoenixSocket.joinChannel(topic);
      } catch {
        return;
      }

      if (cancelled) return;

      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 10,
          timeInterval: 5000,
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;

          if (phoenixSocket.hasJoined(topic)) {
            phoenixSocket.pushWithReply(topic, 'update', {
              lat: latitude,
              lng: longitude,
            }).catch(() => {
              riderService.updateRiderLocation(latitude, longitude).catch(() => {});
            });
          } else {
            riderService.updateRiderLocation(latitude, longitude).catch(() => {});
          }
        },
      );

      if (!cancelled) {
        watcherRef.current = watcher;
      } else {
        watcher.remove();
      }
    }

    start();

    return () => {
      cancelled = true;

      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }

      phoenixSocket.leaveChannel(topic);
    };
  }, [riderId, enabled]);
}
