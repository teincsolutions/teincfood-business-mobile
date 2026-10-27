// @ts-nocheck
import { Linking } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Avatar,
  Separator,
  Spinner,
} from "tamagui";
import {
  Phone,
  Car,
  User,
  MessageCircle,
  ShieldCheck,
  Calendar,
  Hash,
  X,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import {
  useFleetRiderQuery,
  type FleetRider,
} from "@teincfood/core";
import { BackButton, Button } from "@/components/ui";
import { ResponsiveScreen } from "@/components/layout";

interface RiderDetailViewProps {
  riderId?: string;
  initialRider?: FleetRider | null;
  /** Hide the back button and add a close button (right-hand pane). */
  embedded?: boolean;
  onClose?: () => void;
  onBack?: () => void;
}

function statusMeta(rider: FleetRider) {
  const status = String(rider.status ?? "").toLowerCase();

  if (rider.is_online || status === "available") {
    return { label: "Online", color: "$green10", background: "$green2" };
  }
  if (status === "busy") {
    return { label: "Busy", color: "$yellow10", background: "$yellow2" };
  }
  if (status === "suspended") {
    return { label: "Suspended", color: "$red10", background: "$red2" };
  }
  if (status === "on_leave") {
    return { label: "On leave", color: "$yellow10", background: "$yellow2" };
  }
  if (status === "active") {
    return { label: "Active", color: "$blue10", background: "$blue2" };
  }
  return { label: "Offline", color: "$gray10", background: "$gray2" };
}

function kycMeta(status?: string) {
  const value = String(status ?? "pending").toLowerCase();
  if (value === "verified" || value === "approved") {
    return { label: "Verified", color: "$green10", background: "$green2" };
  }
  if (value === "rejected") {
    return { label: "Rejected", color: "$red10", background: "$red2" };
  }
  return { label: "Pending", color: "$yellow10", background: "$yellow2" };
}

export function RiderDetailView({
  riderId,
  initialRider,
  embedded = false,
  onClose,
  onBack,
}: RiderDetailViewProps) {
  const router = useRouter();
  const { data, isLoading } = useFleetRiderQuery(riderId ?? "", Boolean(riderId));
  const rider: FleetRider | null = data?.data ?? initialRider ?? null;

  if (!rider) {
    return (
      <ResponsiveScreen preset="detail">
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
          {isLoading ? (
            <>
              <Spinner size="large" color="$primary" />
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                Loading rider...
              </Text>
            </>
          ) : (
            <>
              <User size={48} color="$colorMuted" />
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                Rider not found
              </Text>
              <Text
                fontSize="$4"
                color="$colorSecondary"
                fontFamily="$body"
                textAlign="center"
              >
                This rider may have been removed from the fleet.
              </Text>
              {!embedded && <BackButton onPress={onBack} />}
            </>
          )}
        </YStack>
      </ResponsiveScreen>
    );
  }

  const status = statusMeta(rider);
  const kyc = kycMeta(rider.kyc_status);
  const name = rider.user?.full_name || rider.rider_number || "Rider";
  const joined = rider.inserted_at
    ? new Date(rider.inserted_at).toLocaleDateString()
    : null;

  const callRider = () => {
    if (rider.phone) {
      Linking.openURL(`tel:${rider.phone.replace(/\s+/g, "")}`);
    }
  };

  const messageRider = () => {
    if (rider.user?.id) {
      router.push({
        pathname: "/(communication)/chat/direct",
        params: { userId: rider.user.id },
      });
    }
  };

  return (
    <ResponsiveScreen preset="detail">
      <XStack alignItems="center" gap="$3">
        {embedded ? (
          <Button
            circular
            size="$3"
            variant="outline"
            icon={<X size={18} />}
            onPress={onClose}
          />
        ) : (
          <BackButton onPress={onBack} />
        )}
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" flex={1}>
          Rider details
        </Text>
      </XStack>

      <Card padding="$5" bordered>
        <YStack alignItems="center" gap="$3">
          <Avatar circular size="$8">
            <Avatar.Image src={rider.user?.avatar_url} />
            <Avatar.Fallback backgroundColor="$gray800">
              <Text color="white" fontWeight="bold" fontSize="$6">
                {name.charAt(0).toUpperCase()}
              </Text>
            </Avatar.Fallback>
          </Avatar>

          <YStack alignItems="center" gap="$2">
            <Text
              fontSize="$7"
              fontWeight="bold"
              fontFamily="$heading"
              textAlign="center"
            >
              {name}
            </Text>
            <XStack gap="$2" alignItems="center" flexWrap="wrap" justifyContent="center">
              <YStack
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius="$3"
                backgroundColor={status.background}
              >
                <Text fontSize="$3" color={status.color} fontFamily="$body">
                  {status.label}
                </Text>
              </YStack>
              <YStack
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius="$3"
                backgroundColor={kyc.background}
              >
                <Text fontSize="$3" color={kyc.color} fontFamily="$body">
                  KYC {kyc.label}
                </Text>
              </YStack>
            </XStack>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              {rider.rider_number}
            </Text>
          </YStack>

          <XStack gap="$2" width="100%">
            <Button
              flex={1}
              variant="outline"
              icon={<Phone size={16} />}
              onPress={callRider}
              disabled={!rider.phone}
            >
              Call
            </Button>
            <Button
              flex={1}
              variant="outline"
              icon={<MessageCircle size={16} />}
              onPress={messageRider}
              disabled={!rider.user?.id}
            >
              Message
            </Button>
          </XStack>
        </YStack>
      </Card>

      <Card padding="$4" bordered>
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
            Contact
          </Text>
          <Separator />

          <XStack gap="$3" alignItems="center">
            <Phone size={18} color="$colorMuted" />
            <YStack flex={1}>
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                Phone
              </Text>
              <Text fontSize="$4" fontFamily="$body">
                {rider.phone || "Not provided"}
              </Text>
            </YStack>
          </XStack>

          <XStack gap="$3" alignItems="center">
            <Hash size={18} color="$colorMuted" />
            <YStack flex={1}>
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                Licence number
              </Text>
              <Text fontSize="$4" fontFamily="$body">
                {rider.license_number || "Not provided"}
              </Text>
            </YStack>
          </XStack>

          {joined && (
            <XStack gap="$3" alignItems="center">
              <Calendar size={18} color="$colorMuted" />
              <YStack flex={1}>
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  Joined fleet
                </Text>
                <Text fontSize="$4" fontFamily="$body">
                  {joined}
                </Text>
              </YStack>
            </XStack>
          )}
        </YStack>
      </Card>

      <Card padding="$4" bordered>
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
            Assigned vehicle
          </Text>
          <Separator />

          {rider.vehicle ? (
            <>
              <XStack gap="$3" alignItems="center">
                <Car size={18} color="$colorMuted" />
                <YStack flex={1}>
                  <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                    Plate number
                  </Text>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {rider.vehicle.plate_number}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap="$3" alignItems="center">
                <ShieldCheck size={18} color="$colorMuted" />
                <YStack flex={1}>
                  <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                    Vehicle
                  </Text>
                  <Text
                    fontSize="$4"
                    fontFamily="$body"
                    textTransform="capitalize"
                  >
                    {[rider.vehicle.brand, rider.vehicle.model]
                      .filter(Boolean)
                      .join(" ") || rider.vehicle.type}
                  </Text>
                </YStack>
              </XStack>
            </>
          ) : (
            <XStack gap="$3" alignItems="center">
              <Car size={18} color="$colorMuted" />
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                No vehicle assigned
              </Text>
            </XStack>
          )}
        </YStack>
      </Card>
    </ResponsiveScreen>
  );
}
