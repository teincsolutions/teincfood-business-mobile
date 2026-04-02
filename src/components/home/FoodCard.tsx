// @ts-nocheck
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Card, Image, Text, XStack, YStack, Button } from 'tamagui';
import { Heart, Plus } from '@tamagui/lucide-icons';
import { Food } from '@/models/food.model';
import { formatCurrency } from '@/utils/formatCurrency';
import { useFavoritesStore } from '@/stores/favorites.store';
import { AppAlertDialog } from '@/components/ui';

interface FoodCardProps {
  food: Food;
  width?: number | string;
  marginRight?: number | string;
}

export function FoodCard({ food, width, marginRight = '$4' }: FoodCardProps) {
  const router = useRouter();
  const toggleFood = useFavoritesStore((state) => state.toggleFood);
  const isSaved = useFavoritesStore((state) => state.isFoodSaved(food.id));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState({ title: '', description: '' });

  const handleFavoritePress = (e: any) => {
    e.stopPropagation();
    const willBeSaved = !isSaved;
    
    // Toggle first for immediate UI heart change
    toggleFood(food.id);
    
    setDialogConfig({
      title: willBeSaved ? 'Added to Favorites' : 'Removed from Favorites',
      description: willBeSaved 
        ? `${food.name} has been added to your favorites list.`
        : `${food.name} has been removed from your favorites list.`
    });
    setDialogOpen(true);
  };

  return (
    <Card 
      elevate 
      width={width} 
      backgroundColor="$backgroundStrong" 
      borderRadius="$5"
      marginRight={marginRight}
      animation="bouncy"
      pressStyle={{ scale: 0.98 }}
      onPress={() => router.push(`/(buyer)/(home)/food/${food.id}`)}
    >
      <Card.Header padding={0} position="relative">
        <Image 
          source={{ uri: food.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop' }}
          width="100%"
          height={120}
          borderTopLeftRadius="$5"
          borderTopRightRadius="$5"
          objectFit="cover"
        />
        <Button 
          position="absolute"
          top="$2"
          right="$2"
          circular
          width={40}
          height={40}
          padding={0}
          backgroundColor="$background"
          onPress={handleFavoritePress}
          icon={<Heart size={18} color={isSaved ? '$red' : '$colorSecondary'} fill={isSaved ? '$red' : 'transparent'} />}
        />
      </Card.Header>
      
      <YStack padding="$3" gap="$1">
        <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color" numberOfLines={1}>
          {food.name}
        </Text>
        <Text fontSize="$2" color="$colorSecondary" fontFamily="$body" numberOfLines={1}>
          {food.chefName}
        </Text>
        
        <XStack justifyContent="space-between" alignItems="center" marginTop="$2">
          <Text fontSize="$4" fontWeight="800" fontFamily="$body" color="$primary">
            {formatCurrency(food.price)}
          </Text>
          
          <Button 
            variant="primary" 
            circular 
            size="$2" 
            backgroundColor="$primary"
            icon={<Plus size={16} color="white" />} 
          />
        </XStack>
      </YStack>

      <AppAlertDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogConfig.title}
        description={dialogConfig.description}
        icon={Heart}
        onConfirm={() => setDialogOpen(false)}
      />
    </Card>
  );
}
