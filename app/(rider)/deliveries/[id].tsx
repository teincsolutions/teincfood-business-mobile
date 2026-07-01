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
} from "@/hooks/useRider";
import type { RiderDeliveryDetail } from "@/types/api/rider.api";
import { BackButton, Button } from "@/components/ui";
import { formatPrice, DEFAULT_CURRENCY } from "@/utils/currency";
import { useRiderDeliveryRealtimeUpdates } from "@/hooks/useRiderDeliveryRealtimeUpdates";
import { extractApiErrorMessage } from "@/utils/error";
import { toast } from "sonner-native";

/**
 * Rider Delivery Details Screen
 */
export default function RiderDeliveryDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Real-time delivery status updates
  useRiderDeliveryRealtimeUpdates();

  // TanStack Query hooks
  const { data: response, isLoading } = useDeliveryDetailQuery(id as string);
  const delivery = response?.data ?? null;
  const updateStatus = useUpdateDeliveryStatusMutation();

  // Filter state
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [issueSheetOpen, setIssueSheetOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "#FFA500";
      case "picked_up":
        return "#3498db";
      case "en_route":
        return "#f39c12";
      case "arrived":
        return "#2ecc71";
      case "delivered":
        return "$success";
      default:
        return "#95a5a6";
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    console.log("[handleStatusUpdate] called with:", {
      deliveryId: id,
      status: newStatus,
    });
    if (id) {
      updateStatus.mutate(
        { deliveryId: id as string, action: newStatus },
        {
          onSuccess: () => {
            console.log("[handleStatusUpdate] success for:", {
              deliveryId: id,
              action: newStatus,
            });
            if (newStatus === "confirm-pickup") {
              toast.success("Pickup confirmed! Awaiting merchant handover.");
            } else if (newStatus === "in-transit") {
              toast.success("En route to dropoff!");
            } else if (newStatus === "arrived") {
              toast.success("Arrived at dropoff!");
            } else if (newStatus === "delivered") {
              toast.success("Delivery completed!");
            } else if (newStatus === "failed") {
              toast.success("Delivery marked as failed.");
            } else if (newStatus === "returned") {
              toast.success("Delivery returned to merchant.");
            }
          },
          onError: (error) => {
            console.debug("[handleStatusUpdate] error for:", {
              deliveryId: id,
              action: newStatus,
              error,
            });
            toast.error(extractApiErrorMessage(error));
          },
        },
      );
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
                  {delivery.order_number}
                </Text>
                <XStack gap="$2" alignItems="center">
                  <Clock size={16} color="$colorMuted" />
                  <Text fontSize="$3" color="$colorMuted">
                    {delivery.eta_minutes
                      ? `${delivery.eta_minutes} min`
                      : "--"}
                  </Text>
                </XStack>
              </XStack>
              <Separator />
              <XStack gap="$3" alignItems="center">
                <Clock size={16} color="$colorMuted" />
                <Text fontSize="$3">
                  ETA:{" "}
                  {delivery.eta_minutes
                    ? `${delivery.eta_minutes} min`
                    : "Calculating..."}
                </Text>
                <Text
                  flex={1}
                  textAlign="right"
                  fontSize="$5"
                  fontWeight="bold"
                  color="$success"
                >
                  +{delivery.currency}{" "}
                  {((delivery.delivery_fee_minor ?? 0) / 100).toFixed(2)}
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
                      (item.price * item.quantity) / 100,
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
                    (delivery.order_total_minor ?? 0) / 100,
                    delivery.currency || DEFAULT_CURRENCY,
                  )}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Delivery Fee</Text>
                <Text>
                  {formatPrice(
                    (delivery.delivery_fee_minor ?? 0) / 100,
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
                    (delivery.delivery_fee_minor ?? 0) / 100,
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
                  backgroundColor={
                    delivery.status !== "assigned" ? "$success" : "$gray800"
                  }
                />
                <YStack flex={1}>
                  <Text fontWeight="bold">Assigned</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    {delivery.inserted_at
                      ? new Date(delivery.inserted_at).toLocaleString()
                      : "--"}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={12}
                  height={12}
                  borderRadius="$10"
                  backgroundColor={
                    ["picked_up", "en_route", "arrived", "delivered"].includes(
                      delivery.status,
                    )
                      ? "#3498db"
                      : "$gray800"
                  }
                />
                <YStack flex={1}>
                  <Text fontWeight="bold">Picked Up</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    {["picked_up", "en_route", "arrived", "delivered"].includes(
                      delivery.status,
                    )
                      ? "Confirmed"
                      : "Pending"}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={12}
                  height={12}
                  borderRadius="$10"
                  backgroundColor={
                    ["en_route", "arrived", "delivered"].includes(
                      delivery.status,
                    )
                      ? "#3498db"
                      : "$gray800"
                  }
                />
                <YStack flex={1}>
                  <Text fontWeight="bold">En Route</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    {["en_route", "arrived", "delivered"].includes(
                      delivery.status,
                    )
                      ? "In transit"
                      : "Pending"}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={12}
                  height={12}
                  borderRadius="$10"
                  backgroundColor={
                    ["arrived", "delivered"].includes(delivery.status)
                      ? "#3498db"
                      : "$gray800"
                  }
                />
                <YStack flex={1}>
                  <Text fontWeight="bold">Delivered</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    {delivery.status === "delivered" ? "Completed" : "Pending"}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </Card>

          {/* Action Buttons */}
          <YStack gap="$3">
            {delivery.status === "assigned" &&
              (updateStatus.isSuccess &&
              updateStatus.variables?.action === "confirm-pickup" ? (
                <Button
                  size="$5"
                  backgroundColor="$yellow10"
                  disabled
                  icon={<Check size={18} />}
                >
                  Awaiting merchant handover
                </Button>
              ) : (
                <Button
                  size="$5"
                  backgroundColor="$primary"
                  onPress={() => handleStatusUpdate("confirm-pickup")}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? "Confirming..." : "Confirm Pickup"}
                </Button>
              ))}
            {delivery.status === "picked_up" && (
              <Button
                size="$5"
                width={"100%"}
                backgroundColor="#f39c12"
                onPress={() => handleStatusUpdate("in-transit")}
              >
                Start Delivery
              </Button>
            )}
            {delivery.status === "en_route" && (
              <Button
                size="$5"
                backgroundColor="#3498db"
                onPress={() => handleStatusUpdate("arrived")}
              >
                Arrived at Dropoff
              </Button>
            )}
            {delivery.status === "arrived" && (
              <>
                <Button
                  size="$5"
                  backgroundColor="$success"
                  onPress={() => setConfirmAction("delivered")}
                >
                  Complete Delivery
                </Button>
              </>
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
                      (delivery.delivery_fee_minor ?? 0) / 100,
                      delivery.currency || DEFAULT_CURRENCY,
                    )}
                  </Text>
                </YStack>
              </Card>
            )}
            {["picked_up", "en_route", "arrived"].includes(delivery.status) && (
              <Button
                size="$5"
                variant="outline"
                borderColor="$red10"
                color="$red10"
                onPress={() => setIssueSheetOpen(true)}
              >
                Report Issue
              </Button>
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
                    { value: "en_route", label: "En Route" },
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

      {/* Confirm Complete Delivery */}
      <Sheet
        modal
        open={confirmAction === "delivered"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        snapPoints={[35]}
        dismissOnSnapToBottom
        zIndex={200_000}
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
          padding="$6"
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4" alignItems="center" paddingTop="$4">
            <Text fontSize="$6" fontWeight="bold">
              Complete Delivery?
            </Text>
            <Text fontSize="$4" color="$colorMuted" textAlign="center">
              Confirm that you have handed the order to the customer.
            </Text>
            <XStack gap="$3" width="100%">
              <Button
                flex={1}
                variant="outline"
                onPress={() => setConfirmAction(null)}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                backgroundColor="$success"
                onPress={() => {
                  setConfirmAction(null);
                  handleStatusUpdate("delivered");
                }}
              >
                Confirm
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Report Issue Sheet */}
      <Sheet
        modal
        open={issueSheetOpen}
        onOpenChange={setIssueSheetOpen}
        snapPoints={[40]}
        dismissOnSnapToBottom
        zIndex={200_000}
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
          padding="$6"
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4" paddingTop="$4">
            <Text fontSize="$6" fontWeight="bold">
              Report Issue
            </Text>
            <Button
              size="$5"
              backgroundColor="$red10"
              onPress={() => {
                setIssueSheetOpen(false);
                setConfirmAction("failed");
              }}
            >
              Customer Not Found — Mark Failed
            </Button>
            <Button
              size="$5"
              backgroundColor="$orange10"
              onPress={() => {
                setIssueSheetOpen(false);
                setConfirmAction("returned");
              }}
            >
              Return to Merchant
            </Button>
            <Button
              size="$5"
              variant="outline"
              onPress={() => setIssueSheetOpen(false)}
            >
              Cancel
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Confirm Failed/Returned */}
      <Sheet
        modal
        open={confirmAction === "failed" || confirmAction === "returned"}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
        snapPoints={[35]}
        dismissOnSnapToBottom
        zIndex={200_000}
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
          padding="$6"
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4" alignItems="center" paddingTop="$4">
            <Text fontSize="$6" fontWeight="bold">
              {confirmAction === "failed"
                ? "Mark as Failed?"
                : "Return to Merchant?"}
            </Text>
            <Text fontSize="$4" color="$colorMuted" textAlign="center">
              {confirmAction === "failed"
                ? "This will end the delivery and mark it as failed. The order will be cancelled."
                : "This will end the delivery and return the order to the merchant."}
            </Text>
            <XStack gap="$3" width="100%">
              <Button
                flex={1}
                variant="outline"
                onPress={() => setConfirmAction(null)}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                backgroundColor="$red10"
                onPress={() => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  handleStatusUpdate(action);
                }}
              >
                Confirm
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
