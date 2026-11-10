// @ts-nocheck
import { useCallback, useState } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { YStack, XStack, Text, Card, Separator, Switch, Spinner } from "tamagui";
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
import { Button } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { ServiceStatusBanner } from "@/components/ui";
import { useRiderDeliveryRealtimeUpdates } from "@/hooks/useRiderDeliveryRealtimeUpdates";
import { useRiderKycQuery } from "@/hooks/useKyc";
import { useRiderDeliveryZonesQuery } from "@/hooks/useRiderDeliveryZones";
import { RiderCoverageMap } from "@/components/rider/RiderCoverageMap";
import {
  useRiderMetricsQuery,
  useRiderProfileQuery,
  useActiveDeliveryQuery,
  useUpdateOnlineStatusMutation,
  useRiderDeliveriesQuery,
} from "@teincfood/core";
import { useResponsive } from "@/utils/responsive";
import { useRiderNavigationStore } from "@/stores/rider-navigation.store";

/**
 * Rider Home Screen
 * Shows online/offline toggle, earnings summary, and delivery dashboard
 */
export default function RiderHome() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const setNavigationTarget = useRiderNavigationStore(
    (state) => state.setNavigationTarget,
  );
  const { isTablet } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const [dismissNoProfile, setDismissNoProfile] = useState(false);

  // Real-time delivery event updates
  useRiderDeliveryRealtimeUpdates();

  // TanStack Query hooks
  const { data: metricsData, isLoading, refetch } = useRiderMetricsQuery();
  const { data: profileData } = useRiderProfileQuery();
  // Rider KYC lives on the dispatch rider row, not the user profile. Reading
  // user.kyc_status here showed "Verification Required" even after approval.
  const { data: riderKyc, isLoading: riderKycLoading } = useRiderKycQuery();
  const { data: activeDeliveryData } = useActiveDeliveryQuery();
  const {
    data: deliveryZones = [],
    isLoading: zonesLoading,
    isError: zonesError,
    refetch: refetchZones,
  } = useRiderDeliveryZonesQuery();
  const updateOnlineStatus = useUpdateOnlineStatusMutation();

  const riderLocation =
    profileData?.current_lat != null && profileData?.current_lng != null
      ? {
          latitude: profileData.current_lat,
          longitude: profileData.current_lng,
        }
      : null;

  // Rider status from backend: 'available' | 'busy' | 'offline'
  const riderStatus = metricsData?.status || 'offline';
  const isAvailable = riderStatus === 'available';
  const isOnline = riderStatus !== 'offline';
  const statusLabel = riderStatus === 'available' ? 'Available' : riderStatus === 'busy' ? 'On Delivery' : 'Offline';
  const statusColor = riderStatus === 'available' ? '$success' : riderStatus === 'busy' ? '$blue9' : '$colorMuted';

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
    await Promise.all([refetch(), refetchZones()]);
  }, [refetch, refetchZones]);

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
    <YStack flex={1} backgroundColor="$background" alignItems="center">
      {/* Fixed Header */}
      <XStack
        width="100%"
        maxWidth={960}
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
              backgroundColor={statusColor}
            />
            <Text fontSize="$3" fontFamily="$body" color="$colorSecondary">
              {statusLabel}
            </Text>
          </XStack>
          <Switch
            size="$8"
            checked={isOnline}
            disabled={riderStatus === 'busy'}
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
        style={{ width: "100%", maxWidth: 960 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <YStack paddingHorizontal="$4" gap="$4">
          {/* Service Status */}
        {!riderKycLoading && (
          <ServiceStatusBanner
            kyc_status={riderKyc?.kyc_status ?? profileData?.kyc_status}
            kycRoute="/(shared)/kyc?type=user&role=rider"
          />
        )}

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
        {riderStatus === 'offline' ? (
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
                  {(metrics as any).currency ?? 'GHS'}{' '}
                  {(metrics.todayEarnings / 100).toFixed(2)}
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
        {activeDelivery ? (
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
                  <Text fontSize="$3">ETA: {activeDelivery.eta_minutes ?? "---"} min</Text>
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
                    setNavigationTarget({
                      name: activeDelivery.dropoff || 'Dropoff',
                      address: activeDelivery.dropoff || 'Dropoff location',
                      latitude: activeDelivery.dropoff_lat,
                      longitude: activeDelivery.dropoff_lng,
                      orderId: activeDelivery.order_id,
                      orderNumber: activeDelivery.order_number,
                      kind: 'dropoff',
                      status: activeDelivery.status,
                      pickup:
                        activeDelivery.pickup_lat != null &&
                        activeDelivery.pickup_lng != null
                          ? {
                              name: activeDelivery.pickup_name,
                              address: activeDelivery.pickup,
                              latitude: activeDelivery.pickup_lat,
                              longitude: activeDelivery.pickup_lng,
                            }
                          : undefined,
                      dropoff: {
                        name: activeDelivery.dropoff,
                        latitude: activeDelivery.dropoff_lat,
                        longitude: activeDelivery.dropoff_lng,
                      },
                    });
                    router.push("/(rider)/navigate");
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
        {isOnline ? (
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
                    <Text fontWeight="bold">{delivery.order_number}</Text>
                    <Text fontSize="$3" color="$colorMuted">
                      Delivered
                    </Text>
                  </YStack>
                  <XStack gap="$2" alignItems="center">
                    <Text fontWeight="bold" color="$success">
                      +{delivery.currency || 'GHS'}{' '}
                      {((delivery.earnings_minor ?? 0) / 100).toFixed(2)}
                    </Text>
                    <ChevronRight size={16} color="$colorMuted" />
                  </XStack>
                </XStack>
                {index < recentDeliveries.length - 1 && <Separator />}
              </YStack>
            ))}
          </YStack>
        </Card>

        {/* Delivery coverage map */}
        {riderStatus !== 'offline' ? (
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center" gap="$3">
                <YStack flex={1} gap="$1">
                  <Text fontSize="$5" fontWeight="bold">
                    Delivery Coverage
                  </Text>
                  <Text fontSize="$2" color="$colorSecondary">
                    {deliveryZones.length > 0
                      ? `${deliveryZones.length} joined ${deliveryZones.length === 1 ? "business" : "businesses"} · ${deliveryZones.filter((zone) => zone.delivery_enabled).length} accepting deliveries`
                      : "Businesses you deliver for and their delivery radius"}
                  </Text>
                </YStack>
                <Button
                  variant="ghost"
                  height={36}
                  width="auto"
                  paddingHorizontal="$2"
                  onPress={() => router.push("/(rider)/settings/delivery-zones")}
                  icon={<ChevronRight size={18} color="$colorSecondary" />}
                />
              </XStack>

              {deliveryZones.length > 0 ? (
                <RiderCoverageMap
                  zones={deliveryZones}
                  riderLocation={riderLocation}
                  height={220}
                  interactive={false}
                />
              ) : zonesLoading ? (
                <YStack
                  height={220}
                  width="100%"
                  borderRadius="$5"
                  backgroundColor="$backgroundSoft"
                  alignItems="center"
                  justifyContent="center"
                  gap="$2"
                >
                  <Spinner color="$primary" />
                  <Text fontSize="$2" color="$colorSecondary">
                    Loading coverage map...
                  </Text>
                </YStack>
              ) : zonesError ? (
                <YStack
                  height={220}
                  width="100%"
                  borderRadius="$5"
                  backgroundColor="$backgroundSoft"
                  alignItems="center"
                  justifyContent="center"
                  gap="$2"
                  padding="$4"
                >
                  <MapPin size={28} color="$colorMuted" />
                  <Text fontSize="$3" fontWeight="600" textAlign="center">
                    Could not load delivery coverage
                  </Text>
                  <Button
                    size="$3"
                    variant="outline"
                    onPress={() => refetchZones()}
                  >
                    Retry
                  </Button>
                </YStack>
              ) : (
                <YStack
                  height={220}
                  width="100%"
                  borderRadius="$5"
                  backgroundColor="$backgroundSoft"
                  alignItems="center"
                  justifyContent="center"
                  gap="$2"
                  padding="$4"
                >
                  <MapPin size={28} color="$colorMuted" />
                  <Text fontSize="$3" fontWeight="600" textAlign="center">
                    You have not joined a business yet
                  </Text>
                  <Button
                    size="$3"
                    variant="outline"
                    onPress={() => router.push("/(rider)/businesses")}
                  >
                    Browse Businesses
                  </Button>
                </YStack>
              )}

              <Button
                variant="outline"
                height={44}
                onPress={() => router.push("/(rider)/settings/delivery-zones")}
              >
                Manage Delivery Zones
              </Button>
            </YStack>
          </Card>
        ) : null}
      </YStack>
    </ScrollView>
    </YStack>
  );
}
