import { api } from './api';

export interface Address {
  id: string;
  label: string;
  street: string;
  apartment?: string;
  city?: string;
  post_code?: string;
  full_address?: string;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
  instructions?: string;
  place_id?: string;
  user_id?: string;
  inserted_at?: string;
  updated_at?: string;
}

interface AddressListResponse {
  data: Address[];
}

export const addressService = {
  async getAddresses() {
    const response = await api.get<AddressListResponse>('/addresses');
    return response.data;
  },

  addAddress(address: Omit<Address, 'id'>): Promise<Address> {
    return api.post<{ data: Address }>('/addresses', { address }).then(res => res.data);
  },

  updateAddress(id: string, updates: Partial<Address>): Promise<Address> {
    return api.put<{ data: Address }>(`/addresses/${id}`, { address: updates }).then(res => res.data);
  },

  removeAddress(id: string): Promise<{ success: boolean }> {
    return api.delete(`/addresses/${id}`).then(() => ({ success: true }));
  },

  setDefaultAddress(id: string): Promise<{ success: boolean }> {
    return api.post(`/addresses/${id}/default`).then(() => ({ success: true }));
  },
};
