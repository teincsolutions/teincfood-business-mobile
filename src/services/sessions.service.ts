/**
 * Sessions Service
 * Handles active session management for security settings
 */

export interface Session {
  id: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web' | 'desktop';
  browser?: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
  loginAt: string;
}

// Mock session data
const MOCK_SESSIONS: Session[] = [
  {
    id: 'session-1',
    deviceName: 'iPhone 15 Pro',
    deviceType: 'ios',
    location: 'Accra, Ghana',
    ipAddress: '192.168.1.105',
    lastActive: 'Just now',
    isCurrent: true,
    loginAt: '2026-04-01T08:30:00Z',
  },
  {
    id: 'session-2',
    deviceName: 'MacBook Pro',
    deviceType: 'desktop',
    browser: 'Chrome 120',
    location: 'Accra, Ghana',
    ipAddress: '192.168.1.102',
    lastActive: '2 hours ago',
    isCurrent: false,
    loginAt: '2026-03-30T14:20:00Z',
  },
  {
    id: 'session-3',
    deviceName: 'Samsung Galaxy S24',
    deviceType: 'android',
    location: 'Kumasi, Ghana',
    ipAddress: '41.215.162.45',
    lastActive: '1 day ago',
    isCurrent: false,
    loginAt: '2026-03-28T09:15:00Z',
  },
  {
    id: 'session-4',
    deviceName: 'iPad Air',
    deviceType: 'ios',
    location: 'Tema, Ghana',
    ipAddress: '41.215.180.22',
    lastActive: '3 days ago',
    isCurrent: false,
    loginAt: '2026-03-25T16:45:00Z',
  },
  {
    id: 'session-5',
    deviceName: 'Windows PC',
    deviceType: 'desktop',
    browser: 'Firefox 119',
    location: 'Takoradi, Ghana',
    ipAddress: '41.215.170.88',
    lastActive: '1 week ago',
    isCurrent: false,
    loginAt: '2026-03-22T11:30:00Z',
  },
];

const SIMULATED_DELAY = 400;

/**
 * Fetch all active sessions for the current user
 */
export async function fetchSessions(): Promise<Session[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...MOCK_SESSIONS]);
    }, SIMULATED_DELAY);
  });
}

/**
 * Terminate a specific session
 */
export async function terminateSession(sessionId: string): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const sessionIndex = MOCK_SESSIONS.findIndex((s) => s.id === sessionId);
      if (sessionIndex === -1) {
        resolve({ success: false, message: 'Session not found' });
        return;
      }

      if (MOCK_SESSIONS[sessionIndex].isCurrent) {
        resolve({ success: false, message: 'Cannot terminate current session' });
        return;
      }

      // Remove from mock data
      MOCK_SESSIONS.splice(sessionIndex, 1);
      resolve({ success: true, message: 'Session terminated successfully' });
    }, SIMULATED_DELAY);
  });
}

/**
 * Terminate all other sessions except current
 */
export async function terminateAllOtherSessions(): Promise<{ success: boolean; message: string; count: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const otherSessions = MOCK_SESSIONS.filter((s) => !s.isCurrent);
      const count = otherSessions.length;

      // Keep only current session
      const currentSession = MOCK_SESSIONS.find((s) => s.isCurrent);
      if (currentSession) {
        MOCK_SESSIONS.length = 0;
        MOCK_SESSIONS.push(currentSession);
      }

      resolve({
        success: true,
        message: `${count} session(s) terminated successfully`,
        count,
      });
    }, SIMULATED_DELAY);
  });
}