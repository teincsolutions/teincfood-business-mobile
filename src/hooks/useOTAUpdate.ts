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
    if (checking.current) return;
    checking.current = true;

    const check = async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (!update.isAvailable) return;
        showAlert({
          title: 'Update Available',
          description: 'A new version of TF Business is available. Update now to get the latest features and fixes.',
          confirmText: 'Update Now',
          cancelText: 'Later',
          onConfirm: async () => {
            try {
              await Updates.fetchUpdateAsync();
              await Updates.reloadAsync();
            } catch {
              // Keep the user in the current version if the update fails
            }
          },
        });
      } catch {
        // Ignore update check failures (offline, dev builds, unsupported)
      }
    };

    check();
  }, [showAlert]);
}

export default useOTAUpdate;