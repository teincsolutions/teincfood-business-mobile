import { WS_BASE_URL, CHAT_CONFIG } from '@/utils/constants';
import { useAuthStore } from '@/stores/auth.store';
import type { ConnectionState, PhoenixV2Frame, PhoenixOutbound } from '@/types/chat';

type FrameHandler = (frame: PhoenixV2Frame) => void;

class PhoenixSocket {
  socket: WebSocket | null = null;
  private refCounter = 0;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatPend = false;
  private heartbeatMissed = 0;
  private static readonly MAX_MISSED_HEARTBEATS = 3;
  private intentionalClose = false;
  private connectGen = 0;
  private connectPromise: Promise<void> | null = null;

  private connectionState: ConnectionState = 'disconnected';
  private connectionListeners: Set<(state: ConnectionState) => void> = new Set();

  private pendingJoins: Map<string, { resolve: (p: Record<string, unknown>) => void; reject: (e: Error) => void }> = new Map();
  private pendingPushes: Map<string, { resolve: (p: Record<string, unknown>) => void; reject: (e: Error) => void }> = new Map();
  joinedChannels: Set<string> = new Set();
  private pendingRejoin: Set<string> = new Set();

  private frameHandlers: Map<string, Set<FrameHandler>> = new Map();

  private getRef(): string {
    return String(++this.refCounter);
  }

  private buildSocketUrl(accessToken: string): string {
    const base = WS_BASE_URL.replace(/\/+$/, '');
    const path = base.endsWith('/ws') ? '/websocket' : '/ws/websocket';
    const withToken = `${base}${path}?token=${encodeURIComponent(accessToken)}&vsn=2.0.0`;
    return withToken;
  }

  private setState(state: ConnectionState) {
    const prev = this.connectionState;
    this.connectionState = state;
    this.connectionListeners.forEach((fn) => fn(state));
  }

  onConnectionStateChange(fn: (state: ConnectionState) => void): () => void {
    this.connectionListeners.add(fn);
    return () => this.connectionListeners.delete(fn);
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.cancelReconnect();
    this.intentionalClose = false;
    this.setState('connecting');

    this.connectPromise = new Promise((resolve, reject) => {
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) {
        this.setState('disconnected');
        this.connectPromise = null;
        reject(new Error('Not authenticated'));
        return;
      }

      const myGen = ++this.connectGen;
      const url = this.buildSocketUrl(accessToken);
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        if (myGen !== this.connectGen) return;
        this.reconnectAttempt = 0;
        this.setState('connected');
        this.startHeartbeat();
        this.rejoinPending().catch(() => {});
        this.connectPromise = null;
        resolve();
      };

      this.socket.onerror = () => {
        if (myGen !== this.connectGen) return;
        if (this.connectionState === 'connecting') {
          this.setState('disconnected');
          this.connectPromise = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const frame: PhoenixV2Frame = JSON.parse(event.data);
          this.handleFrame(frame);
        } catch {
          // silently skip malformed frames
        }
      };

      this.socket.onclose = (event) => {
        if (myGen !== this.connectGen) return;
        this.stopHeartbeat();

        if (!this.intentionalClose) {
          this.joinedChannels.forEach((t) => this.pendingRejoin.add(t));
          this.joinedChannels.clear();
          this.scheduleReconnect();
        } else {
          this.joinedChannels.clear();
          this.pendingRejoin.clear();
          this.setState('disconnected');
        }
        this.connectPromise = null;
      };
    });

    return this.connectPromise;
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.cancelReconnect();
    this.stopHeartbeat();
    this.joinedChannels.clear();
    this.pendingRejoin.clear();
    this.pendingJoins.clear();
    this.pendingPushes.clear();
    this.frameHandlers.clear();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setState('disconnected');
    this.connectPromise = null;
  }

  retryConnection(): void {
    this.cancelReconnect();
    this.reconnectAttempt = 0;
    this.connect().catch(() => {});
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose) return;

    this.setState('reconnecting');

    const delay = Math.min(
      CHAT_CONFIG.RECONNECT_BASE_DELAY_MS * Math.pow(2, this.reconnectAttempt),
      CHAT_CONFIG.RECONNECT_MAX_DELAY_MS,
    );
    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatPend = false;
    this.heartbeatMissed = 0;
    this.heartbeatTimer = setInterval(() => {
      if (this.heartbeatPend) {
        this.heartbeatMissed++;
        if (this.heartbeatMissed >= PhoenixSocket.MAX_MISSED_HEARTBEATS) {
          this.socket?.close();
        }
        return;
      }
      this.heartbeatPend = true;
      this.sendRaw({ topic: 'phoenix', event: 'heartbeat', payload: {} });
    }, CHAT_CONFIG.HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.heartbeatPend = false;
    this.heartbeatMissed = 0;
  }

  private sendRaw(msg: PhoenixOutbound): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const frame: PhoenixV2Frame = [
        msg.joinRef ?? null,
        msg.ref ?? null,
        msg.topic,
        msg.event,
        msg.payload,
      ];
      this.socket.send(JSON.stringify(frame));
    }
  }

  pushWithReply(
    topic: string,
    event: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const ref = this.getRef();
    const msg: PhoenixOutbound = { topic, event, payload, ref };

    return new Promise((resolve, reject) => {
      this.pendingPushes.set(ref, { resolve, reject });
      this.sendRaw(msg);

      setTimeout(() => {
        if (this.pendingPushes.has(ref)) {
          this.pendingPushes.delete(ref);
          reject(new Error(`Request timed out: ${event} on ${topic}`));
        }
      }, 5000);
    });
  }

  private handleFrame([joinRef, ref, topic, event, payload]: PhoenixV2Frame): void {
    if (event === 'phx_reply' && topic === 'phoenix') {
      this.heartbeatPend = false;
      this.heartbeatMissed = 0;
      return;
    }

    if (event === 'phx_reply' && ref) {
      const pending = this.pendingPushes.get(ref);
      if (pending) {
        const status = payload?.status;
        const response = (payload?.response ?? {}) as Record<string, unknown>;

        if (status === 'ok') {
          pending.resolve(response);
        } else {
          pending.reject(new Error(String(response.reason ?? 'Request failed')));
        }
        this.pendingPushes.delete(ref);
        return;
      }
    }

    if (event === 'phx_reply' && payload?.status === 'ok') {
      const pending = this.pendingJoins.get(topic);
      if (pending) {
        const response = (payload?.response ?? {}) as Record<string, unknown>;
        pending.resolve(response);
        this.pendingJoins.delete(topic);
        this.joinedChannels.add(topic);
      }
      return;
    }

    if (event === 'phx_reply' && payload?.status === 'error') {
      const pending = this.pendingJoins.get(topic);
      if (pending) {
        const response = (payload?.response ?? {}) as Record<string, unknown>;
        pending.reject(new Error(String(response.reason ?? 'Join failed')));
        this.pendingJoins.delete(topic);
      }
      return;
    }

    const handlers = this.frameHandlers.get(topic);
    if (handlers) {
      handlers.forEach((cb) => cb([joinRef, ref, topic, event, payload]));
    }
  }

  onFrame(topic: string, handler: FrameHandler): () => void {
    if (!this.frameHandlers.has(topic)) {
      this.frameHandlers.set(topic, new Set());
    }
    this.frameHandlers.get(topic)!.add(handler);
    return () => {
      this.frameHandlers.get(topic)?.delete(handler);
    };
  }

  async joinChannel(topic: string, payload: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    if (this.joinedChannels.has(topic)) {
      return Promise.resolve({});
    }

    const existing = this.pendingJoins.get(topic);
    if (existing) {
      return new Promise((resolve, reject) => {
        this.pendingJoins.set(topic, { resolve, reject });
      });
    }

    const ref = this.getRef();
    const msg: PhoenixOutbound = { topic, event: 'phx_join', payload, ref };

    return new Promise((resolve, reject) => {
      this.pendingJoins.set(topic, { resolve, reject });
      this.sendRaw(msg);

      setTimeout(() => {
        if (this.pendingJoins.has(topic)) {
          this.pendingJoins.delete(topic);
          reject(new Error(`Failed to join channel ${topic} - timeout`));
        }
      }, 5000);
    });
  }

  leaveChannel(topic: string): void {
    this.joinedChannels.delete(topic);
    this.pendingRejoin.delete(topic);
  }

  private async rejoinPending(): Promise<void> {
    const topics = Array.from(this.pendingRejoin);
    this.pendingRejoin.clear();
    await Promise.allSettled(topics.map((topic) => this.joinChannel(topic)));
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  hasJoined(topic: string): boolean {
    return this.joinedChannels.has(topic);
  }
}

export const phoenixSocket = new PhoenixSocket();
