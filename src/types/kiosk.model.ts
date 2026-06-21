export interface KioskOrder {
  id: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  currency: string;
  customerName: string;
  paymentStatus: 'paid' | 'unpaid';
  paymentMethod: 'mobile_money' | 'card' | 'cash';
  createdAt?: string;
  status?: 'pending' | 'preparing' | 'ready';
  startedAt?: string;
  estimatedTime: number;
  assignedRider?: string;
}
