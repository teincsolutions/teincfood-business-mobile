// @ts-nocheck
import { useState } from "react";
import { FlatList, RefreshControl, ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Avatar,
  Sheet,
  Separator,
  Input as TamaguiInput,
  useMedia,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  ChevronRight,
  Clock,
  Check,
  X,
  Mail,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components/ui";
import {
  useFleetRidersQuery,
  useJoinRequestsQuery,
  useApproveJoinRequestMutation,
  useRejectJoinRequestMutation,
  useInviteRiderMutation,
} from "@teincfood/core";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@teincfood/core";

type Tab = "riders" | "requests";

export default function SellerRidersScreen() {
  const router = useRouter();
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("riders");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const {
    data: ridersRes,
    isLoading: ridersLoading,
    refetch: refetchRiders,
    isRefetching: ridersRefetching,
  } = useFleetRidersQuery(true, {
    q: searchQuery || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });
  const {
    data: joinRequestsRes,
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useJoinRequestsQuery(true);

  const approveRequest = useApproveJoinRequestMutation();
  const rejectRequest = useRejectJoinRequestMutation();
  const inviteRider = useInviteRiderMutation();

  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    id: string;
  } | null>(null);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [inviteIdentifier, setInviteIdentifier] = useState("");

  const riders = ridersRes?.data ?? [];
  const joinRequests = joinRequestsRes?.data ?? [];

  const handleApproveRequest = (requestId: string) => {
    approveRequest.mutate(requestId, {
      onSuccess: () => toast.success("Join request approved"),
      onError: (err) => toast.error(extractApiErrorMessage(err)),
    });
  };

  const handleRejectRequest = (requestId: string) => {
    rejectRequest.mutate(requestId, {
      onSuccess: () => toast.success("Join request rejected"),
      onError: (err) => toast.error(extractApiErrorMessage(err)),
    });
  };

  const handleInvite = () => {
    const identifier = inviteIdentifier.trim();
    if (!identifier) {
      toast.error("Enter a rider number, email, or phone");
      return;
    }
    // Send as rider_number if it looks like a rider number (prefix + digits),
    // otherwise as email (contains @) or phone.
    const data: Record<string, string> = {};
    if (/^[\w-]+\d+$/i.test(identifier) || /^RID-/i.test(identifier)) {
      data.rider_number = identifier;
    } else if (identifier.includes("@")) {
      data.email = identifier;
    } else {
      data.phone = identifier;
    }
    inviteRider.mutate(data, {
      onSuccess: () => {
        toast.success("Invitation sent");
        setInviteSheetOpen(false);
        setInviteIdentifier("");
      },
      onError: (err) => toast.error(extractApiErrorMessage(err)),
    });
  };

  const renderRider = ({ item: rider }: { item: any }) => (
    <Card
      padding="$4"
      bordered
      marginBottom="$3"
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
      onPress={() => router.push(`/(seller)/riders/${rider.id}`)}
    >
      <XStack gap="$3" alignItems="center">
        <Avatar circular size="$5">
          <Avatar.Fallback backgroundColor="$gray800">
            <Text color="white" fontWeight="bold">
              {(rider.user?.full_name || "R").charAt(0)}
            </Text>
          </Avatar.Fallback>
        </Avatar>

        <YStack flex={1} gap="$1">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
              {rider.user?.full_name || "Rider"}
            </Text>
            <YStack
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
              backgroundColor={
                rider.is_active ? "$successMuted" : "$errorMuted"
              }
            >
              <Text
                fontSize="$3"
                color={rider.is_active ? "$success" : "$error"}
                fontFamily="$body"
              >
                {rider.status}
              </Text>
            </YStack>
          </XStack>

          <XStack gap="$3" alignItems="center">
            <XStack gap="$1" alignItems="center">
              <Phone size={14} color="$colorMuted" />
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {rider.user?.phone || "N/A"}
              </Text>
            </XStack>
            {rider.vehicle?.plate_number && (
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                · {rider.vehicle.plate_number}
              </Text>
            )}
          </XStack>
        </YStack>

        <ChevronRight size={20} color="$colorMuted" />
      </XStack>
    </Card>
  );

  const renderJoinRequest = ({ item: request }: { item: any }) => {
    const rider = request.rider || {};
    const user = rider.user || {};
    const isPending = approveRequest.isPending || rejectRequest.isPending;

    return (
      <Card padding="$4" bordered marginBottom="$3">
        <YStack gap="$3">
          <XStack gap="$3" alignItems="center">
            <Avatar circular size="$5">
              <Avatar.Fallback backgroundColor="$gray800">
                <Text color="white" fontWeight="bold">
                  {(user.full_name || "R").charAt(0)}
                </Text>
              </Avatar.Fallback>
            </Avatar>

            <YStack flex={1}>
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                {user.full_name || rider.rider_number || "Rider"}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {rider.rider_number || ""}
              </Text>
            </YStack>

            <YStack
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
              backgroundColor="$yellow2"
            >
              <Text fontSize="$2" color="$yellow10" fontFamily="$body">
                Pending
              </Text>
            </YStack>
          </XStack>

          <XStack gap="$3">
            <Button
              size="$3"
              backgroundColor="$green10"
              icon={<Check size={14} />}
              onPress={() => handleApproveRequest(request.id)}
              disabled={isPending}
            >
              Approve
            </Button>
            <Button
              size="$3"
              backgroundColor="$red10"
              icon={<X size={14} />}
              onPress={() => handleRejectRequest(request.id)}
              disabled={isPending}
            >
              Reject
            </Button>
          </XStack>
        </YStack>
      </Card>
    );
  };

  const ListEmpty = () => (
    <Card padding="$6" bordered margin="$4">
      <YStack alignItems="center" gap="$3">
        {activeTab === "riders" ? (
          <>
            <Users size={48} color="$colorMuted" />
            <Text fontSize="$5" fontWeight="600" textAlign="center">
              {searchQuery || filterStatus !== "all"
                ? "No riders found"
                : "No riders yet"}
            </Text>
            <Text fontSize="$4" color="$colorSecondary" textAlign="center">
              Riders request to join your business to deliver your orders.
            </Text>
          </>
        ) : (
          <>
            <Clock size={48} color="$colorMuted" />
            <Text fontSize="$5" fontWeight="600" textAlign="center">
              No pending requests
            </Text>
            <Text fontSize="$4" color="$colorSecondary" textAlign="center">
              Riders can request to join your business from their app.
            </Text>
          </>
        )}
      </YStack>
    </Card>
  );

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top} {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center", width: "100%" } : {})}>
      <YStack padding="$4" gap="$2">
        <Text
          fontSize="$7"
          fontWeight="bold"
          fontFamily="$heading"
          color="$color"
        >
          Riders
        </Text>
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
          Manage delivery riders for your business
        </Text>

        {/* Tabs */}
        <XStack gap="$3" paddingTop="$2">
          <Button
            flex={1}
            variant={activeTab === "riders" ? "primary" : "outline"}
            onPress={() => setActiveTab("riders")}
          >
            {`My Riders (${riders.length})`}
          </Button>
          <Button
            flex={1}
            variant={activeTab === "requests" ? "primary" : "outline"}
            onPress={() => setActiveTab("requests")}
          >
            {`Pending (${joinRequests.length})`}
          </Button>
        </XStack>
      </YStack>

      {activeTab === "riders" && (
        <YStack paddingHorizontal="$4" gap="$3">
          <XStack gap="$3" alignItems="center">
            <YStack flex={1} position="relative">
              <Input
                placeholder="Search riders..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </YStack>
            <Button
              variant="outline"
              icon={<UserPlus size={18} />}
              onPress={() => setInviteSheetOpen(true)}
            >
              Invite
            </Button>
          </XStack>

          <XStack gap="$2" flexWrap="wrap">
            {["all", "available", "busy", "offline"].map((s) => (
              <Button
                key={s}
                height="$12"
                width="auto"
                variant={filterStatus === s ? "primary" : "outline"}
                onPress={() => setFilterStatus(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </XStack>
        </YStack>
      )}

      {activeTab === "riders" ? (
        <FlatList
          data={riders}
          keyExtractor={(item) => item.id}
          renderItem={renderRider}
          ListEmptyComponent={ListEmpty}
          refreshControl={
            <RefreshControl
              refreshing={ridersRefetching || ridersLoading}
              onRefresh={refetchRiders}
            />
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Math.max(insets.bottom + 20, 24),
          }}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
        />
      ) : (
        <FlatList
          data={joinRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderJoinRequest}
          ListEmptyComponent={ListEmpty}
          refreshControl={
            <RefreshControl
              refreshing={requestsLoading}
              onRefresh={refetchRequests}
            />
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Math.max(insets.bottom + 20, 24),
          }}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
        />
      )}

      {/* Invite Rider Sheet */}
      <Sheet
        modal
        open={inviteSheetOpen}
        onOpenChange={setInviteSheetOpen}
        snapPoints={[50]}
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
          padding="$5"
          paddingBottom={insets.bottom + 16}
          {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4">
            <Text fontSize="$6" fontWeight="bold">
              Invite Rider
            </Text>
            <Text fontSize="$3" color="$colorMuted">
              Enter the rider's number, email, or phone
            </Text>

            <TamaguiInput
              placeholder="Rider number, email, or phone"
              value={inviteIdentifier}
              onChangeText={setInviteIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Button
              backgroundColor="$primary"
              onPress={handleInvite}
              disabled={inviteRider.isPending || !inviteIdentifier.trim()}
            >
              {inviteRider.isPending ? "Sending..." : "Send Invitation"}
            </Button>
            <Button variant="outline" onPress={() => setInviteSheetOpen(false)}>
              Cancel
            </Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      <AppAlertDialog
        open={confirmAction !== null}
        onOpenChange={() => setConfirmAction(null)}
        title={
          confirmAction?.type === "approve"
            ? "Approve Request"
            : "Reject Request"
        }
        description={
          confirmAction?.type === "approve"
            ? "This rider will be able to accept your business's deliveries."
            : "This rider will not be able to join your business."
        }
        confirmText={confirmAction?.type === "approve" ? "Approve" : "Reject"}
        isDestructive={confirmAction?.type === "reject"}
        onConfirm={() => {
          if (confirmAction?.type === "approve") {
            handleApproveRequest(confirmAction.id);
          } else if (confirmAction?.type === "reject") {
            handleRejectRequest(confirmAction.id);
          }
          setConfirmAction(null);
        }}
      />
    </YStack>
  );
}
