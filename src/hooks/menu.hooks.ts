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
import { useConnectivityStore } from "@/stores/connectivity.store";
import { useReferenceDataSync, useReferenceData } from "@/reference/hooks";
import { emitReferenceChanged } from "@/reference/events";
import { referenceSyncService } from "@/reference/service";
import { openSyncDatabase } from "@/db/connection";
import { getReferenceData } from "@/reference/operations";
import { runOfflineCapableMutation } from "@teincfood/core";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@/utils/error";
import type { MenuItemListResponse, MenuCategoryListResponse } from "@/types/api";

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
  const isOnline = useConnectivityStore((s) => s.isOnline);

  useReferenceDataSync(businessId, {
    keys: ["menu:items", "menu:categories"],
    enabled: enabled && !!businessId && isOnline,
  });

  const cachedQuery = useReferenceData<MenuItemListResponse>("menu:items");

  const cachedPlaceholder = cachedQuery.data?.payload
    ? {
        pages: [cachedQuery.data.payload],
        pageParams: [1],
      }
    : undefined;

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
    placeholderData: cachedPlaceholder,
    select: (data) => data.pages.flatMap((p) => p.data),
  });
}

// ─── Menu Categories Query Hook ──────────────────────────────────────────────

export function useMenuCategoriesQuery() {
  const businessId = useBusinessId();
  const isOnline = useConnectivityStore((s) => s.isOnline);

  useReferenceDataSync(businessId, {
    keys: ["menu:categories"],
    enabled: !!businessId && isOnline,
  });

  const cachedQuery = useReferenceData<MenuCategoryListResponse>("menu:categories");

  return useQuery({
    queryKey: MENU_KEYS.categories(businessId),
    queryFn: () => menuService.fetchBusinessCategories(businessId!),
    enabled: !!businessId,
    initialData: cachedQuery.data?.payload,
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
      const payload = {
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
      };
      // Online: direct REST (same result shape). Offline: route through the
      // Sync Engine (Local Node → outbox) so the edit is not lost.
      return runOfflineCapableMutation({
        run: () => menuService.createBusinessMenuItem(businessId!, payload),
        commandType: "menu:create_item",
        businessId: businessId!,
        payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
      toast.success("Menu item created");
      if (businessId) {
        emitReferenceChanged(businessId, ["menu:items"]);
      }
    },
  });
}

// ─── Update Menu Item Mutation ───────────────────────────────────────────────

export function useCreateMenuCategoryMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; sort_order?: number }) =>
      runOfflineCapableMutation({
        run: () => menuService.createBusinessCategory(businessId!, data),
        commandType: "menu:create_category",
        businessId: businessId!,
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.categories(businessId) });
      toast.success("Category created");
      if (businessId) {
        emitReferenceChanged(businessId, ["menu:categories"]);
      }
    },
    onError: (e) => {
      toast.error(extractApiErrorMessage(e));
    },
  });
}

export function useUpdateMenuCategoryMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { categoryId: string; name: string; description?: string; sort_order?: number }) =>
      menuService.updateBusinessCategory(businessId!, data.categoryId, {
        name: data.name,
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.sort_order !== undefined ? { sort_order: data.sort_order } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.categories(businessId) });
      toast.success("Category updated");
      if (businessId) {
        emitReferenceChanged(businessId, ["menu:categories"]);
      }
    },
    onError: (e) => {
      toast.error(extractApiErrorMessage(e));
    },
  });
}

export function useDeleteMenuCategoryMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) =>
      menuService.deleteBusinessCategory(businessId!, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.categories(businessId) });
      toast.success("Category deleted");
      if (businessId) {
        emitReferenceChanged(businessId, ["menu:categories"]);
      }
    },
    onError: (e) => {
      toast.error(extractApiErrorMessage(e));
    },
  });
}

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
      return runOfflineCapableMutation({
        run: () => menuService.updateMenuItem(id, payload),
        commandType: "menu:update_item",
        businessId: businessId!,
        entityId: id,
        payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
      toast.success("Menu item updated");
      if (businessId) {
        emitReferenceChanged(businessId, ["menu:items"]);
      }
    },
  });
}

// ─── Delete Menu Item Mutation ───────────────────────────────────────────────

export function useDeleteMenuItemMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      runOfflineCapableMutation({
        run: () => menuService.deleteMenuItem(id),
        commandType: "menu:delete_item",
        businessId: businessId!,
        entityId: id,
        payload: { id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
      toast.success("Menu item deleted");
      if (businessId) {
        emitReferenceChanged(businessId, ["menu:items"]);
      }
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
    onMutate: async ({ id, available }) => {
      await queryClient.cancelQueries({ queryKey: MENU_KEYS.items(businessId) });
      const previous = queryClient.getQueriesData({ queryKey: MENU_KEYS.items(businessId) });
      queryClient.setQueriesData({ queryKey: MENU_KEYS.items(businessId) }, (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data?.map((item: any) =>
              item.id === id ? { ...item, is_available: available } : item
            ),
          })),
        };
      });
      return { previous };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.previous) {
        for (const [key, data] of ctx.previous) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error(extractApiErrorMessage(e));
    },
    onSuccess: () => {
      if (businessId) {
        emitReferenceChanged(businessId, ["menu:items"]);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MENU_KEYS.items(businessId) });
    },
  });
}
