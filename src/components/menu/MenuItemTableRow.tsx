// @ts-nocheck
import { TouchableOpacity } from 'react-native';
import { XStack, YStack, Text, Switch, useTheme } from 'tamagui';
import { UtensilsCrossed, Edit3, Trash2 } from '@tamagui/lucide-icons';
import type { MenuItem } from '@teincfood/core';
import { formatPriceFromMinor } from '@teincfood/core';
import { CachedImage } from '@/components/ui/CachedImage';

interface MenuItemTableRowProps {
  item: MenuItem;
  onPress?: (item: MenuItem) => void;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (item: MenuItem) => void;
  onToggleAvailability?: (id: string) => void;
}

const COLUMN = {
  category: 112,
  price: 96,
  available: 100,
  actions: 88,
} as const;

const headerText = {
  fontSize: '$2',
  fontFamily: '$body',
  fontWeight: '700',
  color: '$colorSecondary',
  textTransform: 'uppercase',
  letterSpacing: 0.6,
} as const;

/**
 * Desktop-parity menu row for tablet landscape. The drawer leaves roughly
 * 780pt of content on a landscape iPad, so a 3-up card grid squeezes names
 * into vertical letters. A fixed-column table keeps every row readable and
 * matches the desktop Menu screen.
 */
export function MenuItemTableHeader() {
  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$2"
      gap="$3"
      alignItems="center"
      backgroundColor="$backgroundSoft"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <Text flex={1} minWidth={0} {...headerText}>
        Item
      </Text>
      <Text width={COLUMN.category} flexShrink={0} {...headerText}>
        Category
      </Text>
      <Text width={COLUMN.price} flexShrink={0} textAlign="right" {...headerText}>
        Price
      </Text>
      <Text width={COLUMN.available} flexShrink={0} textAlign="center" {...headerText}>
        Available
      </Text>
      <Text width={COLUMN.actions} flexShrink={0} textAlign="right" {...headerText}>
        Actions
      </Text>
    </XStack>
  );
}

export function MenuItemTableRow({
  item,
  onPress,
  onEdit,
  onDelete,
  onToggleAvailability,
}: MenuItemTableRowProps) {
  const theme = useTheme();

  const actionButton = (onAction: () => void, destructive: boolean, label: string, icon: React.ReactNode) => (
    <TouchableOpacity
      accessibilityLabel={label}
      onPress={onAction}
      style={{
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: destructive
          ? '#fca5a5'
          : theme.borderColor?.val || '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </TouchableOpacity>
  );

  return (
    <XStack
      minHeight={76}
      alignItems="center"
      gap="$3"
      paddingHorizontal="$4"
      paddingVertical="$2"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      opacity={item.is_available ? 1 : 0.55}
    >
      {/* Only the item details open the detail screen. Availability and the
          action buttons live outside this pressable so their taps cannot
          bubble into row navigation. */}
      <TouchableOpacity
        onPress={() => onPress?.(item)}
        activeOpacity={0.72}
        style={{ flex: 1, minWidth: 0, alignSelf: 'stretch', justifyContent: 'center' }}
      >
        <XStack flex={1} minWidth={0} alignItems="center" gap="$3">
          {/* Item */}
          <XStack flex={1} minWidth={0} alignItems="center" gap="$3">
            <YStack
              width={52}
              height={52}
              borderRadius="$2"
              overflow="hidden"
              backgroundColor="$backgroundSoft"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <CachedImage
                source={item.image_url ? { uri: item.image_url } : null}
                style={{ width: 52, height: 52 }}
                placeholder={<UtensilsCrossed size={20} color="$colorSecondary" />}
              />
            </YStack>

            <YStack flex={1} minWidth={0} gap="$0.5">
              <Text
                fontSize="$4"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.description ? (
                <Text
                  fontSize="$2"
                  color="$colorSecondary"
                  fontFamily="$body"
                  numberOfLines={1}
                >
                  {item.description}
                </Text>
              ) : null}

              {(item.variants?.length > 0 ||
                item.extras?.length > 0 ||
                item.dietary_tags?.length > 0) && (
                <XStack gap="$1" flexWrap="wrap" marginTop={2}>
                  {item.variants?.length > 0 ? (
                    <YStack
                      paddingHorizontal="$1.5"
                      borderRadius="$10"
                      backgroundColor="$backgroundSoft"
                    >
                      <Text fontSize={10} fontFamily="$body" color="$colorSecondary">
                        {`${item.variants.length} ${item.variants.length === 1 ? 'size' : 'sizes'}`}
                      </Text>
                    </YStack>
                  ) : null}
                  {item.extras?.length > 0 ? (
                    <YStack
                      paddingHorizontal="$1.5"
                      borderRadius="$10"
                      backgroundColor="$backgroundSoft"
                    >
                      <Text fontSize={10} fontFamily="$body" color="$colorSecondary">
                        {`${item.extras.length} ${item.extras.length === 1 ? 'add-on' : 'add-ons'}`}
                      </Text>
                    </YStack>
                  ) : null}
                  {item.dietary_tags?.slice(0, 2).map((tag) => (
                    <YStack
                      key={tag}
                      paddingHorizontal="$1.5"
                      borderRadius="$10"
                      backgroundColor="$backgroundSoft"
                    >
                      <Text fontSize={10} fontFamily="$body" color="$colorSecondary">
                        {tag}
                      </Text>
                    </YStack>
                  ))}
                </XStack>
              )}
            </YStack>
          </XStack>

          {/* Category */}
          <YStack width={COLUMN.category} flexShrink={0}>
            <Text
              fontSize="$3"
              color="$colorSecondary"
              fontFamily="$body"
              numberOfLines={1}
            >
              {item.category?.name || '—'}
            </Text>
          </YStack>

          {/* Price */}
          <YStack width={COLUMN.price} flexShrink={0} alignItems="flex-end">
            <Text
              fontSize="$4"
              fontWeight="800"
              fontFamily="$heading"
              color="$primary"
            >
              {formatPriceFromMinor(item.basePrice?.amountMinor || 0)}
            </Text>
          </YStack>
        </XStack>
      </TouchableOpacity>

      {/* Availability */}
      <XStack
        width={COLUMN.available}
        flexShrink={0}
        alignItems="center"
        justifyContent="center"
        gap="$1.5"
      >
        {onToggleAvailability ? (
          <>
            <Switch
              size="$3"
              checked={item.is_available}
              onCheckedChange={() => onToggleAvailability(item.id)}
              backgroundColor={item.is_available ? '$primary' : '$gray5'}
            >
              <Switch.Thumb animation="quick" backgroundColor="white" />
            </Switch>
            <Text
              fontSize="$2"
              fontFamily="$body"
              fontWeight="600"
              color={item.is_available ? '$primary' : '$colorSecondary'}
            >
              {item.is_available ? 'On' : 'Off'}
            </Text>
          </>
        ) : (
          <Text
            fontSize="$2"
            fontFamily="$body"
            fontWeight="600"
            color={item.is_available ? '$primary' : '$colorSecondary'}
          >
            {item.is_available ? 'Available' : 'Unavailable'}
          </Text>
        )}
      </XStack>

      {/* Actions */}
      <XStack width={COLUMN.actions} flexShrink={0} justifyContent="flex-end" gap="$2">
        {onEdit
          ? actionButton(
              () => onEdit(item),
              false,
              `Edit ${item.name}`,
              <Edit3 size={17} color={theme.color?.val} />,
            )
          : null}
        {onDelete
          ? actionButton(
              () => onDelete(item),
              true,
              `Delete ${item.name}`,
              <Trash2 size={17} color="#ef4444" />,
            )
          : null}
      </XStack>
    </XStack>
  );
}
