import { useEffect } from 'react';
import { AppState } from 'react-native';
import {
  flushPendingImageUploads,
  mirrorPendingImageAssets,
} from '@/services/upload.service';
import { useConnectivityStore } from '@/stores/connectivity.store';

/**
 * Retries the durable menu-image outbox. Images picked while offline are
 * cached and bound to their menu records; this hook uploads them when the
 * cloud returns and patches the menu item with the real S3 key.
 */
export function usePendingImageUploads() {
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const isCloudReachable = useConnectivityStore((state) => state.isCloudReachable);

  useEffect(() => {
    if (!isOnline || isCloudReachable === 'unreachable') return;
    void mirrorPendingImageAssets();
    void flushPendingImageUploads();
    const timer = setInterval(() => {
      void mirrorPendingImageAssets();
      void flushPendingImageUploads();
    }, 30_000);
    return () => clearInterval(timer);
  }, [isOnline, isCloudReachable]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void mirrorPendingImageAssets();
        void flushPendingImageUploads();
      }
    });
    return () => subscription.remove();
  }, []);
}
