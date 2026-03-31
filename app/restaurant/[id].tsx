// @ts-nocheck
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, XStack, Text, Image, Separator, Input as TInput } from 'tamagui';
import { Star, Truck, Clock, Search, X } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, Button } from '@/components/ui';
import { FoodCard } from '@/components/home/FoodCard';
import { useRef, useState } from 'react';
import { useRestaurantStorefrontQuery } from '@/services/restaurants.service';

export default function RestaurantStorefrontScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<any>(null);
  const restaurantId = Array.isArray(id) ? id[0] : id;
  const { data: storefront } = useRestaurantStorefrontQuery(restaurantId || '', searchQuery);
  const seller = storefront?.seller;
  const menuItems = storefront?.menuItems || [];

  if (!seller) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} backgroundColor="$background">
        
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 110, 140) }}
      >
        
        {/* Parallax / Hero Header */}
        <YStack height={260} width="100%" position="relative">
          <Image 
            source={{ uri: seller.avatarUrl || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&fit=crop' }}
            width="100%"
            height="100%"
            objectFit="cover"
          />
          {/* Top Bar Floating Buttons */}
          <XStack position="absolute" top={Math.max(insets.top, 50)} left="$5" right="$5" zIndex={10} justifyContent="space-between" alignItems="center">
             <BackButton />
             <Button
               width={44}
               height={44}
               circular
               variant="ghost"
               backgroundColor="$background"
               padding={0}
               onPress={() => searchInputRef.current?.focus()}
             >
               <Search size={20} color="$color" />
             </Button>
          </XStack>
        </YStack>

        {/* Storefront Content */}
        <YStack 
          flex={1} 
          backgroundColor="$background" 
          marginTop={-30} 
          borderTopLeftRadius="$8" 
          borderTopRightRadius="$8"
          padding="$5"
          gap="$6"
        >
          {/* Header Info */}
          <YStack gap="$2" alignItems="center" marginTop={-40}>
            <Image 
              source={{ uri: seller.avatarUrl }} 
              width={80} 
              height={80} 
              borderRadius="$full" 
              borderWidth={4} 
              borderColor="$background"
            />
            <Text fontSize="$8" fontWeight="800" fontFamily="$heading" color="$color" textAlign="center">
              {seller.fullName}
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" textAlign="center">
              {seller.bio || 'Premium Food Partner'}
            </Text>
          </YStack>

          {/* Meta Info Row */}
          <XStack justifyContent="center" alignItems="center" gap="$5">
            <XStack alignItems="center" gap="$1">
              <Star size={16} color="$starOrange" fill="#FF9633" />
              <Text fontSize="$3" fontWeight="800" fontFamily="$body" color="$color">4.8 <Text fontWeight="400" color="$colorSecondary">(120+)</Text></Text>
            </XStack>
            
            <XStack alignItems="center" gap="$1.5">
              <Truck size={16} color="$primary" />
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Free</Text>
            </XStack>

            <XStack alignItems="center" gap="$1.5">
              <Clock size={16} color="$primary" />
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">25-30 Min</Text>
            </XStack>
          </XStack>

          <Separator marginVertical="$2" borderColor="$borderColor" />

          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
              Search Menu
            </Text>
            <XStack
              alignItems="center"
              backgroundColor="$backgroundStrong"
              borderRadius="$4"
              paddingHorizontal="$4"
              height={56}
              gap="$2"
            >
              <Search size={18} color="$colorSecondary" />
              <TInput
                ref={searchInputRef}
                flex={1}
                minWidth={0}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search dishes, categories, ingredients..."
                backgroundColor="transparent"
                color="$color"
                borderWidth={0}
                height={56}
                fontFamily="$body"
                fontSize="$4"
                paddingHorizontal="$0"
                placeholderTextColor="$colorPlaceholder"
                focusStyle={{ borderWidth: 0, backgroundColor: 'transparent' }}
              />
              {searchQuery.length > 0 && (
                <Button
                  width={30}
                  height={30}
                  circular
                  variant="ghost"
                  backgroundColor="transparent"
                  padding={0}
                  onPress={() => setSearchQuery('')}
                >
                  <X size={16} color="$colorSecondary" />
                </Button>
              )}
            </XStack>
          </YStack>

          {/* Menu Items */}
          <YStack gap="$4">
             <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
               Full Menu
             </Text>
             
             {menuItems.length > 0 ? (
               <XStack flexWrap="wrap" justifyContent="space-between" gap="$4">
                 {menuItems.map(food => (
                   <YStack key={food.id} width="47%">
                     <FoodCard food={food} width="100%" marginRight={0} />
                    </YStack>
                 ))}
               </XStack>
             ) : (
               <YStack alignItems="center" padding="$5" gap="$2" backgroundColor="$backgroundStrong" borderRadius="$5">
                 <Text color="$colorSecondary" fontFamily="$body" textAlign="center">
                   {searchQuery.trim() ? `No menu items match "${searchQuery}".` : 'No items listed yet.'}
                 </Text>
               </YStack>
             )}
          </YStack>

        </YStack>
      </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}
