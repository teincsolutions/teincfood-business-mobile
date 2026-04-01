import type { FoodAddon, FoodCategory } from '@/models/food.model';

// ─── Food Categories ───
export const MOCK_CATEGORIES: FoodCategory[] = [
  'all', 'pizza', 'burger', 'sandwich', 'biryani', 'desserts', 'drinks', 'salads', 'pasta',
];

// ─── Food Addons ───
export const MOCK_ADDONS: FoodAddon[] = [
  { id: 'addon-1', name: 'Extra Cheese', price: 2.50 },
  { id: 'addon-2', name: 'Mushroom', price: 1.50 },
  { id: 'addon-3', name: 'Bacon', price: 3.00 },
  { id: 'addon-4', name: 'Jalapeño', price: 1.00 },
  { id: 'addon-5', name: 'Avocado', price: 2.00 },
];

// ─── Kiosk Mode Order Data ───
export interface KioskOrder {
  id: string;
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  customerName: string;
  paymentStatus: 'paid' | 'unpaid';
  paymentMethod: 'mobile_money' | 'card' | 'cash';
  createdAt?: string;
  status?: 'preparing';
  startedAt?: string;
  estimatedTime: number;
}

export const MOCK_PENDING_ORDERS: KioskOrder[] = [
  {
    id: '1',
    orderNumber: '#ORD-001',
    items: [
      { name: 'Jollof Rice', quantity: 2, price: 25.00 },
      { name: 'Grilled Chicken', quantity: 1, price: 35.00 },
    ],
    total: 85.00,
    customerName: 'John Doe',
    paymentStatus: 'paid',
    paymentMethod: 'mobile_money',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    estimatedTime: 15,
  },
  {
    id: '2',
    orderNumber: '#ORD-002',
    items: [
      { name: 'Banku & Tilapia', quantity: 1, price: 45.00 },
      { name: 'Kelewele', quantity: 2, price: 10.00 },
    ],
    total: 65.00,
    customerName: 'Jane Smith',
    paymentStatus: 'unpaid',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 180000).toISOString(),
    estimatedTime: 20,
  },
  {
    id: '3',
    orderNumber: '#ORD-003',
    items: [
      { name: 'Waakye', quantity: 3, price: 20.00 },
      { name: 'Fried Plantain', quantity: 2, price: 8.00 },
    ],
    total: 76.00,
    customerName: 'Kwame Asante',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    createdAt: new Date(Date.now() - 60000).toISOString(),
    estimatedTime: 12,
  },
];

export const MOCK_ACTIVE_ORDERS: KioskOrder[] = [
  {
    id: '4',
    orderNumber: '#ORD-004',
    items: [
      { name: 'Fufu & Light Soup', quantity: 2, price: 30.00 },
    ],
    total: 60.00,
    customerName: 'Abena Mensah',
    paymentStatus: 'paid',
    paymentMethod: 'mobile_money',
    status: 'preparing',
    startedAt: new Date(Date.now() - 600000).toISOString(),
    estimatedTime: 5,
  },
  {
    id: '5',
    orderNumber: '#ORD-005',
    items: [
      { name: 'Rice & Stew', quantity: 1, price: 22.00 },
      { name: 'Fried Fish', quantity: 1, price: 25.00 },
    ],
    total: 47.00,
    customerName: 'Kofi Adom',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    status: 'preparing',
    startedAt: new Date(Date.now() - 480000).toISOString(),
    estimatedTime: 8,
  },
];

// ─── Seller Orders Data ───
export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  addons?: Array<{ name: string; price: number }>;
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

export const MOCK_SELLER_ORDERS: SellerOrder[] = [
  { 
    id: '1', 
    orderNumber: '#ORD-001', 
    status: 'pending', 
    items: 3, 
    total: 85.00, 
    customer: 'John Doe',
    customerPhone: '+233 24 567 8901',
    deliveryAddress: '123 Liberation Road, Accra',
    orderDate: '2026-04-01T09:30:00Z',
    estimatedDelivery: '2026-04-01T10:15:00Z',
    paymentMethod: 'mobile_money',
    paymentStatus: 'paid',
    subtotal: 75.00,
    deliveryFee: 10.00,
    orderItems: [
      { name: 'Jollof Rice', quantity: 2, price: 25.00 },
      { name: 'Grilled Chicken', quantity: 1, price: 35.00 },
      { name: 'Kelewele', quantity: 1, price: 10.00, addons: [{ name: 'Extra Pepper', price: 0.50 }] }
    ],
    notes: 'Please make it less spicy'
  },
  { 
    id: '2', 
    orderNumber: '#ORD-002', 
    status: 'preparing', 
    items: 2, 
    total: 65.00, 
    customer: 'Jane Smith',
    customerPhone: '+233 20 123 4567',
    deliveryAddress: '456 Independence Ave, Accra',
    orderDate: '2026-04-01T09:45:00Z',
    estimatedDelivery: '2026-04-01T10:30:00Z',
    paymentMethod: 'cash',
    paymentStatus: 'unpaid',
    subtotal: 55.00,
    deliveryFee: 10.00,
    orderItems: [
      { name: 'Banku & Tilapia', quantity: 1, price: 45.00 },
      { name: 'Kelewele', quantity: 2, price: 10.00 }
    ]
  },
  { 
    id: '3', 
    orderNumber: '#ORD-003', 
    status: 'ready', 
    items: 4, 
    total: 120.00, 
    customer: 'Kwame Asante',
    customerPhone: '+233 27 890 1234',
    deliveryAddress: '789 Oxford Street, Osu',
    orderDate: '2026-04-01T08:15:00Z',
    estimatedDelivery: '2026-04-01T09:00:00Z',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    subtotal: 110.00,
    deliveryFee: 10.00,
    orderItems: [
      { name: 'Waakye', quantity: 2, price: 20.00, addons: [{ name: 'Extra Wele', price: 5.00 }] },
      { name: 'Fried Plantain', quantity: 2, price: 8.00 },
      { name: 'Fried Fish', quantity: 1, price: 25.00 }
    ],
    notes: 'Call when arriving'
  },
  { 
    id: '4', 
    orderNumber: '#ORD-004', 
    status: 'delivered', 
    items: 1, 
    total: 35.00, 
    customer: 'Abena Mensah',
    customerPhone: '+233 26 345 6789',
    deliveryAddress: '321 Ring Road Central, Accra',
    orderDate: '2026-04-01T07:00:00Z',
    estimatedDelivery: '2026-04-01T07:45:00Z',
    paymentMethod: 'mobile_money',
    paymentStatus: 'paid',
    subtotal: 25.00,
    deliveryFee: 10.00,
    orderItems: [
      { name: 'Fufu & Light Soup', quantity: 1, price: 30.00 }
    ]
  },
];

// ─── Helper Functions ───
export function getAddonById(id: string): FoodAddon | undefined {
  return MOCK_ADDONS.find(addon => addon.id === id);
}

export function getAddonsByIds(ids: string[]): FoodAddon[] {
  return MOCK_ADDONS.filter(addon => ids.includes(addon.id));
}

export function getCategoryBySlug(slug: string): FoodCategory | undefined {
  return MOCK_CATEGORIES.find(cat => cat === slug);
}
