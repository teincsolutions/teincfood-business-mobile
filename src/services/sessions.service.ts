import { api } from './api';

export interface Session {
  id: string;
  device_name: string;
  device_type: 'ios' | 'android' | 'web' | 'desktop';
  browser?: string;
  ip_address: string;
  last_active: string;
  is_current: boolean;
  login_at: string;
}

export async function fetchSessions(): Promise<Session[]> {
  return api.get<{ data: Session[] }>('/sessions').then(res => res.data);
}

export async function terminateSession(sessionId: string): Promise<{ success: boolean; message: string }> {
  return api.delete(`/sessions/${sessionId}`).then(() => ({
    success: true,
    message: 'Session terminated',
  }));
}

export async function terminateAllOtherSessions(): Promise<{ success: boolean; message: string; count: number }> {
  return api.delete('/sessions/others').then(() => ({
    success: true,
    message: 'All other sessions terminated',
    count: 0,
  }));
}
