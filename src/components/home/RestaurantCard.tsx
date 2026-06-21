// @ts-nocheck
import { useRouter } from 'expo-router';
import { Card, Image, Text, XStack, YStack } from 'tamagui';
import { MapPin, Clock, Star, Heart } from '@tamagui/lucide-icons';
import { User } from '@/types/user.model';
import { useFavoritesStore } from '@/stores/favorites.store';
import { Button } from '@/components/ui';

interface RestaurantCardProps {
  restaurant: User; // The chef
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const router = useRouter();
  const toggleRestaurant = useFavoritesStore((state) => state.toggleRestaurant);
  const isSaved = useFavoritesStore((state) => state.isRestaurantSaved(restaurant.id));

  // Placeholder static values - in a real app these come from the model
  const mockRating = "4.8";
  const mockDeliveryTime = "20 min";
  const mockTags = ["Burger", "Pizza"];
  const mockCoverImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop';

  return (
    <Card 
      elevate 
      width="100%" 
      backgroundColor="$backgroundStrong" 
      borderRadius="$5"
      marginBottom="$4"
      animation="bouncy"
      pressStyle={{ scale: 0.98 }}
      onPress={() => {
        router.push(`/restaurant/${restaurant.id}`);
      }}
    >
      <Card.Header padding={0} position="relative">
        <Image 
          source={{ uri: mockCoverImage }}
          width="100%"
          height={140}
          borderTopLeftRadius="$5"
          borderTopRightRadius="$5"
          objectFit="cover"
        />
        <Button 
          position="absolute"
          top="$3"
          right="$3"
          circular
          width={40}
          height={40}
          padding={0}
          backgroundColor="$background"
          onPress={(e) => {
            e.stopPropagation();
            toggleRestaurant(restaurant.id);
          }}
          icon={<Heart size={20} color={isSaved ? '$red' : '$colorSecondary'} fill={isSaved ? '$red' : 'transparent'} />}
        />
        
        {/* Rating Overlay */}
        <XStack 
          position="absolute" 
          top="$3" 
          left="$3" 
          backgroundColor="$background" 
          paddingHorizontal="$2" 
          paddingVertical="$1" 
          borderRadius="$full"
          alignItems="center"
          gap="$1"
        >
          <Star size={12} color="$starOrange" fill="#FF9633" />
          <Text fontSize="$2" fontWeight="700" fontFamily="$body" color="$color">{mockRating}</Text>
        </XStack>
      </Card.Header>
      
      <YStack padding="$3" gap="$1">
        <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color" numberOfLines={1}>
          Restaurant by {restaurant.fullName}
        </Text>
        
        <XStack alignItems="center" gap="$3" marginTop="$1">
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" numberOfLines={1}>
            {mockTags.join(' • ')}
          </Text>
        </XStack>
        
        <XStack alignItems="center" gap="$4" marginTop="$2">
          <XStack alignItems="center" gap="$1.5">
            <Clock size={16} color="$colorSecondary" />
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">{mockDeliveryTime}</Text>
          </XStack>
          
          <XStack alignItems="center" gap="$1.5">
            <MapPin size={16} color="$colorSecondary" />
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">Free Delivery</Text>
          </XStack>
        </XStack>
      </YStack>
    </Card>
  );
}
