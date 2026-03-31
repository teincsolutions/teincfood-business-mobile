// @ts-nocheck
import { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from '@tamagui/lucide-icons';
import { FoodCard, RestaurantCard } from '@/components/home';
import { BackButton } from '@/components/ui';
import { useFavoritesStore } from '@/stores/favorites.store';
import { useSavedCatalogQuery } from '@/services/saved.service';
import { FoodCardSkeleton, RestaurantCardSkeleton } from '@/components/ui';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const savedFoodIds = useFavoritesStore((state) => state.savedFoodIds);
  const savedRestaurantIds = useFavoritesStore((state) => state.savedRestaurantIds);
  const { data: savedCatalog, isLoading } = useSavedCatalogQuery(savedFoodIds, savedRestaurantIds);

  const savedFoods = savedCatalog?.foods || [];
  const savedRestaurants = savedCatalog?.restaurants || [];

  const hasSavedItems = savedFoods.length > 0 || savedRestaurants.length > 0;

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
      <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Saved
        </Text>
      </XStack>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <YStack paddingBottom="$10" gap="$6" paddingHorizontal="$5">
          {isLoading ? (
            <YStack gap="$6">
              <YStack gap="$4">
                <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                  Restaurants
                </Text>
                <YStack gap="$4">
                  {[1, 2].map((key) => <RestaurantCardSkeleton key={key} />)}
                </YStack>
              </YStack>
              <YStack gap="$4">
                <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                  Dishes
                </Text>
                <XStack flexWrap="wrap" justifyContent="space-between" gap="$4">
                  {[1, 2, 3, 4].map((key) => (
                    <YStack key={key} width="47%">
                      <FoodCardSkeleton />
                    </YStack>
                  ))}
                </XStack>
              </YStack>
            </YStack>
          ) : !hasSavedItems ? (
            <YStack alignItems="center" gap="$3" marginTop="$10">
              <Heart size={48} color="$gray200" />
              <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                No favorites yet
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
                Tap the heart icon on any dish or restaurant to save them here for later.
              </Text>
            </YStack>
          ) : (
            <YStack gap="$6">
              
              {/* Saved Restaurants */}
              {savedRestaurants.length > 0 && (
                <YStack gap="$4">
                  <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                    Restaurants
                  </Text>
                  <YStack gap="$4">
                    {savedRestaurants.map(rest => (
                      <RestaurantCard key={rest.id} restaurant={rest} />
                    ))}
                  </YStack>
                </YStack>
              )}

              {/* Saved Foods */}
              {savedFoods.length > 0 && (
                <YStack gap="$4">
                  <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                    Dishes
                  </Text>
                  <XStack flexWrap="wrap" justifyContent="space-between" gap="$4">
                    {savedFoods.map(food => (
                      <YStack key={food.id} width="47%">
                        <FoodCard food={food} width="100%" marginRight={0} />
                      </YStack>
                    ))}
                  </XStack>
                </YStack>
              )}

            </YStack>
          )}

        </YStack>
      </ScrollView>
    </YStack>
  );
}
