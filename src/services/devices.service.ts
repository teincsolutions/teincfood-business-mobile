import { Platform } from 'react-native';
import { randomUUID } from 'expo-crypto';
import * as Device from 'expo-device';
import { mmkvStorage } from '@/utils/storage';
import { api } from './api';

const APP_INSTANCE_ID_KEY = 'app_instance_id';

export function getAppInstanceId(): string {
  let id = mmkvStorage.getString(APP_INSTANCE_ID_KEY);
  if (!id) {
    id = randomUUID();
    mmkvStorage.set(APP_INSTANCE_ID_KEY, id);
  }
  return id;
}

export function getDeviceDisplayName(): string {
  const model = Device.modelName ?? Platform.select({ ios: 'iPhone', android: 'Android' });
  const shortId = getAppInstanceId().slice(0, 4).toUpperCase();
  return `${model} (${shortId})`;
}

export interface PushTokenRegistrationRequest {
  token: string;
  platform: 'ios' | 'android';
  provider: 'fcm' | 'apns';
  app_instance_id: string;
  app_type?: string;
}

export const devicesService = {
  registerPushToken(token: string): Promise<any> {
    const isIOS = Platform.OS === 'ios';
    const payload: PushTokenRegistrationRequest = {
      token,
      platform: isIOS ? 'ios' : 'android',
      provider: 'fcm',
      app_instance_id: getAppInstanceId(),
      app_type: 'business',
    };
    return api.post('/devices/push-token', payload);
  },

  unregisterPushToken(tokenId: string): Promise<any> {
    return api.delete(`/devices/push-token/${tokenId}`);
  },
};
