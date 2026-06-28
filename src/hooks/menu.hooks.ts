import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as menuService from '@/services/menu.service';
import { uploadImage } from '@/services/upload.service';
import type { MenuItem } from '@/services/menu.service';
import { useBusinessStore } from '@/stores/business.store';
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from '@/utils/error';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const MENU_KEYS = {
  all: ['menu'] as const,
  items: (businessId?: string) => [...MENU_KEYS.all, 'items', businessId] as const,
  categories: (businessId?: string) => [...MENU_KEYS.all, 'categories', businessId] as const,
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

// ─── Menu Categories Query Hook ──────────────────────────────────────────────

export function useMenuCategoriesQuery() {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: MENU_KEYS.categories(businessId),
    queryFn: () => menuService.fetchBusinessCategories(businessId!),
    enabled: !!businessId,
  });
}

type CreateInput = {
  name: string;
  description: string;
  priceMinor: number;
  category: string;
  dietaryTags: string[];
  variants: any[];
  extras: any[];
  available: boolean;
  images: string[];
};

type UpdateInput = CreateInput & { id: string };

async function uploadFirstImage(images: string[]): Promise<string | null> {
  if (!images || images.length === 0) return null;
  const uri = images[0];
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  try {
    return await uploadImage(uri);
  } catch (e) {
    toast.error(extractApiErrorMessage(e));
    return null;
  }
}

// ─── Create Menu Item Mutation ───────────────────────────────────────────────

export function useCreateMenuItemMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const imageUrl = await uploadFirstImage(input.images);
      return menuService.createBusinessMenuItem(businessId!, {
        name: input.name,
        description: input.description,
        price_minor: input.priceMinor,
        category: input.category,
        dietary_tags: input.dietaryTags,
        variants: input.variants.map((v: any) => ({
          label: v.label,
          price_minor: v.price_minor,
        })),
        addons: input.extras.map((e: any) => ({
          label: e.label,
          price_minor: e.price_minor,
        })),
        is_available: input.available,
        image_url: imageUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
      toast.success('Menu item created');
    },
    onError: (e) => {
      toast.error(extractApiErrorMessage(e));
    },
  });
}

// ─── Update Menu Item Mutation ───────────────────────────────────────────────

export function useUpdateMenuItemMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateInput> }) => {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.priceMinor !== undefined) payload.price_minor = updates.priceMinor;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.dietaryTags !== undefined) payload.dietary_tags = updates.dietaryTags;
      if (updates.available !== undefined) payload.is_available = updates.available;
      if (updates.images !== undefined) {
        const imageUrl = await uploadFirstImage(updates.images);
        payload.image_url = imageUrl;
      }
      if (updates.variants !== undefined) {
        payload.variants = updates.variants.map((v: any) => ({
          label: v.label,
          price_minor: v.price_minor,
        }));
      }
      if (updates.extras !== undefined) {
        payload.addons = updates.extras.map((e: any) => ({
          label: e.label,
          price_minor: e.price_minor,
        }));
      }
      return menuService.updateMenuItem(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
      toast.success('Menu item updated');
    },
    onError: (e) => {
      toast.error(extractApiErrorMessage(e));
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
      toast.success('Menu item deleted');
    },
    onError: (e) => {
      toast.error(extractApiErrorMessage(e));
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
    onError: (e) => {
      toast.error(extractApiErrorMessage(e));
    },
  });
}
