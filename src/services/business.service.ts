import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { 
  Business, 
  BusinessSummary, 
  CreateBusinessRequest, 
  UpdateBusinessRequest 
} from '@/models/business.model';
import { api } from './api';

export function generateBusinessCode(name: string, city: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
  const cityCode = city.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
  const sequence = Math.floor(Math.random() * 999) + 1;
  return `${prefix}-${cityCode}-${sequence.toString().padStart(3, '0')}`;
}

export const businessService = {
  async getBusinesses(): Promise<BusinessSummary[]> {
    return api.get('/v1/seller/businesses');
  },

  async getBusiness(id: string): Promise<Business> {
    return api.get(`/v1/seller/businesses/${id}`);
  },

  async createBusiness(data: CreateBusinessRequest): Promise<Business> {
    return api.post('/v1/seller/businesses', data);
  },

  async updateBusiness(id: string, data: UpdateBusinessRequest): Promise<Business> {
    return api.patch(`/v1/seller/businesses/${id}`, data);
  },

  async setDefaultBusiness(id: string): Promise<void> {
    return api.post(`/v1/seller/businesses/${id}/set-default`);
  },

  async deactivateBusiness(id: string): Promise<void> {
    return api.post(`/v1/seller/businesses/${id}/deactivate`);
  },
};

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
