// @ts-nocheck
import { ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Avatar,
  Separator,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Phone,
  Mail,
  Car,
  Star,
  Package,
  DollarSign,
  Clock,
  Calendar,
  User,
  MessageCircle,
} from "@tamagui/lucide-icons";
import { useFleetStore } from "@/stores/fleet.store";
import { BackButton, Button } from "@/components/ui";

export default function RiderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getRiderById } = useFleetStore();

  const rider = getRiderById(id);

  if (!rider) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <User size={48} color="$colorMuted" />
        <Text fontSize="$5" fontWeight="600">
          Rider not found
        </Text>
        <Button variant="outline" onPress={() => router.back()}>
          Go Back
        </Button>
      </YStack>
    );
  }

  const statusColor =
    rider.status === "active"
      ? "$green10"
      : rider.status === "suspended"
      ? "$red10"
      : rider.status === "on_leave"
      ? "$yellow10"
      : "$gray10";

  const statusBg =
    rider.status === "active"
      ? "$green2"
      : rider.status === "suspended"
      ? "$red2"
      : rider.status === "on_leave"
      ? "$yellow2"
      : "$gray2";

  const statusLabel =
    rider.status === "active"
      ? "Online"
      : rider.status === "suspended"
      ? "Suspended"
      : rider.status === "on_leave"
      ? "On Leave"
      : "Offline";

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
    >
      <YStack padding="$4" gap="$4">
        {/* Back */}
        <BackButton />

        {/* Profile Header */}
        <Card padding="$5" bordered>
          <YStack alignItems="center" gap="$3">
            <Avatar circular size="$8">
              <Avatar.Image src={rider.riderAvatarUrl} />
              <Avatar.Fallback backgroundColor="$gray800">
                <Text color="white" fontWeight="bold" fontSize="$6">
                  {rider.riderName?.charAt(0) || "R"}
                </Text>
              </Avatar.Fallback>
            </Avatar>

            <YStack alignItems="center" gap="$1">
              <Text fontSize="$7" fontWeight="bold" fontFamily="$heading">
                {rider.riderName}
              </Text>
              <YStack
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius="$3"
                backgroundColor={statusBg}
              >
                <Text fontSize="$3" color={statusColor} fontFamily="$body">
                  {statusLabel}
                </Text>
              </YStack>
            </YStack>

            <XStack gap="$4" marginTop="$1">
              <YStack alignItems="center" gap="$1">
                <Text fontSize="$6" fontWeight="bold" fontFamily="$heading">
                  {rider.totalDeliveries}
                </Text>
                <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                  Deliveries
                </Text>
              </YStack>
              <Separator vertical />
              <YStack alignItems="center" gap="$1">
                <Text fontSize="$6" fontWeight="bold" fontFamily="$heading">
                  {rider.rating.toFixed(1)}
                </Text>
                <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                  Rating
                </Text>
              </YStack>
              <Separator vertical />
              <YStack alignItems="center" gap="$1">
                <Text fontSize="$6" fontWeight="bold" fontFamily="$heading">
                  GHS {rider.totalEarnings.toFixed(0)}
                </Text>
                <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                  Earned
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Contact Info */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
              Contact
            </Text>
            <Separator />

            <XStack gap="$3" alignItems="center">
              <Phone size={18} color="$colorMuted" />
              <Text fontSize="$4" fontFamily="$body">
                {rider.riderPhone}
              </Text>
            </XStack>

            <XStack gap="$3" alignItems="center">
              <Mail size={18} color="$colorMuted" />
              <Text fontSize="$4" fontFamily="$body">
                {rider.riderEmail}
              </Text>
            </XStack>

            {rider.riderId && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  icon={<MessageCircle size={18} />}
                  onPress={() => {
                    const uid = rider.riderId;
                    const name = rider.riderName || "";
                    const phone = rider.riderPhone || "";
                    router.push(
                      `/(communication)/chat/direct?userId=${encodeURIComponent(uid)}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`
                    );
                  }}
                >
                  Message Rider
                </Button>
              </>
            )}
          </YStack>
        </Card>

        {/* Vehicle Info */}
        {(rider.vehiclePlateNumber || rider.vehicleType) && (
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                Assigned Vehicle
              </Text>
              <Separator />

              {rider.vehiclePlateNumber && (
                <XStack gap="$3" alignItems="center">
                  <Car size={18} color="$colorMuted" />
                  <Text fontSize="$4" fontFamily="$body">
                    {rider.vehiclePlateNumber}
                  </Text>
                </XStack>
              )}

              {rider.vehicleType && (
                <XStack gap="$3" alignItems="center">
                  <Package size={18} color="$colorMuted" />
                  <Text
                    fontSize="$4"
                    fontFamily="$body"
                    textTransform="capitalize"
                  >
                    {rider.vehicleType.replace(/_/g, " ")}
                  </Text>
                </XStack>
              )}
            </YStack>
          </Card>
        )}

        {/* Stats */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
              Stats
            </Text>
            <Separator />

            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <Star size={16} color="$colorMuted" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Average rating
                </Text>
              </XStack>
              <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                {rider.rating.toFixed(2)}
              </Text>
            </XStack>

            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <Package size={16} color="$colorMuted" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Total deliveries
                </Text>
              </XStack>
              <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                {rider.totalDeliveries}
              </Text>
            </XStack>

            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <DollarSign size={16} color="$colorMuted" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Total earnings
                </Text>
              </XStack>
              <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                GHS {rider.totalEarnings.toFixed(2)}
              </Text>
            </XStack>

            {rider.joinedAt && (
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$2" alignItems="center">
                  <Calendar size={16} color="$colorMuted" />
                  <Text
                    fontSize="$4"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Joined
                  </Text>
                </XStack>
                <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                  {new Date(rider.joinedAt).toLocaleDateString()}
                </Text>
              </XStack>
            )}

            {rider.lastActiveAt && (
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$2" alignItems="center">
                  <Clock size={16} color="$colorMuted" />
                  <Text
                    fontSize="$4"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Last active
                  </Text>
                </XStack>
                <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                  {new Date(rider.lastActiveAt).toLocaleDateString()}
                </Text>
              </XStack>
            )}
          </YStack>
        </Card>
      </YStack>
    </ScrollView>
  );
}
