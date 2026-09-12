// @ts-nocheck

import { useState, useCallback } from "react";
import { ScrollView, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { formatPrice, formatPriceFromMinor } from "@teincfood/core";
import { YStack, XStack, Text, Card, Separator, Switch, Avatar } from "tamagui";
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
  CreditCard,
  X,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { Button, ServiceStatusBanner } from "@/components/ui";
import { useSellerDashboardQuery } from "@teincfood/core";
import { useBusinessKycQuery } from "@/hooks/useKyc";
import * as businessService from "@/services/business.service";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@teincfood/core";

/**
 * Seller Dashboard Screen
 * Shows business metrics, quick actions, and live order feed
 */
export default function SellerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [togglingStore, setTogglingStore] = useState(false);
  const [dismissNoBusiness, setDismissNoBusiness] = useState(false);
  const { businesses, activeBusiness } = useBusinessStore();
  const hasBusiness = businesses.length > 0;
  const activeBusinessId = activeBusiness?.id;
  const isStoreOpen = activeBusiness?.is_open !== false;

  // Fetch business KYC status (fresh every mount)
  const { data: bizKyc } = useBusinessKycQuery(activeBusinessId);
  const bizKycStatus = bizKyc?.kyc_status;
  const bannerRoute = activeBusinessId
    ? `/(shared)/kyc?type=business&id=${activeBusinessId}`
    : "/(shared)/businesses";

  // TanStack Query hooks
  const { data, isLoading, refetch } = useSellerDashboardQuery(
    activeBusinessId,
    hasBusiness,
  );

  const metrics = data?.metrics ?? {
    today_orders: 0,
    today_revenue_minor: 0,
    pending_orders: 0,
    average_rating: 0,
    active_orders: 0,
  };
  const recentOrders = data?.recent_orders ?? [];

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleToggleStore = useCallback(async () => {
    if (!activeBusiness?.id) return;
    setTogglingStore(true);
    try {
      const result = await businessService.toggleBusinessOpen(activeBusiness.id);
      const updated = result?.data;
      if (updated?.is_open !== undefined) {
        useBusinessStore.getState().setActiveBusiness(updated);
      }
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setTogglingStore(false);
    }
  }, [activeBusiness?.id]);

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

  const formatStatus = (status: string) =>
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <YStack
        padding="$4"
        paddingBottom="$6"
        gap="$4"
        backgroundColor="$background"
      >
        {/* Service Status */}
        <ServiceStatusBanner kyc_status={bizKycStatus} kycRoute={bannerRoute} />

        {/* No Business Banner */}
        {!hasBusiness && !dismissNoBusiness && (
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
                  Create a Business
                </Text>
                <Button
                  circular
                  size="$2"
                  variant="ghost"
                  icon={<X size={16} />}
                  onPress={() => setDismissNoBusiness(true)}
                />
              </XStack>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                You need a business to start selling. Set one up now.
              </Text>
              <XStack gap="$2">
                <Button
                  variant="primary"
                  onPress={() => router.push("/(shared)/businesses/add")}
                >
                  Create Business
                </Button>
              </XStack>
            </YStack>
          </Card>
        )}

        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <Text fontSize="$4" color="$color">
              Welcome back, {user?.full_name || "Seller"}
            </Text>
            {activeBusiness && (
              <XStack gap="$1" alignItems="center" marginTop="$1">
                <Store size={14} color="$colorMuted" />
                <Text fontSize="$3" color="$colorMuted">
                  {activeBusiness.name}
                </Text>
              </XStack>
            )}
          </YStack>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$3">Store {isStoreOpen ? "Open" : "Closed"}</Text>
            <Switch
              size="$8"
              checked={isStoreOpen}
              disabled={togglingStore}
              onCheckedChange={handleToggleStore}
              backgroundColor={isStoreOpen ? "$primary" : "$color.gray600"}
            >
              <Switch.Thumb animation="quick" backgroundColor="$color.white" />
            </Switch>
            <Button
              size="$4"
              circular
              icon={<Bell size={20} />}
              onPress={() => router.push("/(shared)/notifications")}
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
                {metrics.today_orders}
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
              <Text fontSize="$7" fontWeight="bold" color="$success">
                {formatPriceFromMinor(metrics.today_revenue_minor)}
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
                {metrics.pending_orders}
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
                {metrics.average_rating}
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
                backgroundColor="$star"
                onPress={() => router.push("/(seller)/orders")}
              >
                <XStack gap="$2" alignItems="center">
                  <Clock size={18} color="$color.white" />
                  <Text
                    color="$color.white"
                    fontFamily="$body"
                    fontWeight="bold"
                  >
                    Pending ({metrics.pending_orders})
                  </Text>
                </XStack>
              </Button>
              <Button
                flex={1}
                backgroundColor="$primary"
                onPress={() => router.push("/(seller)/orders")}
              >
                <XStack gap="$2" alignItems="center">
                  <Package size={18} color="$color.white" />
                  <Text
                    color="$color.white"
                    fontFamily="$body"
                    fontWeight="bold"
                  >
                    Active ({metrics.active_orders})
                  </Text>
                </XStack>
              </Button>
            </XStack>
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
                width={"auto"}
                variant="outline"
                onPress={() => router.push("/(seller)/orders")}
              >
                View All
              </Button>
            </XStack>

            <Separator />

            {recentOrders.map((order, index) => (
              <Pressable
                key={order.id}
                onPress={() => router.push(`/(seller)/orders/${order.id}`)}
              >
                <YStack gap="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack>
                      <Text fontWeight="bold">{order.order_number}</Text>
                      <Text fontSize="$3" color="$colorMuted">
                        {order.item_count} items •{" "}
                        {formatPrice(
                          order.total_minor ? order.total_minor / 100 : 0,
                        )}
                      </Text>
                    </YStack>
                    <XStack gap="$2" alignItems="center">
                      <YStack
                        backgroundColor={getStatusColor(order.status)}
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                      >
                        <Text fontSize="$2" color="$color.white">
                          {formatStatus(order.status)}
                        </Text>
                      </YStack>
                      <ChevronRight size={16} color="$colorMuted" />
                    </XStack>
                  </XStack>
                  {index < recentOrders.length - 1 && <Separator />}
                </YStack>
              </Pressable>
            ))}
          </YStack>
        </Card>

        {/* Active Delivery Status */}
        {metrics.active_orders > 0 && (
          <Card padding="$4" bordered backgroundColor="$greenLight">
            <YStack gap="$2" alignItems="center">
              <Text fontSize="$3" color="$colorMuted">
                You have {metrics.active_orders} orders being delivered
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
