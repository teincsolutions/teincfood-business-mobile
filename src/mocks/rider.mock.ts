  import type {
  RiderMetrics,
  RiderActiveDelivery,
  RiderDelivery,
  RiderDeliveryDetail,
  RiderEarnings,
  RiderTransaction,
  EarningsBreakdown,
  RiderStatistics,
  VehicleInfo,
  DeliveryZone,
  NavigationSettings,
  NavigationApp,
} from '@/models/rider.model';

// ─── Rider Metrics ───
export const MOCK_RIDER_METRICS: RiderMetrics = {
  todayEarnings: 85.50,
  todayDeliveries: 12,
  activeDelivery: null,
  availableDeliveries: 3,
};

export const MOCK_ACTIVE_DELIVERY: RiderActiveDelivery = {
  id: '1',
  orderId: '#ORD-001',
  pickup: 'TeincFoods Restaurant',
  dropoff: '123 Main Street',
  status: 'picked_up',
  estimatedTime: '15 min',
};

// ─── Rider Deliveries ───
export const MOCK_RIDER_DELIVERIES: RiderDelivery[] = [
  { id: '1', orderId: '#ORD-001', pickup: 'TeincFoods Restaurant', dropoff: '123 Main Street', status: 'picked_up', earnings: 12.50 },
  { id: '2', orderId: '#ORD-002', pickup: 'TeincFoods Restaurant', dropoff: '456 Oak Avenue', status: 'delivering', earnings: 15.00 },
  { id: '3', orderId: '#ORD-003', pickup: 'TeincFoods Restaurant', dropoff: '789 Pine Road', status: 'delivered', earnings: 10.00 },
  { id: '4', orderId: '#ORD-004', pickup: 'TeincFoods Restaurant', dropoff: '321 Elm Street', status: 'delivered', earnings: 18.75 },
];

export const MOCK_RECENT_DELIVERIES: Array<{ id: string; orderId: string; earnings: number; status: string }> = [
  { id: '1', orderId: '#ORD-001', earnings: 12.50, status: 'delivered' },
  { id: '2', orderId: '#ORD-002', earnings: 8.75, status: 'delivered' },
  { id: '3', orderId: '#ORD-003', earnings: 15.00, status: 'delivered' },
];

// ─── Delivery Detail ───
export const MOCK_DELIVERY_DETAIL: RiderDeliveryDetail = {
  id: '1',
  orderId: '#ORD-001',
  status: 'picked_up',
  customer: {
    name: 'John Doe',
    phone: '+233201234567',
    avatar: null,
  },
  pickup: {
    name: 'TeincFoods Restaurant',
    address: '45 Liberation Road, Accra',
    phone: '+233201112222',
    lat: 5.5600,
    lng: -0.2050,
  },
  dropoff: {
    name: 'John Doe',
    address: '123 Main Street, Accra, Ghana',
    phone: '+233201234567',
    lat: 5.5650,
    lng: -0.2100,
    notes: 'Blue gate, call when you arrive',
  },
  items: [
    { name: 'Jollof Rice', quantity: 2, price: 45.00 },
    { name: 'Grilled Chicken', quantity: 1, price: 35.00 },
    { name: 'Coca Cola', quantity: 2, price: 8.00 },
  ],
  orderTotal: 136.00,
  deliveryFee: 12.50,
  earnings: 12.50,
  distance: '3.2 km',
  estimatedTime: '15 min',
  actualTime: null,
  acceptedAt: '2026-03-31T14:30:00',
  pickedUpAt: '2026-03-31T14:45:00',
  deliveredAt: null,
};

// ─── Rider Earnings ───
export const MOCK_RIDER_EARNINGS: RiderEarnings = {
  today: 85.50,
  thisWeek: 420.00,
  thisMonth: 1250.00,
  total: 5680.00,
  pendingPayout: 320.00,
};

export const MOCK_EARNINGS_BREAKDOWN: EarningsBreakdown = {
  baseDeliveryFees: 380.00,
  tipsReceived: 25.00,
  bonuses: 15.00,
  totalThisWeek: 420.00,
};

export const MOCK_RECENT_TRANSACTIONS: RiderTransaction[] = [
  { id: '1', orderId: '#ORD-001', amount: 12.50, date: 'Today, 2:30 PM', type: 'delivery' },
  { id: '2', orderId: '#ORD-002', amount: 15.00, date: 'Today, 1:15 PM', type: 'delivery' },
  { id: '3', orderId: '#ORD-003', amount: 10.00, date: 'Today, 11:45 AM', type: 'delivery' },
  { id: '4', orderId: '#ORD-004', amount: 18.75, date: 'Yesterday, 6:20 PM', type: 'delivery' },
  { id: '5', orderId: 'Bonus', amount: 25.00, date: 'Yesterday, 5:00 PM', type: 'bonus' },
];

// ─── Rider Statistics ───
export const MOCK_RIDER_STATISTICS: RiderStatistics = {
  totalDeliveries: 156,
  acceptanceRate: 94,
  averageRating: 4.8,
  totalEarnings: 5680.00,
};

// ─── Vehicle Info ───
export const MOCK_VEHICLE_INFO: VehicleInfo = {
  type: 'motorcycle',
  plateNumber: 'GR-1234-20',
  color: 'Black',
  brand: 'Honda',
  model: 'CBR 150',
  verificationStatus: 'pending',
};

export const VEHICLE_TYPES = [
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'car', label: 'Car' },
];

// ─── Delivery Zones ───
export const MOCK_DELIVERY_ZONES: DeliveryZone[] = [
  { id: '1', name: 'Greater Accra', enabled: true, radius: '15 km', deliveries: 45, latitude: 5.5600, longitude: -0.2050 },
  { id: '2', name: 'Tema', enabled: true, radius: '10 km', deliveries: 32, latitude: 5.6698, longitude: -0.0166 },
  { id: '3', name: 'Kasoa', enabled: false, radius: '12 km', deliveries: 18, latitude: 5.5560, longitude: -0.4190 },
  { id: '4', name: 'Madina', enabled: true, radius: '8 km', deliveries: 28, latitude: 5.6727, longitude: -0.1679 },
  { id: '5', name: 'East Legon', enabled: true, radius: '5 km', deliveries: 22, latitude: 5.6364, longitude: -0.1585 },
  { id: '6', name: 'Achimota', enabled: false, radius: '10 km', deliveries: 15, latitude: 5.6190, longitude: -0.2290 },
  { id: '7', name: 'Dansoman', enabled: false, radius: '12 km', deliveries: 12, latitude: 5.5420, longitude: -0.2420 },
  { id: '8', name: 'Spintex', enabled: true, radius: '8 km', deliveries: 20, latitude: 5.6350, longitude: -0.1050 },
];

// ─── Navigation Settings ───
export const MOCK_NAVIGATION_SETTINGS: NavigationSettings = {
  selectedApp: 'google_maps',
  autoStart: true,
  avoidTolls: false,
  avoidHighways: false,
};

export const MOCK_NAVIGATION_APPS: NavigationApp[] = [
  {
    id: 'google_maps',
    name: 'Google Maps',
    description: 'Most popular navigation app',
    icon: '🗺️',
    installed: true,
  },
  {
    id: 'apple_maps',
    name: 'Apple Maps',
    description: 'Built-in iOS navigation',
    icon: '🍎',
    installed: true,
  },
  {
    id: 'waze',
    name: 'Waze',
    description: 'Community-based traffic alerts',
    icon: '🚗',
    installed: false,
  },
];

// ─── Profile Menu Items ───
export const RIDER_PROFILE_ITEMS = [
  { route: '/(shared)/profile/edit' },
  { route: '/(shared)/profile/documents' },
  { route: '/(shared)/profile/security' },
  { route: '/(shared)/profile/terms' },
  { route: '/(shared)/profile/privacy-policy' },
  { route: '/(shared)/profile/help' },
];