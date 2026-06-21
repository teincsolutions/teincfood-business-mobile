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

    console.log('[LocationTracking] Starting riderId=%s topic=%s', riderId, topic);

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) {
        console.log('[LocationTracking] Permission not granted or cancelled');
        return;
      }

      console.log('[LocationTracking] Connecting to WebSocket...');
      await phoenixSocket.connect().catch(() => {
        console.log('[LocationTracking] WebSocket connect failed, will use REST fallback');
      });

      try {
        await phoenixSocket.joinChannel(topic);
        console.log('[LocationTracking] Joined channel %s successfully', topic);
      } catch (err) {
        console.log('[LocationTracking] Failed to join channel %s: %s', topic, (err as any)?.message || String(err));
        return;
      }

      if (cancelled) return;

      console.log('[LocationTracking] Starting GPS watcher (10m / 5s)...');
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
      console.log('[LocationTracking] Stopping riderId=%s', riderId);

      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }

      phoenixSocket.leaveChannel(topic);
      console.log('[LocationTracking] Stopped riderId=%s', riderId);
    };
  }, [riderId, enabled]);
}
