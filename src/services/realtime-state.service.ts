/**
 * Realtime State Service
 * Provides reconnect resume, ack/read state persistence, and ordering/de-dup
 */

import { zustandStorage } from '@/utils/storage';

export interface ChatMessage {
  messageId: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  sequence: number;
}

export interface ChatState {
  messages: Record<string, ChatMessage[]>;
  lastSequence: number;
  readReceipts: Record<string, string>;
  pendingAcks: string[];
}

export interface SSEState {
  lastEventId: string | null;
  lastSequence: number;
  processedEvents: Set<string>;
}

const CHAT_STATE_KEY = 'teincfoods-chat-state';
const SSE_STATE_KEY = 'teincfoods-sse-state';

class RealtimeStateService {
  private chatState: ChatState = {
    messages: {},
    lastSequence: 0,
    readReceipts: {},
    pendingAcks: [],
  };

  private sseState: SSEState = {
    lastEventId: null,
    lastSequence: 0,
    processedEvents: new Set(),
  };

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const chatStateStr = zustandStorage.getItem(CHAT_STATE_KEY);
      if (chatStateStr && typeof chatStateStr === 'string') {
        const parsed = JSON.parse(chatStateStr);
        this.chatState = {
          ...this.chatState,
          ...parsed,
          messages: parsed.messages || {},
          readReceipts: parsed.readReceipts || {},
          pendingAcks: parsed.pendingAcks || [],
        };
      }

      const sseStateStr = zustandStorage.getItem(SSE_STATE_KEY);
      if (sseStateStr && typeof sseStateStr === 'string') {
        const parsed = JSON.parse(sseStateStr);
        this.sseState = {
          ...this.sseState,
          ...parsed,
          processedEvents: new Set(parsed.processedEvents || []),
        };
      }
    } catch (error) {
      console.warn('Failed to load realtime state:', error);
    }
  }

  private saveChatState() {
    try {
      zustandStorage.setItem(CHAT_STATE_KEY, JSON.stringify(this.chatState));
    } catch (error) {
      console.warn('Failed to save chat state:', error);
    }
  }

  private saveSSEState() {
    try {
      const toSave = {
        ...this.sseState,
        processedEvents: Array.from(this.sseState.processedEvents),
      };
      zustandStorage.setItem(SSE_STATE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.warn('Failed to save SSE state:', error);
    }
  }

  // Chat State Management
  getLastChatSequence(): number {
    return this.chatState.lastSequence;
  }

  setLastChatSequence(sequence: number): void {
    this.chatState.lastSequence = sequence;
    this.saveChatState();
  }

  addMessage(chatId: string, message: ChatMessage): void {
    if (!this.chatState.messages[chatId]) {
      this.chatState.messages[chatId] = [];
    }

    // De-dup by messageId
    const existing = this.chatState.messages[chatId].find(
      (m) => m.messageId === message.messageId
    );
    if (existing) {
      return;
    }

    // Insert in sequence order
    const messages = this.chatState.messages[chatId];
    const insertIndex = messages.findIndex((m) => m.sequence > message.sequence);
    if (insertIndex === -1) {
      messages.push(message);
    } else {
      messages.splice(insertIndex, 0, message);
    }

    this.saveChatState();
  }

  getMessages(chatId: string): ChatMessage[] {
    return this.chatState.messages[chatId] || [];
  }

  updateMessageStatus(
    chatId: string,
    messageId: string,
    status: ChatMessage['status']
  ): void {
    const messages = this.chatState.messages[chatId];
    if (!messages) return;

    const message = messages.find((m) => m.messageId === messageId);
    if (message) {
      message.status = status;
      this.saveChatState();
    }
  }

  markMessageRead(chatId: string, messageId: string, readerId: string): void {
    this.chatState.readReceipts[`${chatId}:${messageId}`] = readerId;
    this.updateMessageStatus(chatId, messageId, 'read');
    this.saveChatState();
  }

  isMessageRead(chatId: string, messageId: string): boolean {
    return Boolean(this.chatState.readReceipts[`${chatId}:${messageId}`]);
  }

  addPendingAck(messageId: string): void {
    if (!this.chatState.pendingAcks.includes(messageId)) {
      this.chatState.pendingAcks.push(messageId);
      this.saveChatState();
    }
  }

  removePendingAck(messageId: string): void {
    this.chatState.pendingAcks = this.chatState.pendingAcks.filter(
      (id) => id !== messageId
    );
    this.saveChatState();
  }

  getPendingAcks(): string[] {
    return [...this.chatState.pendingAcks];
  }

  // SSE State Management
  getLastSSEEventId(): string | null {
    return this.sseState.lastEventId;
  }

  setLastSSEEventId(eventId: string): void {
    this.sseState.lastEventId = eventId;
    this.saveSSEState();
  }

  getLastSSESequence(): number {
    return this.sseState.lastSequence;
  }

  setLastSSESequence(sequence: number): void {
    this.sseState.lastSequence = sequence;
    this.saveSSEState();
  }

  isEventProcessed(eventId: string): boolean {
    return this.sseState.processedEvents.has(eventId);
  }

  markEventProcessed(eventId: string): void {
    this.sseState.processedEvents.add(eventId);
    
    // Keep only last 1000 events to prevent memory issues
    if (this.sseState.processedEvents.size > 1000) {
      const eventsArray = Array.from(this.sseState.processedEvents);
      this.sseState.processedEvents = new Set(eventsArray.slice(-500));
    }
    
    this.saveSSEState();
  }

  // Cleanup
  clearChatState(): void {
    this.chatState = {
      messages: {},
      lastSequence: 0,
      readReceipts: {},
      pendingAcks: [],
    };
    this.saveChatState();
  }

  clearSSEState(): void {
    this.sseState = {
      lastEventId: null,
      lastSequence: 0,
      processedEvents: new Set(),
    };
    this.saveSSEState();
  }
}

export const realtimeStateService = new RealtimeStateService();