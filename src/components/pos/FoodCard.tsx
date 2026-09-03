// @ts-nocheck
import { useState } from "react";
import { Card, YStack, XStack, Text, Image, useMedia } from "tamagui";
import { Plus } from "@tamagui/lucide-icons";
import { formatPriceFromMinor } from "@/utils/currency";
import type { MenuItem } from "@/types/api/menu.api";
import { ItemCustomizerSheet } from "./ItemCustomizerSheet";
import { Button } from "../ui";
import { useCachedImageUrl } from "@/hooks/useCachedImage";

interface FoodCardProps {
  item: MenuItem;
}

export function FoodCard({ item }: FoodCardProps) {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const media = useMedia();
  const imageUrl = useCachedImageUrl(item.image_url);

  return (
    <>
      <Card
        elevate
        width="100%"
        marginBottom="$3"
        backgroundColor="$background"
        borderRadius="$5"
        pressStyle={item.is_available ? { scale: 0.98 } : undefined}
        onPress={item.is_available ? () => setShowCustomizer(true) : undefined}
        opacity={item.is_available ? 1 : 0.6}
        $md={{ borderRadius: "$6" }}
      >
        <Card.Header
          padding={0}
          borderTopLeftRadius="$5"
          borderTopRightRadius="$5"
          backgroundColor="$gray200"
          position="relative"
          $md={{ borderTopLeftRadius: "$6", borderTopRightRadius: "$6" }}
        >
          <YStack
            width="100%"
            height={120}
            borderTopLeftRadius="$5"
            borderTopRightRadius="$5"
            overflow="hidden"
            backgroundColor="$gray200"
            $md={{
              height: 180,
              borderTopLeftRadius: "$6",
              borderTopRightRadius: "$6",
            }}
          >
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                width="100%"
                height={120}
                objectFit="cover"
                $md={{ height: 180 }}
              />
            ) : (
              <YStack
                width="100%"
                height={120}
                $md={{ height: 180 }}
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
                  fontSize="$7"
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

        <YStack padding="$3" gap="$1" $md={{ padding: "$5", gap: "$2" }}>
          <Text
            fontSize="$4"
            fontWeight="700"
            fontFamily="$heading"
            color="$color"
            numberOfLines={1}
            $md={{ fontSize: "$6" }}
          >
            {item.name}
          </Text>
          <Text
            fontSize="$2"
            color="$colorSecondary"
            fontFamily="$body"
            numberOfLines={1}
            $md={{ fontSize: "$4" }}
          >
            {item.description ?? ""}
          </Text>

          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginTop="$2"
          >
            <Text
              fontSize="$4"
              fontWeight="800"
              fontFamily="$body"
              color="$primary"
              $md={{ fontSize: "$6" }}
            >
              {formatPriceFromMinor(item.basePrice.amountMinor)}
            </Text>
            <Button
              variant="primary"
              size="$4"
              height="$8"
              width="$8"
              rounded="$full"
              disabled={!item.is_available}
              onPress={() => setShowCustomizer(true)}
              $md={{ height: 48, width: 48 }}
              icon={({ color, size }) => (
                <Plus size={media.md ? 22 : 18} color={color} />
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
