// @ts-nocheck

import { useState, useCallback } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { formatPrice } from "@/utils/currency";
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
  Switch,
  Avatar,
} from "tamagui";
import {
  ShoppingBag,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  Bell,
  ChevronRight,
  Store,
  Package,
  X,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { ServiceStatusBanner } from "@/components/ui";
import { useSellerDashboardQuery } from "@/hooks/seller-dashboard.hooks";

/**
 * Seller Dashboard Screen
 * Shows business metrics, quick actions, and live order feed
 */
export default function SellerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [dismissNoBusiness, setDismissNoBusiness] = useState(false);
  const { businesses } = useBusinessStore();
  const hasBusiness = businesses.length > 0;

  // TanStack Query hooks
  const { data, isLoading, refetch } = useSellerDashboardQuery();

  // Use query data or fallback to defaults
  const metrics = data?.metrics ?? {
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    averageRating: 0,
    activeOrders: 0,
  };
  const recentOrders = data?.recentOrders ?? [];

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "$star";
      case "preparing":
        return "$info";
      case "ready":
        return "$success";
      default:
        return "$colorMuted";
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <YStack padding="$4" paddingBottom="$6" gap="$4" backgroundColor="$background">
        {/* Service Status */}
        <ServiceStatusBanner
          status={user?.serviceStatus}
          hasCompletedKyc={user?.hasCompletedKyc}
        />

        {/* No Business Banner */}
        {!hasBusiness && !dismissNoBusiness && (
          <Card padding="$4" bordered backgroundColor="$orangeMuted" borderColor="$orange">
            <XStack gap="$3" alignItems="center">
              <YStack flex={1} gap="$2">
                <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                  Create a Business
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  You need a business to start selling. Set one up now.
                </Text>
                <XStack gap="$2" marginTop="$1">
                  <Button size="$3" variant="primary" onPress={() => router.push("/(seller)/(drawer)/businesses/add")}>
                    Create Business
                  </Button>
                  <Button size="$3" variant="outlined" onPress={() => setDismissNoBusiness(true)}>
                    Skip
                  </Button>
                </XStack>
              </YStack>
              <XStack position="absolute" top={0} right={0}>
                <Button circular size="$2" variant="ghost" icon={<X size={16} />} onPress={() => setDismissNoBusiness(true)} />
              </XStack>
            </XStack>
          </Card>
        )}

        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <Text fontSize="$4" color="$colorMuted">
              Welcome back,
            </Text>
            <Text fontSize="$6" fontWeight="bold">
              {user?.businessName || user?.fullName || "Seller"}
            </Text>
          </YStack>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$3">Store {isStoreOpen ? "Open" : "Closed"}</Text>
            <Switch
              size="$8"
              checked={isStoreOpen}
              onCheckedChange={setIsStoreOpen}
              backgroundColor={isStoreOpen ? "$primary" : "$color.gray600"}
            >
              <Switch.Thumb animation="quick" backgroundColor="$color.white" />
            </Switch>
            <Button
              size="$4"
              circular
              icon={<Bell size={20} />}
              onPress={() => router.push("/(seller)/notifications")}
            />
          </XStack>
        </XStack>

        {/* Metrics Cards */}
        <XStack gap="$3" flexWrap="wrap">
          <Card flex={1} minWidth="45%" padding="$4" bordered>
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <ShoppingBag size={20} color="$primary" />
                <Text fontSize="$3" color="$colorMuted">
                  Today's Orders
                </Text>
              </XStack>
              <Text fontSize="$7" fontWeight="bold">
                {metrics.todayOrders}
              </Text>
            </YStack>
          </Card>

          <Card flex={1} minWidth="45%" padding="$4" bordered>
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <DollarSign size={20} color="$success" />
                <Text fontSize="$3" color="$colorMuted">
                  Today's Revenue
                </Text>
              </XStack>
              <Text fontSize="$7" fontWeight="bold">
                {formatPrice(metrics.todayRevenue)}
              </Text>
            </YStack>
          </Card>

          <Card flex={1} minWidth="45%" padding="$4" bordered>
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <Clock size={20} color="$star" />
                <Text fontSize="$3" color="$colorMuted">
                  Pending Orders
                </Text>
              </XStack>
              <Text fontSize="$7" fontWeight="bold">
                {metrics.pendingOrders}
              </Text>
            </YStack>
          </Card>

          <Card flex={1} minWidth="45%" padding="$4" bordered>
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <Star size={20} color="$star" />
                <Text fontSize="$3" color="$colorMuted">
                  Avg Rating
                </Text>
              </XStack>
              <Text fontSize="$7" fontWeight="bold">
                {metrics.averageRating}
              </Text>
            </YStack>
          </Card>
        </XStack>

        {/* Quick Actions */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="bold">
              Quick Actions
            </Text>
            <XStack gap="$3">
              <Button
                flex={1}
                onPress={() => router.push("/(seller)/orders/pending")}
              >
                <XStack gap="$2" alignItems="center">
                  <Clock size={18} color="$color.white" />
                  <Text
                    color="$color.white"
                    fontFamily="$body"
                    fontWeight="bold"
                  >
                    Pending ({metrics.pendingOrders})
                  </Text>
                </XStack>
              </Button>
              <Button
                flex={1}
                onPress={() => router.push("/(seller)/orders/active")}
              >
                <XStack gap="$2" alignItems="center">
                  <Package size={18} color="$color.white" />
                  <Text
                    color="$color.white"
                    fontFamily="$body"
                    fontWeight="bold"
                  >
                    Active ({metrics.activeOrders})
                  </Text>
                </XStack>
              </Button>
            </XStack>
            <Button
              variant="outlined"
              onPress={() => router.push("/(seller)/analytics")}
            >
              <XStack gap="$2" alignItems="center">
                <TrendingUp size={18} color="$color" />
                <Text fontFamily="$body" fontWeight="bold">
                  View Analytics
                </Text>
              </XStack>
            </Button>
          </YStack>
        </Card>

        {/* Live Order Feed */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">
                Recent Orders
              </Text>
              <Button
                variant="outlined"
                height={36}
                paddingHorizontal="$3"
                onPress={() => router.push("/(seller)/orders")}
              >
                View All
              </Button>
            </XStack>

            <Separator />

            {recentOrders.map((order, index) => (
              <YStack key={order.id} gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text fontWeight="bold">{order.orderNumber}</Text>
                    <Text fontSize="$3" color="$colorMuted">
                      {order.items} items • {formatPrice(order.total)}
                    </Text>
                  </YStack>
                  <XStack gap="$2" alignItems="center">
                    <YStack
                      backgroundColor={getStatusColor(order.status)}
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                    >
                      <Text
                        fontSize="$2"
                        color="$color.white"
                        textTransform="capitalize"
                      >
                        {order.status}
                      </Text>
                    </YStack>
                    <ChevronRight size={16} color="$colorMuted" />
                  </XStack>
                </XStack>
                {index < recentOrders.length - 1 && <Separator />}
              </YStack>
            ))}
          </YStack>
        </Card>

        {/* Active Delivery Status */}
        {metrics.activeOrders > 0 && (
          <Card padding="$4" bordered backgroundColor="$primaryLight">
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">
                Active Deliveries
              </Text>
              <Text color="$colorMuted">
                You have {metrics.activeOrders} orders being delivered
              </Text>
              <Button onPress={() => router.push("/(seller)/orders")}>
                Track Orders
              </Button>
            </YStack>
          </Card>
        )}
      </YStack>
    </ScrollView>
  );
}
