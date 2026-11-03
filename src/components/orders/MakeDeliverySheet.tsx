// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Input,
  Sheet,
  Spinner,
  Separator,
} from "tamagui";
import {
  Bike,
  Check,
  MapPin,
  Search,
} from "@tamagui/lucide-icons";
import { toast } from "sonner-native";
import { usePlaceDetails, usePlacesSearch } from "@teincfood/core";
import { Button } from "@/components/ui";
import { useAvailableRidersQuery } from "@/hooks/kiosk.hooks";
import { useAssignRiderMutation } from "@/hooks/kiosk.hooks";
import { useConvertOrderToDeliveryMutation } from "@/hooks/useMakeDeliveryOrder";
import { useConnectivityStore } from "@/stores/connectivity.store";
import type { PlaceDetails } from "@/services/places.service";

interface MakeDeliverySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any | null;
  onDone?: () => void;
}

/**
 * Seller-side delivery conversion flow.
 *
 * Converts a takeout/dine-in order into a delivery order using the backend
 * conversion endpoint. When the order is already ready, the cashier can pick
 * a rider in the same flow; otherwise rider assignment stays available from
 * the normal ready-order action.
 */
export function MakeDeliverySheet({
  open,
  onOpenChange,
  order,
  onDone,
}: MakeDeliverySheetProps) {
  const { query, setQuery, suggestions, isLoading, clearAll } =
    usePlacesSearch(350);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isOnline = useConnectivityStore(
    (state) => state.isOnline && state.isCloudReachable !== "unreachable",
  );

  const canAssignRider =
    order && ["ready", "waiting_pickup"].includes(order.status);
  const { data: riders = [] } = useAvailableRidersQuery(
    open && Boolean(canAssignRider),
  );
  const { details, isLoading: detailsLoading } =
    usePlaceDetails(selectedPlaceId);
  const convert = useConvertOrderToDeliveryMutation();
  const assignRider = useAssignRiderMutation();

  useEffect(() => {
    if (details) {
      setSelectedPlace(details);
    }
  }, [details]);

  useEffect(() => {
    if (open) return;
    setSelectedPlaceId(null);
    setSelectedPlace(null);
    setSelectedRiderId(null);
    setSubmitting(false);
    clearAll();
  }, [open, clearAll]);

  const availableRiders = useMemo(
    () =>
      (riders ?? []).filter(
        (rider: any) =>
          rider &&
          rider.id &&
          rider.status !== "offline" &&
          rider.is_active !== false,
      ),
    [riders],
  );

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
  };

  const handleSelectPlace = (suggestion: any) => {
    setSelectedPlaceId(suggestion.placeId);
    setQuery(suggestion.description || suggestion.mainText || "");
  };

  const handleConfirm = async () => {
    if (!order) return;
    if (!selectedPlace) {
      toast.error("Choose the delivery address first");
      return;
    }

    setSubmitting(true);
    try {
      await convert.mutateAsync({
        orderId: order.id,
        delivery: {
          address: selectedPlace.formattedAddress,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          city: selectedPlace.city,
          region: selectedPlace.region,
          customer_phone: order.customer_phone,
        },
      });

      if (selectedRiderId && canAssignRider) {
        try {
          await assignRider.mutateAsync({
            orderId: order.id,
            riderId: selectedRiderId,
          });
          toast.success("Order is now delivery and a rider is assigned");
        } catch (error) {
          toast.error(
            `Order is now delivery, but rider assignment failed: ${
              error instanceof Error ? error.message : "try again from Orders"
            }`,
          );
        }
      } else {
        toast.success(
          canAssignRider
            ? "Order is now a delivery order"
            : "Order is now a delivery order — assign a rider when it is ready",
        );
      }

      onDone?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not make this delivery",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
        else onOpenChange(next);
      }}
      snapPointsMode="percent"
      snapPoints={[88]}
      position={0}
      dismissOnSnapToBottom
      zIndex={200_000}
      animation="bouncy"
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0,0,0,0.6)"
      />
      <Sheet.Handle backgroundColor="$gray200" />
      <Sheet.Frame
        padding="$5"
        backgroundColor="$background"
        borderTopLeftRadius="$8"
        borderTopRightRadius="$8"
      >
        <YStack flex={1} gap="$4">
          <YStack gap="$1">
            <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
              Make Delivery
            </Text>
            <Text fontSize="$3" color="$colorSecondary">
              {order?.order_number
                ? `Add a delivery address to ${order.order_number}`
                : "Add a delivery address to this order"}
            </Text>
            {!isOnline ? (
              <Text fontSize="$2" color="$warning">
                Making an order delivery requires an internet connection.
              </Text>
            ) : null}
          </YStack>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <YStack gap="$4" paddingBottom="$4">
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="700">
                  Delivery address
                </Text>
                <XStack
                  alignItems="center"
                  gap="$2"
                  borderWidth={1}
                  borderColor="$borderColor"
                  backgroundColor="$backgroundSoft"
                  borderRadius="$3"
                  paddingHorizontal="$3"
                  height={46}
                >
                  <Search size={16} color="$colorMuted" />
                  <Input
                    flex={1}
                    borderWidth={0}
                    backgroundColor="transparent"
                    placeholder="Search address, landmark or area"
                    value={query}
                    onChangeText={(value) => {
                      setQuery(value);
                      setSelectedPlaceId(null);
                      setSelectedPlace(null);
                    }}
                  />
                  {isLoading || detailsLoading ? (
                    <Spinner size="small" color="$primary" />
                  ) : null}
                </XStack>

                {suggestions.length > 0 && !selectedPlace ? (
                  <YStack
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$3"
                    overflow="hidden"
                    backgroundColor="$background"
                  >
                    {suggestions.slice(0, 6).map((suggestion, index) => (
                      <YStack key={suggestion.placeId}>
                        <YStack
                          padding="$3"
                          pressStyle={{ backgroundColor: "$backgroundSoft" }}
                          onPress={() => handleSelectPlace(suggestion)}
                        >
                          <Text fontSize="$3" fontWeight="600">
                            {suggestion.mainText || suggestion.description}
                          </Text>
                          {suggestion.secondaryText ? (
                            <Text fontSize="$2" color="$colorSecondary">
                              {suggestion.secondaryText}
                            </Text>
                          ) : null}
                        </YStack>
                        {index < Math.min(suggestions.length, 6) - 1 ? (
                          <Separator />
                        ) : null}
                      </YStack>
                    ))}
                  </YStack>
                ) : null}

                {selectedPlace ? (
                  <XStack
                    gap="$2"
                    alignItems="flex-start"
                    backgroundColor="$backgroundOrange"
                    borderRadius="$3"
                    padding="$3"
                  >
                    <MapPin size={17} color="$primary" />
                    <YStack flex={1}>
                      <Text fontSize="$3" fontWeight="700" color="$primary">
                        Selected delivery address
                      </Text>
                      <Text fontSize="$3" color="$color">
                        {selectedPlace.formattedAddress}
                      </Text>
                    </YStack>
                    <Check size={17} color="$success" />
                  </XStack>
                ) : null}
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="700">
                  Rider
                </Text>
                {!canAssignRider ? (
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    backgroundColor="$backgroundSoft"
                    borderRadius="$3"
                    padding="$3"
                  >
                    This order is not ready yet. Mark it ready first, then assign
                    a rider from the order actions.
                  </Text>
                ) : availableRiders.length === 0 ? (
                  <Text fontSize="$3" color="$colorSecondary">
                    No available riders right now. The order can still be
                    converted; assign a rider later.
                  </Text>
                ) : (
                  <YStack gap="$2">
                    {availableRiders.map((rider: any) => {
                      const selected = selectedRiderId === rider.id;
                      return (
                        <XStack
                          key={rider.id}
                          gap="$3"
                          alignItems="center"
                          padding="$3"
                          borderRadius="$3"
                          borderWidth={1}
                          borderColor={selected ? "$primary" : "$borderColor"}
                          backgroundColor={
                            selected ? "$backgroundOrange" : "$backgroundSoft"
                          }
                          onPress={() => setSelectedRiderId(rider.id)}
                        >
                          <YStack
                            width={36}
                            height={36}
                            borderRadius="$full"
                            alignItems="center"
                            justifyContent="center"
                            backgroundColor={selected ? "$primary" : "$background"}
                          >
                            <Bike
                              size={17}
                              color={selected ? "white" : "$primary"}
                            />
                          </YStack>
                          <YStack flex={1}>
                            <Text fontSize="$3" fontWeight="700">
                              {rider.name || rider.user?.full_name || "Rider"}
                            </Text>
                            <Text fontSize="$2" color="$colorSecondary">
                              {[rider.rider_number, rider.vehicle_type]
                                .filter(Boolean)
                                .join(" · ") || "Available rider"}
                            </Text>
                          </YStack>
                          {selected ? <Check size={18} color="$primary" /> : null}
                        </XStack>
                      );
                    })}
                  </YStack>
                )}
              </YStack>
            </YStack>
          </ScrollView>

          <XStack gap="$3">
            <Button
              flex={1}
              variant="outline"
              height={48}
              disabled={submitting}
              onPress={handleClose}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              variant="primary"
              height={48}
              disabled={
                submitting ||
                !isOnline ||
                !selectedPlace ||
                detailsLoading ||
                convert.isPending ||
                assignRider.isPending
              }
              onPress={handleConfirm}
            >
              {submitting || convert.isPending || assignRider.isPending
                ? "Converting..."
                : selectedRiderId
                  ? "Convert & Assign Rider"
                  : "Make Delivery"}
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
