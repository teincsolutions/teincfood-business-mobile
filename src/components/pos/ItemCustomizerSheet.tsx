// @ts-nocheck
import { useState, useMemo } from "react";
import {
  YStack,
  XStack,
  Text,
  Image,
  Separator,
  Sheet,
  Checkbox,
  Dialog,
  Adapt,
  Label,
  Spinner,
  ScrollView,
  useMedia,
} from "tamagui";
import { ShoppingCart, Plus, Minus, X, Check } from "@tamagui/lucide-icons";
import { toast } from "sonner-native";
import { formatPriceFromMinor } from "@teincfood/core";
import { usePOSStore } from "@/stores/pos.store";
import type { MenuItem } from "@teincfood/core";
import { Button } from "../ui";
import { useCachedImageUrl } from "@teincfood/core";
import { useResponsive } from "@/utils/responsive";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ItemCustomizerSheetProps {
  item: MenuItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ItemCustomizerSheet({
  item,
  open,
  onOpenChange,
}: ItemCustomizerSheetProps) {
  const addItem = usePOSStore((s) => s.addItem);
  const imageUrl = useCachedImageUrl(item.image_url);
  const media = useMedia();
  const { height, isLandscape } = useResponsive();
  const insets = useSafeAreaInsets();
  const isSheet = media.sm;
  const dialogMaxHeight = Math.max(
    240,
    Math.round(height * (isLandscape ? 0.88 : 0.9)) -
      insets.top -
      insets.bottom,
  );
  const dialogHeight = isSheet ? "100%" : undefined;
  const heroHeight = isLandscape ? 180 : 220;

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    item.variants.length > 0 ? item.variants[0].id : null,
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const selectedVariant =
    item.variants.find((v) => v.id === selectedVariantId) || null;
  const selectedAddons = item.extras.filter((e) =>
    selectedAddonIds.includes(e.id),
  );

  const effectiveUnitPrice = useMemo(() => {
    if (selectedVariant) return selectedVariant.price.amountMinor;
    return item.basePrice.amountMinor;
  }, [item, selectedVariant]);

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.amountMinor, 0);
  const totalPrice = (effectiveUnitPrice + addonsTotal) * quantity;

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId],
    );
  };

  const handleClose = () => {
    setQuantity(1);
    setSelectedAddonIds([]);
    if (item.variants.length > 0) setSelectedVariantId(item.variants[0].id);
    onOpenChange(false);
  };

  const handleAddToCart = () => {
    if (!item.is_available) {
      toast.error(`${item.name} is unavailable`);
      return;
    }
    addItem(item, quantity, selectedVariant, selectedAddons);
    handleClose();
    toast.success(`${item.name} added to cart`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Adapt when="sm" platform="touch">
        <Sheet snapPoints={[70]} modal dismissOnSnapToBottom>
          <Sheet.Frame
            padding={0}
            paddingBottom={insets.bottom}
            backgroundColor="$background"
          >
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay backgroundColor="rgba(0,0,0,0.4)" />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(15,23,42,0.4)"
          onPress={handleClose}
        />
        <Dialog.Content
          key="content"
          animation="quick"
          enterStyle={{ y: 20, opacity: 0 }}
          exitStyle={{ y: 20, opacity: 0 }}
          width="92%"
          maxWidth={isLandscape ? 560 : 440}
          maxHeight={isSheet ? "100%" : dialogMaxHeight}
          height={dialogHeight}
          backgroundColor="$background"
          borderRadius="$6"
          padding={0}
          overflow="hidden"
        >
          <YStack
            flex={isSheet ? 1 : undefined}
            maxHeight={isSheet ? "100%" : dialogMaxHeight}
          >
            <YStack height={heroHeight} width="100%" backgroundColor="$gray200">
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  width="100%"
                  height={heroHeight}
                  objectFit="cover"
                />
              ) : (
                <YStack flex={1} justifyContent="center" alignItems="center">
                  <Text
                    fontSize="$8"
                    color="$colorSecondary"
                    fontWeight="700"
                    fontFamily="$heading"
                  >
                    {item.name?.charAt(0).toUpperCase() ?? "F"}
                  </Text>
                </YStack>
              )}
              <XStack
                position="absolute"
                top={Math.max(insets.top, 8)}
                right="$2"
                zIndex={10}
              >
                <XStack
                  width={36}
                  height={36}
                  borderRadius="$full"
                  backgroundColor="rgba(0,0,0,0.45)"
                  justifyContent="center"
                  alignItems="center"
                  pressStyle={{ opacity: 0.7 }}
                  onPress={handleClose}
                >
                  <X size={16} color="white" pointerEvents="none" />
                </XStack>
              </XStack>
            </YStack>

            <ScrollView
              flex={isSheet ? 1 : undefined}
              flexShrink={1}
              minHeight={0}
              showsVerticalScrollIndicator
              contentContainerStyle={{ paddingBottom: 8 }}
            >
              <YStack padding="$5" gap="$4">
                {/* Name + price */}
                <XStack justifyContent="space-between" alignItems="flex-start">
                  <YStack flex={1} paddingRight="$3" gap="$1">
                    <Text
                      fontSize="$6"
                      fontWeight="800"
                      fontFamily="$heading"
                      color="$color"
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    )}
                  </YStack>
                  <YStack alignItems="flex-end">
                    <Text
                      fontSize="$6"
                      fontWeight="800"
                      fontFamily="$body"
                      color="$primary"
                    >
                      {formatPriceFromMinor(effectiveUnitPrice)}
                    </Text>
                    {selectedVariant && (
                      <Text
                        fontSize="$2"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
                        {selectedVariant.name}
                      </Text>
                    )}
                  </YStack>
                </XStack>

                <Separator borderColor="$borderColor" />

                {/* Size variants */}
                {item.variants.length > 0 && (
                  <YStack gap="$3">
                    <Text
                      fontSize="$5"
                      fontWeight="700"
                      fontFamily="$heading"
                      color="$color"
                    >
                      SIZE
                    </Text>
                    <XStack flexWrap="wrap" gap="$2.5">
                      {item.variants.map((variant) => {
                        const isActive = selectedVariantId === variant.id;
                        return (
                          <Button
                            key={variant.id}
                            onPress={() => setSelectedVariantId(variant.id)}
                            variant={isActive ? "primary" : "ghost"}
                            borderColor={isActive ? "$primary" : "$borderColor"}
                            borderWidth={isActive ? 0 : 1}
                            width="auto"
                            minWidth={0}
                            height={40}
                          >
                            {`${variant.name} ${formatPriceFromMinor(variant.price.amountMinor)}`}
                          </Button>
                        );
                      })}
                    </XStack>
                  </YStack>
                )}

                {/* Extras */}
                {item.extras.length > 0 && (
                  <YStack gap="$3">
                    <Text
                      fontSize="$5"
                      fontWeight="700"
                      fontFamily="$heading"
                      color="$color"
                    >
                      EXTRAS
                    </Text>
                    <YStack gap="$2">
                      {item.extras.map((addon) => {
                        const selected = selectedAddonIds.includes(addon.id);
                        return (
                          <XStack
                            key={addon.id}
                            alignItems="center"
                            justifyContent="space-between"
                            backgroundColor="$backgroundStrong"
                            borderRadius="$4"
                            padding="$4"
                            onPress={() => toggleAddon(addon.id)}
                            pressStyle={{ opacity: 0.8 }}
                          >
                            <XStack alignItems="center" gap="$4" flex={1}>
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleAddon(addon.id)}
                                width={28}
                                height={28}
                                backgroundColor={
                                  selected ? "$primary" : "$background"
                                }
                                borderColor={
                                  selected ? "$primary" : "$borderColor"
                                }
                                borderRadius="$3"
                              >
                                <Checkbox.Indicator
                                  justifyContent="center"
                                  alignItems="center"
                                >
                                  <Check size={24} color="white" />
                                </Checkbox.Indicator>
                              </Checkbox>
                              <Label
                                flex={1}
                                onPress={() => toggleAddon(addon.id)}
                              >
                                <Text
                                  fontSize="$5"
                                  fontWeight="600"
                                  color="$color"
                                >
                                  {addon.name}
                                </Text>
                              </Label>
                            </XStack>
                            <Text
                              fontSize="$5"
                              fontWeight="700"
                              color="$primary"
                            >
                              +{formatPriceFromMinor(addon.amountMinor)}
                            </Text>
                          </XStack>
                        );
                      })}
                    </YStack>
                  </YStack>
                )}
              </YStack>
            </ScrollView>

            <XStack
              alignItems="center"
              gap="$3"
              paddingHorizontal="$4"
              paddingTop="$3"
              paddingBottom={Math.max(insets.bottom, 12)}
              borderTopWidth={1}
              borderColor="$borderColor"
              backgroundColor="$background"
            >
              <XStack
                alignItems="center"
                backgroundColor="$background"
                borderRadius="$full"
                paddingHorizontal="$1.5"
                paddingVertical="$1.5"
                gap="$1.5"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Button
                  width={36}
                  height={36}
                  circular
                  chromeless
                  backgroundColor="$backgroundSoft"
                  padding={0}
                  icon={<Minus size={16} color="$color" />}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                />
                <Text
                  fontSize="$5"
                  fontWeight="700"
                  color="$color"
                  fontFamily="$body"
                  minWidth={24}
                  textAlign="center"
                >
                  {quantity}
                </Text>
                <Button
                  width={36}
                  height={36}
                  circular
                  chromeless
                  backgroundColor="$backgroundSoft"
                  padding={0}
                  icon={<Plus size={16} color="$color" />}
                  onPress={() => setQuantity(quantity + 1)}
                />
              </XStack>

              <Button
                flex={1}
                minWidth={0}
                variant="primary"
                height={48}
                disabled={!item.is_available}
                onPress={handleAddToCart}
                icon={<ShoppingCart size={18} color="white" />}
              >
                <Text
                  color="white"
                  fontWeight="800"
                  fontFamily="$body"
                  fontSize="$3"
                  numberOfLines={1}
                >
                  Add to Cart · {formatPriceFromMinor(totalPrice)}
                </Text>
              </Button>
            </XStack>
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
