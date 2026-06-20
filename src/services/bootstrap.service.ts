import { api } from './api';

export interface BootstrapData {
  region: string;
  currency: string;
  features: {
    ordering: boolean;
    payments: boolean;
    chat: boolean;
  };
}

export const bootstrapService = {
  getBootstrap(): Promise<BootstrapData> {
    return api.get<{ data: BootstrapData }>('/bootstrap').then(res => res.data);
  },
};
