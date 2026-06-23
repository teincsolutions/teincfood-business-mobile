import type { PaginatedResponse } from './pagination';

export interface SellerOrderItem {
  name: string;
  quantity: number;
  price_minor: number;
  addons: string[];
}

export interface SellerDeliveryInfo {
  id: string;
  status: string;
  rider_name: string | null;
  rider_phone: string | null;
}

export interface SellerOrder {
  id: string;
  order_number: string;
  status: string;
  total_minor: number;
  currency: string;
  customer_name: string;
  customer_phone: string | null;
  payment_status: string;
  payment_method: string;
  items: SellerOrderItem[];
  delivery_address: string | null;
  notes: string | null;
  business_id: string;
  delivery: SellerDeliveryInfo | null;
  inserted_at: string;
  updated_at: string;
}

export type SellerOrdersResponse = PaginatedResponse<SellerOrder>;

export interface SellerOrderDetailResponse {
  data: SellerOrder;
}
