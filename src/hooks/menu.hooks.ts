import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import * as menuService from "@/services/menu.service";
import { uploadImage } from "@/services/upload.service";
import type { MenuItem } from "@/services/menu.service";
import { useBusinessStore } from "@/stores/business.store";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@/utils/error";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const MENU_KEYS = {
  all: ["menu"] as const,
  items: (businessId?: string) =>
    [...MENU_KEYS.all, "items", businessId] as const,
  categories: (businessId?: string) =>
    [...MENU_KEYS.all, "categories", businessId] as const,
  item: (id: string) => [...MENU_KEYS.all, "item", id] as const,
};

function useBusinessId() {
  return useBusinessStore((s) => s.activeBusiness?.id);
}

// ─── Menu Items Query Hooks ──────────────────────────────────────────────────

export function useMenuItemsQuery(filters?: { search?: string; category_ids?: string; sort?: string }, enabled = true) {
  const businessId = useBusinessId();
  return useInfiniteQuery({
    queryKey: [...MENU_KEYS.items(businessId), filters],
    queryFn: ({ pageParam = 1 }) =>
      menuService.fetchBusinessMenuItems(businessId!, pageParam, filters),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.total_pages
        ? lastPage.pagination.page + 1
        : undefined,
    enabled: enabled && !!businessId,
    staleTime: 1000 * 30,
    select: (data) => data.pages.flatMap((p) => p.data),
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
  categoryId: string;
  dietaryTags: string[];
  variants: any[];
  extras: any[];
  available: boolean;
  imageUrl: string | null;
};

type UpdateInput = CreateInput & { id: string };

async function uploadImageForItem(
  imageUrl: string | null,
  businessId?: string,
): Promise<string | null> {
  if (!imageUrl) return null;
  // Local file from picker — upload to S3, return the key
  if (imageUrl.startsWith('file://') || imageUrl.startsWith('ph://') || imageUrl.startsWith('content://')) {
    try {
      const result = await uploadImage(imageUrl, 'menus', { business_id: businessId });
      return result.key;
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
      return null;
    }
  }
  // Presigned URL (http/https) from backend — unchanged, omit from payload
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return '__UNCHANGED__';
  }
  // S3 key (e.g. "menus/biz-id/...") — already uploaded, use as-is
  return imageUrl;
}

// ─── Create Menu Item Mutation ───────────────────────────────────────────────

export function useCreateMenuItemMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const imageUrl = await uploadImageForItem(input.imageUrl, businessId);
      return menuService.createBusinessMenuItem(businessId!, {
        name: input.name,
        description: input.description,
        price_minor: input.priceMinor,
        category_id: input.categoryId,
        currency_code: 'GHS',
        dietary_tags: input.dietaryTags,
        variants: input.variants.map(({ id, ...v }) => v),
        extras: input.extras.map(({ id, ...e }) => e),
        available: input.available,
        ...(imageUrl !== '__UNCHANGED__' ? { image_url: imageUrl } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
      toast.success("Menu item created");
    },
  });
}

// ─── Update Menu Item Mutation ───────────────────────────────────────────────

export function useUpdateMenuItemMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<CreateInput>;
    }) => {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined)
        payload.description = updates.description;
      if (updates.priceMinor !== undefined)
        payload.price_minor = updates.priceMinor;
      if (updates.categoryId !== undefined)
        payload.category_id = updates.categoryId;
      payload.currency_code = "GHS";
      if (updates.available !== undefined)
        payload.available = updates.available;
      if (updates.dietaryTags !== undefined)
        payload.dietary_tags = updates.dietaryTags;
      if (updates.imageUrl !== undefined) {
        const imageUrl = await uploadImageForItem(updates.imageUrl, businessId);
        if (imageUrl !== '__UNCHANGED__') {
          payload.image_url = imageUrl;
        }
      }
      if (updates.variants !== undefined) {
        payload.variants = updates.variants.map(({ id, ...v }) => v);
      }
      if (updates.extras !== undefined) {
        payload.extras = updates.extras.map(({ id, ...e }) => e);
      }
      return menuService.updateMenuItem(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
      toast.success("Menu item updated");
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
      toast.success("Menu item deleted");
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
