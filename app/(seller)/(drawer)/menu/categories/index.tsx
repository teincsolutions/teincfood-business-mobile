// @ts-nocheck
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform } from "react-native";
import {
  Sheet,
  XStack,
  YStack,
  Text,
  Card,
  ScrollView,
  Spinner,
  useMedia,
} from "tamagui";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button } from "@/components/ui";
import { FormInput } from "@/components/ui/FormInput";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { Tags, Plus, Globe, Pencil, Trash2 } from "@tamagui/lucide-icons";
import {
  useMenuCategoriesQuery,
  useCreateMenuCategoryMutation,
  useUpdateMenuCategoryMutation,
  useDeleteMenuCategoryMutation,
} from "@/hooks/menu.hooks";

export default function ManageCategories() {
  const canManageMenu = useHasCapability("menu_manage");
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const media = useMedia();
  const { data, isLoading } = useMenuCategoriesQuery();
  const createMutation = useCreateMenuCategoryMutation();
  const updateMutation = useUpdateMenuCategoryMutation();
  const deleteMutation = useDeleteMenuCategoryMutation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  const categories = data?.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openAdd = () => {
    setEditingCat(null);
    setName("");
    setDescription("");
    setNameError("");
    setSheetOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    setName(cat.name ?? "");
    setDescription(cat.description ?? "");
    setNameError("");
    setSheetOpen(true);
  };

  const closeSheet = (open) => {
    setSheetOpen(open);
    if (!open) setEditingCat(null);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError("Category name is required");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
    };
    if (editingCat) {
      updateMutation.mutate(
        { categoryId: editingCat.id, ...payload },
        { onSuccess: () => closeSheet(false) },
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => closeSheet(false) });
    }
  };

  const handleDelete = (cat) => {
    Alert.alert(
      "Delete category",
      `Delete "${cat.name}"? Categories with menu items can't be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(cat.id),
        },
      ],
    );
  };

  const isCustom = (cat) => !cat.is_global && !cat.is_system;

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={Math.max(insets.top + 8, 16)}
    >
      <XStack
        padding="$4"
        alignItems="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="bold" flex={1}>
          Manage Categories
        </Text>
        <Button
          variant="outline"
          size="$3"
          icon={<Plus size={16} />}
          onPress={openAdd}
          disabled={!canManageMenu}
        >
          Add
        </Button>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack
          padding="$4"
          gap="$3"
          paddingBottom={Math.max(insets.bottom + 20, 24)}
        >
          {isLoading ? (
            <YStack alignItems="center" padding="$8" gap="$3">
              <Spinner size="large" />
              <Text color="$colorMuted">Loading categories...</Text>
            </YStack>
          ) : categories.length === 0 ? (
            <Card padding="$8" bordered>
              <YStack alignItems="center" gap="$3">
                <Tags size={40} color="$colorMuted" />
                <Text color="$colorMuted" textAlign="center">
                  No categories yet. Add one to group your menu items.
                </Text>
                <Button
                  variant="outline"
                  icon={<Plus size={16} />}
                  onPress={openAdd}
                  disabled={!canManageMenu}
                >
                  Add Category
                </Button>
              </YStack>
            </Card>
          ) : (
            categories.map((cat) => (
              <Card key={cat.id} padding="$4" bordered>
                <YStack gap="$2">
                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    gap="$3"
                  >
                    <YStack flex={1} gap="$1">
                      <Text fontSize="$4" fontWeight="600">
                        {cat.name}
                      </Text>
                      <XStack gap="$2" alignItems="center" flexWrap="wrap">
                        {cat.is_global && (
                          <XStack
                            gap="$1"
                            alignItems="center"
                            backgroundColor="$backgroundSoft"
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$2"
                          >
                            <Globe size={12} color="$colorMuted" />
                            <Text fontSize="$2" color="$colorMuted">
                              Global
                            </Text>
                          </XStack>
                        )}
                        {isCustom(cat) && (
                          <XStack
                            gap="$1"
                            alignItems="center"
                            backgroundColor="$backgroundSoft"
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$2"
                          >
                            <Plus size={12} color="$colorMuted" />
                            <Text fontSize="$2" color="$colorMuted">
                              Custom
                            </Text>
                          </XStack>
                        )}
                      </XStack>
                    </YStack>
                    <XStack gap="$2" alignItems="center">
                      <Text fontSize="$3" color="$colorMuted">
                        #{cat.sort_order ?? ""}
                      </Text>
                      {isCustom(cat) && canManageMenu && (
                        <>
                          <Button
                            size="$2"
                            height={38}
                            width={38}
                            variant="outline"
                            icon={<Pencil size={14} />}
                            disabled={isSaving || deleteMutation.isPending}
                            onPress={() => openEdit(cat)}
                          />
                          <Button
                            size="$2"
                            height={38}
                            width={38}
                            variant="outline"
                            icon={<Trash2 size={14} color="$red10" />}
                            disabled={isSaving || deleteMutation.isPending}
                            onPress={() => handleDelete(cat)}
                          />
                        </>
                      )}
                    </XStack>
                  </XStack>
                </YStack>
              </Card>
            ))
          )}
        </YStack>
      </ScrollView>

      {/* Add/Edit Category Sheet */}
      <Sheet
        modal
        open={sheetOpen}
        onOpenChange={closeSheet}
        snapPoints={[90]}
        dismissOnSnapToBottom
        zIndex={200_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.5)"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          {...(media.md || media.lg
            ? { maxWidth: 600, alignSelf: "center" }
            : {})}
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Sheet.ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <YStack
                paddingHorizontal="$4"
                paddingTop="$2"
                paddingBottom={Math.max(insets.bottom + 16, 32)}
                gap="$4"
              >
                <Text fontSize="$5" fontWeight="bold">
                  {editingCat ? "Edit Category" : "Add Category"}
                </Text>
                <FormInput
                  label="Category Name"
                  placeholder="e.g. Grills"
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    setNameError("");
                  }}
                  error={nameError}
                  required
                />
                <FormInput
                  label="Description (optional)"
                  placeholder="Short description"
                  value={description}
                  onChangeText={setDescription}
                />
                <Button
                  variant="primary"
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingCat
                      ? "Save Changes"
                      : "Save Category"}
                </Button>
                <Button variant="outline" onPress={() => closeSheet(false)}>
                  Cancel
                </Button>
              </YStack>
            </Sheet.ScrollView>
          </KeyboardAvoidingView>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
