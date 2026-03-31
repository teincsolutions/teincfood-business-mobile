// @ts-nocheck
import { YStack, Text, Card, Button, XStack, Separator } from 'tamagui';
import { UtensilsCrossed, Plus, Edit3, Trash2, Eye, EyeOff } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';

/**
 * Seller Menu Screen
 */
export default function SellerMenu() {
  const menuItems = [
    { id: '1', name: 'Jollof Rice', price: 25.00, category: 'Main', available: true, image: null },
    { id: '2', name: 'Banku & Tilapia', price: 45.00, category: 'Main', available: true, image: null },
    { id: '3', name: 'Waakye', price: 20.00, category: 'Main', available: false, image: null },
    { id: '4', name: 'Kelewele', price: 10.00, category: 'Snacks', available: true, image: null },
    { id: '5', name: 'Grilled Chicken', price: 35.00, category: 'Protein', available: true, image: null },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack padding="$4" justifyContent="space-between" alignItems="center">
        <Text fontSize="$6" fontWeight="bold">Menu</Text>
        <Button size="$3" icon={<Plus size={18} />}>Add Item</Button>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$3">
          {menuItems.map((item) => (
            <Card key={item.id} padding="$4" bordered opacity={item.available ? 1 : 0.6}>
              <XStack gap="$4" alignItems="center">
                <YStack
                  width={60}
                  height={60}
                  backgroundColor="$gray5"
                  borderRadius="$3"
                  alignItems="center"
                  justifyContent="center"
                >
                  <UtensilsCrossed size={24} color="$colorMuted" />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Text fontWeight="bold">{item.name}</Text>
                  <Text color="$colorMuted" fontSize="$3">{item.category}</Text>
                  <Text fontWeight="bold" color="$primary">GHS {item.price.toFixed(2)}</Text>
                </YStack>
                <XStack gap="$2">
                  <Button size="$2" circular icon={<Edit3 size={16} />} />
                  <Button
                    size="$2"
                    circular
                    icon={item.available ? <Eye size={16} /> : <EyeOff size={16} />}
                  />
                  <Button size="$2" circular icon={<Trash2 size={16} />} />
                </XStack>
              </XStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}