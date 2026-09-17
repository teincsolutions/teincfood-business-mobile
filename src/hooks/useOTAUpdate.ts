import { useEffect, useRef } from 'react';
import * as Updates from 'expo-updates';
import { useAlert } from '../contexts/AlertContext';

export function useOTAUpdate() {
  const { showAlert } = useAlert();
  const checking = useRef(false);

  useEffect(() => {
    if (__DEV__ || process.env.EXPO_PUBLIC_ENABLE_OTA === 'false') {
      return;
    }
    if (!Updates.isEnabled) {
      console.debug('[OTA] expo-updates not enabled (Expo Go or unconfigured build) — skipping');
      return;
    }
    if (checking.current) return;
    checking.current = true;

    const check = async () => {
      try {
        console.debug('[OTA] checking for update', {
          channel: Updates.channel,
          runtimeVersion: Updates.runtimeVersion,
          updateId: Updates.updateId,
        });
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable) {
          console.debug('[OTA] no update available');
          return;
        }
        console.debug('[OTA] update available — prompting user');
        showAlert({
          title: 'Update Available',
          description: 'A new version of TF Business is available. Update now to get the latest features and fixes.',
          confirmText: 'Update Now',
          cancelText: 'Later',
          onConfirm: async () => {
            try {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            } catch (e) {
              console.debug('[OTA] fetch/reload failed', e);
              // Keep the user in the current version if the update fails
            }
          },
        });
      } catch (e) {
        console.debug('[OTA] check failed (offline, wrong channel, or unpublished)', e);
      }
    };

    check();
  }, [showAlert]);
}

export default useOTAUpdate;
