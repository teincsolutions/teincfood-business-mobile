// @ts-nocheck
import { useState } from 'react';
import { TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert, Keyboard } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  YStack,
  XStack,
  Text,
  Sheet,
  Separator,
  Switch,
  Input as TamaguiInput,
  useTheme,
  useMedia,
} from 'tamagui';
import { Plus, X, ChevronDown, Camera, Image as ImageIcon } from '@tamagui/lucide-icons';
import { toast } from 'sonner-native';
import { Button, FormInput } from '@/components/ui';
import type { MenuItem } from '@/types/api/menu.api';
import type { MenuItemForm } from '@/types/menu.types';
import type { UploadResult } from '@/services/upload.service';
import type { MenuCategory } from '@/types/api';
import {
  DIETARY_TAGS,
  EMPTY_FORM,
  toMinor,
} from '@/services/menu.service';
import { formatPrice } from '@/utils/currency';

interface MenuFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: MenuItem | null;
  form: MenuItemForm;
  fieldErrors?: Record<string, string>;
  variantLabel: string;
  variantPrice: string;
  extraLabel: string;
  extraPrice: string;
  isFormValid: boolean;
  isSaving?: boolean;
  isUploadingImage?: boolean;
  categories: MenuCategory[];
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
  onImagePick: (uri: string) => Promise<UploadResult>;
  onSave: () => void;
  categorySheetOpen: boolean;
  onCategorySheetOpenChange: (open: boolean) => void;
  onAddCategory: (name: string) => void;
  isAddingCategory?: boolean;
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
  isSaving,
  isUploadingImage,
  fieldErrors,
  onImagePick,
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
  categories,
  onAddCategory,
  isAddingCategory,
}: MenuFormSheetProps) {
  const theme = useTheme();
  const media = useMedia();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addCategoryName, setAddCategoryName] = useState('');

  const updateFormField = <K extends keyof MenuItemForm>(
    field: K,
    value: MenuItemForm[K]
  ) => {
    onFormChange({ ...form, [field]: value });
  };

  const handleImageResult = async (localUri: string) => {
    try {
      console.log('[MenuForm] Uploading image', localUri?.slice(0, 60));
      const result = await onImagePick(localUri);
      console.log('[MenuForm] Upload succeeded', result);
      onFormChange({ ...form, image_url: result.download_url, image_key: result.key });
    } catch (e) {
      console.error('[MenuForm] Upload failed', e);
      toast.error("Could not upload image. Try again.");
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      toast.error("Photo library permission is needed to select photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageResult(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      toast.error("Camera permission is needed to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleImageResult(result.assets[0].uri);
    }
  };

  const pickImage = () => {
    Alert.alert("Add Image", "Choose an option", [
      {
        text: "Take Photo",
        onPress: takePhoto,
      },
      {
        text: "Choose from Gallery",
        onPress: pickFromGallery,
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const closeAddCategory = () => {
    setAddCategoryOpen(false);
    setAddCategoryName("");
  };

  const handleAddCategory = () => {
    const name = addCategoryName.trim();
    if (!name) return;
    onAddCategory(name);
    closeAddCategory();
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
          style={{ zIndex: 999 }}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.6)"
        />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}>
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Sheet.ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
                    error={fieldErrors?.name}
                    required
                  />
                  <FormInput
                    label="Description"
                    placeholder="Short description of the item"
                    value={form.description}
                    onChangeText={(v) => updateFormField('description', v)}
                    error={fieldErrors?.description}
                  />
                  <FormInput
                    label="Base Price"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={form.price}
                    onChangeText={(v) => updateFormField('price', v)}
                    error={fieldErrors?.price}
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
                  <XStack gap="$2">
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        onCategorySheetOpenChange(true);
                      }}
                      style={{
                        flex: 1,
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
                        {categories.find((c) => c.id === form.category)?.name || 'Select a category'}
                      </Text>
                      <ChevronDown size={18} color={theme.colorSecondary?.val} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setAddCategoryOpen((v) => !v);
                      }}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        backgroundColor: theme.backgroundSoft?.val || '#f3f4f6',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {addCategoryOpen ? (
                        <X size={20} color="#ef4444" />
                      ) : (
                        <Plus size={22} color={theme.primary?.val || '#F97316'} />
                      )}
                    </TouchableOpacity>
                  </XStack>

                  {addCategoryOpen && (
                    <YStack gap="$2">
                      <FormInput
                        label=""
                        placeholder="New category name"
                        value={addCategoryName}
                        onChangeText={setAddCategoryName}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleAddCategory}
                      />
                      <XStack gap="$2" justifyContent="flex-end">
                        <Button
                          variant="outline"
                          height={44}
                          disabled={isAddingCategory}
                          onPress={closeAddCategory}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          height={44}
                          loading={isAddingCategory}
                          disabled={!addCategoryName.trim()}
                          onPress={handleAddCategory}
                        >
                          Add Category
                        </Button>
                      </XStack>
                    </YStack>
                  )}
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
                        checked={form.is_available}
                        onCheckedChange={(v) => updateFormField('is_available', v)}
                        backgroundColor={form.is_available ? '$primary' : '$color.gray900'}
                  >
                    <Switch.Thumb animation="quick" backgroundColor="white" />
                  </Switch>
                </XStack>

                <Separator />

                {/* Image (single) */}
                <YStack gap="$3">
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                    Item Image
                  </Text>
                  
                  {form.image_url ? (
                    <YStack position="relative" width={120} height={120}>
                      <Image
                        source={{ uri: form.image_url }}
                        style={{ width: 120, height: 120, borderRadius: 8 }}
                      />
                      <TouchableOpacity
                        onPress={() => updateFormField('image_url', '')}
                        style={{
                          position: 'absolute', top: -6, right: -6,
                          width: 20, height: 20, borderRadius: 10,
                          backgroundColor: '#ef4444',
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <X size={12} color="white" />
                      </TouchableOpacity>
                    </YStack>
                  ) : (
                    <TouchableOpacity
                      onPress={pickImage}
                      disabled={isUploadingImage}
                      style={{
                        height: 120,
                        borderRadius: 8,
                        borderWidth: 2,
                        borderColor: theme.borderColor?.val || '#e5e7eb',
                        borderStyle: 'dashed',
                        backgroundColor: theme.backgroundSoft?.val || '#f3f4f6',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        opacity: isUploadingImage ? 0.5 : 1,
                      }}
                    >
                      {isUploadingImage ? (
                        <Text fontFamily="$body" fontSize="$3" color="$colorSecondary">
                          Uploading...
                        </Text>
                      ) : (
                        <>
                          <Camera size={24} color={theme.colorSecondary?.val} />
                          <Text fontFamily="$body" fontSize="$3" color="$colorSecondary">
                            Tap to add photo
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </YStack>

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
                          {v.name} — {formatPrice(v.price_adjustment / 100)}
                        </Text>
                      </YStack>
                      <TouchableOpacity onPress={() => onRemoveVariant(v.id)}>
                        <X size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </XStack>
                  ))}

                  <XStack gap="$2" alignItems="flex-end">
                    <YStack flex={1}>
                      <FormInput
                        label=""
                        placeholder="Label (e.g. Large)"
                        value={variantLabel}
                        onChangeText={onVariantLabelChange}
                      />
                    </YStack>
                    <YStack flex={1}>
                      <FormInput
                        label=""
                        placeholder="Price"
                        keyboardType="decimal-pad"
                        value={variantPrice}
                        onChangeText={onVariantPriceChange}
                      />
                    </YStack>
                    <Button
                      variant="outline"
                      height={48}
                      width={48}
                      paddingHorizontal="$0"
                      onPress={() => onAddVariant()}
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
                          {e.name} — {formatPrice(e.price_minor / 100)}
                        </Text>
                      </YStack>
                      <TouchableOpacity onPress={() => onRemoveExtra(e.id)}>
                        <X size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </XStack>
                  ))}

                  <XStack gap="$2" alignItems="flex-end">
                    <YStack flex={1}>
                      <FormInput
                        label=""
                        placeholder="Label (e.g. Extra Cheese)"
                        value={extraLabel}
                        onChangeText={onExtraLabelChange}
                      />
                    </YStack>
                    <YStack flex={1}>
                      <FormInput
                        label=""
                        placeholder="Price"
                        keyboardType="decimal-pad"
                        value={extraPrice}
                        onChangeText={onExtraPriceChange}
                      />
                    </YStack>
                    <Button
                      variant="outline"
                      height={48}
                      width={48}
                      paddingHorizontal="$0"
                      onPress={() => onAddExtra()}
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
                  disabled={!isFormValid || isSaving}
                  loading={isSaving}
                  opacity={isFormValid && !isSaving ? 1 : 0.5}
                >
                  {editingItem ? 'SAVE CHANGES' : 'ADD ITEM'}
                </Button>
              </YStack>
            </Sheet.ScrollView>
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
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}>
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack px="$5" pt="$3" pb="$2">
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color">
              Select Category
            </Text>
          </YStack>
          <Sheet.ScrollView>
            <YStack px="$5" pb="$6" gap="$1">
              {categories.map((cat, i, arr) => (
                <YStack key={cat.name}>
                  <XStack
                    py="$4"
                    justifyContent="space-between"
                    alignItems="center"
                    onPress={() => {
                      updateFormField('category', cat.id);
                      onCategorySheetOpenChange(false);
                    }}
                  >
                    <Text fontSize="$4" fontFamily="$body" fontWeight="600" color="$color">
                      {cat.name}
                    </Text>
                    {form.category === cat.id && (
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
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>

    </>
  );
}
