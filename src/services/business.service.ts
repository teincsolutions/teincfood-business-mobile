import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  Business, 
  BusinessSummary, 
  CreateBusinessRequest, 
  UpdateBusinessRequest 
} from '@/models/business.model';

const SIMULATED_DELAY = 800;

// Mock business data
const MOCK_BUSINESSES: BusinessSummary[] = [
  {
    id: 'biz-1',
    code: 'TEINC-ACC-001',
    name: 'Teinc Foods - Accra Mall',
    type: 'restaurant',
    logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
    address: {
      city: 'Accra',
      fullAddress: 'Accra Mall, Tetteh Quarshie Interchange, Accra',
    },
    status: 'active',
    isDefault: true,
    pendingOrders: 3,
    todayOrders: 12,
    todayRevenue: 450.00,
    rating: 4.5,
  },
  {
    id: 'biz-2',
    code: 'TEINC-KUM-001',
    name: 'Teinc Foods - Kumasi City',
    type: 'restaurant',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
    address: {
      city: 'Kumasi',
      fullAddress: 'Kumasi City Mall, Kumasi',
    },
    status: 'active',
    isDefault: false,
    pendingOrders: 1,
    todayOrders: 8,
    todayRevenue: 320.00,
    rating: 4.3,
  },
];

const MOCK_BUSINESS_DETAIL: Business = {
  id: 'biz-1',
  code: 'TEINC-ACC-001',
  ownerId: 'user-1',
  name: 'Teinc Foods - Accra Mall',
  type: 'restaurant',
  logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
  description: 'Authentic Ghanaian cuisine with a modern twist',
  address: {
    street: 'Accra Mall',
    city: 'Accra',
    region: 'Greater Accra',
    country: 'Ghana',
    latitude: 5.6037,
    longitude: -0.1870,
    fullAddress: 'Accra Mall, Tetteh Quarshie Interchange, Accra',
  },
  phone: '+233 20 123 4567',
  email: 'accra@teincfoods.com',
  operatingHours: [
    { dayOfWeek: 0, dayName: 'Sunday', openTime: '10:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 1, dayName: 'Monday', openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 2, dayName: 'Tuesday', openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 3, dayName: 'Wednesday', openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 4, dayName: 'Thursday', openTime: '09:00', closeTime: '22:00', isClosed: false },
    { dayOfWeek: 5, dayName: 'Friday', openTime: '09:00', closeTime: '23:00', isClosed: false },
    { dayOfWeek: 6, dayName: 'Saturday', openTime: '10:00', closeTime: '23:00', isClosed: false },
  ],
  deliverySettings: {
    deliveryRadius: 10,
    minimumOrderAmount: 20,
    deliveryFee: 5,
    freeDeliveryThreshold: 50,
    estimatedPrepTime: 25,
    acceptsPickup: true,
    acceptsDelivery: true,
  },
  paymentSettings: {
    bankName: 'GCB Bank',
    accountNumber: '****4567',
    accountHolderName: 'Teinc Foods Ltd',
    mobileMoneyNumber: '+233 20 123 4567',
    mobileMoneyProvider: 'mtn',
    payoutSchedule: 'weekly',
  },
  status: 'active',
  isDefault: true,
  rating: 4.5,
  reviewCount: 128,
  totalOrders: 1542,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2026-03-20T14:30:00Z',
};

// Generate business code
export function generateBusinessCode(name: string, city: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
  const cityCode = city.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  const sequence = Math.floor(Math.random() * 999) + 1;
  return `${prefix}-${cityCode}-${sequence.toString().padStart(3, '0')}`;
}

export const businessService = {
  // Get all businesses for current user
  async getBusinesses(): Promise<BusinessSummary[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_BUSINESSES);
      }, SIMULATED_DELAY);
    });
  },

  // Get business by ID
  async getBusiness(id: string): Promise<Business> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (id === 'biz-1') {
          resolve(MOCK_BUSINESS_DETAIL);
        } else {
          reject({ status: 404, message: 'Business not found' });
        }
      }, SIMULATED_DELAY);
    });
  },

  // Create new business
  async createBusiness(data: CreateBusinessRequest): Promise<Business> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const code = generateBusinessCode(data.name, data.address.city);
        const newBusiness: Business = {
          ...MOCK_BUSINESS_DETAIL,
          id: `biz-${Date.now()}`,
          code,
          name: data.name,
          type: data.type,
          address: data.address,
          phone: data.phone,
          email: data.email,
          description: data.description,
          isDefault: false,
          rating: 0,
          reviewCount: 0,
          totalOrders: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        resolve(newBusiness);
      }, SIMULATED_DELAY);
    });
  },

  // Update business
  async updateBusiness(id: string, data: UpdateBusinessRequest): Promise<Business> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const updated: Business = {
          ...MOCK_BUSINESS_DETAIL,
          ...data,
          deliverySettings: {
            ...MOCK_BUSINESS_DETAIL.deliverySettings,
            ...data.deliverySettings,
          },
          paymentSettings: {
            ...MOCK_BUSINESS_DETAIL.paymentSettings,
            ...data.paymentSettings,
          },
          updatedAt: new Date().toISOString(),
        };
        resolve(updated);
      }, SIMULATED_DELAY);
    });
  },

  // Set default business
  async setDefaultBusiness(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, SIMULATED_DELAY);
    });
  },

  // Deactivate business
  async deactivateBusiness(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, SIMULATED_DELAY);
    });
  },
};

// React Query hooks
export function useBusinessesQuery() {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: () => businessService.getBusinesses(),
  });
}

export function useBusinessQuery(id: string) {
  return useQuery({
    queryKey: ['business', id],
    queryFn: () => businessService.getBusiness(id),
    enabled: !!id,
  });
}

export function useCreateBusinessMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBusinessRequest) => businessService.createBusiness(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
}

export function useUpdateBusinessMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBusinessRequest }) =>
      businessService.updateBusiness(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['business', variables.id] });
    },
  });
}

export function useSetDefaultBusinessMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => businessService.setDefaultBusiness(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
}

export function useDeactivateBusinessMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => businessService.deactivateBusiness(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
    },
  });
}