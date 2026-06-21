export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  currency?: string;
  addons?: Array<{ name: string; price: number; currency?: string }>;
}

export interface SellerOrder {
  id: string;
  orderNumber: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  items: number;
  total: number;
  customer: string;
  customerPhone?: string;
  deliveryAddress?: string;
  orderDate: string;
  estimatedDelivery?: string;
  paymentMethod: 'mobile_money' | 'card' | 'cash';
  paymentStatus: 'paid' | 'unpaid';
  orderItems?: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  notes?: string;
}
