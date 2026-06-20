import { api } from './api';

export const liveActivitiesService = {
  registerIOSLiveActivity(orderId: string, payload: any): Promise<any> {
    return api.post(`/orders/${orderId}/live-activity/ios`, payload);
  },

  unregisterIOSLiveActivity(orderId: string, activityId: string): Promise<any> {
    return api.delete(`/orders/${orderId}/live-activity/ios/${activityId}`);
  },
};
