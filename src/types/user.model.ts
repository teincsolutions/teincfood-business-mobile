export type UserRole = 'seller' | 'rider' | 'fleet_manager';

/** Matches the backend's /users/me + auth response shape exactly. */
export interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  has_password: boolean;
  roles: string[];
  email_verified_at: string | null;
  phone_verified_at: string | null;
  kyc_status: string;
  has_completed_kyc: boolean;
  inserted_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  label: 'home' | 'work' | 'business' | 'other';
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
  type: 'bank_account' | 'mobile_money' | 'card' | 'cash';
  accountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  last4?: string;
  cardHolderName?: string;
  cardBrand?: 'visa' | 'mastercard' | 'amex';
  isDefault: boolean;
}