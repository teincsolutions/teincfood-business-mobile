// @ts-nocheck
import { useState } from 'react';
import { ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import {
  YStack,
  XStack,
  Text,
  Card,
  Sheet,
  Separator,
  Switch,
  Input as TamaguiInput,
  useTheme,
} from 'tamagui';
import {
  UtensilsCrossed,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  X,
  ChevronDown,
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { AppAlertDialog } from '@/components/ui/AlertDialog';

const CATEGORIES = ['All', 'Main', 'Snacks', 'Protein', 'Drinks', 'Desserts'];

const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal'];

type Variant = { id: string; label: string; priceMinor: number };
type Extra = { id: string; label: string; priceMinor: number };

type MenuItem = {
  id: string;
  name: string;
  description: string;
  priceMinor: number; // in pesewas
  category: string;
  available: boolean;
  dietaryTags: string[];
  variants: Variant[];
  extras: Extra[];
};

const INITIAL_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Jollof Rice',
    description: 'Classic West African jollof rice served with stew',
    priceMinor: 2500,
    category: 'Main',
    available: true,
    dietaryTags: ['Halal'],
    variants: [
      { id: 'v1a', label: 'Small', priceMinor: 2000 },
      { id: 'v1b', label: 'Large', priceMinor: 3500 },
    ],
    extras: [{ id: 'e1a', label: 'Extra Stew', priceMinor: 500 }],
  },
  {
    id: '2',
    name: 'Banku & Tilapia',
    description: 'Fermented corn dough with grilled whole tilapia',
    priceMinor: 4500,
    category: 'Main',
    available: true,
    dietaryTags: ['Halal', 'Gluten-free'],
    variants: [],
    extras: [{ id: 'e2a', label: 'Extra Pepper', priceMinor: 200 }],
  },
  {
    id: '3',
    name: 'Waakye',
    description: 'Rice & beans cooked with sorghum leaves',
    priceMinor: 2000,
    category: 'Main',
    available: false,
    dietaryTags: ['Vegetarian', 'Halal'],
    variants: [],
    extras: [],
  },
  {
    id: '4',
    name: 'Kelewele',
    description: 'Spiced fried plantain cubes',
    priceMinor: 1000,
    category: 'Snacks',
    available: true,
    dietaryTags: ['Vegan', 'Gluten-free'],
    variants: [],
    extras: [],
  },
  {
    id: '5',
    name: 'Grilled Chicken',
    description: 'Whole grilled chicken with marinade',
    priceMinor: 3500,
    category: 'Protein',
    available: true,
    dietaryTags: ['Halal', 'Gluten-free'],
    variants: [
      { id: 'v5a', label: 'Half', priceMinor: 2000 },
      { id: 'v5b', label: 'Full', priceMinor: 3500 },
    ],
    extras: [{ id: 'e5a', label: 'Extra Sauce', priceMinor: 300 }],
  },
];

function toGHS(minor: number) {
  return (minor / 100).toFixed(2);
}
function toMinor(ghsStr: string) {
  const n = parseFloat(ghsStr);
  return isNaN(n) ? 0 : Math.round(n * 100);
}

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  category: 'Main',
  dietaryTags: [] as string[],
  variants: [] as Variant[],
  extras: [] as Extra[],
  available: true,
};

export default function SellerMenu() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [items, setItems] = useState<MenuItem[]>(INITIAL_ITEMS);
  const [activeCategory, setActiveCategory] = useState('All');

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form state
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [variantLabel, setVariantLabel] = useState('');
  const [variantPrice, setVariantPrice] = useState('');
  const [extraLabel, setExtraLabel] = useState('');
  const [extraPrice, setExtraPrice] = useState('');

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  // Category picker in form
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const filtered = activeCategory === 'All'
    ? items
    : items.filter((i) => i.category === activeCategory);

  // ─── Open add sheet ────────────────────────────────────────────
  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...EMPTY_FORM });
    setVariantLabel('');
    setVariantPrice('');
    setExtraLabel('');
    setExtraPrice('');
    setSheetOpen(true);
  };

  // ─── Open edit sheet ───────────────────────────────────────────
  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: toGHS(item.priceMinor),
      category: item.category,
      dietaryTags: [...item.dietaryTags],
      variants: [...item.variants],
      extras: [...item.extras],
      available: item.available,
    });
    setVariantLabel('');
    setVariantPrice('');
    setExtraLabel('');
    setExtraPrice('');
    setSheetOpen(true);
  };

  // ─── Save (add or edit) ────────────────────────────────────────
  const handleSave = () => {
    if (!form.name.trim() || !form.price.trim()) return;

    if (editingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                name: form.name.trim(),
                description: form.description.trim(),
                priceMinor: toMinor(form.price),
                category: form.category,
                dietaryTags: form.dietaryTags,
                variants: form.variants,
                extras: form.extras,
                available: form.available,
              }
            : i,
        ),
      );
    } else {
      const newItem: MenuItem = {
        id: Date.now().toString(),
        name: form.name.trim(),
        description: form.description.trim(),
        priceMinor: toMinor(form.price),
        category: form.category,
        available: form.available,
        dietaryTags: form.dietaryTags,
        variants: form.variants,
        extras: form.extras,
      };
      setItems((prev) => [newItem, ...prev]);
    }
    setSheetOpen(false);
  };

  // ─── Toggle availability ───────────────────────────────────────
  const toggleAvailability = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, available: !i.available } : i)),
    );
  };

  // ─── Delete ────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // ─── Variant helpers ───────────────────────────────────────────
  const addVariant = () => {
    if (!variantLabel.trim() || !variantPrice.trim()) return;
    setForm((f) => ({
      ...f,
      variants: [
        ...f.variants,
        { id: Date.now().toString(), label: variantLabel.trim(), priceMinor: toMinor(variantPrice) },
      ],
    }));
    setVariantLabel('');
    setVariantPrice('');
  };
  const removeVariant = (id: string) =>
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.id !== id) }));

  // ─── Extra helpers ─────────────────────────────────────────────
  const addExtra = () => {
    if (!extraLabel.trim() || !extraPrice.trim()) return;
    setForm((f) => ({
      ...f,
      extras: [
        ...f.extras,
        { id: Date.now().toString(), label: extraLabel.trim(), priceMinor: toMinor(extraPrice) },
      ],
    }));
    setExtraLabel('');
    setExtraPrice('');
  };
  const removeExtra = (id: string) =>
    setForm((f) => ({ ...f, extras: f.extras.filter((e) => e.id !== id) }));

  // ─── Dietary tag toggle ────────────────────────────────────────
  const toggleTag = (tag: string) =>
    setForm((f) => ({
      ...f,
      dietaryTags: f.dietaryTags.includes(tag)
        ? f.dietaryTags.filter((t) => t !== tag)
        : [...f.dietaryTags, tag],
    }));

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
      >
        <Text fontSize="$7" fontWeight="800" fontFamily="$heading" color="$color">
          Menu
        </Text>
        <Button
          variant="primary"
          height={44}
          width="auto"
          paddingHorizontal="$4"
          onPress={openAdd}
        >
          <XStack gap="$1" alignItems="center">
            <Plus size={16} color="white" />
            <Text fontFamily="$body" fontWeight="700" fontSize="$3" color="white">
              Add Item
            </Text>
          </XStack>
        </Button>
      </XStack>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexDirection: 'row' }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setActiveCategory(cat)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: activeCategory === cat ? theme.primary?.val || '#F97316' : theme.borderColor?.val || '#e5e7eb',
              backgroundColor: activeCategory === cat ? (theme.primary?.val || '#F97316') : 'transparent',
              marginRight: 8,
            }}
          >
            <Text
              fontFamily="$body"
              fontWeight="600"
              fontSize="$3"
              color={activeCategory === cat ? 'white' : '$colorSecondary'}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Item count */}
      <XStack paddingHorizontal="$4" pb="$2">
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
          {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
        </Text>
      </XStack>

      {/* List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack paddingHorizontal="$4" paddingBottom={insets.bottom + 16} gap="$3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              padding="$4"
              bordered
              opacity={item.available ? 1 : 0.55}
            >
              <XStack gap="$3" alignItems="flex-start">
                {/* Thumbnail */}
                <YStack
                  width={64}
                  height={64}
                  backgroundColor="$backgroundSoft"
                  borderRadius="$3"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <UtensilsCrossed size={26} color="$colorSecondary" />
                </YStack>

                {/* Info */}
                <YStack flex={1} gap="$1">
                  <XStack justifyContent="space-between" alignItems="flex-start">
                    <YStack flex={1} gap="$0.5">
                      <Text fontSize="$4" fontWeight="800" fontFamily="$heading" color="$color">
                        {item.name}
                      </Text>
                      <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                        {item.category}
                      </Text>
                    </YStack>
                    <Text fontSize="$4" fontWeight="800" fontFamily="$heading" color="$primary">
                      GHS {toGHS(item.priceMinor)}
                    </Text>
                  </XStack>

                  {item.description ? (
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body" numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}

                  {/* Tags */}
                  {item.dietaryTags.length > 0 && (
                    <XStack gap="$1" flexWrap="wrap" mt="$1">
                      {item.dietaryTags.map((tag) => (
                        <YStack
                          key={tag}
                          paddingHorizontal="$2"
                          paddingVertical={2}
                          borderRadius="$10"
                          backgroundColor="$backgroundSoft"
                          borderWidth={1}
                          borderColor="$borderColor"
                        >
                          <Text fontSize={10} fontFamily="$body" color="$colorSecondary">
                            {tag}
                          </Text>
                        </YStack>
                      ))}
                    </XStack>
                  )}

                  {/* Variants / extras summary */}
                  {(item.variants.length > 0 || item.extras.length > 0) && (
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body" mt="$1">
                      {[
                        item.variants.length > 0 && `${item.variants.length} size${item.variants.length > 1 ? 's' : ''}`,
                        item.extras.length > 0 && `${item.extras.length} add-on${item.extras.length > 1 ? 's' : ''}`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  )}
                </YStack>
              </XStack>

              <Separator marginVertical="$3" />

              {/* Actions row */}
              <XStack justifyContent="space-between" alignItems="center">
                {/* Availability toggle */}
                <TouchableOpacity
                  onPress={() => toggleAvailability(item.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  {item.available ? (
                    <Eye size={15} color={theme.primary?.val || '#F97316'} />
                  ) : (
                    <EyeOff size={15} color={theme.colorSecondary?.val || '#6b7280'} />
                  )}
                  <Text
                    fontSize="$3"
                    fontFamily="$body"
                    fontWeight="600"
                    color={item.available ? '$primary' : '$colorSecondary'}
                  >
                    {item.available ? 'Available' : 'Unavailable'}
                  </Text>
                </TouchableOpacity>

                <XStack gap="$2">
                  {/* Edit */}
                  <TouchableOpacity
                    onPress={() => openEdit(item)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: theme.borderColor?.val || '#e5e7eb',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Edit3 size={15} color={theme.color?.val} />
                  </TouchableOpacity>

                  {/* Delete */}
                  <TouchableOpacity
                    onPress={() => setDeleteTarget(item)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: '#fca5a5',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={15} color="#ef4444" />
                  </TouchableOpacity>
                </XStack>
              </XStack>
            </Card>
          ))}

          {filtered.length === 0 && (
            <YStack alignItems="center" paddingVertical="$10" gap="$3">
              <UtensilsCrossed size={48} color="$colorSecondary" />
              <Text color="$colorSecondary" fontFamily="$body" fontSize="$4">
                No items in this category
              </Text>
              <Button variant="outline" height={44} width="auto" paddingHorizontal="$5" onPress={openAdd}>
                Add First Item
              </Button>
            </YStack>
          )}
        </YStack>
      </ScrollView>

      {/* ── Add / Edit Sheet ─────────────────────────────────────── */}
      <Sheet
        modal
        open={sheetOpen}
        onOpenChange={setSheetOpen}
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
                  <TouchableOpacity onPress={() => setSheetOpen(false)}>
                    <X size={22} color={theme.color?.val} />
                  </TouchableOpacity>
                </XStack>

                {/* Basic info */}
                <YStack gap="$4">
                  <Input
                    label="Item Name"
                    placeholder="e.g. Jollof Rice"
                    value={form.name}
                    onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                  />
                  <Input
                    label="Description"
                    placeholder="Short description of the item"
                    value={form.description}
                    onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  />
                  <Input
                    label="Base Price (GHS)"
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={form.price}
                    onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
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
                    onPress={() => setCategorySheetOpen(true)}
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
                    size="$3"
                    checked={form.available}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, available: v }))}
                    backgroundColor={form.available ? '$primary' : '$gray8'}
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
                          onPress={() => toggleTag(tag)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 20,
                            borderWidth: 1,
                            borderColor: active ? (theme.primary?.val || '#F97316') : (theme.borderColor?.val || '#e5e7eb'),
                            backgroundColor: active ? (theme.primary?.val || '#F97316') : 'transparent',
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
                      <TouchableOpacity onPress={() => removeVariant(v.id)}>
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
                        value={variantLabel}
                        onChangeText={setVariantLabel}
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
                        keyboardType="decimal-pad"
                        value={variantPrice}
                        onChangeText={setVariantPrice}
                      />
                    </YStack>
                    <Button
                      variant="outline"
                      height={50}
                      width={50}
                      paddingHorizontal="$0"
                      onPress={addVariant}
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
                      <TouchableOpacity onPress={() => removeExtra(e.id)}>
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
                        value={extraLabel}
                        onChangeText={setExtraLabel}
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
                        keyboardType="decimal-pad"
                        value={extraPrice}
                        onChangeText={setExtraPrice}
                      />
                    </YStack>
                    <Button
                      variant="outline"
                      height={50}
                      width={50}
                      paddingHorizontal="$0"
                      onPress={addExtra}
                    >
                      <Plus size={18} />
                    </Button>
                  </XStack>
                </YStack>

                {/* Save button */}
                <Button
                  variant="primary"
                  onPress={handleSave}
                  disabled={!form.name.trim() || !form.price.trim()}
                  opacity={form.name.trim() && form.price.trim() ? 1 : 0.5}
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
        onOpenChange={setCategorySheetOpen}
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
              {CATEGORIES.filter((c) => c !== 'All').map((cat, i, arr) => (
                <YStack key={cat}>
                  <XStack
                    py="$4"
                    justifyContent="space-between"
                    alignItems="center"
                    onPress={() => {
                      setForm((f) => ({ ...f, category: cat }));
                      setCategorySheetOpen(false);
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
                        <Text color="white" fontSize={12} fontWeight="800">✓</Text>
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

      {/* ── Delete confirmation ──────────────────────────────────── */}
      <AppAlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Item"
        description={`Remove "${deleteTarget?.name}" from your menu? This cannot be undone.`}
        icon={Trash2}
        confirmText="DELETE"
        isDestructive
        onConfirm={handleDelete}
      />
    </YStack>
  );
}