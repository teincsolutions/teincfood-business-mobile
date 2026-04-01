import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as menuService from '@/services/menu.service';
import type { MenuItem } from '@/services/menu.service';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const MENU_KEYS = {
  all: ['menu'] as const,
  items: () => [...MENU_KEYS.all, 'items'] as const,
  item: (id: string) => [...MENU_KEYS.all, 'item', id] as const,
};

// ─── Menu Items Query Hooks ──────────────────────────────────────────────────

export function useMenuItemsQuery(enabled = true) {
  return useQuery({
    queryKey: MENU_KEYS.items(),
    queryFn: () => menuService.fetchMenuItems(),
    enabled,
  });
}

// ─── Create Menu Item Mutation ───────────────────────────────────────────────

export function useCreateMenuItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Omit<MenuItem, 'id'>) => menuService.createMenuItem(item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items() });
    },
  });
}

// ─── Update Menu Item Mutation ───────────────────────────────────────────────

export function useUpdateMenuItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MenuItem> }) =>
      menuService.updateMenuItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items() });
    },
  });
}

// ─── Delete Menu Item Mutation ───────────────────────────────────────────────

export function useDeleteMenuItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuService.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items() });
    },
  });
}

// ─── Toggle Availability Mutation ────────────────────────────────────────────

export function useToggleAvailabilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      menuService.toggleItemAvailability(id, available),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items() });
    },
  });
}

