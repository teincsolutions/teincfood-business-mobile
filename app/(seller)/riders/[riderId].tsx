// @ts-nocheck
import { useState } from "react";
import { Linking } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Avatar,
  Separator,
  ScrollView,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import {
  Phone,
  Car,
  ShieldCheck,
  User,
  Ban,
  CheckCircle,
} from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { MessageButton } from "@/components/chat/MessageButton";
import {
  useFleetRiderQuery,
  useRiderKycQuery,
  useSuspendRiderMutation,
  useActivateRiderMutation,
} from "@teincfood/core";
import { RiderKycSheet } from "@/components/rider/RiderKycSheet";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@teincfood/core";

export default function SellerRiderDetailScreen() {
  const { riderId } = useLocalSearchParams<{ riderId: string }>();
  const insets = useSafeAreaInsets();
  const [kycSheetOpen, setKycSheetOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const { data: riderRes, isLoading } = useFleetRiderQuery(riderId);
  const { data: kycRes } = useRiderKycQuery(riderId, kycSheetOpen);
  const suspendRider = useSuspendRiderMutation();
  const activateRider = useActivateRiderMutation();

  const rider = riderRes?.data;
  const kyc = kycRes?.data;
  const kycDocuments = kyc?.documents ?? [];
  const kycStatus = kyc?.kyc_status ?? rider?.kyc_status ?? "pending";

  if (isLoading || !rider) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$3"
        backgroundColor="$background"
      >
        <User size={48} color="$colorMuted" />
        <Text fontSize="$5" fontWeight="600">
          Loading...
        </Text>
      </YStack>
    );
  }

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  const handleSuspend = () => {
    suspendRider.mutate(rider.id, {
      onSuccess: () => toast.success("Rider suspended"),
      onError: (err) => toast.error(extractApiErrorMessage(err)),
    });
    setConfirmAction(null);
  };

  const handleActivate = () => {
    activateRider.mutate(rider.id, {
      onSuccess: () => toast.success("Rider activated"),
      onError: (err) => toast.error(extractApiErrorMessage(err)),
    });
    setConfirmAction(null);
  };

  const statusColor = rider.is_active ? "$success" : "$error";
  const statusBg = rider.is_active ? "$successMuted" : "$errorMuted";
  const statusLabel = rider.is_active
    ? rider.status === "available"
      ? "Available"
      : rider.status === "busy"
        ? "On Delivery"
        : "Online"
    : "Suspended";

  const vehicle = rider.vehicle;

  return (
    <YStack
      flex={1}
      paddingTop={Math.max(insets.top + 8, 24)}
      paddingBottom={insets.bottom + 16}
      backgroundColor="$background"
    >
      {/* Header */}
      <XStack
        padding="$4"
        alignItems="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <BackButton />
        <YStack flex={1}>
          <Text fontSize="$6" fontWeight="bold">
            {rider.user?.full_name || "Rider"}
          </Text>
          <Text fontSize="$3" color="$colorMuted">
            {rider.rider_number}
          </Text>
        </YStack>
        <YStack
          paddingHorizontal="$3"
          paddingVertical="$1"
          borderRadius="$2"
          backgroundColor={statusBg}
        >
          <Text
            color="$background"
            fontSize="$3"
            textTransform="capitalize"
            fontWeight="600"
          >
            {statusLabel}
          </Text>
        </YStack>
      </XStack>

      <ScrollView
        contentContainerStyle={{
          width: "100%",
          maxWidth: 600,
          marginHorizontal: "auto",
        }}
      >
        <YStack flex={1} padding="$4" gap="$4">
          {/* Profile Header */}
          <Card padding="$5" bordered>
            <YStack alignItems="center" gap="$3">
              <Avatar size="$28" circular>
                <Avatar.Image src={rider.user?.avatar_url ?? undefined} />
                <Avatar.Fallback
                  justify={"center"}
                  alignItems="center"
                  backgroundColor="$colorMuted"
                >
                  <Text color="$color" fontWeight="bold" fontSize="$12">
                    {(rider.user?.full_name || "R").charAt(0)}
                  </Text>
                </Avatar.Fallback>
              </Avatar>

              <YStack alignItems="center" gap="$1">
                <Text fontSize="$7" fontWeight="bold" fontFamily="$heading">
                  {rider.user?.full_name || rider.rider_number}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  {rider.rider_number}
                </Text>
                <XStack gap="$2" alignItems="center">
                  <YStack
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    borderRadius="$3"
                    backgroundColor={statusBg}
                  >
                    <Text
                      fontSize="$3"
                      color={statusColor}
                      fontFamily="$body"
                      fontWeight="600"
                    >
                      {statusLabel}
                    </Text>
                  </YStack>
                  {rider.is_online && (
                    <YStack
                      width={8}
                      height={8}
                      borderRadius="$full"
                      backgroundColor="$success"
                    />
                  )}
                </XStack>
              </YStack>
            </YStack>
          </Card>

          {/* Contact */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                Contact
              </Text>
              <Separator />

              <Text fontSize="$4" fontFamily="$body">
                {rider.phone || "No phone"}
              </Text>

              <XStack flex={1} gap="$3" justify={"space-between"}>
                <Button
                  flex={1}
                  variant="outline"
                  icon={({ color, size }) => (
                    <Phone size={size} color={color} />
                  )}
                  onPress={() => rider.phone && handleCall(rider.phone)}
                  disabled={!rider.phone}
                >
                  Call
                </Button>
                <MessageButton
                  flex={1}
                  userId={rider.user?.id || ""}
                  displayName={rider.user?.full_name}
                />
              </XStack>
            </YStack>
          </Card>

          {/* Assigned Vehicle */}
          {vehicle && (
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <XStack gap="$2" alignItems="center">
                  <Car size={18} color="$colorMuted" />
                  <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                    Assigned Vehicle
                  </Text>
                </XStack>
                <Separator />

                {vehicle.plate_number && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorSecondary" fontFamily="$body">
                      Plate Number
                    </Text>
                    <Text fontWeight="600" fontFamily="$body">
                      {vehicle.plate_number}
                    </Text>
                  </XStack>
                )}
                {vehicle.brand && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorSecondary" fontFamily="$body">
                      Brand
                    </Text>
                    <Text fontWeight="600" fontFamily="$body">
                      {vehicle.brand}
                    </Text>
                  </XStack>
                )}
                {vehicle.model && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorSecondary" fontFamily="$body">
                      Model
                    </Text>
                    <Text fontWeight="600" fontFamily="$body">
                      {vehicle.model}
                    </Text>
                  </XStack>
                )}
                {vehicle.color && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorSecondary" fontFamily="$body">
                      Color
                    </Text>
                    <Text fontWeight="600" fontFamily="$body">
                      {vehicle.color}
                    </Text>
                  </XStack>
                )}
                {vehicle.year && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorSecondary" fontFamily="$body">
                      Year
                    </Text>
                    <Text fontWeight="600" fontFamily="$body">
                      {vehicle.year}
                    </Text>
                  </XStack>
                )}
                {vehicle.type && (
                  <XStack justifyContent="space-between">
                    <Text color="$colorSecondary" fontFamily="$body">
                      Type
                    </Text>
                    <Text
                      fontWeight="600"
                      fontFamily="$body"
                      textTransform="capitalize"
                    >
                      {vehicle.type.replace(/_/g, " ")}
                    </Text>
                  </XStack>
                )}
              </YStack>
            </Card>
          )}

          {/* KYC Status */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <ShieldCheck size={18} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                  KYC Status
                </Text>
              </XStack>
              <Separator />

              <YStack
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$3"
                backgroundColor={
                  kycStatus === "approved"
                    ? "$successMuted"
                    : kycStatus === "rejected"
                      ? "$errorMuted"
                      : "$warningMuted"
                }
                alignSelf="flex-start"
              >
                <Text
                  fontSize="$3"
                  fontWeight="600"
                  color={
                    kycStatus === "approved"
                      ? "$success"
                      : kycStatus === "rejected"
                        ? "$error"
                        : "$warning"
                  }
                  textTransform="capitalize"
                >
                  {kycStatus}
                </Text>
              </YStack>

              {kycDocuments.length > 0 && (
                <Button variant="outline" onPress={() => setKycSheetOpen(true)}>
                  View Documents ({kycDocuments.length})
                </Button>
              )}
            </YStack>
          </Card>

          {/* Details */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                Details
              </Text>
              <Separator />

              <XStack justifyContent="space-between">
                <Text color="$colorSecondary" fontFamily="$body">
                  License
                </Text>
                <Text fontWeight="600" fontFamily="$body">
                  {rider.license_number || "—"}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorSecondary" fontFamily="$body">
                  Status
                </Text>
                <Text fontWeight="600" fontFamily="$body">
                  {rider.status}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorSecondary" fontFamily="$body">
                  Fleet Managed
                </Text>
                <Text fontWeight="600" fontFamily="$body">
                  {rider.is_fleet_managed ? "Yes" : "No"}
                </Text>
              </XStack>
            </YStack>
          </Card>

          {/* Actions */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                Actions
              </Text>
              <Separator />

              {rider.is_active ? (
                <Button
                  variant="danger"
                  icon={<Ban size={18} />}
                  onPress={() => setConfirmAction("suspend")}
                  disabled={suspendRider.isPending}
                >
                  {suspendRider.isPending ? "Suspending..." : "Suspend Rider"}
                </Button>
              ) : (
                <Button
                  variant="success"
                  icon={<CheckCircle size={18} />}
                  onPress={() => setConfirmAction("activate")}
                  disabled={activateRider.isPending}
                >
                  {activateRider.isPending ? "Activating..." : "Activate Rider"}
                </Button>
              )}
              <Text fontSize="$3" color="$colorMuted" textAlign="center">
                {rider.is_active
                  ? "Suspended riders cannot accept your deliveries"
                  : "Activate to allow this rider to accept your deliveries"}
              </Text>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>

      {/* KYC Documents Sheet */}
      <RiderKycSheet
        open={kycSheetOpen}
        onOpenChange={setKycSheetOpen}
        documents={kycDocuments}
        kycStatus={kycStatus}
      />

      {/* Confirm Action Dialog */}
      {confirmAction && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundColor="rgba(0,0,0,0.5)"
          justifyContent="center"
          alignItems="center"
          padding="$6"
        >
          <Card
            padding="$6"
            bordered
            backgroundColor="$background"
            width="100%"
            maxWidth={400}
          >
            <YStack gap="$4" alignItems="center">
              <Text fontSize="$6" fontWeight="bold" textAlign="center">
                {confirmAction === "suspend"
                  ? "Suspend Rider?"
                  : "Activate Rider?"}
              </Text>
              <Text fontSize="$4" color="$colorMuted" textAlign="center">
                {confirmAction === "suspend"
                  ? "This rider will no longer be able to accept your business's deliveries."
                  : "This rider will be able to accept your business's deliveries again."}
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
                  backgroundColor={
                    confirmAction === "suspend" ? "$error" : "$success"
                  }
                  onPress={
                    confirmAction === "suspend" ? handleSuspend : handleActivate
                  }
                >
                  Confirm
                </Button>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      )}
    </YStack>
  );
}
