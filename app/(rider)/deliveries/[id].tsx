// @ts-nocheck
import { useState } from "react";
import { ScrollView, TouchableOpacity, Linking, Platform } from "react-native";
import { YStack, XStack, Text, Card, Separator, Avatar, Sheet } from "tamagui";
import {
  MapPin,
  Navigation,
  Clock,
  Package,
  Phone,
  MessageCircle,
  User,
  DollarSign,
  Truck,
  Filter,
  X,
  Check,
} from "@tamagui/lucide-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useDeliveryDetailQuery,
  useUpdateDeliveryStatusMutation,
} from "@/hooks/rider.hooks";
import type { RiderDeliveryDetail } from "@/models/rider.model";
import { BackButton, Button } from "@/components/ui";
import { formatPrice, DEFAULT_CURRENCY } from "@/utils/currency";

/**
 * Rider Delivery Details Screen
 */
export default function RiderDeliveryDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // TanStack Query hooks
  const { data: delivery, isLoading } = useDeliveryDetailQuery(id as string);
  const updateStatus = useUpdateDeliveryStatusMutation();

  // Filter state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "#FFA500";
      case "picked_up":
        return "#3498db";
      case "delivering":
        return "#f39c12";
      case "delivered":
        return "$success";
      default:
        return "#95a5a6";
    }
  };

  const handleStatusUpdate = (newStatus: RiderDeliveryDetail["status"]) => {
    if (id) {
      updateStatus.mutate({ deliveryId: id as string, status: newStatus });
    }
  };

  const handleCall = (phoneNumber: string) => {
    const url =
      Platform.OS === "ios" ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  const handleNavigateToPickup = () => {
    if (!delivery) return;

    const locationData = {
      name: delivery.pickup.name,
      address: delivery.pickup.address,
      phone: delivery.pickup.phone,
      lat: delivery.pickup.lat,
      lng: delivery.pickup.lng,
    };
    const encodedLocation = encodeURIComponent(JSON.stringify(locationData));
    router.push(`/(rider)/navigate/${encodedLocation}`);
  };

  const handleNavigateToDropoff = () => {
    if (!delivery) return;
    const locationData = {
      name: delivery.dropoff.name,
      address: delivery.dropoff.address,
      phone: delivery.dropoff.phone,
      lat: delivery.dropoff.lat,
      lng: delivery.dropoff.lng,
      notes: delivery.dropoff.notes,
    };
    const encodedLocation = encodeURIComponent(JSON.stringify(locationData));
    router.push(`/(rider)/navigate/${encodedLocation}`);
  };

  if (!delivery) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
      >
        <Text>Loading...</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Delivery Details
        </Text>
        <XStack gap="$2" alignItems="center">
          <TouchableOpacity onPress={() => setFilterSheetOpen(true)}>
            <YStack backgroundColor="$gray3" padding="$2" borderRadius="$3">
              <Filter size={20} color="$color" />
            </YStack>
          </TouchableOpacity>
          <YStack
            backgroundColor={getStatusColor(delivery.status)}
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius="$10"
          >
            <Text color="white" fontSize="$2" textTransform="capitalize">
              {delivery.status.replace("_", " ")}
            </Text>
          </YStack>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Order Info */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold">
                  {delivery.orderId}
                </Text>
                <XStack gap="$2" alignItems="center">
                  <Truck size={16} color="$colorMuted" />
                  <Text fontSize="$3" color="$colorMuted">
                    {delivery.distance}
                  </Text>
                </XStack>
              </XStack>
              <Separator />
              <XStack gap="$3" alignItems="center">
                <Clock size={16} color="$colorMuted" />
                <Text fontSize="$3">ETA: {delivery.estimatedTime}</Text>
                <Text
                  flex={1}
                  textAlign="right"
                  fontSize="$5"
                  fontWeight="bold"
                  color="$success"
                >
                  +{delivery.currency} {delivery.earnings.toFixed(2)}
                </Text>
              </XStack>
            </YStack>
          </Card>

          {/* Customer Info */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                Customer
              </Text>
              <Separator />
              <XStack gap="$3" alignItems="center">
                <Avatar circular size="$10">
                  <Avatar.Fallback
                    items="center"
                    justify="center"
                    backgroundColor="$primary"
                  >
                    <User size="$6" color="white" />
                  </Avatar.Fallback>
                </Avatar>
                <YStack flex={1}>
                  <Text fontWeight="bold">{delivery.customer.name}</Text>
                  <Text fontSize="$3" color="$colorMuted">
                    {delivery.customer.phone}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="outline"
                  icon={<Phone size={18} />}
                  onPress={() => handleCall(delivery.customer.phone)}
                >
                  Call
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  icon={<MessageCircle size={18} />}
                  onPress={() =>
                    router.push(
                      `/(communication)/chat/${delivery.customer.phone}`,
                    )
                  }
                >
                  Message
                </Button>
              </XStack>
            </YStack>
          </Card>

          {/* Pickup Location */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <MapPin size={20} color="$primary" />
                <Text fontSize="$5" fontWeight="bold">
                  Pickup Location
                </Text>
              </XStack>
              <Separator />
              <YStack gap="$2">
                <Text fontWeight="bold">{delivery.pickup.name}</Text>
                <Text color="$colorMuted">{delivery.pickup.address}</Text>
                <Text color="$colorMuted" fontSize="$3">
                  {delivery.pickup.phone}
                </Text>
              </YStack>
              <Button
                variant="outline"
                icon={<Navigation size={18} />}
                onPress={handleNavigateToPickup}
                width={"100%"}
              >
                Navigate to Pickup
              </Button>
            </YStack>
          </Card>

          {/* Dropoff Location */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Navigation size={20} color="$success" />
                <Text fontSize="$5" fontWeight="bold">
                  Dropoff Location
                </Text>
              </XStack>
              <Separator />
              <YStack gap="$2">
                <Text fontWeight="bold">{delivery.dropoff.name}</Text>
                <Text color="$colorMuted">{delivery.dropoff.address}</Text>
                {delivery.dropoff.notes && (
                  <YStack
                    backgroundColor="$yellow2"
                    padding="$2"
                    borderRadius="$2"
                  >
                    <Text fontSize="$3" color="$orange10">
                      Note: {delivery.dropoff.notes}
                    </Text>
                  </YStack>
                )}
              </YStack>
              <Button
                backgroundColor="$primary"
                width={"100%"}
                icon={<Navigation size={18} />}
                onPress={handleNavigateToDropoff}
              >
                Navigate to Dropoff
              </Button>
            </YStack>
          </Card>

          {/* Order Items */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Package size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">
                  Order Items
                </Text>
              </XStack>
              <Separator />
              {delivery.items.map((item, index) => (
                <XStack
                  key={index}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <YStack>
                    <Text fontWeight="bold">{item.name}</Text>
                    <Text fontSize="$2" color="$colorMuted">
                      Qty: {item.quantity}
                    </Text>
                  </YStack>
                  <Text fontWeight="bold">
                    {formatPrice(
                      item.price * item.quantity,
                      item.currency || DEFAULT_CURRENCY,
                    )}
                  </Text>
                </XStack>
              ))}
              <Separator />
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Order Total</Text>
                <Text>
                  {formatPrice(
                    delivery.orderTotal,
                    delivery.currency || DEFAULT_CURRENCY,
                  )}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Delivery Fee</Text>
                <Text>
                  {formatPrice(
                    delivery.deliveryFee,
                    delivery.currency || DEFAULT_CURRENCY,
                  )}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontWeight="bold" color="$success">
                  Your Earnings
                </Text>
                <Text fontWeight="bold" color="$success">
                  {formatPrice(
                    delivery.earnings,
                    delivery.currency || DEFAULT_CURRENCY,
                  )}
                </Text>
              </XStack>
            </YStack>
          </Card>

          {/* Delivery Timeline */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                Delivery Timeline
              </Text>
              <Separator />
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={12}
                  height={12}
                  borderRadius="$10"
                  backgroundColor="$success"
                />
                <YStack flex={1}>
                  <Text fontWeight="bold">Order Accepted</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    {delivery.acceptedAt}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={12}
                  height={12}
                  borderRadius="$10"
                  backgroundColor={delivery.pickedUpAt ? "#3498db" : "$gray800"}
                />
                <YStack flex={1}>
                  <Text fontWeight="bold">Picked Up</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    {delivery.pickedUpAt || "Pending"}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={12}
                  height={12}
                  borderRadius="$10"
                  backgroundColor={
                    delivery.deliveredAt ? "$success" : "$gray800"
                  }
                />
                <YStack flex={1}>
                  <Text fontWeight="bold">Delivered</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    {delivery.deliveredAt || "Pending"}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </Card>

          {/* Action Buttons */}
          <YStack gap="$3">
            {delivery.status === "assigned" && (
              <Button
                size="$5"
                backgroundColor="$primary"
                onPress={() => handleStatusUpdate("picked_up")}
              >
                Confirm Pickup
              </Button>
            )}
            {delivery.status === "picked_up" && (
              <Button
                size="$5"
                width={"100%"}
                backgroundColor="#f39c12"
                onPress={() => handleStatusUpdate("delivering")}
              >
                Start Delivery
              </Button>
            )}
            {delivery.status === "delivering" && (
              <Button
                size="$5"
                backgroundColor="$success"
                onPress={() => handleStatusUpdate("delivered")}
              >
                Complete Delivery
              </Button>
            )}
            {delivery.status === "delivered" && (
              <Card padding="$4" bordered backgroundColor="$green2">
                <YStack alignItems="center" gap="$2">
                  <Text fontSize="$6">✓</Text>
                  <Text fontSize="$5" fontWeight="bold" color="$success">
                    Delivery Completed!
                  </Text>
                  <Text color="$colorMuted">
                    You earned{" "}
                    {formatPrice(
                      delivery.earnings,
                      delivery.currency || DEFAULT_CURRENCY,
                    )}
                  </Text>
                </YStack>
              </Card>
            )}
          </YStack>
        </YStack>
      </ScrollView>

      {/* Filter Bottom Sheet */}
      <Sheet
        modal
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        snapPoints={[60]}
        dismissOnSnapToBottom
        zIndex={100_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.5)"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />

          {/* Header */}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            paddingHorizontal="$5"
            paddingVertical="$4"
          >
            <Text
              fontSize="$6"
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              Filter Options
            </Text>
            <TouchableOpacity onPress={() => setFilterSheetOpen(false)}>
              <X size={24} color="$color" />
            </TouchableOpacity>
          </XStack>

          <Separator />

          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack padding="$5" gap="$5" paddingBottom="$8">
              {/* Status Filter */}
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                  Delivery Status
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {[
                    { value: "all", label: "All" },
                    { value: "assigned", label: "Assigned" },
                    { value: "picked_up", label: "Picked Up" },
                    { value: "delivering", label: "Delivering" },
                    { value: "delivered", label: "Delivered" },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setStatusFilter(option.value)}
                    >
                      <YStack
                        paddingHorizontal="$4"
                        paddingVertical="$2"
                        borderRadius="$4"
                        borderWidth={1}
                        borderColor={
                          statusFilter === option.value
                            ? "$primary"
                            : "$borderColor"
                        }
                        backgroundColor={
                          statusFilter === option.value
                            ? "$primary"
                            : "$background"
                        }
                      >
                        <Text
                          color={
                            statusFilter === option.value ? "white" : "$color"
                          }
                          fontWeight="600"
                        >
                          {option.label}
                        </Text>
                      </YStack>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </YStack>

              <Separator />

              {/* Date Filter */}
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                  Date Range
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {[
                    { value: "all", label: "All Time" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "This Week" },
                    { value: "month", label: "This Month" },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setDateFilter(option.value)}
                    >
                      <YStack
                        paddingHorizontal="$4"
                        paddingVertical="$2"
                        borderRadius="$4"
                        borderWidth={1}
                        borderColor={
                          dateFilter === option.value
                            ? "$primary"
                            : "$borderColor"
                        }
                        backgroundColor={
                          dateFilter === option.value
                            ? "$primary"
                            : "$background"
                        }
                      >
                        <Text
                          color={
                            dateFilter === option.value ? "white" : "$color"
                          }
                          fontWeight="600"
                        >
                          {option.label}
                        </Text>
                      </YStack>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </YStack>

              <Separator />

              {/* Earnings Filter */}
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                  Earnings Range
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {[
                    { value: "all", label: "All" },
                    {
                      value: "high",
                      label: `High (>${formatPrice(10, DEFAULT_CURRENCY)})`,
                    },
                    {
                      value: "medium",
                      label: `Medium (${formatPrice(5, DEFAULT_CURRENCY)}-10)`,
                    },
                    {
                      value: "low",
                      label: `Low (<${formatPrice(5, DEFAULT_CURRENCY)})`,
                    },
                  ].map((option) => (
                    <TouchableOpacity key={option.value}>
                      <YStack
                        paddingHorizontal="$4"
                        paddingVertical="$2"
                        borderRadius="$4"
                        borderWidth={1}
                        borderColor="$borderColor"
                        backgroundColor="$background"
                      >
                        <Text color="$color" fontWeight="600">
                          {option.label}
                        </Text>
                      </YStack>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </YStack>

              <Separator />

              {/* Distance Filter */}
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                  Distance
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {[
                    { value: "all", label: "All" },
                    { value: "near", label: "Near (<5km)" },
                    { value: "medium", label: "Medium (5-10km)" },
                    { value: "far", label: "Far (>10km)" },
                  ].map((option) => (
                    <TouchableOpacity key={option.value}>
                      <YStack
                        paddingHorizontal="$4"
                        paddingVertical="$2"
                        borderRadius="$4"
                        borderWidth={1}
                        borderColor="$borderColor"
                        backgroundColor="$background"
                      >
                        <Text color="$color" fontWeight="600">
                          {option.label}
                        </Text>
                      </YStack>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </YStack>

              {/* Action Buttons */}
              <YStack gap="$3" marginTop="$4">
                <Button
                  variant="outline"
                  width="100%"
                  onPress={() => {
                    setStatusFilter("all");
                    setDateFilter("all");
                  }}
                >
                  Reset Filters
                </Button>
                <Button
                  variant="primary"
                  width="100%"
                  onPress={() => setFilterSheetOpen(false)}
                >
                  Apply Filters
                </Button>
              </YStack>
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
