import { Platform } from 'react-native';
import { api } from './api';

export interface PushTokenRegistrationRequest {
  token: string;
  platform: 'ios' | 'android';
  provider: 'fcm' | 'apns';
}

export const devicesService = {
  registerPushToken(token: string): Promise<any> {
    const isIOS = Platform.OS === 'ios';
    const payload: PushTokenRegistrationRequest = {
      token,
      platform: isIOS ? 'ios' : 'android',
      provider: 'fcm',
    };
    return api.post('/devices/push-token', payload);
  },

  unregisterPushToken(tokenId: string): Promise<any> {
    return api.delete(`/devices/push-token/${tokenId}`);
  },
};
