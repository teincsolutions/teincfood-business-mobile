// @ts-nocheck
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text } from 'tamagui';
import { ShoppingBag, MapPin, ChevronDown, Search } from "@tamagui/lucide-icons";
import { Input, Button } from '@/components/ui';
import { CategoryPill, FoodCard, RestaurantCard } from '@/components/home';
import { Skeleton, FoodCardSkeleton, RestaurantCardSkeleton } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useCartStore } from '@/stores/cart.store';
import { useLocationStore } from '@/stores/location.store';
import { useAddressesQuery } from '@/services/address.service';
import { useHomeFeedQuery } from '@/services/home.service';

const CATEGORIES = ['All', 'Hot Dog', 'Burger', 'Pizza', 'Snacks', 'Drink'];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const cartItems = useCartStore((state) => state.items);
  const currentLocation = useLocationStore((state) => state.currentLocation);
  const isAuthenticated = Boolean(user && accessToken);
  const { data: addressesData } = useAddressesQuery(isAuthenticated);
  const addresses = addressesData || [];
  const defaultAddress = useMemo(() => addresses.find(a => a.isDefault) || addresses[0], [addresses]);

  const cartItemCount = useMemo(() => cartItems.reduce((t, i) => t + i.quantity, 0), [cartItems]);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: homeFeed, isLoading } = useHomeFeedQuery(activeCategory);
  const popularFoods = useMemo(() => (homeFeed?.foods || []).slice(0, 5), [homeFeed]);
  const restaurants = homeFeed?.restaurants || [];

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        <YStack padding="$5" paddingTop={Math.max(insets.top, 20)} paddingBottom="$10" gap="$6">
          
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$3" alignItems="center">
              <YStack pressStyle={{ opacity: 0.7 }} onPress={() => router.push('/profile/addresses')}>
                <Text fontSize="$2" color="$primary" fontWeight="700" textTransform="uppercase" fontFamily="$body">
                  Deliver to
                </Text>
                <XStack alignItems="center" gap="$1">
                  <Text fontSize="$4" fontWeight="600" color="$colorSecondary" fontFamily="$body">
                    {defaultAddress?.label || defaultAddress?.street || currentLocation?.area || 'Set Location'}
                  </Text>
                  <ChevronDown size={16} color="$colorSecondary" />
                </XStack>
              </YStack>
            </XStack>

            <YStack position="relative">
              <Button 
                variant="ghost" 
                circular
                backgroundColor="$navy"
                icon={<ShoppingBag size={20} color="white" />} 
                onPress={() => router.push('/cart')}
              />
              {cartItemCount > 0 && (
                <YStack 
                  position="absolute" 
                  top={-4} 
                  right={-4} 
                  backgroundColor="$primary" 
                  width={20} 
                  height={20} 
                  borderRadius="$full"
                  justifyContent="center"
                  alignItems="center"
                  borderWidth={2}
                  borderColor="$background"
                >
                  <Text fontSize={10} fontWeight="800" color="white" fontFamily="$body">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </Text>
                </YStack>
              )}
            </YStack>
          </XStack>

          {/* Greeting */}
          <XStack>
            <Text fontSize="$8" fontWeight="500" fontFamily="$body" color="$color">
              Hey {user?.fullName?.split(' ')[0] || 'Guest'},{' '}
              <Text fontWeight="800" fontFamily="$heading">Good Afternoon!</Text>
            </Text>
          </XStack>

          {/* Search */}
          <XStack 
            alignItems="center" 
            backgroundColor="$backgroundSoft" 
            borderRadius="$4" 
            paddingHorizontal="$4" 
            height={56}
            pressStyle={{ opacity: 0.7 }}
            onPress={() => router.push('/search')}
          >
            <Search size={20} color="$colorSecondary" />
            <Text 
              flex={1} 
              color="$colorSecondary" 
              fontFamily="$body" 
              fontSize="$4" 
              marginLeft="$2"
            >
              Search dishes, restaurants
            </Text>
          </XStack>

          {/* Categories */}
          <YStack gap="$3" marginTop="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                All Categories
              </Text>
              <Text 
                fontSize="$3" 
                color="$colorSecondary" 
                fontFamily="$body"
                onPress={() => router.push({ pathname: '/results', params: { type: 'categories', title: 'All Categories' }})}
              >
                See All
              </Text>
            </XStack>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
              <XStack gap="$3" paddingRight="$8">
                {CATEGORIES.map(cat => (
                  <CategoryPill 
                    key={cat} 
                    label={cat} 
                    isActive={activeCategory === cat} 
                    onPress={() => setActiveCategory(cat)} 
                  />
                ))}
              </XStack>
            </ScrollView>
          </YStack>

          {/* Popular Food */}
          <YStack gap="$3" marginTop="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                Popular Food
              </Text>
              <Text 
                fontSize="$3" 
                color="$colorSecondary" 
                fontFamily="$body"
                onPress={() => router.push({ pathname: '/results', params: { type: 'foods', title: 'Popular Food' }})}
              >
                See All
              </Text>
            </XStack>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
              <XStack gap="$4" paddingRight="$8" paddingBottom="$4" paddingTop="$2">
                {isLoading 
                  ? [1, 2, 3].map(i => <FoodCardSkeleton key={`food-skel-${i}`} />)
                  : popularFoods.map(food => (
                      <FoodCard key={food.id} food={food} />
                    ))
                }
              </XStack>
            </ScrollView>
          </YStack>

          {/* Open Restaurants */}
          <YStack gap="$3" marginTop="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                Open Restaurants
              </Text>
              <Text 
                fontSize="$3" 
                color="$colorSecondary" 
                fontFamily="$body"
                onPress={() => router.push({ pathname: '/results', params: { type: 'restaurants', title: 'Open Restaurants' }})}
              >
                See All
              </Text>
            </XStack>

            <YStack gap="$4" paddingTop="$2">
              {isLoading
                ? [1, 2, 3].map(i => <RestaurantCardSkeleton key={`rest-skel-${i}`} />)
                : restaurants.map(rest => (
                    <RestaurantCard key={rest.id} restaurant={rest} />
                  ))
              }
            </YStack>
          </YStack>

        </YStack>
      </ScrollView>
    </YStack>
  );
}
