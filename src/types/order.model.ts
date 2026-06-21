import type { CartItem } from './cart.model';
import type { Address, PaymentMethod } from './user.model';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  status: OrderStatus;
  deliveryAddress: Address;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  currency: string;
  estimatedDeliveryTime?: string;
  deliveryPerson?: DeliveryPerson;
  placedAt: string;
  deliveredAt?: string;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  rating: number;
  currentLatitude?: number;
  currentLongitude?: number;
}

export interface OrderTrackingUpdate {
  status: OrderStatus;
  timestamp: string;
  message: string;
}
