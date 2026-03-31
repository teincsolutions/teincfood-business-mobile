// @ts-nocheck
import { YStack, Text, Card, Button, XStack } from 'tamagui';
import { UtensilsCrossed, Plus, Edit3, Trash2, Eye, EyeOff } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Seller Menu Screen
 */
export default function SellerMenu() {
  const insets = useSafeAreaInsets();
  const menuItems = [
    { id: '1', name: 'Jollof Rice', price: 25.00, category: 'Main', available: true, image: null },
    { id: '2', name: 'Banku & Tilapia', price: 45.00, category: 'Main', available: true, image: null },
    { id: '3', name: 'Waakye', price: 20.00, category: 'Main', available: false, image: null },
    { id: '4', name: 'Kelewele', price: 10.00, category: 'Snacks', available: true, image: null },
    { id: '5', name: 'Grilled Chicken', price: 35.00, category: 'Protein', available: true, image: null },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        justifyContent="space-between"
        alignItems="center"
      >
        <Text fontSize="$6" fontWeight="bold">Menu</Text>
        <XStack
          height={40}
          paddingHorizontal="$3"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$3"
          alignItems="center"
          gap="$2"
          pressStyle={{ opacity: 0.7 }}
        >
          <Plus size={16} color="$color" />
          <Text fontFamily="$body" fontWeight="600" fontSize="$3">Add Item</Text>
        </XStack>
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
                  <XStack
                    width={36} height={36} borderRadius="$10"
                    backgroundColor="$backgroundSoft" borderWidth={1} borderColor="$borderColor"
                    alignItems="center" justifyContent="center" pressStyle={{ opacity: 0.7 }}
                  >
                    <Edit3 size={16} color="$color" />
                  </XStack>
                  <XStack
                    width={36} height={36} borderRadius="$10"
                    backgroundColor="$backgroundSoft" borderWidth={1} borderColor="$borderColor"
                    alignItems="center" justifyContent="center" pressStyle={{ opacity: 0.7 }}
                  >
                    {item.available ? <Eye size={16} color="$color" /> : <EyeOff size={16} color="$color" />}
                  </XStack>
                  <XStack
                    width={36} height={36} borderRadius="$10"
                    backgroundColor="$backgroundSoft" borderWidth={1} borderColor="$red8"
                    alignItems="center" justifyContent="center" pressStyle={{ opacity: 0.7 }}
                  >
                    <Trash2 size={16} color="$red10" />
                  </XStack>
                </XStack>
              </XStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}