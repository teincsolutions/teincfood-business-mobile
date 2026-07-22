// @ts-nocheck
import { useState, useCallback, useMemo, useRef } from 'react';
import { TouchableOpacity, FlatList, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { YStack, Text, Card, XStack, Separator, useMedia } from 'tamagui';
import {
  Truck,
  MapPin,
  Filter,
  Search,
  ChevronRight,
  Package,
  Clock,
  Navigation,
} from '@tamagui/lucide-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '@/components/ui';
import {
  useRiderDeliveriesQuery,
  useRiderProfileQuery,
  useAvailableOrdersQuery,
  useClaimOrderMutation,
} from '@/hooks/useRider';
import { useRiderDeliveryRealtimeUpdates } from '@/hooks/useRiderDeliveryRealtimeUpdates';

type FilterOption = 'all' | 'active' | 'completed';

const FILTER_OPTIONS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const ACTIVE_STATUSES = ['assigned', 'picked_up', 'en_route', 'arrived'];
const COMPLETED_STATUSES = ['delivered', 'cancelled', 'failed', 'returned'];

function formatDeliveryAddress(address: unknown): string {
  if (!address) return 'Customer';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const a = address as Record<string, unknown>;
    return (a.formattedAddress as string) || (a.street as string) || (a.address_line as string) || JSON.stringify(address);
  }
  return 'Customer';
}

export default function RiderDeliveries() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'available' | 'my_deliveries'>('my_deliveries');
  const [filter, setFilter] = useState<FilterOption>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const media = useMedia();
  const columns = media.md ? 2 : 1;

  const [refreshing, setRefreshing] = useState(false);
  const loadingMore = useRef(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !loadingMore.current) {
      loadingMore.current = true;
      fetchNextPage().finally(() => {
        loadingMore.current = false;
      });
    }
  }, [hasNextPage, fetchNextPage]);

  useRiderDeliveryRealtimeUpdates();

  const { data: profileData } = useRiderProfileQuery();
  const {
    data: deliveries = [],
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useRiderDeliveriesQuery(true, {
    q: searchQuery || undefined,
  });

  const isBusy = profileData?.status === 'offline';
  const { data: availableOrders = [] } = useAvailableOrdersQuery(!isBusy);
  const claimOrder = useClaimOrderMutation();

  const filteredDeliveries = useMemo(() => {
    switch (filter) {
      case 'active':
        return deliveries.filter((d) => ACTIVE_STATUSES.includes(d.status));
      case 'completed':
        return deliveries.filter((d) => COMPLETED_STATUSES.includes(d.status));
      default:
        return deliveries;
    }
  }, [deliveries, filter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up': return '#3498db';
      case 'en_route': return '#f39c12';
      case 'arrived': return '#2ecc71';
      case 'delivered': return '$success';
      default: return '#95a5a6';
    }
  };

  const getDeliveryEtaDisplay = (delivery) => {
    if (delivery.eta_minutes) {
      return `${delivery.eta_minutes} min`;
    }
    return '-- min';
  };

  const handleClaimOrder = useCallback((orderId: string) => {
    Alert.alert(
      'Claim Delivery',
      'Are you sure you want to accept this delivery?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: () => claimOrder.mutate(orderId),
        },
      ],
    );
  }, [claimOrder]);

  const handleShowOnMap = useCallback((order) => {
    router.push({
      pathname: '/(rider)/map',
      params: {
        pickupLat: order.business_lat,
        pickupLng: order.business_lng,
        dropoffLat: order.delivery_lat,
        dropoffLng: order.delivery_lng,
        orderId: order.order_id,
        orderNumber: order.order_number,
        pickupAddress: order.business_name || order.business_address,
        dropoffAddress: typeof order.delivery_address === 'string'
          ? order.delivery_address
          : order.delivery_address?.formattedAddress || 'Dropoff',
      },
    });
  }, [router]);

  const FilterSelector = () => (
    <YStack>
      <Button
        variant="outline"
        height={40}
        width="auto"
        paddingHorizontal="$3"
        onPress={() => setShowFilterMenu(!showFilterMenu)}
      >
        <XStack gap="$1" alignItems="center">
          <Filter size={15} />
          <Text fontSize="$3" fontFamily="$body" fontWeight="600">
            {FILTER_OPTIONS.find((o) => o.key === filter)?.label || 'Filter'}
          </Text>
        </XStack>
      </Button>

      {showFilterMenu ? (
        <YStack
          position="absolute"
          top={44}
          right={0}
          backgroundColor="$background"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={0.1}
          shadowRadius={8}
          elevation={8}
          zIndex={100}
          minWidth={160}
        >
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => {
                setFilter(opt.key);
                setShowFilterMenu(false);
              }}
            >
              <YStack
                paddingHorizontal="$4"
                paddingVertical="$3"
                backgroundColor={filter === opt.key ? '$backgroundSoft' : 'transparent'}
              >
                <Text
                  fontSize="$3"
                  fontFamily="$body"
                  fontWeight={filter === opt.key ? '700' : '400'}
                  color={filter === opt.key ? '$primary' : '$color'}
                >
                  {opt.label}
                </Text>
              </YStack>
            </TouchableOpacity>
          ))}
        </YStack>
      ) : null}
    </YStack>
  );

  const AvailableOrderCard = ({ order }: { order: any }) => (
    <Card padding="$4" bordered backgroundColor="$greenLight">
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center">
            <Package size={16} color="$success" />
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading" numberOfLines={1} ellipsis>
              {order.order_number}
            </Text>
          </XStack>
          <YStack backgroundColor="$success" paddingHorizontal="$3" paddingVertical="$1" borderRadius="$10">
            <Text color="white" fontSize="$2" fontFamily="$body">Ready</Text>
          </YStack>
        </XStack>

        <Text fontSize="$3" fontFamily="$body" color="$colorSecondary" numberOfLines={1} ellipsis>
          {order.business_name}
        </Text>

        <XStack gap="$3" alignItems="center">
          <MapPin size={14} color="$primary" />
          <YStack flex={1}>
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">{order.business_name}</Text>
            <Text fontSize="$3" fontFamily="$body" numberOfLines={1} ellipsis>{order.business_address || order.business_name}</Text>
          </YStack>
        </XStack>

        <XStack gap="$2" alignItems="center">
          <Truck size={14} color="$success" />
          <YStack flex={1}>
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">Dropoff</Text>
            <Text fontSize="$3" fontFamily="$body" numberOfLines={1} ellipsis>{formatDeliveryAddress(order.delivery_address)}</Text>
          </YStack>
        </XStack>

        <Separator />

        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$success">
            {order.currency} {((order.total_minor || 0) / 100).toFixed(2)}
          </Text>
          <XStack gap="$2">
            {order.business_lat && order.delivery_lat ? (
              <Button
                variant="outline"
                height={40}
                paddingHorizontal="$3"
                onPress={() => handleShowOnMap(order)}
              >
                <Navigation size={16} color="$primary" />
              </Button>
            ) : null}
            <Button
              height={40}
              backgroundColor="$primary"
              paddingHorizontal="$4"
              onPress={() => handleClaimOrder(order.order_id)}
              disabled={claimOrder.isPending}
            >
              <Text color="white" fontWeight="700" fontSize="$3">
                {claimOrder.isPending ? 'Claiming...' : 'Accept'}
              </Text>
            </Button>
          </XStack>
        </XStack>
      </YStack>
    </Card>
  );

  const renderDelivery = ({ item: delivery }) => (
    <YStack flex={1} px="$2" mb="$3">
      <Card padding="$4" bordered>
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading" numberOfLines={1} ellipsis>
              {delivery.order_number || 'Delivery'}
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
              <Text fontSize="$3" fontFamily="$body" color="$color" numberOfLines={1} ellipsis>
                Pickup: {delivery.pickup || 'Pickup location'}
              </Text>
            </XStack>

            {delivery.eta_minutes ? (
              <XStack gap="$2" alignItems="center">
                <Clock size={14} color="$colorMuted" />
                <Text fontSize="$3" fontFamily="$body" color="$colorSecondary">
                  ETA: {getDeliveryEtaDisplay(delivery)}
                </Text>
              </XStack>
            ) : null}

            <XStack gap="$2" alignItems="center">
              <Truck size={14} color="$success" />
              <Text fontSize="$3" fontFamily="$body" color="$color" numberOfLines={1} ellipsis>
                Dropoff: {delivery.dropoff || 'Dropoff location'}
              </Text>
            </XStack>
          </YStack>

          <Separator />

          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$success">
              +{delivery.currency || 'GHS'} {((delivery.earnings_minor || 0) / 100).toFixed(2)}
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
    </YStack>
  );

  const ListEmptyComponent = () => (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$10" paddingTop="$20">
      <Package size={80} color="$gray200" />
      <Text fontSize="$6" fontWeight="700" fontFamily="$heading" marginTop="$4" color="$color">
        {tab === 'available' ? 'No available deliveries' : 'No deliveries yet'}
      </Text>
      <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" marginTop="$2" textAlign="center">
        {tab === 'available'
          ? 'New delivery requests will appear here when available.'
          : filter !== 'all'
            ? 'No deliveries match this filter.'
            : 'Your delivery assignments will appear here once you start receiving orders.'}
      </Text>
    </YStack>
  );

  const ListFooterComponent = () => (
    hasNextPage ? (
      <YStack padding="$4" alignItems="center">
        <ActivityIndicator />
      </YStack>
    ) : null
  );

  const TabButton = ({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
      <YStack
        paddingVertical="$3"
        alignItems="center"
        borderBottomWidth={2}
        borderBottomColor={isActive ? '$primary' : 'transparent'}
      >
        <Text
          fontSize="$4"
          fontWeight={isActive ? '700' : '400'}
          fontFamily="$heading"
          color={isActive ? '$primary' : '$colorSecondary'}
        >
          {label}
        </Text>
      </YStack>
    </TouchableOpacity>
  );

  const TabBar = () => (
    <XStack paddingHorizontal="$4" backgroundColor="$background">
      <TabButton
        label={`Available${availableOrders.length > 0 ? ` (${availableOrders.length})` : ''}`}
        isActive={tab === 'available'}
        onPress={() => setTab('available')}
      />
      <TabButton
        label="My Deliveries"
        isActive={tab === 'my_deliveries'}
        onPress={() => setTab('my_deliveries')}
      />
    </XStack>
  );

  const ListHeaderComponent = () => (
    <YStack>
      {/* Header with drawer menu */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
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
      </XStack>
    </YStack>
  );

  const renderAvailableOrder = ({ item: order }) => (
    <YStack flex={1} px="$2" mb="$3">
      <AvailableOrderCard order={order} />
    </YStack>
  );

  const data = tab === 'available' ? availableOrders : filteredDeliveries;
  const renderItem = tab === 'available' ? renderAvailableOrder : renderDelivery;

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Fixed header outside FlatList */}
      <ListHeaderComponent />
      <TabBar />

      {/* Available tab — simple ordered list */}
      {tab === 'available' ? (
        <FlatList
          key={`grid-${columns}`}
          data={data}
          keyExtractor={(item) => item.order_id || item.id}
          numColumns={columns}
          renderItem={renderItem}
          ListEmptyComponent={ListEmptyComponent}
          ListFooterComponent={ListFooterComponent}
          columnWrapperStyle={columns > 1 ? { paddingHorizontal: 8 } : undefined}
          contentContainerStyle={{
            paddingHorizontal: columns > 1 ? 8 : 0,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
        />
      ) : (
        /* My Deliveries tab — search + filter + paginated list */
        <YStack flex={1}>
          {/* Search bar + filter */}
          <XStack paddingHorizontal="$4" paddingTop="$3" paddingBottom="$3" gap="$2" alignItems="center">
            <YStack flex={1} position="relative">
              <Input
                placeholder="Search by order number..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                paddingStart="$10"
              />
              <YStack position="absolute" left="$3" top={11}>
                <Search size={18} color="$colorMuted" />
              </YStack>
            </YStack>
            <FilterSelector />
          </XStack>

          <FlatList
            key={`deliveries-grid-${columns}`}
            data={filteredDeliveries}
            keyExtractor={(item) => item.id}
            numColumns={columns}
            renderItem={renderDelivery}
            ListEmptyComponent={ListEmptyComponent}
            ListFooterComponent={ListFooterComponent}
            columnWrapperStyle={columns > 1 ? { paddingHorizontal: 8 } : undefined}
            contentContainerStyle={{
              paddingHorizontal: columns > 1 ? 8 : 16,
              paddingBottom: insets.bottom + 16,
              flexGrow: 1,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            initialNumToRender={10}
            windowSize={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews
          />
        </YStack>
      )}
    </YStack>
  );
}
