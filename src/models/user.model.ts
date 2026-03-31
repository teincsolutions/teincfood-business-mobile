export interface User {
  id: string;
  username?: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: 'buyer' | 'seller';
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  addresses: Address[];
  paymentMethods: PaymentMethod[];
}

export interface Address {
  id: string;
  label: 'home' | 'work' | 'other';
  street: string;
  apartment?: string;
  postCode: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'cash' | 'visa' | 'mastercard' | 'paypal' | 'mobile_money';
  last4?: string;
  cardHolderName?: string;
  expiryDate?: string;
  isDefault: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
  phone: string;
}

export interface OTPVerifyRequest {
  phone: string;
  code: string;
  sessionId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
