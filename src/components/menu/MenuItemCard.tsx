// @ts-nocheck
import { TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
  useTheme,
} from 'tamagui';
import {
  UtensilsCrossed,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
} from '@tamagui/lucide-icons';
import type { MenuItem } from '@/types/api/menu.api';
import { formatPriceFromMinor } from '@/utils/currency';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggleAvailability: (id: string) => void;
}

export function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuItemCardProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const s = isTablet ? { thumbnail: 96, icon: 32, textMd: '$5', textSm: '$3', textXs: '$2', btnSize: 44, iconSize: 20 } : { thumbnail: 64, icon: 26, textMd: '$4', textSm: '$2', textXs: 10, btnSize: 36, iconSize: 15 };

  return (
    <Card
      padding={isTablet ? '$5' : '$4'}
      bordered
      opacity={item.is_available ? 1 : 0.55}
    >
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
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: s.thumbnail, height: s.thumbnail, borderRadius: 8 }}
            />
          ) : (
            <UtensilsCrossed size={s.icon} color="$colorSecondary" />
          )}
        </YStack>

        {/* Info */}
        <YStack flex={1} gap="$1">
          <XStack justifyContent="space-between" alignItems="flex-start">
            <YStack flex={1} gap="$0.5">
              <Text fontSize={s.textMd} fontWeight="800" fontFamily="$heading" color="$color">
                {item.name}
              </Text>
              <Text fontSize={s.textSm} color="$colorSecondary" fontFamily="$body">
                {item.category?.name || ''}
              </Text>
            </YStack>
            <Text fontSize={s.textMd} fontWeight="800" fontFamily="$heading" color="$primary">
              {formatPriceFromMinor(item.basePrice?.amountMinor || 0)}
            </Text>
          </XStack>

          {item.description ? (
            <Text fontSize={s.textSm} color="$colorSecondary" fontFamily="$body" numberOfLines={2}>
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
                  <Text fontSize={s.textXs} fontFamily="$body" color="$colorSecondary">
                    {tag}
                  </Text>
                </YStack>
              ))}
            </XStack>
          )}

          {/* Variants / addons summary */}
          {(item.variants?.length > 0 || item.extras?.length > 0) && (
            <Text fontSize={s.textSm} color="$colorSecondary" fontFamily="$body" mt="$1">
              {[
                item.variants.length > 0 &&
                  `${item.variants.length} size${item.variants.length > 1 ? 's' : ''}`,
                item.extras.length > 0 &&
                  `${item.extras.length} add-on${item.extras.length > 1 ? 's' : ''}`,
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
          onPress={() => onToggleAvailability(item.id)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          {item.is_available ? (
            <Eye size={s.iconSize} color={theme.primary?.val || '#F97316'} />
          ) : (
            <EyeOff size={s.iconSize} color={theme.colorSecondary?.val || '#6b7280'} />
          )}
          <Text
            fontSize={s.textSm}
            fontFamily="$body"
            fontWeight="600"
            color={item.is_available ? '$primary' : '$colorSecondary'}
          >
            {item.is_available ? 'Available' : 'Unavailable'}
          </Text>
        </TouchableOpacity>

        <XStack gap="$2">
          {/* Edit */}
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={{
              width: s.btnSize,
              height: s.btnSize,
              borderRadius: s.btnSize / 2,
              borderWidth: 1,
              borderColor: theme.borderColor?.val || '#e5e7eb',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Edit3 size={s.iconSize} color={theme.color?.val} />
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity
            onPress={() => onDelete(item)}
            style={{
              width: s.btnSize,
              height: s.btnSize,
              borderRadius: s.btnSize / 2,
              borderWidth: 1,
              borderColor: '#fca5a5',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trash2 size={s.iconSize} color="#ef4444" />
          </TouchableOpacity>
        </XStack>
      </XStack>
    </Card>
  );
}
