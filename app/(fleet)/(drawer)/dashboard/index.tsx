// @ts-nocheck
import { useState } from "react";
import { YStack, XStack, Text, Card, Separator, Avatar } from "tamagui";
import {
  Users,
  Car,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
  X,
} from "@tamagui/lucide-icons";
import { useFleetDashboardQuery, useFleetRidersQuery } from "@teincfood/core";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { ServiceStatusBanner, Button } from "@/components/ui";
import { ResponsiveScreen } from "@/components/layout";
import { useRouter } from "expo-router";
import { useBusinessKycQuery } from "@/hooks/useKyc";
import { formatPriceFromMinor } from "@teincfood/core";

export default function FleetDashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { businesses } = useBusinessStore();
  const [dismissNoBusiness, setDismissNoBusiness] = useState(false);
  const hasBusiness = businesses.length > 0;
  const activeBizId = businesses[0]?.id;
  const { data: bizKyc } = useBusinessKycQuery(activeBizId);
  const bizKycStatus = bizKyc?.kyc_status;
  const bannerRoute = activeBizId ? `/(shared)/kyc?type=business&id=${activeBizId}` : '/(shared)/businesses';
  const { data: dashboardRes, isLoading } = useFleetDashboardQuery(hasBusiness);
  const { data: ridersRes } = useFleetRidersQuery(hasBusiness);

  const dashboard = dashboardRes?.data ?? null;
  const riders = ridersRes?.data ?? [];
  const onlineRiders = dashboard?.online_riders ?? 0;
  const totalRiders = dashboard?.total_riders ?? riders.length;
  const totalVehicles = dashboard?.total_vehicles ?? 0;

  return (
    <ResponsiveScreen preset="wide">
      <YStack gap="$4">
        <ServiceStatusBanner
          kyc_status={bizKycStatus}
          kycRoute={bannerRoute}
        />

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
                You need a business to manage a fleet. Set one up now.
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

        <YStack gap="$2">
          <Text
            fontSize="$8"
            fontWeight="bold"
            fontFamily="$heading"
            color="$color"
          >
            Fleet Dashboard
          </Text>
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
            Welcome back, {user?.fullName || "Fleet Manager"}
          </Text>
        </YStack>

        <XStack gap="$3" flexWrap="wrap">
          <Card flex={1} minWidth={140} padding="$4" bordered>
            <YStack gap="$2" alignItems="center">
              <YStack
                width={48}
                height={48}
                borderRadius="$4"
                backgroundColor="$primary"
                alignItems="center"
                justifyContent="center"
              >
                <Users size={24} color="$white" />
              </YStack>
              <YStack alignItems="center">
                <Text fontSize="$7" fontWeight="bold" fontFamily="$heading">
                  {onlineRiders}/{totalRiders}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Online Riders
                </Text>
              </YStack>
            </YStack>
          </Card>

          <Card flex={1} minWidth={140} padding="$4" bordered>
            <YStack gap="$2" alignItems="center">
              <YStack
                width={48}
                height={48}
                borderRadius="$4"
                backgroundColor="$info"
                alignItems="center"
                justifyContent="center"
              >
                <Car size={24} color="$white" />
              </YStack>
              <YStack alignItems="center">
                <Text fontSize="$7" fontWeight="bold" fontFamily="$heading">
                  {totalVehicles}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Total Vehicles
                </Text>
              </YStack>
            </YStack>
          </Card>

          <Card flex={1} minWidth={140} padding="$4" bordered>
            <YStack gap="$2" alignItems="center">
              <YStack
                width={48}
                height={48}
                borderRadius="$4"
                backgroundColor="$success"
                alignItems="center"
                justifyContent="center"
              >
                <DollarSign size={24} color="$white" />
              </YStack>
              <YStack alignItems="center">
                <Text fontSize="$7" fontWeight="bold" fontFamily="$heading">
                  {formatPriceFromMinor(dashboard?.today_earnings_minor ?? 0)}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Today's Earnings
                </Text>
              </YStack>
            </YStack>
          </Card>

          <Card flex={1} minWidth={140} padding="$4" bordered>
            <YStack gap="$2" alignItems="center">
              <YStack
                width={48}
                height={48}
                borderRadius="$4"
                backgroundColor="$primary"
                alignItems="center"
                justifyContent="center"
              >
                <TrendingUp size={24} color="$white" />
              </YStack>
              <YStack alignItems="center">
                <Text fontSize="$7" fontWeight="bold" fontFamily="$heading">
                  {totalRiders}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Total Riders
                </Text>
              </YStack>
            </YStack>
          </Card>
        </XStack>

        <YStack gap="$3">
          <Text
            fontSize="$6"
            fontWeight="600"
            fontFamily="$heading"
            color="$color"
          >
            Quick Actions
          </Text>
          <XStack gap="$3">
            <Button
              flex={1}
              variant="outline"
              icon={Plus}
              onPress={() => router.push("/(fleet)/riders/add")}
            >
              Add Rider
            </Button>
            <Button
              flex={1}
              variant="outline"
              icon={Plus}
              onPress={() => router.push("/(fleet)/vehicles/add")}
            >
              Add Vehicle
            </Button>
          </XStack>
        </YStack>

        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize="$6"
              fontWeight="600"
              fontFamily="$heading"
              color="$color"
            >
              Recent Riders
            </Text>
            <Button
              variant="ghost"
              size="$2"
              icon={ChevronRight}
              onPress={() => router.push("/(fleet)/riders")}
            >
              View All
            </Button>
          </XStack>

          {riders.slice(0, 3).map((rider) => (
            <Card key={rider.id} padding="$3" bordered>
              <XStack gap="$3" alignItems="center">
                <Avatar circular size="$4">
                  <Avatar.Fallback backgroundColor="$colorMuted">
                    <Text color="$white" fontWeight="bold">
                      {(rider.user?.full_name || "R").charAt(0)}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body">
                    {rider.user?.full_name || "Rider"}
                  </Text>
                  <XStack gap="$2" alignItems="center">
                    <YStack
                      width={8}
                      height={8}
                      borderRadius="$10"
                      backgroundColor={
                        rider.status === "available" ? "$success" : "$colorMuted"
                      }
                    />
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      {rider.status === "available" ? "Online" : rider.status}
                    </Text>
                  </XStack>
                </YStack>
              </XStack>
            </Card>
          ))}

          {riders.length === 0 && (
            <Card padding="$4" bordered>
              <YStack alignItems="center" gap="$3">
                <Users size={48} color="$colorMuted" />
                <Text
                  fontSize="$4"
                  color="$colorSecondary"
                  textAlign="center"
                  fontFamily="$body"
                >
                  No riders yet. Add your first rider to get started.
                </Text>
                <Button
                  variant="primary"
                  onPress={() => router.push("/(fleet)/riders/add")}
                >
                  Add Rider
                </Button>
              </YStack>
            </Card>
          )}
        </YStack>

        {dashboard && (
          <YStack gap="$3">
            <Text
              fontSize="$6"
              fontWeight="600"
              fontFamily="$heading"
              color="$color"
            >
              Fleet Performance
            </Text>
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <XStack justifyContent="space-between">
                  <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                    Today's Deliveries
                  </Text>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {dashboard.today_deliveries}
                  </Text>
                </XStack>
                <Separator />
                <XStack justifyContent="space-between">
                  <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                    Pending Join Requests
                  </Text>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {dashboard.pending_join_requests}
                  </Text>
                </XStack>
                <Separator />
                <XStack justifyContent="space-between">
                  <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                    Active Riders
                  </Text>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {dashboard.active_riders}
                  </Text>
                </XStack>
              </YStack>
            </Card>
          </YStack>
        )}
      </YStack>
    </ResponsiveScreen>
  );
}
