export type RegionCode = string;

export interface EventEnvelope<TPayload = unknown> {
  eventId: string;
  type: string;
  occurredAt: string;
  sequence: number;
  region: RegionCode;
  orderId?: string | null;
  chatId?: string | null;
  version: number;
  payload: TPayload;
}

export interface BootstrapResponse {
  user: {
    id: string;
    username: string;
    email: string;
  } | null;
  region: {
    countryCode: string;
    currencyCode: string;
    timezone: string;
  };
  features: {
    liveActivitiesIOS: boolean;
    androidLiveNotifications: boolean;
    sseNotifications: boolean;
  };
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    phone: string;
    fullName: string;
  };
}

export interface SetLocationRequest {
  latitude: number;
  longitude: number;
  city: string;
  area: string;
  countryCode: string;
}

export interface PushTokenRegistrationRequest {
  platform: 'ios' | 'android';
  provider: 'fcm' | 'apns';
  token: string;
  locale: string;
  timezone: string;
  appVersion: string;
}

export interface LiveActivityRegistrationRequest {
  activityId: string;
  pushToken: string;
  attributesVersion: number;
}

export interface ChatSendPayload {
  clientMessageId: string;
  chatId: string;
  text: string;
}

export interface ChatAckPayload {
  clientMessageId: string;
  serverMessageId: string;
  status: 'sent' | 'delivered' | 'read';
  sentAt: string;
}

export interface ChatMessagePayload {
  messageId: string;
  senderId: string;
  text: string;
}
