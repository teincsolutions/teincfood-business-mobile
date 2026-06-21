import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as menuService from '@/services/menu.service';
import type { MenuItem } from '@/services/menu.service';
import { useBusinessStore } from '@/stores/business.store';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const MENU_KEYS = {
  all: ['menu'] as const,
  items: (businessId?: string) => [...MENU_KEYS.all, 'items', businessId] as const,
  item: (id: string) => [...MENU_KEYS.all, 'item', id] as const,
};

function useBusinessId() {
  return useBusinessStore((s) => s.activeBusiness?.id);
}

// ─── Menu Items Query Hooks ──────────────────────────────────────────────────

export function useMenuItemsQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: MENU_KEYS.items(businessId),
    queryFn: () => {
      if (businessId) {
        return menuService.fetchBusinessMenuItems(businessId);
      }
      return menuService.fetchMenuItems();
    },
    enabled,
  });
}

// ─── Create Menu Item Mutation ───────────────────────────────────────────────

export function useCreateMenuItemMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Omit<MenuItem, 'id'>) => menuService.createMenuItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
    },
  });
}

// ─── Update Menu Item Mutation ───────────────────────────────────────────────

export function useUpdateMenuItemMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MenuItem> }) =>
      menuService.updateMenuItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
    },
  });
}

// ─── Delete Menu Item Mutation ───────────────────────────────────────────────

export function useDeleteMenuItemMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuService.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
    },
  });
}

// ─── Toggle Availability Mutation ────────────────────────────────────────────

export function useToggleAvailabilityMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      menuService.toggleItemAvailability(id, available),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
    },
  });
}
