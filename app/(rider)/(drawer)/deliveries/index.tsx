// @ts-nocheck
import { TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { YStack, Text, Card, XStack, Separator } from 'tamagui';
import { Truck, MapPin, Filter, ChevronRight, Package } from '@tamagui/lucide-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useRiderDeliveriesQuery } from '@/hooks/useRider';

export default function RiderDeliveries() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    data: deliveries = [],
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRiderDeliveriesQuery();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up': return '#3498db';
      case 'delivering': return '#f39c12';
      case 'delivered': return '$success';
      default: return '#95a5a6';
    }
  };

  const renderDelivery = ({ item: delivery }) => (
    <Card padding="$4" bordered marginBottom="$3">
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="800" fontFamily="$heading">
            {delivery.orderId}
          </Text>
          <YStack
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius="$10"
            backgroundColor={getStatusColor(delivery.status)}
          >
            <Text color="white" fontSize="$2" fontFamily="$body" textTransform="capitalize">
              {delivery.status.replace('_', ' ')}
            </Text>
          </YStack>
        </XStack>

        <YStack gap="$2">
          <XStack gap="$2" alignItems="center">
            <MapPin size={14} color="$primary" />
            <Text fontSize="$3" fontFamily="$body" color="$color">
              Pickup: {delivery.pickup}
            </Text>
          </XStack>
          <XStack gap="$2" alignItems="center">
            <Truck size={14} color="$success" />
            <Text fontSize="$3" fontFamily="$body" color="$color">
              Dropoff: {delivery.dropoff}
            </Text>
          </XStack>
        </YStack>

        <Separator />

        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$success">
            +{delivery.currency} {delivery.earnings.toFixed(2)}
          </Text>
          <Button
            variant="ghost"
            width="auto"
            paddingHorizontal="$3"
            onPress={() => router.push(`/(rider)/deliveries/${delivery.id}`)}
          >
            <XStack gap="$1" alignItems="center">
              <Text fontSize="$3" fontFamily="$body" fontWeight="600" color="$primary">
                View Details
              </Text>
              <ChevronRight size={14} color="$primary" />
            </XStack>
          </Button>
        </XStack>
      </YStack>
    </Card>
  );

  const ListEmptyComponent = () => (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$10" paddingTop="$20">
      <Package size={80} color="$gray200" />
      <Text fontSize="$6" fontWeight="700" fontFamily="$heading" marginTop="$4" color="$color">
        No deliveries yet
      </Text>
      <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" marginTop="$2" textAlign="center">
        Your delivery assignments will appear here once you start receiving orders.
      </Text>
    </YStack>
  );

  const ListFooterComponent = () => (
    isFetchingNextPage ? (
      <YStack padding="$4" alignItems="center">
        <Text fontSize="$3" color="$colorSecondary">Loading more...</Text>
      </YStack>
    ) : null
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <XStack gap="$3" alignItems="center">
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Text fontSize={22}>☰</Text>
          </TouchableOpacity>
          <Text fontSize="$7" fontWeight="800" fontFamily="$heading" color="$color">
            Deliveries
          </Text>
        </XStack>
        <Button
          variant="outline"
          height={40}
          width="auto"
          paddingHorizontal="$3"
          onPress={() => {
            alert('Filter options:\n• All Deliveries\n• Active Only\n• Completed Only\n• Today Only');
          }}
        >
          <XStack gap="$1" alignItems="center">
            <Filter size={15} />
            <Text fontSize="$3" fontFamily="$body" fontWeight="600">Filter</Text>
          </XStack>
        </Button>
      </XStack>

      <FlatList
        data={deliveries}
        keyExtractor={(item) => item.id}
        renderItem={renderDelivery}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 16,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />
    </YStack>
  );
}
