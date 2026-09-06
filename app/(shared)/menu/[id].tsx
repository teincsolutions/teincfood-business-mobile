// @ts-nocheck
import { Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { YStack, XStack, Text, Card, Separator, useTheme } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, Button } from '@/components/ui';
import { useMenuItemsQuery } from '@/hooks/menu.hooks';
import { useCachedImageUrl } from '@/hooks/useCachedImage';
import { formatPriceFromMinor } from '@teincfood/core';
import {
  UtensilsCrossed,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Tag,
} from '@tamagui/lucide-icons';
import { useResponsive } from '@/utils/responsive';

export default function MenuItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { isTablet } = useResponsive();
  const { data: items } = useMenuItemsQuery();
  const item = items?.find((i) => i.id === id);
  const imageUri = useCachedImageUrl(item?.image_url ?? null);

  if (!item) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" padding="$6">
        <UtensilsCrossed size={48} color="$colorMuted" />
        <Text fontSize="$5" fontWeight="600" textAlign="center">Item not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </YStack>
    );
  }

  const s = isTablet ? { textXl: '$8', textLg: '$7', textMd: '$5', textSm: '$3', spacing: '$5' } : { textXl: '$7', textLg: '$6', textMd: '$4', textSm: '$2', spacing: '$4' };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Top bar */}
      <XStack
        paddingHorizontal="$4" paddingTop={Math.max(insets.top + 8, 16)} paddingBottom="$3"
        alignItems="center" gap="$3" backgroundColor="$background"
        borderBottomWidth={1} borderBottomColor="$borderColor"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="700" fontFamily="$heading" numberOfLines={1}>Item Details</Text>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <YStack height={isTablet ? 400 : 280} backgroundColor="$backgroundSoft" overflow="hidden">
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <YStack flex={1} alignItems="center" justifyContent="center">
              <UtensilsCrossed size={64} color="$colorMuted" />
            </YStack>
          )}
        </YStack>

        {/* Content card overlapping image */}
        <YStack
          marginTop={-30} padding={s.spacing} gap="$4"
          backgroundColor="$background" borderTopLeftRadius="$8" borderTopRightRadius="$8"
        >
          {/* Name + category + status */}
          <XStack justifyContent="space-between" alignItems="flex-start">
            <YStack flex={1} gap="$1">
              <Text fontSize={s.textXl} fontWeight="800" fontFamily="$heading" color="$color">
                {item.name}
              </Text>
              <Text fontSize={s.textMd} color="$primary" fontFamily="$body">
                {item.category?.name || ''}
              </Text>
            </YStack>
            <XStack
              paddingHorizontal="$3" paddingVertical="$1" borderRadius="$10"
              backgroundColor={item.is_available ? '$successMuted' : '$backgroundSoft'}
              borderWidth={1} borderColor={item.is_available ? '$success' : '$borderColor'}
            >
              <XStack gap="$1" alignItems="center">
                {item.is_available ? <Eye size={14} color="$success" /> : <EyeOff size={14} color="$colorMuted" />}
                <Text fontSize="$2" color={item.is_available ? '$success' : '$colorMuted'} fontWeight="600">
                  {item.is_available ? 'Available' : 'Unavailable'}
                </Text>
              </XStack>
            </XStack>
          </XStack>

          {/* Price */}
          <Card padding="$3" bordered backgroundColor="$backgroundSoft">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textTransform="uppercase" letterSpacing={0.5}>Price</Text>
            <Text fontSize={s.textLg} fontWeight="800" color="$primary" fontFamily="$heading">
              {formatPriceFromMinor(item.basePrice?.amountMinor || 0)}
            </Text>
          </Card>

          {/* Description */}
          {item.description && (
            <>
              <Separator />
              <YStack gap="$1">
                <Text fontSize={s.textSm} fontWeight="600" color="$colorSecondary" fontFamily="$body" textTransform="uppercase" letterSpacing={0.5}>Description</Text>
                <Text fontSize="$4" color="$color" fontFamily="$body" lineHeight={24}>{item.description}</Text>
              </YStack>
            </>
          )}

          {/* Dietary tags */}
          {item.dietary_tags?.length > 0 && (
            <>
              <Separator />
              <YStack gap="$2">
                <Text fontSize={s.textSm} fontWeight="600" color="$colorSecondary" fontFamily="$body" textTransform="uppercase" letterSpacing={0.5}>Dietary Info</Text>
                <XStack gap="$2" flexWrap="wrap">
                  {item.dietary_tags.map((tag) => (
                    <XStack key={tag} gap="$1" paddingHorizontal="$3" paddingVertical="$1" borderRadius="$10" backgroundColor="$backgroundSoft" borderWidth={1} borderColor="$borderColor">
                      <Tag size={12} color="$colorMuted" />
                      <Text fontSize="$3" fontFamily="$body" color="$colorSecondary">{tag}</Text>
                    </XStack>
                  ))}
                </XStack>
              </YStack>
            </>
          )}

          {/* Variants */}
          {item.variants?.length > 0 && (
            <>
              <Separator />
              <YStack gap="$2">
                <Text fontSize={s.textSm} fontWeight="600" color="$colorSecondary" fontFamily="$body" textTransform="uppercase" letterSpacing={0.5}>Sizes / Variants</Text>
                {item.variants.map((v) => (
                  <XStack key={v.id} justifyContent="space-between" alignItems="center" paddingVertical="$2">
                    <Text fontSize="$4" fontFamily="$body" color="$color">{v.name}</Text>
                    <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$primary">
                      {formatPriceFromMinor(v.price?.amountMinor || 0)}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            </>
          )}

          {/* Extras */}
          {item.extras?.length > 0 && (
            <>
              <Separator />
              <YStack gap="$2">
                <Text fontSize={s.textSm} fontWeight="600" color="$colorSecondary" fontFamily="$body" textTransform="uppercase" letterSpacing={0.5}>Add-ons / Extras</Text>
                {item.extras.map((e) => (
                  <XStack key={e.id} justifyContent="space-between" alignItems="center" paddingVertical="$2">
                    <Text fontSize="$4" fontFamily="$body" color="$color">{e.name}</Text>
                    <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$primary">
                      +{formatPriceFromMinor(e.amountMinor || 0)}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            </>
          )}

          <Separator />

          {/* Actions */}
          <YStack gap="$3" paddingBottom={insets.bottom + 20}>
            <Button variant="outline" icon={<Edit3 size={18} />} onPress={() => router.replace(`/(seller)/(drawer)/menu?edit=${item.id}`)}>
              Edit Item
            </Button>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
