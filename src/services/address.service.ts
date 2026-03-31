import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Address } from '@/models/user.model';
import { mockBackend } from './mock-backend.service';

const ADDRESSES_QUERY_KEY = ['addresses'];

export function useAddressesQuery(enabled = true) {
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: () => mockBackend.getAddresses(),
    enabled,
  });
}

export function useAddAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (address: Address) => mockBackend.createAddress(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Address> }) =>
      mockBackend.updateAddress(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useRemoveAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockBackend.removeAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useSetDefaultAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockBackend.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}
