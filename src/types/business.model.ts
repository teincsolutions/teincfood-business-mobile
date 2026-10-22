export interface BusinessAddress {
  street: string;
  city: string;
  region: string;
  postalCode?: string;
  country: string;
  latitude: number;
  longitude: number;
  fullAddress: string;
}

export interface OperatingHours {
  dayOfWeek: number;           // 0-6 (Sunday-Saturday)
  dayName: string;             // "Sunday", "Monday", etc.
  openTime: string;            // "09:00"
  closeTime: string;           // "22:00"
  isClosed: boolean;           // For holidays/special days
}

export interface DeliverySettings {
  deliveryRadius: number;      // in km
  minimumOrderAmount: number;
  deliveryFee: number;
  freeDeliveryThreshold?: number;
  estimatedPrepTime: number;   // in minutes
  acceptsPickup: boolean;
  acceptsDelivery: boolean;
}

export interface PaymentSettings {
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  mobileMoneyNumber?: string;
  mobileMoneyProvider?: 'mtn' | 'vodafone' | 'airteltigo';
  payoutSchedule: 'daily' | 'weekly' | 'biweekly' | 'monthly';
}

export type BusinessType = 'merchant' | 'delivery_provider';

export type BusinessStatus = 'active' | 'inactive' | 'pending_verification' | 'suspended';

export interface Business {
  id: string;
  code: string;                  // Human-readable: "TEINC-ACC-001"
  ownerId: string;               // Links to User.id
  name: string;                  // "Teinc Foods - Accra Mall"
  type: BusinessType;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  address: BusinessAddress;
  phone: string;
  email?: string;
  currency: string;              // Currency code (e.g., "GHS", "USD")
  operatingHours: OperatingHours[];
  deliverySettings: DeliverySettings;
  paymentSettings: PaymentSettings;
  status: BusinessStatus;
  isDefault: boolean;
  rating: number;
  reviewCount: number;
  totalOrders: number;
  /** Backend-computed open flag (operating hours + manual close). */
  is_open?: boolean;
  /** Seller-facing manual open/close toggle (backend `manually_closed`). */
  manually_closed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessRequest {
  name: string;
  type: BusinessType;
  address: BusinessAddress;
  phone: string;
  email?: string;
  description?: string;
  operatingHours?: Partial<OperatingHours>[];
  deliverySettings?: Partial<DeliverySettings>;
  paymentSettings?: Partial<PaymentSettings>;
}

export interface UpdateBusinessRequest {
  name?: string;
  type?: BusinessType;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  address?: BusinessAddress;
  phone?: string;
  email?: string;
  operatingHours?: OperatingHours[];
  deliverySettings?: Partial<DeliverySettings>;
  paymentSettings?: Partial<PaymentSettings>;
  status?: BusinessStatus;
}

import type { Business as ApiBusiness } from '@teincfood/core';

export interface BusinessSummary extends ApiBusiness {
  isDefault?: boolean;
}