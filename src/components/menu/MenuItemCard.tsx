// @ts-nocheck
import { TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Card, Separator, useTheme } from "tamagui";
import {
  UtensilsCrossed,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
} from "@tamagui/lucide-icons";
import type { MenuItem } from "@teincfood/core";
import { formatPriceFromMinor } from "@teincfood/core";
import { useResponsive } from "@/utils/responsive";
import { CachedImage } from "@/components/ui/CachedImage";

interface MenuItemCardProps {
  item: MenuItem;
  onPress?: (item: MenuItem) => void;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (item: MenuItem) => void;
  onToggleAvailability?: (id: string) => void;
}

export function MenuItemCard({
  item,
  onPress,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuItemCardProps) {
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const s = isTablet
    ? {
        thumbnail: 96,
        icon: 32,
        textMd: "$5",
        textSm: "$3",
        textXs: "$2",
        btnSize: 44,
        iconSize: 20,
      }
    : {
        thumbnail: 64,
        icon: 26,
        textMd: "$4",
        textSm: "$2",
        textXs: 10,
        btnSize: 36,
        iconSize: 15,
      };

  return (
    <Card
      padding={isTablet ? "$5" : "$4"}
      bordered
      opacity={item.is_available ? 1 : 0.55}
    >
      <TouchableOpacity onPress={() => onPress?.(item)} activeOpacity={0.7}>
        <XStack gap="$3" alignItems="flex-start">
          {/* Thumbnail */}
          <YStack
            width={s.thumbnail}
            height={s.thumbnail}
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            overflow="hidden"
          >
            <CachedImage
              source={item.image_url ? { uri: item.image_url } : null}
              style={{
                width: s.thumbnail,
                height: s.thumbnail,
                borderRadius: 8,
              }}
              placeholder={
                <UtensilsCrossed size={s.icon} color="$colorSecondary" />
              }
            />
          </YStack>

          {/* Info */}
          <YStack flex={1} gap="$1">
            <XStack justifyContent="space-between" alignItems="flex-start">
              <YStack flex={1} gap="$0.5">
                <Text
                  fontSize={s.textMd}
                  fontWeight="800"
                  fontFamily="$heading"
                  color="$color"
                >
                  {item.name}
                </Text>
                <Text
                  fontSize={s.textSm}
                  color="$colorSecondary"
                  fontFamily="$body"
                >
                  {item.category?.name || ""}
                </Text>
              </YStack>
              <Text
                fontSize={s.textMd}
                fontWeight="800"
                fontFamily="$heading"
                color="$primary"
              >
                {formatPriceFromMinor(item.basePrice?.amountMinor || 0)}
              </Text>
            </XStack>

            {item.description ? (
              <Text
                fontSize={s.textSm}
                color="$colorSecondary"
                fontFamily="$body"
                numberOfLines={2}
              >
                {item.description}
              </Text>
            ) : null}

            {/* Tags */}
            {item.dietary_tags && item.dietary_tags.length > 0 && (
              <XStack gap="$1" flexWrap="wrap" mt="$1">
                {item.dietary_tags.map((tag) => (
                  <YStack
                    key={tag}
                    paddingHorizontal="$2"
                    paddingVertical={2}
                    borderRadius="$10"
                    backgroundColor="$backgroundSoft"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text
                      fontSize={s.textXs}
                      fontFamily="$body"
                      color="$colorSecondary"
                    >
                      {tag}
                    </Text>
                  </YStack>
                ))}
              </XStack>
            )}

            {/* Variants / addons badges */}
            <XStack gap="$1" flexWrap="wrap" mt="$1">
              {item.variants?.length > 0 && (
                <XStack
                  paddingHorizontal="$2"
                  paddingVertical={2}
                  borderRadius="$10"
                  backgroundColor="$backgroundSoft"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <Text
                    fontSize={s.textXs}
                    fontFamily="$body"
                    color="$colorSecondary"
                  >
                    {item.variants.length} size
                    {item.variants.length > 1 ? "s" : ""}
                  </Text>
                </XStack>
              )}
              {item.extras?.length > 0 && (
                <XStack
                  paddingHorizontal="$2"
                  paddingVertical={2}
                  borderRadius="$10"
                  backgroundColor="$backgroundSoft"
                  borderWidth={1}
                  borderColor="$borderColor"
                >
                  <Text
                    fontSize={s.textXs}
                    fontFamily="$body"
                    color="$colorSecondary"
                  >
                    {item.extras.length} add-on
                    {item.extras.length > 1 ? "s" : ""}
                  </Text>
                </XStack>
              )}
            </XStack>
          </YStack>
        </XStack>
      </TouchableOpacity>

      <Separator marginVertical="$3" />

      {/* Actions row */}
      {(onToggleAvailability || onEdit || onDelete) && (
        <XStack justifyContent="space-between" alignItems="center">
          {/* Availability toggle */}
          {onToggleAvailability ? (
            <TouchableOpacity
              onPress={() => onToggleAvailability(item.id)}
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              {item.is_available ? (
                <Eye size={s.iconSize} color={theme.primary?.val || "#F97316"} />
              ) : (
                <EyeOff
                  size={s.iconSize}
                  color={theme.colorSecondary?.val || "#6b7280"}
                />
              )}
              <Text
                fontSize={s.textSm}
                fontFamily="$body"
                fontWeight="600"
                color={item.is_available ? "$primary" : "$colorSecondary"}
              >
                {item.is_available ? "Available" : "Unavailable"}
              </Text>
            </TouchableOpacity>
          ) : (
            <YStack />
          )}

          <XStack gap="$2">
            {/* Edit */}
            {onEdit && (
              <TouchableOpacity
                onPress={() => onEdit(item)}
                style={{
                  width: s.btnSize,
                  height: s.btnSize,
                  borderRadius: s.btnSize / 2,
                  borderWidth: 1,
                  borderColor: theme.borderColor?.val || "#e5e7eb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Edit3 size={s.iconSize} color={theme.color?.val} />
              </TouchableOpacity>
            )}

            {/* Delete */}
            {onDelete && (
              <TouchableOpacity
                onPress={() => onDelete(item)}
                style={{
                  width: s.btnSize,
                  height: s.btnSize,
                  borderRadius: s.btnSize / 2,
                  borderWidth: 1,
                  borderColor: "#fca5a5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={s.iconSize} color="#ef4444" />
              </TouchableOpacity>
            )}
          </XStack>
        </XStack>
      )}
    </Card>
  );
}
