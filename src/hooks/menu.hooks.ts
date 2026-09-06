export { useMenuItemsQuery, useMenuCategoriesQuery, useCreateMenuItemMutation, useUpdateMenuItemMutation, useDeleteMenuItemMutation, CATALOG_KEYS as MENU_KEYS } from "@teincfood/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useBusinessStore } from "@/stores/business.store";
import * as menuService from "@/services/menu.service";
import { emitReferenceChanged } from "@teincfood/core";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@teincfood/core";
import { CATALOG_KEYS } from "@teincfood/core";

export function useCreateMenuCategoryMutation() {
  const bid = useBusinessStore((s) => s.activeBusiness?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; sort_order?: number }) => menuService.createBusinessCategory(bid!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CATALOG_KEYS.categories(bid) }); toast.success("Category created"); if (bid) emitReferenceChanged(bid, ["menu:categories"]); },
    onError: (e) => toast.error(extractApiErrorMessage(e)),
  });
}
export function useUpdateMenuCategoryMutation() {
  const bid = useBusinessStore((s) => s.activeBusiness?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { categoryId: string; name: string; description?: string; sort_order?: number }) => menuService.updateBusinessCategory(bid!, data.categoryId, { name: data.name, ...(data.description !== undefined ? { description: data.description } : {}), ...(data.sort_order !== undefined ? { sort_order: data.sort_order } : {}) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CATALOG_KEYS.categories(bid) }); toast.success("Category updated"); if (bid) emitReferenceChanged(bid, ["menu:categories"]); },
    onError: (e) => toast.error(extractApiErrorMessage(e)),
  });
}
export function useDeleteMenuCategoryMutation() {
  const bid = useBusinessStore((s) => s.activeBusiness?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuService.deleteBusinessCategory(bid!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: CATALOG_KEYS.categories(bid) }); toast.success("Category deleted"); if (bid) emitReferenceChanged(bid, ["menu:categories"]); },
    onError: (e) => toast.error(extractApiErrorMessage(e)),
  });
}
export function useToggleAvailabilityMutation() {
  const bid = useBusinessStore((s) => s.activeBusiness?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => menuService.toggleItemAvailability(id, available),
    onMutate: async ({ id, available }: { id: string; available: boolean }) => {
      await qc.cancelQueries({ queryKey: CATALOG_KEYS.items(bid) });
      const prev = qc.getQueriesData({ queryKey: CATALOG_KEYS.items(bid) });
      qc.setQueriesData({ queryKey: CATALOG_KEYS.items(bid) }, (old: unknown) => {
        const o = old as { pages?: { data: { id: string; is_available: boolean }[] }[] } | undefined;
        if (!o?.pages) return old;
        return { ...o, pages: o.pages.map((p) => ({ ...p, data: p.data?.map((item) => item.id === id ? { ...item, is_available: available } : item) })) };
      });
      return { prev };
    },
    onError: (e, _v, ctx) => { const c = ctx as { prev?: [unknown, unknown][] } | undefined; if (c?.prev) for (const [k, d] of c.prev) qc.setQueryData(k as unknown[], d); toast.error(extractApiErrorMessage(e)); },
    onSuccess: () => { if (bid) emitReferenceChanged(bid, ["menu:items"]); },
    onSettled: () => { qc.invalidateQueries({ queryKey: CATALOG_KEYS.items(bid) }); },
  });
}
