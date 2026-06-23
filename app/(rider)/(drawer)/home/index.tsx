// @ts-nocheck
import { useCallback, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { YStack, XStack, Text, Card, Separator, Switch } from "tamagui";
import {
  DollarSign,
  Package,
  MapPin,
  Navigation,
  Clock,
  Bell,
  ChevronRight,
  Menu,
  RefreshCw,
  X,
  UserPlus,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { ServiceStatusBanner } from "@/components/ui";
import {
  useRiderMetricsQuery,
  useRiderProfileQuery,
  useActiveDeliveryQuery,
  useUpdateOnlineStatusMutation,
  useRiderDeliveriesQuery,
} from "@/hooks/useRider";
import { useResponsive } from "@/utils/responsive";

/**
 * Rider Home Screen
 * Shows online/offline toggle, earnings summary, and delivery dashboard
 */
export default function RiderHome() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const [dismissNoProfile, setDismissNoProfile] = useState(false);

  // TanStack Query hooks
  const { data: metricsData, isLoading, refetch } = useRiderMetricsQuery();
  const { data: profileData } = useRiderProfileQuery();
  const { data: activeDeliveryData } = useActiveDeliveryQuery();
  const updateOnlineStatus = useUpdateOnlineStatusMutation();

  // Online status from rider profile (backend source of truth)
  const isOnline = metricsData?.status !== 'offline';

  // Use query data or fallback to defaults
  const metrics = {
    todayEarnings: metricsData?.today_earnings_minor ?? 0,
    todayDeliveries: metricsData?.today_deliveries ?? 0,
    availableDeliveries: metricsData?.available_deliveries ?? 0,
    totalDeliveries: metricsData?.total_deliveries ?? 0,
  };
  const activeDelivery = activeDeliveryData ?? null;

  // Get recent deliveries from the deliveries query
  const { data: deliveriesData = [] } = useRiderDeliveriesQuery();
  const recentDeliveries = deliveriesData
    .filter((d) => d.status === "delivered")
    .slice(0, 5);

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "$success";
      case "picked_up":
        return "$info";
      case "assigned":
        return "$primary";
      default:
        return "$colorMuted";
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Fixed Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <XStack gap="$3" alignItems="center">
          <Button
            variant="ghost"
            size="$3"
            onPress={() => navigation.openDrawer()}
            icon={<Menu size={24} color="$color" />}
          />
          <YStack>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              Welcome back,
            </Text>
            <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
              {user?.fullName || "Rider"}
            </Text>
          </YStack>
        </XStack>
        <XStack gap="$3" alignItems="center">
          <XStack gap="$1" alignItems="center">
            <YStack
              width={10}
              height={10}
              borderRadius={5}
              backgroundColor={isOnline ? "$success" : "$colorMuted"}
            />
            <Text fontSize="$3" fontFamily="$body" color="$colorSecondary">
              {isOnline ? "Online" : "Offline"}
            </Text>
          </XStack>
          <Switch
            size="$8"
            checked={isOnline}
            onCheckedChange={(val) => updateOnlineStatus.mutate(val)}
            backgroundColor={isOnline ? "$success" : "$colorMuted"}
          >
            <Switch.Thumb animation="quick" backgroundColor="white" />
          </Switch>
          <Button
            variant="ghost"
            size="$3"
            onPress={() => router.push("/(shared)/notifications")}
            icon={<Bell size={22} color="$color" />}
          />
        </XStack>
      </XStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <YStack paddingHorizontal="$4" gap="$4">
          {/* Service Status */}
        <ServiceStatusBanner
          status={user?.serviceStatus}
          hasCompletedKyc={user?.hasCompletedKyc}
        />

        {/* No Rider Profile Banner */}
        {!metricsData && !isLoading && !dismissNoProfile && (
          <Card
            padding="$4"
            bordered
            backgroundColor="$orangeMuted"
            borderColor="$orange"
          >
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  fontFamily="$heading"
                  color="$color"
                >
                  Complete Your Rider Profile
                </Text>
                <Button
                  circular
                  size="$2"
                  variant="ghost"
                  icon={<X size={16} />}
                  onPress={() => setDismissNoProfile(true)}
                />
              </XStack>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Set up your rider profile to start accepting deliveries.
              </Text>
              <XStack gap="$2">
                <Button
                  size="$3"
                  variant="primary"
                  onPress={() => router.push("/(rider)/settings/profile")}
                >
                  Create Profile
                </Button>
                <Button
                  size="$3"
                  variant="outline"
                  onPress={() => setDismissNoProfile(true)}
                >
                  Skip
                </Button>
              </XStack>
            </YStack>
          </Card>
        )}

        {/* Online Status Card */}
        {!isOnline ? (
          <Card padding="$4" bordered backgroundColor="$backgroundSoft">
            <YStack gap="$3" alignItems="center">
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading">
                You're Offline
              </Text>
              <Text
                color="$colorSecondary"
                textAlign="center"
                fontFamily="$body"
              >
                Go online to start receiving delivery requests
              </Text>
              <Button
                variant="primary"
                height={48}
                width="100%"
                onPress={() => updateOnlineStatus.mutate(true)}
              >
                Go Online
              </Button>
            </YStack>
          </Card>
        ) : null}

        {/* Earnings Summary */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="bold">
              Today's Summary
            </Text>
            <XStack gap="$4">
              <YStack flex={1} alignItems="center" gap="$1">
                <DollarSign size={24} color="$success" />
                <Text fontSize="$7" fontWeight="bold">
                  GHS {(metrics.todayEarnings / 100).toFixed(2)}
                </Text>
                <Text fontSize="$3" color="$colorMuted">
                  Earnings
                </Text>
              </YStack>
              <Separator vertical />
              <YStack flex={1} alignItems="center" gap="$1">
                <Package size={24} color="$primary" />
                <Text fontSize="$7" fontWeight="bold">
                  {metrics.todayDeliveries}
                </Text>
                <Text fontSize="$3" color="$colorMuted">
                  Deliveries
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Active Delivery */}
        {isOnline && activeDelivery ? (
          <Card padding="$4" bordered backgroundColor="$primaryLight">
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold">
                  Active Delivery
                </Text>
                <YStack
                  backgroundColor={getStatusColor(activeDelivery.status)}
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                >
                  <Text fontSize="$2" color="white" textTransform="capitalize">
                    {activeDelivery.status.replace("_", " ")}
                  </Text>
                </YStack>
              </XStack>

              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <MapPin size={16} color="$primary" />
                  <Text fontSize="$3">Pickup: {activeDelivery.pickup}</Text>
                </XStack>
                <XStack gap="$2" alignItems="center">
                  <Navigation size={16} color="$success" />
                  <Text fontSize="$3">Dropoff: {activeDelivery.dropoff}</Text>
                </XStack>
                <XStack gap="$2" alignItems="center">
                  <Clock size={16} color="$colorMuted" />
                  <Text fontSize="$3">ETA: {activeDelivery.estimatedTime}</Text>
                </XStack>
              </YStack>

              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="primary"
                  height={48}
                  onPress={() => {
                    if (!activeDelivery.dropoff_lat || !activeDelivery.dropoff_lng) {
                      router.push("/(rider)/deliveries");
                      return;
                    }
                    const locationData = {
                      name: activeDelivery.dropoff || 'Dropoff',
                      address: activeDelivery.dropoff || 'Dropoff location',
                      phone: '',
                      lat: activeDelivery.dropoff_lat,
                      lng: activeDelivery.dropoff_lng,
                    };
                    const encoded = encodeURIComponent(JSON.stringify(locationData));
                    router.push(`/(rider)/navigate/${encoded}`);
                  }}
                >
                  Navigate
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  height={48}
                  onPress={() => router.push(`/(rider)/deliveries/${activeDelivery.id}`)}
                >
                  View Details
                </Button>
              </XStack>
            </YStack>
          </Card>
        ) : null}

        {/* Quick Actions */}
        {isOnline && !activeDelivery ? (
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                Quick Actions
              </Text>
              <XStack gap="$3">
                <Button
                  variant="primary"
                  height={48}
                  onPress={() => router.push("/(rider)/deliveries")}
                >
                  Available {`${metrics.availableDeliveries || 0}`}
                </Button>
                <Button
                  variant="outline"
                  height={48}
                  onPress={() => router.push("/(rider)/earnings")}
                >
                  Earnings
                </Button>
              </XStack>
            </YStack>
          </Card>
        ) : null}

        {/* Recent Deliveries */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">
                Recent Deliveries
              </Text>
              <Button
                variant="ghost"
                height={36}
                width="auto"
                paddingHorizontal="$3"
                onPress={() => router.push("/(rider)/deliveries")}
              >
                View All
              </Button>
            </XStack>

            <Separator />

            {recentDeliveries.map((delivery, index) => (
              <YStack key={delivery.id} gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text fontWeight="bold">{delivery.orderId}</Text>
                    <Text fontSize="$3" color="$colorMuted">
                      Delivered
                    </Text>
                  </YStack>
                  <XStack gap="$2" alignItems="center">
                    <Text fontWeight="bold" color="$success">
                      +GHS {((delivery.earnings_minor ?? 0) / 100).toFixed(2)}
                    </Text>
                    <ChevronRight size={16} color="$colorMuted" />
                  </XStack>
                </XStack>
                {index < recentDeliveries.length - 1 && <Separator />}
              </YStack>
            ))}
          </YStack>
        </Card>

        {/* Map Preview */}
        {isOnline ? (
          <Card padding="$4" bordered>
            <YStack gap="$3" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">
                Delivery Map
              </Text>
              <YStack
                height={200}
                width="100%"
                borderRadius="$4"
                overflow="hidden"
              >
                <MapView
                  style={{ flex: 1 }}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: 5.6037,
                    longitude: -0.1870,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  showsUserLocation
                  showsMyLocationButton={false}
                  scrollEnabled={false}
                  zoomEnabled={false}
                />
              </YStack>
              <Button
                variant="outline"
                height={48}
                onPress={() => router.push("/(rider)/map")}
              >
                Open Full Map
              </Button>
            </YStack>
          </Card>
        ) : null}
      </YStack>
    </ScrollView>
    </YStack>
  );
}
