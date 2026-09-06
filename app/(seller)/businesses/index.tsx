// @ts-nocheck
import { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card, Button, Separator, Sheet, ScrollView, Avatar, useMedia } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building,
  ChevronRight,
  Crown,
  MapPin,
  Map,
  Store,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { BackButton } from "@/components/ui";
import { CachedAvatarImage } from "@/components/ui/CachedAvatarImage";
import { useQuery } from "@tanstack/react-query";
import * as businessService from "@/services/business.service";
import type { Business } from "@teincfood/core";

export default function SellerBusinessesScreen() {
  const router = useRouter();
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["seller", "businesses"],
    queryFn: () => businessService.fetchMyBusinesses(),
  });
  const businesses = data?.data ?? [];
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleOpenSheet = (business: Business) => {
    setSelectedBusiness(business);
    setSheetOpen(true);
  };

  const handleViewOnMap = (business: Business) => {
    const lat = business.latitude;
    const lng = business.longitude;
    if (!lat || !lng) return;
    setSheetOpen(false);
    setTimeout(() => {
      router.push({
        pathname: "/(seller)/map" as any,
        params: {
          pickupLat: lat,
          pickupLng: lng,
          pickupAddress: business.address
            ? `${business.address.street}, ${business.address.city}`
            : business.name,
        },
      });
    }, 200);
  };

  const getAddressText = (business: Business) => {
    if (business.address) {
      return [business.address.street, business.address.city]
        .filter(Boolean)
        .join(", ");
    }
    return null;
  };

  const renderBusiness = ({ item: business }: { item: Business }) => {
    const addressText = getAddressText(business);

    return (
      <Card
        bordered
        overflow="hidden"
        marginBottom="$3"
        pressStyle={{ scale: 0.99, opacity: 0.9 }}
        onPress={() => handleOpenSheet(business)}
      >
        <YStack
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          width={4}
          backgroundColor={business.status === "active" ? "$success" : "$colorMuted"}
        />
        <XStack
          paddingLeft="$5"
          paddingRight="$4"
          paddingVertical="$4"
          alignItems="center"
          justifyContent="space-between"
        >
          <YStack flex={1} gap="$1" paddingRight="$3">
            <XStack gap="$2" alignItems="center">
              {business.logo_url ? (
                <Avatar circular>
                  <CachedAvatarImage src={business.logo_url} />
                </Avatar>
              ) : (
                <XStack width={28} height={28} borderRadius={14} backgroundColor="$gray3" alignItems="center" justifyContent="center">
                  <Store size={14} color="$colorMuted" />
                </XStack>
              )}
              <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color" flexShrink={1}>
                {business.name}
              </Text>
              <XStack paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10" backgroundColor="$orangeMuted" borderWidth={1} borderColor="$orange">
                <Crown size={10} color="$orange" />
                <Text fontSize="$1" color="$orange" fontFamily="$body" fontWeight="600" marginLeft={2}>OWNER</Text>
              </XStack>
              <XStack paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10" backgroundColor={business.status === "active" ? "$successMuted" : "$backgroundSoft"} borderWidth={1} borderColor={business.status === "active" ? "$success" : "$borderColor"}>
                <Text fontSize="$1" color={business.status === "active" ? "$success" : "$colorMuted"} fontFamily="$body" fontWeight="600">
                  {business.status === "active" ? "ACTIVE" : "INACTIVE"}
                </Text>
              </XStack>
            </XStack>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              {business.business_number}
            </Text>
            {addressText && (
              <XStack gap="$1" alignItems="center" marginTop="$1">
                <MapPin size={12} color="$colorMuted" />
                <Text fontSize="$2" color="$colorMuted" fontFamily="$body" numberOfLines={1}>
                  {addressText}
                </Text>
              </XStack>
            )}
          </YStack>
          <ChevronRight size={18} color="$colorMuted" />
        </XStack>
      </Card>
    );
  };

  const addressText = selectedBusiness ? getAddressText(selectedBusiness) : null;
  const hasLocation = selectedBusiness?.latitude && selectedBusiness?.longitude;

  const ListEmptyComponent = () => (
    <Card padding="$6" bordered>
      <YStack alignItems="center" gap="$3">
        <Building size={48} color="$colorMuted" />
        <Text fontSize="$5" fontWeight="600" textAlign="center" fontFamily="$heading">
          No businesses yet
        </Text>
        <Text fontSize="$4" color="$colorSecondary" textAlign="center" fontFamily="$body">
          Add your first business to get started
        </Text>
        <Button onPress={() => router.push("/(shared)/businesses/add" as any)}>
          Add Business
        </Button>
      </YStack>
    </Card>
  );

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top + 8, 16)} {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center", width: "100%" } : {})}>
      <YStack gap="$1" paddingHorizontal="$4" paddingBottom="$4">
        <XStack gap="$2" alignItems="center">
          <BackButton />
          <YStack gap="$1" flex={1}>
            <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
              My Businesses
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              Businesses you own or manage
            </Text>
          </YStack>
        </XStack>
      </YStack>
      <FlatList
        data={businesses}
        keyExtractor={(item) => item.id}
        renderItem={renderBusiness}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: Math.max(insets.bottom + 20, 24),
          flexGrow: 1,
        }}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />

      <Sheet
        modal
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedBusiness(null);
        }}
        snapPoints={[75]}
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
          padding="$4"
          paddingBottom={Math.max(insets.bottom, 16)}
          {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <ScrollView showsVerticalScrollIndicator={false} flex={1}>
            {selectedBusiness && (
              <YStack gap="$4" pt="$2" paddingBottom="$4">
                {/* Header */}
                <YStack gap="$1" paddingRight="$4">
                  <XStack gap="$2" alignItems="center" flexWrap="wrap">
                    {selectedBusiness.logo_url ? (
                      <Avatar circular>
                        <CachedAvatarImage src={selectedBusiness.logo_url} />
                      </Avatar>
                    ) : (
                      <XStack width={28} height={28} borderRadius={14} backgroundColor="$gray3" alignItems="center" justifyContent="center">
                        <Store size={14} color="$colorMuted" />
                      </XStack>
                    )}
                    <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
                      {selectedBusiness.name}
                    </Text>
                    <XStack paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10" backgroundColor="$orangeMuted" borderWidth={1} borderColor="$orange">
                      <Crown size={10} color="$orange" />
                      <Text fontSize="$1" color="$orange" fontFamily="$body" fontWeight="600" marginLeft={2}>OWNER</Text>
                    </XStack>
                  </XStack>
                  <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                    {selectedBusiness.business_number}
                  </Text>
                </YStack>

                <Separator />

                {/* Address */}
                {addressText && (
                  <XStack gap="$3" alignItems="flex-start">
                    <MapPin size={18} color="$success" style={{ marginTop: 2 }} />
                    <YStack flex={1}>
                      <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                        Address
                      </Text>
                      <Text fontSize="$4" fontWeight="600" fontFamily="$body">
                        {addressText}
                      </Text>
                      {selectedBusiness.address?.region && (
                        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                          {selectedBusiness.address.region}
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                )}

                {/* Fallback coords display */}
                {!addressText && selectedBusiness.latitude && selectedBusiness.longitude && (
                  <XStack gap="$3" alignItems="flex-start">
                    <MapPin size={18} color="$success" style={{ marginTop: 2 }} />
                    <YStack flex={1}>
                      <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                        Location
                      </Text>
                      <Text fontSize="$4" fontWeight="600" fontFamily="$body">
                        {selectedBusiness.latitude.toFixed(4)}, {selectedBusiness.longitude.toFixed(4)}
                      </Text>
                    </YStack>
                  </XStack>
                )}

                <Separator />

                {/* Actions */}
                <YStack gap="$3">
                  {hasLocation && (
                    <Button
                      icon={<Map size={20} />}
                      backgroundColor="$primary"
                      color="white"
                      onPress={() => handleViewOnMap(selectedBusiness)}
                    >
                      View on Map
                    </Button>
                  )}

                  <Button
                    icon={<Building size={20} />}
                    variant="outline"
                    onPress={() => {
                      setSheetOpen(false);
                      setTimeout(() => router.push(`/(shared)/businesses/${selectedBusiness.id}` as any), 200);
                    }}
                  >
                    Business Settings
                  </Button>
                </YStack>
              </YStack>
            )}
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
