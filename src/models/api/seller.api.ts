import type { PaginatedResponse } from './pagination';

// ─── Seller Order ───

export interface SellerOrder {
  id: string;
  order_number: string;
  status: string;
  total_minor: number;
  currency: string;
  customer_name: string;
  payment_status: string;
  payment_method: string;
  items: SellerOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface SellerOrderItem {
  name: string;
  quantity: number;
  price_minor: number;
  addons: string[];
}

export type SellerOrdersResponse = PaginatedResponse<SellerOrder>;

export interface SellerOrderDetailResponse {
  data: SellerOrder;
}
