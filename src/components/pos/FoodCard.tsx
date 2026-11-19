// @ts-nocheck
import { useState } from "react";
import { Card, YStack, XStack, Text, Image, useMedia } from "tamagui";
import { Plus } from "@tamagui/lucide-icons";
import { formatPriceFromMinor } from "@teincfood/core";
import type { MenuItem } from "@teincfood/core";
import { ItemCustomizerSheet } from "./ItemCustomizerSheet";
import { Button } from "../ui";
import { useCachedImageUrl } from "@teincfood/core";

interface FoodCardProps {
  item: MenuItem;
  /** Dense card for POS tablet-landscape grids. */
  compact?: boolean;
}

export function FoodCard({ item, compact = false }: FoodCardProps) {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const media = useMedia();
  const imageUrl = useCachedImageUrl(item.image_url);
  const imageHeight = compact ? 96 : 120;
  const addButtonSize = compact ? 32 : undefined;

  return (
    <>
      <Card
        elevate
        width="100%"
        backgroundColor="$background"
        borderRadius="$5"
        pressStyle={item.is_available ? { scale: 0.98 } : undefined}
        onPress={item.is_available ? () => setShowCustomizer(true) : undefined}
        opacity={item.is_available ? 1 : 0.6}
        $md={compact ? undefined : { borderRadius: "$6" }}
      >
        <Card.Header
          padding={0}
          borderTopLeftRadius="$5"
          borderTopRightRadius="$5"
          backgroundColor="$gray200"
          position="relative"
          $md={
            compact
              ? undefined
              : { borderTopLeftRadius: "$6", borderTopRightRadius: "$6" }
          }
        >
          <YStack
            width="100%"
            height={imageHeight}
            borderTopLeftRadius="$5"
            borderTopRightRadius="$5"
            overflow="hidden"
            backgroundColor="$gray200"
            $md={
              compact
                ? undefined
                : {
                    height: 180,
                    borderTopLeftRadius: "$6",
                    borderTopRightRadius: "$6",
                  }
            }
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                width="100%"
                height={imageHeight}
                objectFit="cover"
                $md={compact ? undefined : { height: 180 }}
              />
            ) : (
              <YStack
                width="100%"
                height={imageHeight}
                $md={compact ? undefined : { height: 180 }}
                backgroundColor={
                  item.id
                    ? ["#E8E8E8", "#D4D4D4", "#F0F0F0", "#E5E5E5"][
                        item.id.charCodeAt(0) % 4
                      ]
                    : "#E8E8E8"
                }
                justifyContent="center"
                alignItems="center"
              >
                <Text
                  fontSize={compact ? "$5" : "$7"}
                  color="$colorSecondary"
                  fontWeight="700"
                  fontFamily="$heading"
                >
                  {item.name ? item.name.charAt(0).toUpperCase() : "F"}
                </Text>
              </YStack>
            )}
          </YStack>
          {!item.is_available && (
            <YStack
              position="absolute"
              top="$2"
              left="$2"
              backgroundColor="$error"
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$full"
            >
              <Text fontSize="$2" color="white" fontWeight="700">
                Unavailable
              </Text>
            </YStack>
          )}
        </Card.Header>

        <YStack
          padding={compact ? "$2" : "$3"}
          gap={compact ? "$1" : "$1"}
          $md={compact ? undefined : { padding: "$5", gap: "$2" }}
        >
          <Text
            fontSize={compact ? "$2" : "$4"}
            fontWeight="700"
            fontFamily="$heading"
            color="$color"
            numberOfLines={2}
            lineHeight={compact ? 14 : 18}
            minHeight={compact ? 28 : 36}
            $md={
              compact
                ? undefined
                : { fontSize: "$6", lineHeight: 22, minHeight: 44 }
            }
          >
            {item.name}
          </Text>

          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginTop={compact ? "$1" : "$2"}
          >
            <Text
              fontSize={compact ? "$3" : "$4"}
              fontWeight="800"
              fontFamily="$body"
              color="$primary"
              $md={compact ? undefined : { fontSize: "$6" }}
            >
              {formatPriceFromMinor(item.basePrice.amountMinor)}
            </Text>
            <Button
              variant="primary"
              size={compact ? "$2" : "$4"}
              height={addButtonSize ?? "$8"}
              width={addButtonSize ?? "$8"}
              rounded="$full"
              padding={0}
              hitSlop={compact ? 6 : undefined}
              disabled={!item.is_available}
              onPress={() => setShowCustomizer(true)}
              $md={compact ? undefined : { height: 48, width: 48 }}
              icon={({ color, size }) => (
                <Plus size={compact ? 14 : media.md ? 22 : 18} color={color} />
              )}
            />
          </XStack>
        </YStack>
      </Card>

      <ItemCustomizerSheet
        item={item}
        open={showCustomizer}
        onOpenChange={setShowCustomizer}
      />
    </>
  );
}
