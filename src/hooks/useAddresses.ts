import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { addressService, type Address } from '@/services/address.service';

const ADDRESSES_QUERY_KEY = ['addresses'];

export { type Address } from '@/services/address.service';

export function useAddressesQuery(enabled = true) {
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: addressService.getAddresses,
    enabled,
    staleTime: 0,
  });
}

export function useAddAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (address: Omit<Address, 'id'>) => {
      return addressService.addAddress(address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Address> }) => {
      return addressService.updateAddress(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useRemoveAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return addressService.removeAddress(id);
    },
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useSetDefaultAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return addressService.setDefaultAddress(id);
    },
    onSuccess: () => {
      queryClient.resetQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useAddresses() {
  const addressesQuery = useAddressesQuery();
  const addAddressMutation = useAddAddressMutation();
  const updateAddressMutation = useUpdateAddressMutation();
  const removeAddressMutation = useRemoveAddressMutation();
  const setDefaultAddressMutation = useSetDefaultAddressMutation();

  const addresses = addressesQuery.data || [];

  const defaultAddress = useMemo(() => {
    return addresses.find((a) => a.is_default) || addresses[0] || null;
  }, [addresses]);

  const hasAddresses = addresses.length > 0;

  const addAddress = useCallback(async (address: Omit<Address, 'id'>) => {
    await addAddressMutation.mutateAsync(address);
  }, [addAddressMutation]);

  const updateAddress = useCallback(async (id: string, updates: Partial<Address>) => {
    await updateAddressMutation.mutateAsync({ id, updates });
  }, [updateAddressMutation]);

  const removeAddress = useCallback(async (id: string) => {
    await removeAddressMutation.mutateAsync(id);
  }, [removeAddressMutation]);

  const setDefaultAddress = useCallback(async (id: string) => {
    await setDefaultAddressMutation.mutateAsync(id);
  }, [setDefaultAddressMutation]);

  const getAddressById = useCallback((id: string) => {
    return addresses.find((a) => a.id === id) || null;
  }, [addresses]);

  return {
    addresses,
    defaultAddress,
    hasAddresses,
    isLoading: addressesQuery.isLoading,
    isAdding: addAddressMutation.isPending,
    isUpdating: updateAddressMutation.isPending,
    isRemoving: removeAddressMutation.isPending,
    isSettingDefault: setDefaultAddressMutation.isPending,
    addAddress,
    updateAddress,
    removeAddress,
    setDefaultAddress,
    getAddressById,
    refetch: addressesQuery.refetch,
  };
}
