import type { SellerOrder as ApiSellerOrder, SellerOrderItem as ApiSellerOrderItem, SellerDeliveryInfo } from '@/types/api/seller.api';

export interface MappedOrderItem {
  name: string;
  quantity: number;
  price_minor: number;
  addons: string[];
}

export interface MappedDeliveryInfo {
  id: string;
  status: string;
  riderName: string | null;
  riderPhone: string | null;
}

export interface MappedSellerOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalMinor: number;
  currency: string;
  customerName: string;
  customerPhone: string | null;
  paymentStatus: string;
  paymentMethod: string;
  items: MappedOrderItem[];
  deliveryAddress: string | null;
  notes: string | null;
  businessId: string;
  delivery: MappedDeliveryInfo | null;
  createdAt: string;
  updatedAt: string;
}

export function mapSellerOrder(api: ApiSellerOrder): MappedSellerOrder {
  return {
    id: api.id,
    orderNumber: api.order_number,
    status: api.status,
    totalMinor: api.total_minor,
    currency: api.currency,
    customerName: api.customer_name,
    customerPhone: api.customer_phone ?? null,
    paymentStatus: api.payment_status,
    paymentMethod: api.payment_method,
    items: (api.items || []).map(mapOrderItem),
    deliveryAddress: api.delivery_address ?? null,
    notes: api.notes ?? null,
    businessId: api.business_id,
    delivery: api.delivery ? mapDeliveryInfo(api.delivery) : null,
    createdAt: api.inserted_at,
    updatedAt: api.updated_at,
  };
}

function mapOrderItem(api: ApiSellerOrderItem): MappedOrderItem {
  return {
    name: api.name,
    quantity: api.quantity,
    price_minor: api.price_minor,
    addons: api.addons || [],
  };
}

function mapDeliveryInfo(api: SellerDeliveryInfo): MappedDeliveryInfo {
  return {
    id: api.id,
    status: api.status,
    riderName: api.rider_name,
    riderPhone: api.rider_phone,
  };
}
