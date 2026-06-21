// @ts-nocheck
import { useState, useEffect } from "react";
import { Image, ScrollView } from "react-native";
import { YStack, XStack, Text, Card, Separator, Avatar } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Users,
  Car,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  ChevronRight,
  Plus,
  X,
  Building,
} from "@tamagui/lucide-icons";
import { useFleetStore } from "@/stores/fleet.store";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { ServiceStatusBanner } from "@/components/ui";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";
import { formatPrice } from "@/utils/currency";

export default function FleetDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { dashboard, riders, vehicles } = useFleetStore();
  const { businesses } = useBusinessStore();
  const [dismissNoBusiness, setDismissNoBusiness] = useState(false);
  const hasBusiness = businesses.length > 0;

  const onlineRiders = riders.filter((r) => r.status === "active").length;
  const totalVehicles = vehicles.length;
  const assignedVehicles = vehicles.filter((v) => v.assignedRiderId).length;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
    >
      <YStack padding="$4" gap="$4">
        {/* Service Status */}
        <ServiceStatusBanner
          status={user?.serviceStatus}
          hasCompletedKyc={user?.hasCompletedKyc}
        />

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
                You need a business to manage a fleet. Set one up now.
              </Text>
              <XStack gap="$2">
                <Button
                  size="$3"
                  variant="primary"
                  onPress={() =>
                    router.push("/(seller)/(drawer)/businesses/add")
                  }
                >
                  Create Business
                </Button>
                <Button
                  size="$3"
                  variant="outline"
                  onPress={() => setDismissNoBusiness(true)}
                >
                  Skip
                </Button>
              </XStack>
            </YStack>
          </Card>
        )}

        {/* Welcome Section */}
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

        {/* Key Metrics */}
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
                  {onlineRiders}/{riders.length}
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
                <Image
                  source={require("assets/icons/delivery-bike.png")}
                  style={{ width: 24, height: 24, tintColor: "white" }}
                />
              </YStack>
              <YStack alignItems="center">
                <Text fontSize="$7" fontWeight="bold" fontFamily="$heading">
                  {assignedVehicles}/{totalVehicles}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Assigned Motors
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
                  {formatPrice(dashboard?.todayEarnings || 0)}
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
                  {riders.length}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Total Riders
                </Text>
              </YStack>
            </YStack>
          </Card>
        </XStack>

        {/* Quick Actions */}
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

        {/* Recent Riders */}
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
                  <Avatar.Image src={rider.riderAvatarUrl} />
                  <Avatar.Fallback backgroundColor="$colorMuted">
                    <Text color="$white" fontWeight="bold">
                      {rider.riderName?.charAt(0) || "R"}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$body">
                    {rider.riderName}
                  </Text>
                  <XStack gap="$2" alignItems="center">
                    <YStack
                      width={8}
                      height={8}
                      borderRadius="$10"
                      backgroundColor={
                        rider.status === "active" ? "$success" : "$colorMuted"
                      }
                    />
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      {rider.status === "active" ? "Online" : "Offline"}
                    </Text>
                    {rider.vehiclePlateNumber && (
                      <>
                        <Text fontSize="$3" color="$colorSecondary">
                          •
                        </Text>
                        <Text
                          fontSize="$3"
                          color="$colorSecondary"
                          fontFamily="$body"
                        >
                          {rider.vehiclePlateNumber}
                        </Text>
                      </>
                    )}
                  </XStack>
                </YStack>
                <YStack alignItems="flex-end">
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    fontFamily="$heading"
                    color="$success"
                  >
                    {formatPrice(rider.totalEarnings)}
                  </Text>
                  <Text
                    fontSize="$2"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    earnings
                  </Text>
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
                <Button onPress={() => router.push("/(fleet)/riders/add")}>
                  Add Rider
                </Button>
              </YStack>
            </Card>
          )}
        </YStack>

        {/* Fleet Performance Summary */}
        {dashboard?.activeDeliveries > 0 && (
          <YStack gap="$3">
            <Text
              fontSize="$6"
              fontWeight="600"
              fontFamily="$heading"
              color="$color"
            >
              Fleet Activity
            </Text>
            <Card padding="$4" bordered backgroundColor="$infoMuted">
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={48}
                  height={48}
                  borderRadius="$4"
                  backgroundColor="$info"
                  alignItems="center"
                  justifyContent="center"
                >
                  <MapPin size={24} color="$white" />
                </YStack>
                <YStack flex={1}>
                  <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                    {dashboard.activeDeliveries} Active Riders
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Riders are currently on delivery
                  </Text>
                </YStack>
              </XStack>
            </Card>
          </YStack>
        )}

        {/* Fleet Performance */}
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
                  This Week
                </Text>
                <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                  {formatPrice(dashboard?.weekEarnings || 0)}
                </Text>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between">
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  This Month
                </Text>
                <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                  {formatPrice(dashboard?.monthEarnings || 0)}
                </Text>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between">
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Total Deliveries
                </Text>
                <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                  {riders.reduce((sum, r) => sum + r.totalDeliveries, 0)}
                </Text>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
