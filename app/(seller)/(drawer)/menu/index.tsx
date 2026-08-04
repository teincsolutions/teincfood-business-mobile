// @ts-nocheck
import { useState, useCallback, useEffect } from "react";
import { FlatList, ScrollView, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, useTheme } from "tamagui";
import { UtensilsCrossed, Plus } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsive } from "@/utils/responsive";
import { useLocalSearchParams } from "expo-router";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@/utils/error";
import { Button } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { useFilterStore } from "@/stores/filter.store";
import { CategoryPill } from "@/components/menu/CategoryPill";
import { MenuItemCard, MenuFormSheet } from "@/components/menu";
import { useBusinessStore } from "@/stores/business.store";
import { uploadImage } from "@/services/upload.service";
import {
  useMenuItemsQuery,
  useMenuCategoriesQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useToggleAvailabilityMutation,
} from "@/hooks/menu.hooks";
import type { MenuItem, MenuItemForm } from "@/services/menu.service";
import { EMPTY_FORM, toGHS, toMinor } from "@/services/menu.service";
import { useRouter } from "expo-router";
import Drawer from "expo-router/drawer";

export default function SellerMenu() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const { isTablet, isLandscape } = useResponsive();
  const menuColumns = !isTablet ? 1 : isLandscape ? 3 : 2;

  // ── State (must be before hooks that use them) ──
  const activeCategory = useFilterStore((s) => s.menuActiveCategory);
  const setActiveCategory = useFilterStore((s) => s.setMenuActiveCategory);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuItemForm>({ ...EMPTY_FORM });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [variantLabel, setVariantLabel] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [extraLabel, setExtraLabel] = useState("");
  const [extraPrice, setExtraPrice] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);

  // TanStack Query hooks — filters sent to backend, no client-side filtering
  const categoryFilter = activeCategory
    ? { category_ids: activeCategory }
    : undefined;
  const {
    data,
    isPending,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMenuItemsQuery(categoryFilter);
  console.log(
    "[Menu] businessId:",
    businessId,
    "items:",
    data?.length,
    "categoryFilter:",
    categoryFilter,
  );
  const { data: categoriesRes } = useMenuCategoriesQuery();
  const createMutation = useCreateMenuItemMutation();
  const updateMutation = useUpdateMenuItemMutation();
  const deleteMutation = useDeleteMenuItemMutation();
  const toggleMutation = useToggleAvailabilityMutation();

  const allCategories = categoriesRes?.data ?? [];
  const filterCategories = [{ id: "", name: "All" } as any, ...allCategories];

  // Auto-open edit sheet when navigating back from detail screen
  const { edit: editParam } = useLocalSearchParams<{ edit?: string }>();
  useEffect(() => {
    if (editParam && data) {
      const item = data.find((i: any) => i.id === editParam);
      if (item) {
        openEdit(item);
      }
    }
  }, [editParam, data]);

  // ─── Open add sheet ────────────────────────────────────────────
  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM });
    setVariantLabel("");
    setVariantPrice("");
    setExtraLabel("");
    setExtraPrice("");
    setSheetOpen(true);
  };

  // ─── Open edit sheet ───────────────────────────────────────────
  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.basePrice ? toGHS(item.basePrice.amountMinor) : "",
      category: item.category?.id || "",
      dietaryTags: [],
      variants: (item.variants || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        price_adjustment: v.price?.amountMinor || 0,
      })),
      extras: (item.extras || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        price_minor: e.amountMinor || 0,
      })),
      is_available: item.is_available,
      image_url: item.image_url || "",
      image_key: "",
    });
    setVariantLabel("");
    setVariantPrice("");
    setExtraLabel("");
    setExtraPrice("");
    setSheetOpen(true);
  };

  // ─── Save (add or edit) ────────────────────────────────────────
  const handleSave = () => {
    if (!form.name.trim() || !form.price.trim()) return;

    if (!form.category) {
      toast.error("Please select a category");
      return;
    }

    const baseData = {
      name: form.name.trim(),
      description: form.description.trim(),
      priceMinor: toMinor(form.price),
      categoryId: form.category,
      dietaryTags: form.dietaryTags,
      variants: form.variants,
      extras: form.extras,
      available: form.is_available,
      imageUrl: form.image_key || form.image_url || null,
    };

    if (editingItem) {
      updateMutation.mutate(
        { id: editingItem.id, updates: baseData },
        {
          onSuccess: () => setSheetOpen(false),
          onError: (err: any) => {
            console.debug(
              "[Menu] Update item error:",
              err?.response?.data || err,
            );
            const details = err?.response?.data?.error?.details;
            if (details && typeof details === "object") {
              const mapped: Record<string, string> = {};
              for (const [field, msgs] of Object.entries(details)) {
                const arr = Array.isArray(msgs) ? msgs : [msgs];
                const key = field === "category_id" ? "category" : field;
                mapped[key] = arr[0];
              }
              setFieldErrors(mapped);
            } else {
              toast.error(extractApiErrorMessage(err));
            }
          },
        },
      );
    } else {
      createMutation.mutate(baseData, {
        onSuccess: () => setSheetOpen(false),
        onError: (err: any) => {
          console.debug(
            "[Menu] Create item error:",
            err?.response?.data || err,
          );
          const details = err?.response?.data?.error?.details;
          if (details && typeof details === "object") {
            const mapped: Record<string, string> = {};
            for (const [field, msgs] of Object.entries(details)) {
              const arr = Array.isArray(msgs) ? msgs : [msgs];
              const key = field === "category_id" ? "category" : field;
              mapped[key] = arr[0];
            }
            setFieldErrors(mapped);
          } else {
            toast.error(extractApiErrorMessage(err));
          }
        },
      });
    }
  };

  // ─── Toggle availability ───────────────────────────────────────
  const toggleAvailability = (id: string) => {
    const item = (data ?? []).find((i: any) => i.id === id);
    if (item) {
      toggleMutation.mutate({ id, available: !item.is_available });
    }
  };

  // ─── Delete ────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  // ─── Form helpers ──────────────────────────────────────────────
  const isFormValid = form.name.trim() && form.price.trim();

  const toggleDietaryTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      dietaryTags: f.dietaryTags.includes(tag)
        ? f.dietaryTags.filter((t) => t !== tag)
        : [...f.dietaryTags, tag],
    }));
  };

  const addVariant = useCallback(() => {
    const label = variantLabel.trim();
    const price = variantPrice.trim();
    if (!label || !price) return;
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        {
          id: Date.now().toString(),
          name: label,
          price_adjustment: toMinor(price),
        },
      ],
    }));
    setVariantLabel("");
    setVariantPrice("");
  }, [variantLabel, variantPrice]);

  const removeVariant = (id: string) => {
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.id !== id) }));
  };

  const addExtra = useCallback(() => {
    const label = extraLabel.trim();
    const price = extraPrice.trim();
    if (!label || !price) return;
    setForm((f) => ({
      ...f,
      extras: [
        ...f.extras,
        { id: Date.now().toString(), name: label, price_minor: toMinor(price) },
      ],
    }));
    setExtraLabel("");
    setExtraPrice("");
  }, [extraLabel, extraPrice]);

  const removeExtra = (id: string) => {
    setForm((f) => ({ ...f, extras: f.extras.filter((e) => e.id !== id) }));
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <Drawer.Screen
        options={{
          headerRight: () => (
            <Button
              variant="primary"
              height="$8"
              $lg={{ height: "$8" }}
              marginRight="$2"
              onPress={openAdd}
              icon={({ color, size }) => <Plus size={size} color={color} />}
            >
              New
            </Button>
          ),
        }}
      />
      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
          flexDirection: "row",
        }}
      >
        {filterCategories.map((cat) => (
          <CategoryPill
            key={cat.id || "all"}
            label={cat.name}
            isActive={activeCategory === cat.id}
            onPress={() => setActiveCategory(cat.id)}
          />
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        key={`menu-grid-${menuColumns}`}
        data={data}
        keyExtractor={(item) => item.id}
        extraData={data?.length}
        numColumns={menuColumns}
        renderItem={({ item }) => (
          <YStack flex={1} padding="$1" maxWidth={isTablet ? "50%" : "100%"}>
            <MenuItemCard
              item={item}
              onPress={(item) => router.push(`/(shared)/menu/${item.id}`)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onToggleAvailability={toggleAvailability}
            />
          </YStack>
        )}
        ListHeaderComponent={
          <XStack paddingHorizontal="$4" pb="$2">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              {data?.length || 0} {(data?.length || 0) === 1 ? "item" : "items"}
            </Text>
          </XStack>
        }
        ListEmptyComponent={
          <YStack alignItems="center" paddingVertical="$10" gap="$3">
            <UtensilsCrossed size={48} color="$colorSecondary" />
            <Text color="$colorSecondary" fontFamily="$body" fontSize="$4">
              No items in this category
            </Text>
            <Button
              variant="outline"
              height={44}
              width="auto"
              paddingHorizontal="$5"
              onPress={openAdd}
            >
              Add First Item
            </Button>
          </YStack>
        }
        contentContainerStyle={{
          paddingHorizontal: isTablet ? 24 : 16,
          paddingBottom: insets.bottom + 16,
        }}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <Text p="$4" ta="center" color="$colorMuted">
              Loading more...
            </Text>
          ) : null
        }
      />

      {/* ── Add / Edit Sheet ─────────────────────────────────────── */}
      <MenuFormSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setFieldErrors({});
        }}
        editingItem={editingItem}
        form={form}
        fieldErrors={fieldErrors}
        variantLabel={variantLabel}
        variantPrice={variantPrice}
        extraLabel={extraLabel}
        extraPrice={extraPrice}
        isFormValid={isFormValid}
        isSaving={createMutation.isPending || updateMutation.isPending}
        isUploadingImage={isUploadingImage}
        onFormChange={setForm}
        onVariantLabelChange={setVariantLabel}
        onVariantPriceChange={setVariantPrice}
        onExtraLabelChange={setExtraLabel}
        onExtraPriceChange={setExtraPrice}
        onToggleDietaryTag={toggleDietaryTag}
        onAddVariant={addVariant}
        onRemoveVariant={removeVariant}
        onAddExtra={addExtra}
        onRemoveExtra={removeExtra}
        onImagePick={async (uri) => {
          setIsUploadingImage(true);
          try {
            return await uploadImage(uri, "menus", { business_id: businessId });
          } finally {
            setIsUploadingImage(false);
          }
        }}
        onSave={handleSave}
        categorySheetOpen={categorySheetOpen}
        onCategorySheetOpenChange={setCategorySheetOpen}
        categories={allCategories}
      />

      {/* ── Delete confirmation ──────────────────────────────────── */}
      <AppAlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Item"
        description={`Remove "${deleteTarget?.name}" from your menu? This cannot be undone.`}
        icon={UtensilsCrossed}
        confirmText="DELETE"
        isDestructive
        onConfirm={handleDelete}
      />
    </YStack>
  );
}
