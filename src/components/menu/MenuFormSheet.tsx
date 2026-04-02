// @ts-nocheck
import { useState } from 'react';
import { ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import {
  YStack,
  XStack,
  Text,
  Sheet,
  Separator,
  Switch,
  Input as TamaguiInput,
  useTheme,
} from 'tamagui';
import { Plus, X, ChevronDown } from '@tamagui/lucide-icons';
import { Button, FormInput } from '@/components/ui';
import type { MenuItem, MenuItemForm, Variant, Extra } from '@/services/menu.service';
import {
  MENU_CATEGORIES,
  DIETARY_TAGS,
  EMPTY_FORM,
  toGHS,
  toMinor,
} from '@/services/menu.service';

interface MenuFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: MenuItem | null;
  form: MenuItemForm;
  variantLabel: string;
  variantPrice: string;
  extraLabel: string;
  extraPrice: string;
  isFormValid: boolean;
  onFormChange: (form: MenuItemForm) => void;
  onVariantLabelChange: (label: string) => void;
  onVariantPriceChange: (price: string) => void;
  onExtraLabelChange: (label: string) => void;
  onExtraPriceChange: (price: string) => void;
  onToggleDietaryTag: (tag: string) => void;
  onAddVariant: () => void;
  onRemoveVariant: (id: string) => void;
  onAddExtra: () => void;
  onRemoveExtra: (id: string) => void;
  onSave: () => void;
  categorySheetOpen: boolean;
  onCategorySheetOpenChange: (open: boolean) => void;
}

export function MenuFormSheet({
  open,
  onOpenChange,
  editingItem,
  form,
  variantLabel,
  variantPrice,
  extraLabel,
  extraPrice,
  isFormValid,
  onFormChange,
  onVariantLabelChange,
  onVariantPriceChange,
  onExtraLabelChange,
  onExtraPriceChange,
  onToggleDietaryTag,
  onAddVariant,
  onRemoveVariant,
  onAddExtra,
  onRemoveExtra,
  onSave,
  categorySheetOpen,
  onCategorySheetOpenChange,
}: MenuFormSheetProps) {
  const theme = useTheme();

  const updateFormField = <K extends keyof MenuItemForm>(
    field: K,
    value: MenuItemForm[K]
  ) => {
    onFormChange({ ...form, [field]: value });
  };

  return (
    <>
      {/* ── Add / Edit Sheet ─────────────────────────────────────── */}
      <Sheet
        modal
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={[92]}
        dismissOnSnapToBottom
        zIndex={100_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.6)"
        />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6">
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <YStack paddingHorizontal="$5" paddingTop="$2" paddingBottom="$8" gap="$5">
                {/* Sheet header */}
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
                    {editingItem ? 'Edit Item' : 'Add Item'}
                  </Text>
                  <TouchableOpacity onPress={() => onOpenChange(false)}>
                    <X size={22} color={theme.color?.val} />
                  </TouchableOpacity>
                </XStack>

                {/* Basic info */}
                <YStack gap="$4">
                  <FormInput
                    label="Item Name"
                    placeholder="e.g. Jollof Rice"
                    value={form.name}
                    onChangeText={(v) => updateFormField('name', v)}
                    required
                  />
                  <FormInput
                    label="Description"
                    placeholder="Short description of the item"
                    value={form.description}
                    onChangeText={(v) => updateFormField('description', v)}
                  />
                  <FormInput
                    label="Base Price (GHS)"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={form.price}
                    onChangeText={(v) => updateFormField('price', v)}
                    required
                  />
                </YStack>

                {/* Category picker */}
                <YStack gap="$2">
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color="$colorSecondary"
                    fontFamily="$body"
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    Category
                  </Text>
                  <TouchableOpacity
                    onPress={() => onCategorySheetOpenChange(true)}
                    style={{
                      height: 60,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      backgroundColor: theme.backgroundSoft?.val || '#f3f4f6',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text fontFamily="$body" fontSize="$4" color="$color">
                      {form.category}
                    </Text>
                    <ChevronDown size={18} color={theme.colorSecondary?.val} />
                  </TouchableOpacity>
                </YStack>

                {/* Availability toggle */}
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack gap="$0.5">
                    <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color">
                      Available
                    </Text>
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                      Show this item to customers
                    </Text>
                  </YStack>
                  <Switch
                    size="$6"
                    checked={form.available}
                    onCheckedChange={(v) => updateFormField('available', v)}
                    backgroundColor={form.available ? '$primary' : '$color.gray900'}
                  >
                    <Switch.Thumb animation="quick" backgroundColor="white" />
                  </Switch>
                </XStack>

                <Separator />

                {/* Dietary tags */}
                <YStack gap="$3">
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                    Dietary Tags
                  </Text>
                  <XStack gap="$2" flexWrap="wrap">
                    {DIETARY_TAGS.map((tag) => {
                      const active = form.dietaryTags.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => onToggleDietaryTag(tag)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: active
                              ? theme.primary?.val || '#F97316'
                              : theme.borderColor?.val || '#e5e7eb',
                            backgroundColor: active
                              ? theme.primary?.val || '#F97316'
                              : 'transparent',
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            fontFamily="$body"
                            fontWeight="600"
                            fontSize="$3"
                            color={active ? 'white' : '$colorSecondary'}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </XStack>
                </YStack>

                <Separator />

                {/* Variants (sizes) */}
                <YStack gap="$3">
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                    Size Options
                  </Text>
                  <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                    e.g. Small / Medium / Large with different prices
                  </Text>

                  {form.variants.map((v) => (
                    <XStack key={v.id} alignItems="center" gap="$2">
                      <YStack
                        flex={1}
                        height={48}
                        paddingHorizontal="$3"
                        borderRadius="$3"
                        backgroundColor="$backgroundSoft"
                        justifyContent="center"
                      >
                        <Text fontFamily="$body" fontSize="$3" color="$color">
                          {v.label} — GHS {toGHS(v.priceMinor)}
                        </Text>
                      </YStack>
                      <TouchableOpacity onPress={() => onRemoveVariant(v.id)}>
                        <X size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </XStack>
                  ))}

                  <XStack gap="$2" alignItems="flex-end">
                    <YStack flex={1}>
                      <TamaguiInput
                        height={50}
                        borderWidth={0}
                        borderRadius="$3"
                        backgroundColor="$backgroundSoft"
                        fontFamily="$body"
                        fontSize="$3"
                        color="$color"
                        placeholder="Label (e.g. Large)"
                        placeholderTextColor="$color.gray900"
                        value={variantLabel}
                        onChangeText={onVariantLabelChange}
                      />
                    </YStack>
                    <YStack flex={1}>
                      <TamaguiInput
                        height={50}
                        borderWidth={0}
                        borderRadius="$3"
                        backgroundColor="$backgroundSoft"
                        fontFamily="$body"
                        fontSize="$3"
                        color="$color"
                        placeholder="Price (GHS)"
                        placeholderTextColor="$color.gray900"
                        keyboardType="decimal-pad"
                        value={variantPrice}
                        onChangeText={onVariantPriceChange}
                      />
                    </YStack>
                    <Button
                      variant="outline"
                      height={50}
                      width={50}
                      paddingHorizontal="$0"
                      onPress={onAddVariant}
                    >
                      <Plus size={18} />
                    </Button>
                  </XStack>
                </YStack>

                <Separator />

                {/* Extras / add-ons */}
                <YStack gap="$3">
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                    Add-ons / Extras
                  </Text>
                  <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                    e.g. Extra Cheese, Extra Sauce
                  </Text>

                  {form.extras.map((e) => (
                    <XStack key={e.id} alignItems="center" gap="$2">
                      <YStack
                        flex={1}
                        height={48}
                        paddingHorizontal="$3"
                        borderRadius="$3"
                        backgroundColor="$backgroundSoft"
                        justifyContent="center"
                      >
                        <Text fontFamily="$body" fontSize="$3" color="$color">
                          {e.label} — GHS {toGHS(e.priceMinor)}
                        </Text>
                      </YStack>
                      <TouchableOpacity onPress={() => onRemoveExtra(e.id)}>
                        <X size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </XStack>
                  ))}

                  <XStack gap="$2" alignItems="flex-end">
                    <YStack flex={1}>
                      <TamaguiInput
                        height={50}
                        borderWidth={0}
                        borderRadius="$3"
                        backgroundColor="$backgroundSoft"
                        fontFamily="$body"
                        fontSize="$3"
                        color="$color"
                        placeholder="Label (e.g. Extra Cheese)"
                        placeholderTextColor="$color.gray900"
                        value={extraLabel}
                        onChangeText={onExtraLabelChange}
                      />
                    </YStack>
                    <YStack flex={1}>
                      <TamaguiInput
                        height={50}
                        borderWidth={0}
                        borderRadius="$3"
                        backgroundColor="$backgroundSoft"
                        fontFamily="$body"
                        fontSize="$3"
                        color="$color"
                        placeholder="Price (GHS)"
                        placeholderTextColor="$color.gray900"
                        keyboardType="decimal-pad"
                        value={extraPrice}
                        onChangeText={onExtraPriceChange}
                      />
                    </YStack>
                    <Button
                      variant="outline"
                      height={50}
                      width={50}
                      paddingHorizontal="$0"
                      onPress={onAddExtra}
                    >
                      <Plus size={18} />
                    </Button>
                  </XStack>
                </YStack>

                {/* Save button */}
                <Button
                  variant="primary"
                  width="100%"
                  onPress={onSave}
                  disabled={!isFormValid}
                  opacity={isFormValid ? 1 : 0.5}
                >
                  {editingItem ? 'SAVE CHANGES' : 'ADD ITEM'}
                </Button>
              </YStack>
            </ScrollView>
          </KeyboardAvoidingView>
        </Sheet.Frame>
      </Sheet>

      {/* ── Category picker sub-sheet ────────────────────────────── */}
      <Sheet
        modal
        open={categorySheetOpen}
        onOpenChange={onCategorySheetOpenChange}
        snapPoints={[45]}
        dismissOnSnapToBottom
        zIndex={200_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.5)"
        />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6">
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack px="$5" pt="$3" pb="$2">
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color">
              Select Category
            </Text>
          </YStack>
          <ScrollView>
            <YStack px="$5" pb="$6" gap="$1">
              {MENU_CATEGORIES.filter((c) => c !== 'All').map((cat, i, arr) => (
                <YStack key={cat}>
                  <XStack
                    py="$4"
                    justifyContent="space-between"
                    alignItems="center"
                    onPress={() => {
                      updateFormField('category', cat);
                      onCategorySheetOpenChange(false);
                    }}
                  >
                    <Text fontSize="$4" fontFamily="$body" fontWeight="600" color="$color">
                      {cat}
                    </Text>
                    {form.category === cat && (
                      <YStack
                        width={20}
                        height={20}
                        borderRadius={10}
                        backgroundColor="$primary"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text color="white" fontSize={12} fontWeight="800">
                          ✓
                        </Text>
                      </YStack>
                    )}
                  </XStack>
                  {i < arr.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </>
  );
}