// @ts-nocheck
import { useState } from "react";
import { Sheet, XStack, YStack, Text, Card, ScrollView, Spinner } from "tamagui";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button } from "@/components/ui";
import { FormInput } from "@/components/ui/FormInput";
import { Tags, Plus, Globe, CheckCircle2 } from "@tamagui/lucide-icons";
import { useMenuCategoriesQuery, useCreateMenuCategoryMutation } from "@/hooks/menu.hooks";

export default function ManageCategories() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useMenuCategoriesQuery();
  const createMutation = useCreateMenuCategoryMutation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  const categories = data?.data ?? [];

  const openAdd = () => {
    setName("");
    setDescription("");
    setNameError("");
    setSheetOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setNameError("Category name is required");
      return;
    }
    createMutation.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => setSheetOpen(false),
      },
    );
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top + 8, 16)}>
      <XStack padding="$4" alignItems="center" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <BackButton />
        <Text fontSize="$6" fontWeight="bold" flex={1}>
          Manage Categories
        </Text>
        <Button variant="outline" size="$3" icon={<Plus size={16} />} onPress={openAdd}>
          Add
        </Button>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$3" paddingBottom={Math.max(insets.bottom + 20, 24)}>
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
                <Button variant="outline" icon={<Plus size={16} />} onPress={openAdd}>
                  Add Category
                </Button>
              </YStack>
            </Card>
          ) : (
            categories.map((cat) => (
              <Card key={cat.id} padding="$4" bordered>
                <YStack gap="$2">
                  <XStack justifyContent="space-between" alignItems="center" gap="$3">
                    <YStack flex={1} gap="$1">
                      <Text fontSize="$4" fontWeight="600">{cat.name}</Text>
                      <XStack gap="$2" alignItems="center" flexWrap="wrap">
                        {cat.is_global && (
                          <XStack gap="$1" alignItems="center" backgroundColor="$backgroundSoft" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                            <Globe size={12} color="$colorMuted" />
                            <Text fontSize="$2" color="$colorMuted">Global</Text>
                          </XStack>
                        )}
                        {cat.is_system && (
                          <XStack gap="$1" alignItems="center" backgroundColor="$backgroundSoft" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                            <CheckCircle2 size={12} color="$colorMuted" />
                            <Text fontSize="$2" color="$colorMuted">System</Text>
                          </XStack>
                        )}
                        {!cat.is_global && !cat.is_system && (
                          <XStack gap="$1" alignItems="center" backgroundColor="$backgroundSoft" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                            <Plus size={12} color="$colorMuted" />
                            <Text fontSize="$2" color="$colorMuted">Custom</Text>
                          </XStack>
                        )}
                      </XStack>
                    </YStack>
                    <Text fontSize="$3" color="$colorMuted">#{cat.sort_order ?? ""}</Text>
                  </XStack>
                </YStack>
              </Card>
            ))
          )}
        </YStack>
      </ScrollView>

      {/* Add Category Sheet */}
      <Sheet
        modal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        snapPoints={[55]}
        dismissOnSnapToBottom
        zIndex={200_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.5)"
        />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" marginTop="$6">
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack paddingHorizontal="$4" paddingBottom={Math.max(insets.bottom + 16, 32)} gap="$4">
            <Text fontSize="$5" fontWeight="bold">Add Category</Text>
            <FormInput
              label="Category Name"
              placeholder="e.g. Grills"
              value={name}
              onChangeText={(v) => { setName(v); setNameError(""); }}
              error={nameError}
              required
            />
            <FormInput
              label="Description (optional)"
              placeholder="Short description"
              value={description}
              onChangeText={setDescription}
            />
            <Button variant="primary" onPress={handleSave} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save Category"}
            </Button>
            <Button variant="outline" onPress={() => setSheetOpen(false)}>
              Cancel
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}