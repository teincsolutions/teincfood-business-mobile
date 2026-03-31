import type { FoodItem, FoodAddon } from './food.model';

export interface CartItem {
  id: string;
  food: FoodItem;
  quantity: number;
  selectedAddons: FoodAddon[];
  specialInstructions?: string;
  totalPrice: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
}
