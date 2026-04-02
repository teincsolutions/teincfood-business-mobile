// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { ScrollView, TouchableOpacity, Linking, Platform } from "react-native";
import { YStack, XStack, Text, Card, Button, Separator, Avatar } from "tamagui";
import {
  MapPin,
  Navigation,
  Clock,
  Package,
  Phone,
  MessageCircle,
  User,
  ArrowLeft,
  ExternalLink,
} from "@tamagui/lucide-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useResponsive } from "@/utils/responsive";

interface LocationData {
  name: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  notes?: string;
}

interface OrderInfo {
  orderId: string;
  customerName: string;
  customerPhone: string;
  earnings: number;
  estimatedTime: string;
  status: string;
}

/**
 * Reusable Navigation Screen
 * Can be used for pickup/dropoff navigation with map view and order info footer
 */
export default function NavigationScreen() {
  const router = useRouter();
  const { location: locationParam } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();

  // Parse location data from URL params
  const locationData: LocationData = locationParam
    ? JSON.parse(decodeURIComponent(locationParam as string))
    : null;

  // Mock order data - in real app, this would come from context or API
  const orderInfo: OrderInfo = {
    orderId: "#ORD-001",
    customerName: locationData?.name || "Customer",
    customerPhone: locationData?.phone || "+233201234567",
    earnings: 12.5,
    estimatedTime: "15 min",
    status: "picked_up",
  };

  const handleCall = () => {
    const phoneNumber = locationData?.phone || orderInfo.customerPhone;
    const url =
      Platform.OS === "ios" ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  const handleMessage = () => {
    const phoneNumber = locationData?.phone || orderInfo.customerPhone;
    router.push(`/(communication)/chat/${phoneNumber}`);
  };

  const handleOpenMaps = () => {
    if (!locationData) return;

    const { lat, lng, name } = locationData;
    const encodedName = encodeURIComponent(name);
    let url: string;

    if (Platform.OS === "ios") {
      url = `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodedName}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedName}`;
    }

    Linking.openURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "#FFA500";
      case "picked_up":
        return "#3498db";
      case "delivering":
        return "#f39c12";
      case "delivered":
        return "#27ae60";
      default:
        return "#95a5a6";
    }
  };

  if (!locationData) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
      >
        <Text>No location data provided</Text>
        <Button marginTop="$4" onPress={() => router.back()}>
          Go Back
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Map View Area */}
      <YStack flex={1} position="relative">
        {/* Map View */}
        <MapView
          style={{ flex: 1 }}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: locationData.lat,
            longitude: locationData.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: locationData.lat,
              longitude: locationData.lng,
            }}
            title={locationData.name}
            description={locationData.address}
          />
        </MapView>

        {/* Route Info Overlay */}
        <YStack
          position="absolute"
          top={insets.top + 80}
          left="$4"
          right="$4"
          backgroundColor="$background"
          padding="$4"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <XStack gap="$3" alignItems="center">
            <YStack backgroundColor="$primary" padding="$2" borderRadius="$10">
              <Navigation size={20} color="white" />
            </YStack>
            <YStack flex={1}>
              <Text fontSize="$3" color="$colorMuted">
                Destination
              </Text>
              <Text fontSize="$4" fontWeight="bold">
                {locationData.name}
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                {locationData.address}
              </Text>
            </YStack>
            <TouchableOpacity onPress={handleOpenMaps}>
              <YStack backgroundColor="$blue10" padding="$2" borderRadius="$2">
                <ExternalLink size={20} color="white" />
              </YStack>
            </TouchableOpacity>
          </XStack>

          {locationData.notes && (
            <YStack
              marginTop="$3"
              backgroundColor="$yellow2"
              padding="$2"
              borderRadius="$2"
            >
              <Text fontSize="$3" color="$orange10">
                Note: {locationData.notes}
              </Text>
            </YStack>
          )}
        </YStack>

        {/* Header */}
        <XStack
          position="absolute"
          top={insets.top + 12}
          left="$4"
          right="$4"
          justifyContent="space-between"
          alignItems="center"
        >
          <TouchableOpacity onPress={() => router.back()}>
            <YStack
              backgroundColor="$background"
              padding="$3"
              borderRadius="$10"
              borderWidth={1}
              borderColor="$borderColor"
            >
              <ArrowLeft size={20} color="$color" />
            </YStack>
          </TouchableOpacity>

          <YStack
            backgroundColor="$background"
            paddingHorizontal="$4"
            paddingVertical="$2"
            borderRadius="$10"
            borderWidth={1}
            borderColor="$borderColor"
          >
            <Text fontWeight="bold" fontSize="$4">
              Navigation
            </Text>
          </YStack>

          <TouchableOpacity onPress={handleOpenMaps}>
            <YStack backgroundColor="$primary" padding="$3" borderRadius="$10">
              <ExternalLink size={20} color="white" />
            </YStack>
          </TouchableOpacity>
        </XStack>
      </YStack>

      {/* Sticky Footer with Order Info */}
      <YStack
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        paddingBottom={insets.bottom}
      >
        {/* Order Info Section */}
        <XStack
          padding="$4"
          gap="$3"
          alignItems="center"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <Avatar circular size="$8">
            <Avatar.Fallback
              items="center"
              justify="center"
              backgroundColor="$primary"
            >
              <User size="$4" color="white" />
            </Avatar.Fallback>
          </Avatar>

          <YStack flex={1}>
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontWeight="bold" fontSize="$4">
                {orderInfo.orderId}
              </Text>
              <YStack
                backgroundColor={getStatusColor(orderInfo.status)}
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$10"
              >
                <Text color="white" fontSize="$2" textTransform="capitalize">
                  {orderInfo.status.replace("_", " ")}
                </Text>
              </YStack>
            </XStack>
            <Text fontSize="$3" color="$colorMuted">
              {orderInfo.customerName}
            </Text>
          </YStack>
        </XStack>

        {/* Delivery Stats */}
        <XStack
          paddingVertical="$3"
          paddingHorizontal="$4"
          gap="$4"
          justifyContent="space-around"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <YStack alignItems="center">
            <XStack gap="$1" alignItems="center">
              <Clock size={14} color="$colorMuted" />
              <Text fontSize="$3" color="$colorMuted">
                ETA
              </Text>
            </XStack>
            <Text fontWeight="bold" fontSize="$4">
              {orderInfo.estimatedTime}
            </Text>
          </YStack>

          <YStack alignItems="center">
            <XStack gap="$1" alignItems="center">
              <Package size={14} color="$colorMuted" />
              <Text fontSize="$3" color="$colorMuted">
                Earnings
              </Text>
            </XStack>
            <Text fontWeight="bold" fontSize="$4" color="#27ae60">
              +GHS {orderInfo.earnings.toFixed(2)}
            </Text>
          </YStack>
        </XStack>

        {/* Quick Actions */}
        <XStack padding="$4" gap="$3">
          <Button
            flex={1}
            variant="outline"
            icon={<Phone size={18} />}
            onPress={handleCall}
          >
            Call
          </Button>
          <Button
            flex={1}
            variant="outline"
            icon={<MessageCircle size={18} />}
            onPress={handleMessage}
          >
            Message
          </Button>
          {isTablet && (
            <Button
              flex={1}
              backgroundColor="$primary"
              icon={<Navigation size={18} />}
              onPress={handleOpenMaps}
            >
              Open Maps
            </Button>
          )}
        </XStack>
      </YStack>
    </YStack>
  );
}
