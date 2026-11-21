// @ts-nocheck
import { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Avatar,
  Sheet,
  Input as TamaguiInput,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Users,
  UserPlus,
  Phone,
  ChevronRight,
  Clock,
  Check,
  X,
  ExternalLink,
  Bike,
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
import { CachedAvatarImage } from "@/components/ui/CachedAvatarImage";
import { toast } from "sonner-native";
import { extractApiErrorMessage, formatDate } from "@teincfood/core";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { useResponsive } from "@/utils/responsive";

type Tab = "riders" | "requests";

const RIDER_FILTERS = ["all", "available", "busy", "offline"] as const;

const headerText = {
  fontSize: "$2",
  fontFamily: "$body",
  fontWeight: "700",
  color: "$colorSecondary",
  textTransform: "uppercase",
  letterSpacing: 0.6,
} as const;

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatusBadge({ status, active }: { status?: string; active?: boolean }) {
  const isActive = active !== false && status !== "suspended";
  return (
    <YStack
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$full"
      backgroundColor={isActive ? "$successMuted" : "$errorMuted"}
      alignItems="center"
    >
      <Text
        fontSize="$2"
        fontWeight="700"
        fontFamily="$body"
        color={isActive ? "$success" : "$error"}
        numberOfLines={1}
      >
        {titleCase(status || (isActive ? "active" : "inactive"))}
      </Text>
    </YStack>
  );
}

function RiderAvatar({ rider, size = "$5" }: { rider: any; size?: any }) {
  const name = rider?.user?.full_name || rider?.rider_number || "Rider";
  return (
    <Avatar circular size={size} backgroundColor="$primaryLight" flexShrink={0}>
      {rider?.user?.avatar_url ? (
        <CachedAvatarImage src={rider.user.avatar_url} />
      ) : null}
      <Avatar.Fallback
        alignItems="center"
        justifyContent="center"
        backgroundColor="$primaryLight"
      >
        <Text fontSize="$3" fontWeight="800" color="$primary">
          {name.charAt(0).toUpperCase()}
        </Text>
      </Avatar.Fallback>
    </Avatar>
  );
}

export default function SellerRidersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTablet, isLandscape } = useResponsive();
  const useTable = isTablet && isLandscape;
  const gridColumns = !isTablet ? 1 : useTable ? 1 : 2;

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
  const canManageRiders = useHasCapability("riders_manage");

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

  const openRider = (riderId: string) => {
    router.push(`/(seller)/riders/${riderId}`);
  };

  const renderRiderCard = ({ item: rider }: { item: any }) => (
    <Card
      padding="$4"
      bordered
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
      onPress={() => openRider(rider.id)}
    >
      <XStack gap="$3" alignItems="center">
        <RiderAvatar rider={rider} />
        <YStack flex={1} minWidth={0} gap="$1">
          <XStack justifyContent="space-between" alignItems="center" gap="$2">
            <YStack flex={1} minWidth={0}>
              <Text
                fontSize="$4"
                fontWeight="700"
                fontFamily="$heading"
                numberOfLines={1}
              >
                {rider.user?.full_name || "Rider"}
              </Text>
              <Text
                fontSize="$2"
                color="$colorSecondary"
                fontFamily="$body"
                numberOfLines={1}
              >
                {rider.rider_number || "—"}
              </Text>
            </YStack>
            <StatusBadge status={rider.status} active={rider.is_active} />
          </XStack>
          <XStack gap="$3" alignItems="center" flexWrap="wrap">
            <XStack gap="$1" alignItems="center">
              <Phone size={13} color="$colorMuted" />
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                {rider.user?.phone || "N/A"}
              </Text>
            </XStack>
            {rider.vehicle?.plate_number ? (
              <XStack gap="$1" alignItems="center">
                <Bike size={13} color="$colorMuted" />
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  {rider.vehicle.plate_number}
                </Text>
              </XStack>
            ) : null}
          </XStack>
        </YStack>
        <ChevronRight size={18} color="$colorMuted" />
      </XStack>
    </Card>
  );

  const RiderTableHeader = () => (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$2"
      gap="$3"
      alignItems="center"
      backgroundColor="$backgroundSoft"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <Text flex={1.4} minWidth={0} {...headerText}>
        Rider
      </Text>
      <Text width={130} flexShrink={0} {...headerText}>
        Phone
      </Text>
      <Text width={90} flexShrink={0} {...headerText}>
        Status
      </Text>
      <Text width={110} flexShrink={0} {...headerText}>
        Vehicle
      </Text>
      <Text width={80} flexShrink={0} textAlign="right" {...headerText}>
        Actions
      </Text>
    </XStack>
  );

  const RiderTableRow = ({ item: rider }: { item: any }) => (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      gap="$3"
      alignItems="center"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      pressStyle={{ backgroundColor: "$backgroundSoft" }}
      onPress={() => openRider(rider.id)}
    >
      <XStack flex={1.4} minWidth={0} gap="$3" alignItems="center">
        <RiderAvatar rider={rider} size="$4" />
        <YStack flex={1} minWidth={0}>
          <Text
            fontSize="$3"
            fontWeight="700"
            fontFamily="$body"
            color="$color"
            numberOfLines={1}
          >
            {rider.user?.full_name || "Rider"}
          </Text>
          <Text
            fontSize="$2"
            color="$colorSecondary"
            fontFamily="$body"
            numberOfLines={1}
          >
            {rider.rider_number || "—"}
          </Text>
        </YStack>
      </XStack>
      <YStack width={130} flexShrink={0}>
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" numberOfLines={1}>
          {rider.user?.phone || "—"}
        </Text>
      </YStack>
      <XStack width={90} flexShrink={0}>
        <StatusBadge status={rider.status} active={rider.is_active} />
      </XStack>
      <YStack width={110} flexShrink={0}>
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" numberOfLines={1}>
          {rider.vehicle?.plate_number || "—"}
        </Text>
      </YStack>
      <XStack width={80} flexShrink={0} justifyContent="flex-end">
        <Button
          variant="outline"
          width={40}
          height={40}
          padding={0}
          accessibilityLabel={`View ${rider.user?.full_name || rider.rider_number || "rider"}`}
          icon={<ExternalLink size={16} />}
          onPress={() => openRider(rider.id)}
        />
      </XStack>
    </XStack>
  );

  const renderRequestCard = ({ item: request }: { item: any }) => {
    const rider = request.rider || {};
    const user = rider.user || {};
    const isPending = approveRequest.isPending || rejectRequest.isPending;
    return (
      <Card padding="$4" bordered>
        <YStack gap="$3">
          <XStack gap="$3" alignItems="center">
            <RiderAvatar rider={rider} />
            <YStack flex={1} minWidth={0}>
              <Text fontSize="$4" fontWeight="700" fontFamily="$heading" numberOfLines={1}>
                {user.full_name || rider.rider_number || "Rider"}
              </Text>
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body" numberOfLines={1}>
                {rider.rider_number || ""}
              </Text>
            </YStack>
            <YStack
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$full"
              backgroundColor="$yellow2"
            >
              <Text fontSize="$2" color="$yellow10" fontFamily="$body" fontWeight="700">
                Pending
              </Text>
            </YStack>
          </XStack>
          {canManageRiders ? (
            <XStack gap="$2">
              <Button
                flex={1}
                size="$3"
                backgroundColor="$green10"
                icon={<Check size={14} />}
                onPress={() => handleApproveRequest(request.id)}
                disabled={isPending}
              >
                Approve
              </Button>
              <Button
                flex={1}
                size="$3"
                backgroundColor="$red10"
                icon={<X size={14} />}
                onPress={() => handleRejectRequest(request.id)}
                disabled={isPending}
              >
                Reject
              </Button>
            </XStack>
          ) : null}
        </YStack>
      </Card>
    );
  };

  const RequestTableHeader = () => (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$2"
      gap="$3"
      alignItems="center"
      backgroundColor="$backgroundSoft"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
    >
      <Text flex={1} minWidth={0} {...headerText}>
        Rider
      </Text>
      <Text width={140} flexShrink={0} {...headerText}>
        Rider #
      </Text>
      <Text width={120} flexShrink={0} {...headerText}>
        Requested
      </Text>
      <Text width={170} flexShrink={0} textAlign="right" {...headerText}>
        Actions
      </Text>
    </XStack>
  );

  const RequestTableRow = ({ item: request }: { item: any }) => {
    const rider = request.rider || {};
    const user = rider.user || {};
    const isPending = approveRequest.isPending || rejectRequest.isPending;
    return (
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        gap="$3"
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack flex={1} minWidth={0} gap="$3" alignItems="center">
          <RiderAvatar rider={rider} size="$4" />
          <Text fontSize="$3" fontWeight="700" fontFamily="$body" numberOfLines={1}>
            {user.full_name || rider.rider_number || "Rider"}
          </Text>
        </XStack>
        <YStack width={140} flexShrink={0}>
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" numberOfLines={1}>
            {rider.rider_number || "—"}
          </Text>
        </YStack>
        <YStack width={120} flexShrink={0}>
          <Text fontSize="$2" color="$colorSecondary" fontFamily="$body" numberOfLines={1}>
            {request.inserted_at ? formatDate(request.inserted_at) : "—"}
          </Text>
        </YStack>
        <XStack width={170} flexShrink={0} justifyContent="flex-end" gap="$2">
          {canManageRiders ? (
            <>
              <Button
                size="$3"
                height={38}
                backgroundColor="$green10"
                paddingHorizontal="$3"
                icon={<Check size={14} />}
                onPress={() => handleApproveRequest(request.id)}
                disabled={isPending}
              >
                Approve
              </Button>
              <Button
                size="$3"
                height={38}
                backgroundColor="$red10"
                paddingHorizontal="$3"
                icon={<X size={14} />}
                onPress={() => handleRejectRequest(request.id)}
                disabled={isPending}
              >
                Reject
              </Button>
            </>
          ) : null}
        </XStack>
      </XStack>
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

  const contentMax = useTable ? 1100 : isTablet ? 960 : undefined;
  const listData = activeTab === "riders" ? riders : joinRequests;
  const listKey = `${activeTab}-${useTable ? "table" : `grid-${gridColumns}`}`;

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Full-width header */}
      <YStack
        paddingHorizontal="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        paddingBottom="$3"
        gap="$2"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Riders
        </Text>
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
          Manage delivery riders for your business
        </Text>
        <XStack gap="$3" paddingTop="$2">
          <Button
            flex={1}
            height={44}
            variant={activeTab === "riders" ? "primary" : "outline"}
            onPress={() => setActiveTab("riders")}
          >
            {`My Riders (${riders.length})`}
          </Button>
          <Button
            flex={1}
            height={44}
            variant={activeTab === "requests" ? "primary" : "outline"}
            onPress={() => setActiveTab("requests")}
          >
            {`Pending (${joinRequests.length})`}
          </Button>
        </XStack>
      </YStack>

      <YStack
        flex={1}
        width="100%"
        maxWidth={contentMax}
        alignSelf="center"
      >
        {activeTab === "riders" ? (
          <YStack padding="$4" gap="$3">
            <XStack gap="$3" alignItems="center">
              <YStack flex={1}>
                <Input
                  placeholder="Search riders..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </YStack>
              <Button
                variant="outline"
                height={44}
                icon={<UserPlus size={18} />}
                onPress={() => setInviteSheetOpen(true)}
                disabled={!canManageRiders}
              >
                Invite
              </Button>
            </XStack>
            <XStack gap="$2" flexWrap="wrap">
              {RIDER_FILTERS.map((status) => (
                <Button
                  key={status}
                  height={40}
                  width="auto"
                  paddingHorizontal="$3"
                  variant={filterStatus === status ? "primary" : "outline"}
                  onPress={() => setFilterStatus(status)}
                >
                  {titleCase(status)}
                </Button>
              ))}
            </XStack>
          </YStack>
        ) : null}

        {useTable && activeTab === "riders" ? <RiderTableHeader /> : null}
        {useTable && activeTab === "requests" ? <RequestTableHeader /> : null}

        <FlatList
          key={listKey}
          data={listData}
          keyExtractor={(item) => item.id}
          numColumns={useTable ? 1 : gridColumns}
          columnWrapperStyle={
            !useTable && gridColumns > 1 ? { gap: 12 } : undefined
          }
          renderItem={
            activeTab === "riders"
              ? useTable
                ? ({ item }) => <RiderTableRow item={item} />
                : ({ item }) => (
                    <YStack
                      flex={1}
                      paddingBottom="$3"
                      maxWidth={gridColumns > 1 ? "50%" : "100%"}
                    >
                      {renderRiderCard({ item })}
                    </YStack>
                  )
              : useTable
                ? ({ item }) => <RequestTableRow item={item} />
                : ({ item }) => (
                    <YStack
                      flex={1}
                      paddingBottom="$3"
                      maxWidth={gridColumns > 1 ? "50%" : "100%"}
                    >
                      {renderRequestCard({ item })}
                    </YStack>
                  )
          }
          ListEmptyComponent={ListEmpty}
          refreshControl={
            <RefreshControl
              refreshing={
                activeTab === "riders"
                  ? ridersRefetching || ridersLoading
                  : requestsLoading
              }
              onRefresh={
                activeTab === "riders" ? refetchRiders : refetchRequests
              }
            />
          }
          contentContainerStyle={{
            paddingHorizontal: useTable ? 0 : 16,
            paddingBottom: Math.max(insets.bottom + 20, 24),
            flexGrow: 1,
          }}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
        />
      </YStack>

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
          {...(isTablet ? { maxWidth: 600, alignSelf: "center" } : {})}
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
