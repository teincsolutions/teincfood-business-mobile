// ─── Kiosk Order ───

export interface KioskOrder {
  id: string;
  order_number: string;
  status: string;
  total_minor: number;
  currency: string;
  customer_name: string;
  payment_status: string;
  payment_method: string;
  items: KioskOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface KioskOrderItem {
  name: string;
  quantity: number;
  price_minor: number;
}

export interface KioskOrdersResponse {
  data: KioskOrder[];
}
