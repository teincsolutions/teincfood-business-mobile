// @ts-nocheck
import { Card, Image, Text, XStack, YStack, Button } from 'tamagui';
import { Minus, Plus, Trash2 } from '@tamagui/lucide-icons';
import { useCartStore, type CartItem } from '@/stores/cart.store';
import { formatCurrency } from '@/utils/formatCurrency';

interface CartItemCardProps {
  item: CartItem;
}

export function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const addonsText = item.selectedAddons?.map(a => a.name).join(', ');

  return (
    <Card 
      elevate 
      width="100%" 
      backgroundColor="$backgroundStrong" 
      borderRadius="$5"
      marginBottom="$3"
      flexDirection="row"
      padding="$3"
      alignItems="center"
    >
      <Image 
        source={{ uri: item.food?.imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop' }}
        width={80}
        height={80}
        borderRadius="$4"
        objectFit="cover"
      />
      
      <YStack flex={1} marginLeft="$3" justifyContent="space-between" minHeight={80}>
        <YStack>
          <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color" numberOfLines={1}>
            {item.food?.name}
          </Text>
          {item.size && (
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              Size: {item.size}
            </Text>
          )}
          {addonsText && (
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body" numberOfLines={1}>
              + {addonsText}
            </Text>
          )}
        </YStack>
        
        <XStack justifyContent="space-between" alignItems="center" marginTop="$1">
          <Text fontSize="$5" fontWeight="800" fontFamily="$body" color="$primary">
            {formatCurrency(item.price * item.quantity)}
          </Text>

          <XStack
            alignItems="center"
            backgroundColor="$backgroundSoft"
            borderRadius="$full"
            paddingHorizontal="$1.5"
            paddingVertical="$1.5"
            gap="$1.5"
          >
            <Button 
              width={36}
              height={36}
              circular 
              variant="ghost" 
              backgroundColor="$background"
              padding={0}
              icon={item.quantity === 1 ? <Trash2 size={16} color="$red" /> : <Minus size={16} color="$color" />}
              onPress={() => item.quantity === 1 ? removeItem(item.cartItemId) : updateQuantity(item.cartItemId, item.quantity - 1)}
            />
            <Text fontSize="$4" fontWeight="700" color="$color" fontFamily="$body" minWidth={20} textAlign="center">
              {item.quantity}
            </Text>
            <Button 
              width={36}
              height={36}
              circular 
              variant="ghost" 
              backgroundColor="$background"
              padding={0}
              icon={<Plus size={16} color="$color" />}
              onPress={() => updateQuantity(item.cartItemId, item.quantity + 1)}
            />
          </XStack>
        </XStack>
      </YStack>
    </Card>
  );
}
