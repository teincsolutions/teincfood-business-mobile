// @ts-nocheck
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import {
  YStack,
  XStack,
  Text,
  Separator,
  Spinner,
  Sheet,
  useTheme,
  useMedia,
} from "tamagui";
import {
  MapPin,
  Navigation,
  Clock,
  Package,
  Phone,
  MessageCircle,
  ChefHat,
  Check,
  LocateFixed,
  AlertCircle,
} from "@tamagui/lucide-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, {
  AnimatedRegion,
  Marker,
  MarkerAnimated,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import polyline from "@mapbox/polyline";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  useRiderDeliveryDetailQuery,
  useRiderProfileQuery,
  useUpdateDeliveryStatusMutation,
  formatPrice,
  DEFAULT_CURRENCY,
  extractApiErrorMessage,
} from "@teincfood/core";
import { BackButton, Button } from "@/components/ui";
import { useRiderDeliveryRealtimeUpdates } from "@/hooks/useRiderDeliveryRealtimeUpdates";
import {
  DeliveryTimeline,
  getDeliveryStepIndex,
} from "@/components/tracking/DeliveryTimeline";
import { useRiderNavigationStore } from "@/stores/rider-navigation.store";
import {
  getDirectionsPolyline,
  estimateDurationSeconds,
} from "@/services/directions.service";
import { toast } from "sonner-native";

const DEFAULT_REGION = {
  latitude: 5.6037,
  longitude: -0.187,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const SNAP_POINTS = ["22%", "48%", "88%"];
const PICKED_UP_STATUSES = ["picked_up", "en_route", "arrived", "delivered"];

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function getStageLabel(status: string, pickupConfirmed: boolean) {
  switch (status) {
    case "assigned":
      return pickupConfirmed ? "Awaiting merchant handover" : "Heading to pickup";
    case "picked_up":
      return "Order picked up";
    case "en_route":
      return "On the way to customer";
    case "arrived":
      return "Arrived at customer";
    case "delivered":
      return "Delivery completed";
    case "failed":
      return "Delivery failed";
    case "returned_to_merchant":
      return "Returned to merchant";
    case "cancelled":
      return "Delivery cancelled";
    default:
      return "Delivery in progress";
  }
}

export default function RiderDeliveryDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const setNavigationTarget = useRiderNavigationStore(
    (state) => state.setNavigationTarget,
  );
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const media = useMedia();
  const theme = useTheme();

  useRiderDeliveryRealtimeUpdates();

  const { data: response, isLoading } = useRiderDeliveryDetailQuery(id as string);
  const delivery = response?.data ?? null;
  const updateStatus = useUpdateDeliveryStatusMutation();
  const { data: riderProfile } = useRiderProfileQuery();

  const sheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [pickupRouteCoords, setPickupRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [dropoffRouteCoords, setDropoffRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [pickupEtaSeconds, setPickupEtaSeconds] = useState<number | null>(null);
  const [dropoffEtaSeconds, setDropoffEtaSeconds] = useState<number | null>(null);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [issueSheetOpen, setIssueSheetOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const pickupPos = {
    lat: isNum(delivery?.pickup?.lat)
      ? delivery!.pickup!.lat
      : isNum(delivery?.pickup_lat)
        ? delivery!.pickup_lat
        : null,
    lng: isNum(delivery?.pickup?.lng)
      ? delivery!.pickup!.lng
      : isNum(delivery?.pickup_lng)
        ? delivery!.pickup_lng
        : null,
  };
  const dropoffPos = {
    lat: isNum(delivery?.dropoff?.lat)
      ? delivery!.dropoff!.lat
      : isNum(delivery?.dropoff_lat)
        ? delivery!.dropoff_lat
        : null,
    lng: isNum(delivery?.dropoff?.lng)
      ? delivery!.dropoff!.lng
      : isNum(delivery?.dropoff_lng)
        ? delivery!.dropoff_lng
        : null,
  };
  const hasPickup = isNum(pickupPos.lat) && isNum(pickupPos.lng);
  const hasDropoff = isNum(dropoffPos.lat) && isNum(dropoffPos.lng);
  const riderPos = {
    lat: isNum(riderProfile?.current_lat) ? riderProfile!.current_lat : null,
    lng: isNum(riderProfile?.current_lng) ? riderProfile!.current_lng : null,
  };
  const hasRider = isNum(riderPos.lat) && isNum(riderPos.lng);

  const riderCoordinate = useRef(
    new AnimatedRegion({
      latitude: riderPos.lat ?? DEFAULT_REGION.latitude,
      longitude: riderPos.lng ?? DEFAULT_REGION.longitude,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;
  const riderInitialised = useRef(false);

  useEffect(() => {
    if (!hasRider) return;
    if (!riderInitialised.current) {
      riderCoordinate.setValue({
        latitude: riderPos.lat!,
        longitude: riderPos.lng!,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });
      riderInitialised.current = true;
      return;
    }
    riderCoordinate
      .timing({
        latitude: riderPos.lat!,
        longitude: riderPos.lng!,
        duration: 800,
        useNativeDriver: false,
      })
      .start();
  }, [hasRider, riderPos.lat, riderPos.lng, riderCoordinate]);

  const pickupCompleted = PICKED_UP_STATUSES.includes(delivery?.status ?? "");
  const delivered = delivery?.status === "delivered";
  const pickupRouteColor =
    delivered || pickupCompleted ? theme.colorMuted.val : theme.primary.val;
  const dropoffRouteColor = delivered
    ? theme.colorMuted.val
    : pickupCompleted
      ? theme.primary.val
      : theme.colorMuted.val;
  const activeRouteCoords = pickupCompleted
    ? dropoffRouteCoords
    : pickupRouteCoords;

  const sheetHeight =
    screenHeight * (parseFloat(SNAP_POINTS[sheetIndex]) / 100);
  const sheetHeightRef = useRef(sheetHeight);

  useEffect(() => {
    sheetHeightRef.current = sheetHeight;
  }, [sheetHeight]);

  const fitRoute = useCallback(
    (bottomPadding = sheetHeightRef.current) => {
      const coords: { latitude: number; longitude: number }[] = [];
      if (hasPickup) {
        coords.push({ latitude: pickupPos.lat!, longitude: pickupPos.lng! });
      }
      if (hasDropoff) {
        coords.push({ latitude: dropoffPos.lat!, longitude: dropoffPos.lng! });
      }
      if (hasRider) {
        coords.push({ latitude: riderPos.lat!, longitude: riderPos.lng! });
      }
      coords.push(...pickupRouteCoords, ...dropoffRouteCoords);

      if (coords.length === 0) return;
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: {
          top: insets.top + 90,
          right: 48,
          bottom: bottomPadding + 32,
          left: 48,
        },
        animated: true,
      });
    },
    [
      hasPickup,
      hasDropoff,
      hasRider,
      pickupPos.lat,
      pickupPos.lng,
      dropoffPos.lat,
      dropoffPos.lng,
      riderPos.lat,
      riderPos.lng,
      pickupRouteCoords,
      dropoffRouteCoords,
      insets.top,
    ],
  );

  useEffect(() => {
    if (!hasPickup || !hasDropoff || !delivery) {
      setPickupRouteCoords([]);
      setDropoffRouteCoords([]);
      setPickupEtaSeconds(null);
      setDropoffEtaSeconds(null);
      setRoutesLoading(false);
      return;
    }

    setRoutesLoading(true);
    const pickup = { latitude: pickupPos.lat!, longitude: pickupPos.lng! };
    const dropoff = { latitude: dropoffPos.lat!, longitude: dropoffPos.lng! };
    const rider = hasRider
      ? { latitude: riderPos.lat!, longitude: riderPos.lng! }
      : null;

    let cancelled = false;
    async function loadRoutes() {
      const [dropoffResult, pickupResult] = await Promise.all([
        getDirectionsPolyline({
          orderId: delivery!.order_id,
          origin: pickup,
          destination: dropoff,
          leg: "dropoff",
        }),
        rider
          ? getDirectionsPolyline({
              orderId: delivery!.order_id,
              origin: rider,
              destination: pickup,
              leg: "pickup",
            })
          : Promise.resolve(null),
      ]);
      if (cancelled) return;

      const decode = (encoded: string | null) =>
        encoded
          ? polyline
              .decode(encoded)
              .map(([lat, lng]: [number, number]) => ({
                latitude: lat,
                longitude: lng,
              }))
          : [];

      const dropoffCoords = decode(dropoffResult?.polyline ?? null);
      const pickupCoords = decode(pickupResult?.polyline ?? null);

      setDropoffRouteCoords(dropoffCoords);
      setPickupRouteCoords(pickupCoords);
      setRoutesLoading(false);
      setDropoffEtaSeconds(
        dropoffResult?.durationSeconds ??
          dropoffResult?.staticDurationSeconds ??
          estimateDurationSeconds(pickup, dropoff),
      );
      setPickupEtaSeconds(
        rider
          ? (pickupResult?.durationSeconds ??
              pickupResult?.staticDurationSeconds ??
              estimateDurationSeconds(rider, pickup))
          : null,
      );

      const coords = [
        pickup,
        dropoff,
        ...(rider ? [rider] : []),
        ...pickupCoords,
        ...dropoffCoords,
      ];
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: {
            top: insets.top + 90,
            right: 48,
            bottom: sheetHeightRef.current + 32,
            left: 48,
          },
          animated: true,
        });
      }, 250);
    }

    void loadRoutes();
    return () => {
      cancelled = true;
    };
  }, [id, hasPickup, hasDropoff, hasRider, delivery?.order_id, insets.top]);

  const handleSheetChange = useCallback(
    (index: number) => {
      setSheetIndex(index);
      sheetHeightRef.current =
        screenHeight * (parseFloat(SNAP_POINTS[index]) / 100);
    },
    [screenHeight],
  );

  const handleRecenter = useCallback(() => {
    if (hasRider) {
      mapRef.current?.animateToRegion(
        {
          latitude: riderPos.lat!,
          longitude: riderPos.lng!,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        },
        600,
      );
      return;
    }
    fitRoute();
  }, [hasRider, riderPos.lat, riderPos.lng, fitRoute]);

  const handleNavigate = useCallback(() => {
    const target = pickupCompleted
      ? {
          name: delivery?.dropoff?.name ?? "Dropoff",
          address: delivery?.dropoff?.address ?? "",
          phone: delivery?.dropoff?.phone,
          latitude: dropoffPos.lat,
          longitude: dropoffPos.lng,
          notes: delivery?.dropoff?.notes,
          userId: delivery?.customer?.user_id,
          orderId: delivery?.order_id,
          orderNumber: delivery?.order_number,
          customerName: delivery?.customer?.name,
          kind: "dropoff" as const,
        }
      : {
          name: delivery?.pickup?.name ?? "Pickup",
          address: delivery?.pickup?.address ?? "",
          phone: delivery?.pickup?.phone,
          latitude: pickupPos.lat,
          longitude: pickupPos.lng,
          userId: delivery?.customer?.user_id,
          orderId: delivery?.order_id,
          orderNumber: delivery?.order_number,
          customerName: delivery?.customer?.name,
          kind: "pickup" as const,
        };

    if (!isNum(target.latitude) || !isNum(target.longitude)) return;
    setNavigationTarget(target);
    router.push("/(rider)/navigate");
  }, [
    pickupCompleted,
    delivery,
    dropoffPos.lat,
    dropoffPos.lng,
    pickupPos.lat,
    pickupPos.lng,
    setNavigationTarget,
    router,
  ]);

  const handleCall = (phoneNumber?: string) => {
    if (!phoneNumber) return;
    const url =
      Platform.OS === "ios" ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  const handleMessage = () => {
    const uid = delivery?.customer?.user_id;
    if (!uid || !delivery) return;
    router.push({
      pathname: "/(communication)/chat/direct",
      params: { userId: uid, orderId: delivery.order_id },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "$warning";
      case "picked_up":
        return "$info";
      case "en_route":
        return "$primary";
      case "arrived":
        return "$success";
      case "delivered":
        return "$success";
      default:
        return "$colorMuted";
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (!id) return;
    updateStatus.mutate(
      { deliveryId: id as string, action: newStatus },
      {
        onSuccess: () => {
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
          console.debug("[handleStatusUpdate] error", {
            deliveryId: id,
            action: newStatus,
            error,
          });
          toast.error(extractApiErrorMessage(error));
        },
      },
    );
  };

  if (isLoading || !delivery) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
      >
        <Spinner size="large" color="$primary" />
        <Text marginTop="$3" color="$colorSecondary">
          Loading delivery...
        </Text>
      </YStack>
    );
  }

  const stageLabel = getStageLabel(
    delivery.status,
    Boolean(delivery.rider_pickup_confirmed_at),
  );
  const totalEtaSeconds = pickupCompleted
    ? dropoffEtaSeconds
    : pickupEtaSeconds && dropoffEtaSeconds
      ? pickupEtaSeconds + dropoffEtaSeconds
      : (dropoffEtaSeconds ?? pickupEtaSeconds);
  const etaLabel = totalEtaSeconds
    ? `${Math.ceil(totalEtaSeconds / 60)} min`
    : delivery.eta_minutes
      ? `${delivery.eta_minutes} min`
      : "--";
  const routeReady =
    pickupRouteCoords.length > 0 || dropoffRouteCoords.length > 0;
  const itemsSummary =
    delivery.items && delivery.items.length > 0
      ? delivery.items
          .slice(0, 3)
          .map((item) => `${item.quantity}× ${item.name}`)
          .join(", ")
      : "No item details";

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        showsMyLocationButton={false}
        showsCompass
        showsScale
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled
        toolbarEnabled={false}
        mapPadding={{
          top: insets.top + 84,
          bottom: sheetHeight + 16,
          left: 16,
          right: 16,
        }}
      >
        {hasPickup ? (
          <Marker
            coordinate={{ latitude: pickupPos.lat!, longitude: pickupPos.lng! }}
            title={`Pickup: ${delivery.pickup?.name || "Restaurant"}`}
            description={delivery.pickup?.address || ""}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <YStack
              backgroundColor="$success"
              borderRadius="$full"
              padding="$2"
              borderWidth={3}
              borderColor="$background"
              alignItems="center"
              justifyContent="center"
            >
              <ChefHat size={18} color="white" />
            </YStack>
          </Marker>
        ) : null}

        {hasDropoff ? (
          <Marker
            coordinate={{
              latitude: dropoffPos.lat!,
              longitude: dropoffPos.lng!,
            }}
            title={`Dropoff: ${delivery.dropoff?.name || "Customer"}`}
            description={delivery.dropoff?.address || ""}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <YStack
              backgroundColor="$primary"
              borderRadius="$full"
              padding="$2"
              borderWidth={3}
              borderColor="$background"
              alignItems="center"
              justifyContent="center"
            >
              <MapPin size={18} color="white" />
            </YStack>
          </Marker>
        ) : null}

        {hasRider ? (
          <MarkerAnimated
            coordinate={riderCoordinate}
            title="You"
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <YStack
              backgroundColor="$color"
              borderRadius="$full"
              padding="$2"
              borderWidth={3}
              borderColor="$background"
              alignItems="center"
              justifyContent="center"
            >
              <Navigation size={18} color="white" />
            </YStack>
          </MarkerAnimated>
        ) : null}

        {activeRouteCoords.length > 0 ? (
          <Polyline
            coordinates={activeRouteCoords}
            strokeColor={theme.background.val}
            strokeWidth={13}
            lineCap="round"
            lineJoin="round"
            zIndex={1}
          />
        ) : null}

        {pickupRouteCoords.length > 0 ? (
          <Polyline
            coordinates={pickupRouteCoords}
            strokeColor={pickupRouteColor}
            strokeWidth={7}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        ) : null}

        {dropoffRouteCoords.length > 0 ? (
          <Polyline
            coordinates={dropoffRouteCoords}
            strokeColor={dropoffRouteColor}
            strokeWidth={7}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        ) : null}
      </MapView>

      <XStack
        position="absolute"
        top={insets.top + 8}
        left="$4"
        right="$4"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <BackButton />

        <YStack
          backgroundColor="$background"
          paddingHorizontal="$3"
          paddingVertical="$1.5"
          borderRadius="$full"
          shadowColor="$shadowColorStrong"
          shadowOpacity={1}
          shadowRadius={8}
          shadowOffset={{ width: 0, height: 2 }}
          elevation={3}
        >
          <Text fontSize="$2" fontWeight="700" color="$color">
            {stageLabel}
          </Text>
        </YStack>

        <YStack gap="$2">
          <Button
            circular
            width={40}
            height={40}
            backgroundColor="$background"
            pressStyle={{ backgroundColor: "$backgroundSoft" }}
            icon={<LocateFixed size={19} color="$color" />}
            onPress={handleRecenter}
          />
          <Button
            circular
            width={40}
            height={40}
            backgroundColor="$primary"
            pressStyle={{ backgroundColor: "$primaryDark" }}
            icon={<Navigation size={19} color="white" />}
            onPress={handleNavigate}
          />
        </YStack>
      </XStack>

      <BottomSheet
        ref={sheetRef}
        index={0}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose={false}
        onChange={handleSheetChange}
        backgroundStyle={{
          backgroundColor: theme.background.val,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colorMuted.val,
          width: 42,
        }}
      >
        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 28,
          }}
        >
          <YStack gap="$4">
            <XStack
              justifyContent="space-between"
              alignItems="flex-start"
              paddingTop="$1"
            >
              <YStack flex={1} gap="$1">
                <Text fontSize="$3" color="$colorSecondary">
                  Current stage
                </Text>
                <Text
                  fontSize="$7"
                  fontWeight="800"
                  fontFamily="$heading"
                  color="$color"
                >
                  {stageLabel}
                </Text>
              </YStack>
              <YStack alignItems="flex-end" gap="$1">
                <Text fontSize="$3" color="$colorSecondary">
                  ETA
                </Text>
                <Text
                  fontSize="$6"
                  fontWeight="800"
                  fontFamily="$heading"
                  color="$primary"
                >
                  {etaLabel}
                </Text>
              </YStack>
            </XStack>

            <XStack gap="$2" alignItems="center">
              <Text fontSize="$3" fontWeight="700" color="$color">
                {delivery.order_number}
              </Text>
              <Text color="$colorMuted">•</Text>
              <Text
                fontSize="$3"
                color="$colorSecondary"
                flex={1}
                numberOfLines={1}
              >
                {delivery.dropoff?.name ||
                  delivery.dropoff?.address ||
                  "Dropoff location"}
              </Text>
            </XStack>

            {!routesLoading && !routeReady && hasPickup && hasDropoff ? (
              <XStack
                gap="$2"
                alignItems="center"
                backgroundColor="$backgroundOrange"
                padding="$3"
                borderRadius="$3"
              >
                <AlertCircle size={16} color="$primary" />
                <Text fontSize="$2" color="$colorSecondary" flex={1}>
                  Route unavailable right now. Showing pickup and dropoff
                  locations.
                </Text>
              </XStack>
            ) : null}

            {pickupEtaSeconds || dropoffEtaSeconds ? (
              <XStack gap="$4">
                <XStack gap="$2" alignItems="center">
                  <YStack
                    width={14}
                    height={4}
                    borderRadius="$full"
                    backgroundColor={
                      pickupCompleted ? "$colorMuted" : "$primary"
                    }
                  />
                  <Text fontSize="$2" color="$colorSecondary">
                    To pickup{" "}
                    {pickupEtaSeconds
                      ? `${Math.ceil(pickupEtaSeconds / 60)} min`
                      : "--"}
                  </Text>
                </XStack>
                <XStack gap="$2" alignItems="center">
                  <YStack
                    width={14}
                    height={4}
                    borderRadius="$full"
                    backgroundColor={
                      pickupCompleted ? "$primary" : "$colorMuted"
                    }
                  />
                  <Text fontSize="$2" color="$colorSecondary">
                    To customer{" "}
                    {dropoffEtaSeconds
                      ? `${Math.ceil(dropoffEtaSeconds / 60)} min`
                      : "--"}
                  </Text>
                </XStack>
              </XStack>
            ) : null}

            <Separator />

            <DeliveryTimeline
              currentStep={getDeliveryStepIndex(delivery.status)}
              status={delivery.status}
            />

            <Separator />

            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="700" color="$color">
                  Pickup
                </Text>
                {delivery.pickup?.phone ? (
                  <Button
                    height={36}
                    variant="outline"
                    icon={<Phone size={14} />}
                    onPress={() => handleCall(delivery.pickup?.phone)}
                  >
                    Call
                  </Button>
                ) : null}
              </XStack>
              <Text fontWeight="700" color="$color">
                {delivery.pickup?.name || "Restaurant"}
              </Text>
              <Text fontSize="$3" color="$colorSecondary">
                {delivery.pickup?.address || "Pickup address unavailable"}
              </Text>
            </YStack>

            <Separator />

            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="700" color="$color">
                  Dropoff
                </Text>
                <XStack gap="$2">
                  {delivery.customer?.phone ? (
                    <Button
                      height={36}
                      variant="outline"
                      icon={<Phone size={14} />}
                      onPress={() => handleCall(delivery.customer?.phone)}
                    >
                      Call
                    </Button>
                  ) : null}
                  {delivery.customer?.user_id ? (
                    <Button
                      height={36}
                      variant="outline"
                      icon={<MessageCircle size={14} />}
                      onPress={handleMessage}
                    >
                      Message
                    </Button>
                  ) : null}
                </XStack>
              </XStack>
              <Text fontWeight="700" color="$color">
                {delivery.customer?.name || delivery.dropoff?.name || "Customer"}
              </Text>
              <Text fontSize="$3" color="$colorSecondary">
                {delivery.dropoff?.address || "Dropoff address unavailable"}
              </Text>
              {delivery.dropoff?.notes ? (
                <YStack
                  backgroundColor="$backgroundOrange"
                  padding="$2"
                  borderRadius="$2"
                >
                  <Text fontSize="$2" color="$colorSecondary">
                    Note: {delivery.dropoff.notes}
                  </Text>
                </YStack>
              ) : null}
            </YStack>

            <Separator />

            <YStack gap="$2">
              <XStack justifyContent="space-between">
                <Text fontSize="$5" fontWeight="700" color="$color">
                  Order
                </Text>
                <Text fontSize="$3" color="$colorSecondary">
                  {delivery.order_number}
                </Text>
              </XStack>
              <XStack gap="$2" alignItems="center">
                <Package size={15} color="$colorMuted" />
                <Text fontSize="$3" color="$colorSecondary" flex={1}>
                  {itemsSummary}
                </Text>
              </XStack>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" color="$colorSecondary">
                  Order total
                </Text>
                <Text fontSize="$3" color="$color">
                  {formatPrice(
                    (delivery.order_total_minor ?? 0) / 100,
                    delivery.currency || DEFAULT_CURRENCY,
                  )}
                </Text>
              </XStack>
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$2" alignItems="center">
                  <Clock size={15} color="$colorMuted" />
                  <Text fontSize="$3" color="$colorSecondary">
                    Delivery earnings
                  </Text>
                </XStack>
                <Text fontWeight="700" color="$success">
                  +
                  {formatPrice(
                    (delivery.delivery_fee_minor ?? 0) / 100,
                    delivery.currency || DEFAULT_CURRENCY,
                  )}
                </Text>
              </XStack>
            </YStack>

            <Separator />

            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="700" color="$color">
                  Actions
                </Text>
                <YStack
                  backgroundColor={getStatusColor(delivery.status)}
                  paddingHorizontal="$2"
                  paddingVertical="$0.5"
                  borderRadius="$full"
                >
                  <Text fontSize="$1" fontWeight="700" color="white">
                    {delivery.status.replace("_", " ")}
                  </Text>
                </YStack>
              </XStack>

              <Button
                variant="outline"
                width="100%"
                icon={<Navigation size={18} />}
                onPress={handleNavigate}
              >
                {pickupCompleted
                  ? "Navigate to Customer"
                  : "Navigate to Restaurant"}
              </Button>

              {delivery.status === "assigned" ? (
                delivery.rider_pickup_confirmed_at ? (
                  <Button
                    width="100%"
                    variant="warning"
                    disabled
                    icon={<Check size={18} />}
                  >
                    Awaiting merchant handover
                  </Button>
                ) : (
                  <Button
                    width="100%"
                    onPress={() => handleStatusUpdate("confirm-pickup")}
                    disabled={updateStatus.isPending}
                    loading={updateStatus.isPending}
                  >
                    Confirm Pickup
                  </Button>
                )
              ) : null}

              {delivery.status === "picked_up" ? (
                <Button
                  width="100%"
                  variant="warning"
                  onPress={() => handleStatusUpdate("in-transit")}
                  disabled={updateStatus.isPending}
                  loading={updateStatus.isPending}
                >
                  Start Delivery
                </Button>
              ) : null}

              {delivery.status === "en_route" ? (
                <Button
                  width="100%"
                  variant="info"
                  onPress={() => handleStatusUpdate("arrived")}
                  disabled={updateStatus.isPending}
                  loading={updateStatus.isPending}
                >
                  Arrived at Dropoff
                </Button>
              ) : null}

              {delivery.status === "arrived" ? (
                <Button
                  width="100%"
                  variant="success"
                  onPress={() => setConfirmAction("delivered")}
                  disabled={updateStatus.isPending}
                >
                  Complete Delivery
                </Button>
              ) : null}

              {delivery.status === "delivered" ? (
                <YStack
                  backgroundColor="$backgroundOrange"
                  padding="$3"
                  borderRadius="$3"
                  alignItems="center"
                  gap="$1"
                >
                  <Text fontSize="$5" fontWeight="700" color="$success">
                    Delivery completed
                  </Text>
                  <Text fontSize="$3" color="$colorSecondary">
                    You earned{" "}
                    {formatPrice(
                      (delivery.delivery_fee_minor ?? 0) / 100,
                      delivery.currency || DEFAULT_CURRENCY,
                    )}
                  </Text>
                </YStack>
              ) : null}

              {["picked_up", "en_route", "arrived"].includes(
                delivery.status,
              ) ? (
                <Button
                  width="100%"
                  variant="dangerOutline"
                  onPress={() => setIssueSheetOpen(true)}
                >
                  Report Issue
                </Button>
              ) : null}
            </YStack>
          </YStack>
        </BottomSheetScrollView>
      </BottomSheet>

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
          backgroundColor="$shadowColorStrong"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          padding="$6"
          {...(media.md || media.lg
            ? { maxWidth: 600, alignSelf: "center" }
            : {})}
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
                variant="success"
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
          backgroundColor="$shadowColorStrong"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          padding="$6"
          {...(media.md || media.lg
            ? { maxWidth: 600, alignSelf: "center" }
            : {})}
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4" paddingTop="$4">
            <Text fontSize="$6" fontWeight="bold">
              Report Issue
            </Text>
            <Button
              width="100%"
              variant="danger"
              onPress={() => {
                setIssueSheetOpen(false);
                setConfirmAction("failed");
              }}
            >
              Customer Not Found — Mark Failed
            </Button>
            <Button
              width="100%"
              variant="warning"
              onPress={() => {
                setIssueSheetOpen(false);
                setConfirmAction("returned");
              }}
            >
              Return to Merchant
            </Button>
            <Button
              width="100%"
              variant="outline"
              onPress={() => setIssueSheetOpen(false)}
            >
              Cancel
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>

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
          backgroundColor="$shadowColorStrong"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          padding="$6"
          {...(media.md || media.lg
            ? { maxWidth: 600, alignSelf: "center" }
            : {})}
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
                ? "This will end the delivery and mark it as failed."
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
                variant="danger"
                onPress={() => {
                  const action = confirmAction;
                  setConfirmAction(null);
                  handleStatusUpdate(action!);
                }}
              >
                Confirm
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
