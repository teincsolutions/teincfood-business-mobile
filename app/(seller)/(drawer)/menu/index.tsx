// @ts-nocheck
import { useState } from "react";
import { FlatList, ScrollView, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, useTheme } from "tamagui";
import { UtensilsCrossed, Plus } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { CategoryPill } from "@/components/home/CategoryPill";
import { MenuItemCard, MenuFormSheet } from "@/components/menu";
import {
  useMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useToggleAvailabilityMutation,
} from "@/hooks/menu.hooks";
import type { MenuItem, MenuItemForm } from "@/services/menu.service";
import {
  MENU_CATEGORIES,
  EMPTY_FORM,
  toGHS,
  toMinor,
} from "@/services/menu.service";
import Drawer from "expo-router/drawer";

export default function SellerMenu() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  // TanStack Query hooks
  const { data: items = [] } = useMenuItemsQuery();
  const createMutation = useCreateMenuItemMutation();
  const updateMutation = useUpdateMenuItemMutation();
  const deleteMutation = useDeleteMenuItemMutation();
  const toggleMutation = useToggleAvailabilityMutation();

  // UI state
  const [activeCategory, setActiveCategory] = useState("All");

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form state
  const [form, setForm] = useState<MenuItemForm>({ ...EMPTY_FORM });
  const [variantLabel, setVariantLabel] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [extraLabel, setExtraLabel] = useState("");
  const [extraPrice, setExtraPrice] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  // Category picker in form
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const filtered =
    activeCategory === "All"
      ? items
      : items.filter((i) => i.category === activeCategory);

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
      price: toGHS(item.price_minor),
      category: item.category,
      dietaryTags: [...(item.dietary_tags || [])],
      variants: [...(item.variants || [])],
      extras: [...(item.addons || [])],
      available: item.is_available,
      images: item.image_url ? [item.image_url] : [],
    });
    setVariantLabel("");
    setVariantPrice("");
    setExtraLabel("");
    setExtraPrice("");
    setSheetOpen(true);
  };

  // ─── Save (add or edit) ────────────────────────────────────────
  const handleSave = () => {
    if (!form.name.trim() || !form.price.trim())
      return;

    const baseData = {
      name: form.name.trim(),
      description: form.description.trim(),
      priceMinor: toMinor(form.price),
      category: form.category,
      dietaryTags: form.dietaryTags,
      variants: form.variants,
      extras: form.extras,
      available: form.available,
      images: form.images,
    };

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        updates: baseData,
      });
    } else {
      createMutation.mutate(baseData);
    }
    setSheetOpen(false);
  };

  // ─── Toggle availability ───────────────────────────────────────
  const toggleAvailability = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      toggleMutation.mutate({ id, available: !item.available });
    }
  };

  // ─── Delete ────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  // ─── Form helpers ──────────────────────────────────────────────
  const isFormValid =
    form.name.trim() && form.price.trim();

  const toggleDietaryTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      dietaryTags: f.dietaryTags.includes(tag)
        ? f.dietaryTags.filter((t) => t !== tag)
        : [...f.dietaryTags, tag],
    }));
  };

  const addVariant = () => {
    if (!variantLabel.trim() || !variantPrice.trim()) return;
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        {
          id: Date.now().toString(),
          label: variantLabel.trim(),
          priceMinor: toMinor(variantPrice),
        },
      ],
    }));
    setVariantLabel("");
    setVariantPrice("");
  };

  const removeVariant = (id: string) => {
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.id !== id) }));
  };

  const addExtra = () => {
    if (!extraLabel.trim() || !extraPrice.trim()) return;
    setForm((f) => ({
      ...f,
      extras: [
        ...f.extras,
        {
          id: Date.now().toString(),
          label: extraLabel.trim(),
          priceMinor: toMinor(extraPrice),
        },
      ],
    }));
    setExtraLabel("");
    setExtraPrice("");
  };

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
              paddingHorizontal="$4"
              marginBottom="$2"
              onPress={openAdd}
            >
              <XStack gap="$1" alignItems="center">
                <Plus size={16} color="white" />
                <Text
                  fontFamily="$body"
                  fontWeight="700"
                  fontSize="$3"
                  color="white"
                >
                  Add Item
                </Text>
              </XStack>
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
        {MENU_CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            isActive={activeCategory === cat}
            onPress={() => setActiveCategory(cat)}
          />
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MenuItemCard
            item={item}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
            onToggleAvailability={toggleAvailability}
          />
        )}
        ListHeaderComponent={
          <XStack paddingHorizontal="$4" pb="$2">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
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
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 16,
        }}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />

      {/* ── Add / Edit Sheet ─────────────────────────────────────── */}
      <MenuFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingItem={editingItem}
        form={form}
        variantLabel={variantLabel}
        variantPrice={variantPrice}
        extraLabel={extraLabel}
        extraPrice={extraPrice}
        isFormValid={isFormValid}
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
        onSave={handleSave}
        categorySheetOpen={categorySheetOpen}
        onCategorySheetOpenChange={setCategorySheetOpen}
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
