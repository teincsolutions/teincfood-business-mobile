/**
 * Kiosk Service
 * API functions for kiosk-mode order handling
 */

import type { KioskOrder } from './mock-data.service';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AvailableRider {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'bicycle' | 'motorcycle' | 'car';
  plateNumber: string;
  rating: number;
  distanceKm: number;
  isOnline: boolean;
  avatarUrl?: string;
}

export interface KioskOrdersResponse {
  pendingOrders: KioskOrder[];
  preparingOrders: KioskOrder[];
  readyOrders: KioskOrder[];
}

export interface KioskOrderActionResponse {
  success: boolean;
  message: string;
  order?: KioskOrder;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

let pendingOrders: KioskOrder[] = [
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

let preparingOrders: KioskOrder[] = [
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

let readyOrders: KioskOrder[] = [
  {
    id: '6',
    orderNumber: '#ORD-006',
    items: [
      { name: 'Banku & Okro Soup', quantity: 1, price: 35.00 },
    ],
    total: 35.00,
    customerName: 'Akua Boateng',
    paymentStatus: 'paid',
    paymentMethod: 'mobile_money',
    status: 'ready',
    startedAt: new Date(Date.now() - 900000).toISOString(),
    estimatedTime: 0,
  },
];

const MOCK_RIDERS: AvailableRider[] = [
  {
    id: 'r1',
    name: 'Kofi Mensah',
    phone: '+233 24 111 2222',
    vehicleType: 'motorcycle',
    plateNumber: 'GR-1234-20',
    rating: 4.8,
    distanceKm: 0.3,
    isOnline: true,
  },
  {
    id: 'r2',
    name: 'Yaw Boateng',
    phone: '+233 20 333 4444',
    vehicleType: 'bicycle',
    plateNumber: '',
    rating: 4.5,
    distanceKm: 0.8,
    isOnline: true,
  },
  {
    id: 'r3',
    name: 'Ama Darko',
    phone: '+233 26 555 6666',
    vehicleType: 'motorcycle',
    plateNumber: 'AS-5678-21',
    rating: 4.9,
    distanceKm: 1.2,
    isOnline: true,
  },
  {
    id: 'r4',
    name: 'Kwesi Appiah',
    phone: '+233 27 777 8888',
    vehicleType: 'car',
    plateNumber: 'WR-9012-22',
    rating: 4.7,
    distanceKm: 2.1,
    isOnline: true,
  },
  {
    id: 'r5',
    name: 'Esi Ofori',
    phone: '+233 50 999 0000',
    vehicleType: 'motorcycle',
    plateNumber: 'EP-3456-23',
    rating: 4.6,
    distanceKm: 3.5,
    isOnline: true,
  },
];

// ─── Mock API Functions ──────────────────────────────────────────────────────

const SIMULATED_DELAY = 300;

/**
 * Fetch all kiosk orders (pending + preparing + ready)
 */
export async function fetchKioskOrders(): Promise<KioskOrdersResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        pendingOrders: [...pendingOrders],
        preparingOrders: [...preparingOrders],
        readyOrders: [...readyOrders],
      });
    }, SIMULATED_DELAY);
  });
}

/**
 * Accept a pending order — moves it to preparing
 */
export async function acceptKioskOrder(orderId: string): Promise<KioskOrderActionResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const order = pendingOrders.find((o) => o.id === orderId);
      if (!order) {
        resolve({ success: false, message: 'Order not found' });
        return;
      }

      pendingOrders = pendingOrders.filter((o) => o.id !== orderId);
      preparingOrders = [
        ...preparingOrders,
        { ...order, status: 'preparing', startedAt: new Date().toISOString() },
      ];

      resolve({
        success: true,
        message: `Order ${order.orderNumber} accepted`,
        order,
      });
    }, SIMULATED_DELAY);
  });
}

/**
 * Reject a pending order — removes it from the queue
 */
export async function rejectKioskOrder(orderId: string): Promise<KioskOrderActionResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const order = pendingOrders.find((o) => o.id === orderId);
      if (!order) {
        resolve({ success: false, message: 'Order not found' });
        return;
      }

      pendingOrders = pendingOrders.filter((o) => o.id !== orderId);

      resolve({
        success: true,
        message: `Order ${order.orderNumber} rejected`,
        order,
      });
    }, SIMULATED_DELAY);
  });
}

/**
 * Mark a preparing order as ready — moves it to ready queue
 */
export async function markKioskOrderReady(orderId: string): Promise<KioskOrderActionResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const order = preparingOrders.find((o) => o.id === orderId);
      if (!order) {
        resolve({ success: false, message: 'Order not found' });
        return;
      }

      preparingOrders = preparingOrders.filter((o) => o.id !== orderId);
      readyOrders = [
        ...readyOrders,
        { ...order, status: 'ready' },
      ];

      resolve({
        success: true,
        message: `Order ${order.orderNumber} is ready`,
        order,
      });
    }, SIMULATED_DELAY);
  });
}

/**
 * Fetch available riders sorted by distance
 */
export async function fetchAvailableRiders(): Promise<AvailableRider[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const online = MOCK_RIDERS.filter((r) => r.isOnline).sort(
        (a, b) => a.distanceKm - b.distanceKm
      );
      resolve([...online]);
    }, SIMULATED_DELAY);
  });
}

/**
 * Assign a rider to a ready order — removes it from kiosk queue
 */
export async function assignKioskOrderToRider(
  orderId: string,
  riderId: string
): Promise<KioskOrderActionResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const order = readyOrders.find((o) => o.id === orderId);
      if (!order) {
        resolve({ success: false, message: 'Order not found' });
        return;
      }

      const rider = MOCK_RIDERS.find((r) => r.id === riderId);
      if (!rider) {
        resolve({ success: false, message: 'Rider not found' });
        return;
      }

      readyOrders = readyOrders.filter((o) => o.id !== orderId);

      resolve({
        success: true,
        message: `Order ${order.orderNumber} assigned to ${rider.name}`,
        order: { ...order, assignedRider: rider.name },
      });
    }, SIMULATED_DELAY);
  });
}