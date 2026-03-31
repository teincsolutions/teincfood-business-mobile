// @ts-nocheck
import { useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui';
import { FoodCard, RestaurantCard } from '@/components/home';
import { useResultsQuery } from '@/services/results.service';

/**
 * Results Screen (Global Stack)
 * Replicated layout from saved/index.tsx as requested.
 */
export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const { type, title } = useLocalSearchParams<{ type: string; title: string }>();
  const resultType = type || 'foods';
  const { data } = useResultsQuery(resultType);
  const foods = data?.foods || [];
  const restaurants = data?.restaurants || [];

  const isRestaurants = resultType === 'restaurants';

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <YStack paddingTop={Math.max(insets.top, 50)} paddingBottom="$10" gap="$6" paddingHorizontal="$5">
          
          {/* Header */}
          <XStack alignItems="center" gap="$3">
            <BackButton />
            <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
              {title || 'Results'}
            </Text>
          </XStack>

          <YStack gap="$6">
            
            {isRestaurants ? (
              <YStack gap="$4">
                <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                  Restaurants
                </Text>
                <YStack gap="$4">
                  {restaurants.map(rest => (
                    <RestaurantCard key={rest.id} restaurant={rest} width="100%" />
                  ))}
                </YStack>
              </YStack>
            ) : (
              <YStack gap="$4">
                <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                  Dishes
                </Text>
                <XStack flexWrap="wrap" justifyContent="space-between" gap="$4">
                  {foods.map(food => (
                    <YStack key={food.id} width="47%">
                      <FoodCard food={food} width="100%" marginRight={0} />
                    </YStack>
                  ))}
                </XStack>
              </YStack>
            )}

          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
