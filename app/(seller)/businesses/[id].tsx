// @ts-nocheck
import { ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BackButton, Button } from "@/components/ui";
import { useBusinessStore } from "@/stores/business.store";
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Hash,
  Star,
  Clock,
  ShoppingBag,
  DollarSign,
} from "@tamagui/lucide-icons";

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getBusinessById, setDefaultBusiness, getDefaultBusiness } = useBusinessStore();

  const business = getBusinessById(id);
  const isDefault = getDefaultBusiness()?.id === id;
  const isActive = business?.status === "active";

  if (!business) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$4"
        paddingTop={insets.top}
        padding="$6"
      >
        <Building size={48} color="$colorMuted" />
        <Text fontSize="$5" fontWeight="600" fontFamily="$heading" textAlign="center">
          Business not found
        </Text>
        <Button onPress={() => router.back()}>
          <Text fontFamily="$body">Go Back</Text>
        </Button>
      </YStack>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
    >
      <YStack padding="$4" gap="$4">
        {/* Back */}
        <BackButton />

        {/* Header */}
        <XStack justifyContent="space-between" alignItems="flex-start">
          <YStack flex={1} gap="$1" paddingRight="$3">
            <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
              {business.name}
            </Text>
            <XStack gap="$2" alignItems="center">
              <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
                {business.code}
              </Text>
              {business.type && (
                <>
                  <Text fontSize="$3" color="$colorMuted">·</Text>
                  <Text fontSize="$3" color="$colorMuted" fontFamily="$body" textTransform="capitalize">
                    {business.type.replace("_", " ")}
                  </Text>
                </>
              )}
            </XStack>
          </YStack>

          <XStack
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$10"
            backgroundColor={isActive ? "$successMuted" : "$backgroundSoft"}
            borderWidth={1}
            borderColor={isActive ? "$success" : "$borderColor"}
          >
            <Text
              fontSize="$2"
              color={isActive ? "$success" : "$colorMuted"}
              fontFamily="$body"
              fontWeight="600"
            >
              {isActive ? "ACTIVE" : "INACTIVE"}
            </Text>
          </XStack>
        </XStack>

        {/* Stats row */}
        <XStack gap="$3">
          <Card flex={1} padding="$3" bordered>
            <YStack gap="$1" alignItems="center">
              <XStack gap="$1" alignItems="center">
                <Star size={14} color="$star" />
                <Text fontSize="$4" fontWeight="700" fontFamily="$heading">
                  {business.rating?.toFixed(1) ?? "5.0"}
                </Text>
              </XStack>
              <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                Rating
              </Text>
            </YStack>
          </Card>

          <Card flex={1} padding="$3" bordered>
            <YStack gap="$1" alignItems="center">
              <XStack gap="$1" alignItems="center">
                <Clock size={14} color="$colorMuted" />
                <Text fontSize="$4" fontWeight="700" fontFamily="$heading">
                  {business.todayOrders ?? 0}
                </Text>
              </XStack>
              <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                Today's Orders
              </Text>
            </YStack>
          </Card>

          <Card flex={1} padding="$3" bordered>
            <YStack gap="$1" alignItems="center">
              <XStack gap="$1" alignItems="center">
                <DollarSign size={14} color="$colorMuted" />
                <Text fontSize="$4" fontWeight="700" fontFamily="$heading">
                  {business.todayRevenue ?? 0}
                </Text>
              </XStack>
              <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                Today's Revenue
              </Text>
            </YStack>
          </Card>
        </XStack>

        {/* Details */}
        <Card bordered padding="$4">
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
              Business Details
            </Text>
            <Separator />

            <XStack gap="$3" alignItems="flex-start">
              <MapPin size={18} color="$colorMuted" />
              <YStack flex={1} gap="$1">
                <Text fontSize="$3" fontWeight="500" fontFamily="$body" color="$color">
                  Address
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  {business.address?.fullAddress || business.address?.city || "No address"}
                </Text>
              </YStack>
            </XStack>

            {business.phone && (
              <XStack gap="$3" alignItems="center">
                <Phone size={18} color="$colorMuted" />
                <YStack flex={1}>
                  <Text fontSize="$3" fontWeight="500" fontFamily="$body" color="$color">
                    Phone
                  </Text>
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                    {business.phone}
                  </Text>
                </YStack>
              </XStack>
            )}

            {business.email && (
              <XStack gap="$3" alignItems="center">
                <Mail size={18} color="$colorMuted" />
                <YStack flex={1}>
                  <Text fontSize="$3" fontWeight="500" fontFamily="$body" color="$color">
                    Email
                  </Text>
                  <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                    {business.email}
                  </Text>
                </YStack>
              </XStack>
            )}

            {isDefault && (
              <XStack gap="$3" alignItems="center">
                <Building size={18} color="$info" />
                <Text fontSize="$3" color="$info" fontFamily="$body" fontWeight="500">
                  This is your default business
                </Text>
              </XStack>
            )}
          </YStack>
        </Card>

        {/* Actions */}
        <YStack gap="$3">
          {!isDefault && isActive && (
            <Button
              size="$5"
              variant="outlined"
              onPress={() => setDefaultBusiness(id)}
            >
              <Text fontFamily="$body">Set as Default Business</Text>
            </Button>
          )}
        </YStack>
      </YStack>
    </ScrollView>
  );
}
