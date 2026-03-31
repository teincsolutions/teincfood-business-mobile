// @ts-nocheck
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text, Image, Separator, Checkbox, Label } from 'tamagui';
import { Star, Truck, Clock, Minus, Plus, Check } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton, Button, AppAlertDialog } from '@/components/ui';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCartStore } from '@/stores/cart.store';
import { useEffect, useState } from 'react';
import { useFoodByIdQuery } from '@/services/foods.service';
import type { FoodAddon } from '@/models/food.model';

export default function FoodDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<FoodAddon[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const foodId = Array.isArray(id) ? id[0] : id;
  const { data: foodData } = useFoodByIdQuery(foodId || '');
  const food = foodData;

  useEffect(() => {
    if (!food) return;
    const defaultSizeId = food.sizeOptions?.[0]?.id || null;
    setSelectedSizeId(defaultSizeId);
    setSelectedAddons([]);
  }, [food?.id, food?.sizeOptions]);

  const toggleAddon = (addon: FoodAddon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  if (!food) {
    return null;
  }

  const selectedSizeOption = food.sizeOptions?.find((option) => option.id === selectedSizeId) || null;
  const effectiveUnitPrice = selectedSizeOption?.price ?? food.price;
  const selectedSizeLabel = selectedSizeOption?.label;
  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const totalPrice = (effectiveUnitPrice + addonsTotal) * quantity;

  const handleAddToCart = () => {
    addItem(food, quantity, selectedSizeLabel, effectiveUnitPrice, selectedAddons);
    setDialogOpen(true);
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100+insets.bottom }}>
        
        {/* Parallax / Hero Header */}
        <YStack height={320} width="100%" position="relative">
          <Image 
            source={{ uri: food.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop' }}
            width="100%"
            height="100%"
            objectFit="cover"
          />
          {/* Top Bar Floating Buttons */}
          <XStack position="absolute" top={Math.max(insets.top, 50)} left="$5" right="$5" zIndex={10}>
             <BackButton />
             {/* Right side favorite heart could go here */}
          </XStack>
        </YStack>

        {/* Content Container (overlaps image slightly) */}
        <YStack 
          flex={1} 
          backgroundColor="$background" 
          marginTop={-30} 
          borderTopLeftRadius="$8" 
          borderTopRightRadius="$8"
          padding="$5"
          gap="$6"
        >
          {/* Title & Restaurant Row */}
          <YStack gap="$1">
            <XStack justifyContent="space-between" alignItems="flex-start">
              <Text fontSize="$9" fontWeight="800" fontFamily="$heading" color="$color" flex={1}>
                {food.name}
              </Text>
            </XStack>
            <Text fontSize="$4" color="$primary" fontWeight="600" fontFamily="$body">
              Restaurant Name / Chef ID {food.restaurantId}
            </Text>
          </YStack>

          {/* Meta Info Row */}
          <XStack justifyContent="space-between" alignItems="center">
            <XStack alignItems="center" gap="$1">
              <Star size={18} color="$starOrange" fill="#FF9633" />
              <Text fontSize="$4" fontWeight="800" fontFamily="$body" color="$color">4.7</Text>
            </XStack>
            
            <XStack alignItems="center" gap="$1.5">
              <Truck size={18} color="$primary" />
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">Free Delivery</Text>
            </XStack>

            <XStack alignItems="center" gap="$1.5">
              <Clock size={18} color="$primary" />
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">20 Min</Text>
            </XStack>
          </XStack>

          <Text fontSize="$5" color="$colorSecondary" fontFamily="$body" lineHeight={24}>
            {food.description}
          </Text>

          <Separator marginVertical="$2" borderColor="$borderColor" />

          {food.sizeOptions?.length ? (
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                 <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">SIZE</Text>
              </XStack>
              
              <XStack flexWrap="wrap" gap="$2.5">
                {food.sizeOptions.map((sizeOption) => {
                  const isActive = selectedSizeId === sizeOption.id;
                  return (
                    <Button
                      key={sizeOption.id}
                      variant={isActive ? 'primary' : 'ghost'}
                      width="auto"
                      minWidth={0}
                      height={40}
                      paddingHorizontal="$4"
                      borderRadius="$10"
                      backgroundColor={isActive ? '$primary' : '$backgroundStrong'}
                      onPress={() => setSelectedSizeId(sizeOption.id)}
                    >
                      <Text color={isActive ? '$white' : '$color'} fontWeight={isActive ? '700' : '600'} fontSize="$3">
                        {sizeOption.label}
                      </Text>
                    </Button>
                  );
                })}
              </XStack>
            </YStack>
          ) : null}

          {food.addons?.length ? (
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">EXTRAS</Text>
              
              <YStack gap="$2">
                {food.addons.map((addon) => {
                  const isSelected = selectedAddons.some(a => a.id === addon.id);
                  return (
                    <XStack
                      key={addon.id}
                      alignItems="center"
                      justifyContent="space-between"
                      backgroundColor="$backgroundStrong"
                      borderRadius="$4"
                      padding="$4"
                      onPress={() => toggleAddon(addon)}
                      pressStyle={{ opacity: 0.8 }}
                    >
                      <XStack alignItems="center" gap="$4" flex={1}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleAddon(addon)}
                          width={28}
                          height={28}
                          backgroundColor={isSelected ? '$primary' : '$background'}
                          borderColor={isSelected ? '$primary' : '$borderColor'}
                          borderRadius="$3"
                        >
                          <Checkbox.Indicator justifyContent="center" alignItems="center">
                            <Check size={24} color="white" />
                          </Checkbox.Indicator>
                        </Checkbox>
                        <Label flex={1} onPress={() => toggleAddon(addon)}>
                          <Text fontSize="$5" fontWeight="600" color="$color">{addon.name}</Text>
                        </Label>
                      </XStack>
                      <Text fontSize="$5" fontWeight="700" color="$primary">+{formatCurrency(addon.price)}</Text>
                    </XStack>
                  );
                })}
              </YStack>
            </YStack>
          ) : null}

        </YStack>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <YStack 
        position="absolute" 
        bottom={0} 
        left={0} 
        right={0} 
        backgroundColor="$backgroundStrong" 
        borderTopLeftRadius="$6" 
        borderTopRightRadius="$6"
        paddingHorizontal="$5"
        paddingBottom={Math.max(insets.bottom, 20)}
        paddingTop="$4"
        shadowColor="$shadowColor"
        shadowOpacity={0.05}
        shadowRadius={10}
      >
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
             <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textTransform="uppercase">PRICE</Text>
             <Text fontSize={28} fontWeight="800" fontFamily="$body" color="$color">{formatCurrency(totalPrice)}</Text>
          </YStack>
          
          <XStack alignItems="center" gap="$3" flex={1} justifyContent="flex-end">
            <XStack
              alignItems="center"
              backgroundColor="$background"
              borderRadius="$full"
              paddingHorizontal="$1.5"
              paddingVertical="$1.5"
              gap="$1.5"
              flexShrink={0}
            >
              <Button
                width={36}
                height={36}
                circular
                variant="ghost"
                backgroundColor="$backgroundSoft"
                padding={0}
                icon={<Minus size={16} color="$color" />}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              />
              <Text fontSize="$5" fontWeight="700" color="$color" fontFamily="$body" minWidth={24} textAlign="center">
                {quantity}
              </Text>
              <Button
                width={36}
                height={36}
                circular
                variant="ghost"
                backgroundColor="$backgroundSoft"
                padding={0}
                icon={<Plus size={16} color="$color" />}
                onPress={() => setQuantity(quantity + 1)}
              />
            </XStack>
            
            <Button
              variant="primary"
              flex={1}
              minWidth={0}
              maxWidth={136}
              height={52}
              onPress={handleAddToCart}
            >
              <Text fontSize="$3" fontWeight="700" color="white">
                ADD TO CART
              </Text>
            </Button>
          </XStack>
        </XStack>
      </YStack>

      <AppAlertDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Added to Cart"
        description={`${food.name}${selectedSizeLabel ? ` (${selectedSizeLabel})` : ''}${selectedAddons.length ? ` + ${selectedAddons.map(a => a.name).join(', ')}` : ''} x${quantity} was added to your cart.`}
        icon={Plus}
        confirmText="VIEW CART"
        onConfirm={() => {
          setDialogOpen(false);
          router.push('/cart');
        }}
      />
    </YStack>
  );
}
