// @ts-nocheck
import { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card, Separator, Button } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building,
  Plus,
  Search,
  MapPin,
  ChevronRight,
  LogOut,
  Crown,
  User,
} from "@tamagui/lucide-icons";
import { useRouter, useNavigation } from "expo-router";
import { Input, BackButton } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { useMyBusinesses } from "@/hooks/useMyBusinesses";
import {
  useLeaveBusinessMutation,
  useAcceptFleetInvitationMutation,
  useAcceptBusinessInvitationMutation,
} from "@teincfood/core";

export default function BusinessesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { entries, isLoading, refetchAll } = useMyBusinesses();
  const ownedCount = entries.filter((e) => e.type === "owned").length;
  const leaveMutation = useLeaveBusinessMutation();
  const acceptFleetInvitation = useAcceptFleetInvitationMutation();
  const acceptMemberInvitation = useAcceptBusinessInvitationMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [leaveTarget, setLeaveTarget] = useState<{
    invitationId: string;
    name: string;
  } | null>(null);

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.business_number &&
        entry.business_number
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && entry.status === "active") ||
      (filterStatus === "inactive" && entry.status !== "active");
    return matchesSearch && matchesStatus;
  });

  const RoleBadge = ({ entry }) => {
    if (entry.type === "owned") {
      return (
        <XStack
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$10"
          backgroundColor="$orangeMuted"
          borderWidth={1}
          borderColor="$orange"
        >
          <Crown size={10} color="$orange" />
          <Text
            fontSize="$1"
            color="$orange"
            fontFamily="$body"
            fontWeight="600"
            marginLeft={2}
          >
            OWNER
          </Text>
        </XStack>
      );
    }
    if (entry.type === "rider") {
      return (
        <XStack
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$10"
          backgroundColor="$greenMuted"
          borderWidth={1}
          borderColor="$green"
        >
          <User size={10} color="$green" />
          <Text
            fontSize="$1"
            color="$green"
            fontFamily="$body"
            fontWeight="600"
            marginLeft={2}
          >
            RIDER
          </Text>
        </XStack>
      );
    }
    if (
      entry.type === "fleet_invitation" ||
      entry.type === "member_invitation"
    ) {
      return (
        <XStack
          paddingHorizontal="$2"
          paddingVertical="$1"
          borderRadius="$10"
          backgroundColor="$yellowMuted"
          borderWidth={1}
          borderColor="$yellow"
        >
          <User size={10} color="$yellow" />
          <Text
            fontSize="$1"
            color="$yellow"
            fontFamily="$body"
            fontWeight="600"
            marginLeft={2}
          >
            INVITED
          </Text>
        </XStack>
      );
    }
    return (
      <XStack
        paddingHorizontal="$2"
        paddingVertical="$1"
        borderRadius="$10"
        backgroundColor="$infoMuted"
        borderWidth={1}
        borderColor="$info"
      >
        <User size={10} color="$info" />
        <Text
          fontSize="$1"
          color="$info"
          fontFamily="$body"
          fontWeight="600"
          marginLeft={2}
        >
          {entry.role?.toUpperCase() || "MEMBER"}
        </Text>
      </XStack>
    );
  };

  const renderBusiness = ({ item: entry }) => {
    const isOwned = entry.type === "owned";
    const isActive = entry.status === "active";
    const isPendingInvite =
      entry.type === "fleet_invitation" || entry.type === "member_invitation";
    const canLeave = entry.type === "member" || entry.type === "rider";
    return (
      <Card
        bordered
        overflow="hidden"
        marginBottom="$3"
        pressStyle={{ scale: 0.99, opacity: 0.9 }}
        onPress={() =>
          isOwned && router.push(`/(shared)/businesses/${entry.business_id}`)
        }
      >
        <YStack
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          width={4}
          backgroundColor={isActive ? "$success" : "$colorMuted"}
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
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                {entry.name}
              </Text>
              <RoleBadge entry={entry} />
              {!isPendingInvite && (
                <XStack
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$10"
                  backgroundColor={
                    isActive ? "$successMuted" : "$backgroundSoft"
                  }
                  borderWidth={1}
                  borderColor={isActive ? "$success" : "$borderColor"}
                >
                  <Text
                    fontSize="$1"
                    color={isActive ? "$success" : "$colorMuted"}
                    fontFamily="$body"
                    fontWeight="600"
                  >
                    {isActive ? "ACTIVE" : "INACTIVE"}
                  </Text>
                </XStack>
              )}
            </XStack>
            {entry.business_number && (
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {entry.business_number}
              </Text>
            )}
          </YStack>
          <XStack gap="$2" alignItems="center">
            {isPendingInvite && entry.code && (
              <Button
                size="$2"
                variant="primary"
                onPress={(e) => {
                  e.stopPropagation();
                  // Member and fleet/rider invites use different endpoints.
                  if (entry.type === "member_invitation") {
                    acceptMemberInvitation.mutate({ code: entry.code });
                  } else {
                    acceptFleetInvitation.mutate({ code: entry.code });
                  }
                }}
              >
                Accept
              </Button>
            )}
            {canLeave && entry.invitation_id && (
              <Button
                size="$2"
                variant="dangerOutline"
                icon={<LogOut size={14} />}
                onPress={(e) => {
                  e.stopPropagation();
                  setLeaveTarget({
                    invitationId: entry.invitation_id,
                    name: entry.name,
                  });
                }}
              >
                Leave
              </Button>
            )}
            {isOwned && <ChevronRight size={18} color="$colorMuted" />}
          </XStack>
        </XStack>
      </Card>
    );
  };

  const ListEmptyComponent = () => (
    <Card padding="$6" bordered>
      <YStack alignItems="center" gap="$3">
        <Building size={48} color="$colorMuted" />
        <Text
          fontSize="$5"
          fontWeight="600"
          textAlign="center"
          fontFamily="$heading"
        >
          {searchQuery || filterStatus !== "all"
            ? "No businesses found"
            : "No businesses yet"}
        </Text>
        <Text
          fontSize="$4"
          color="$colorSecondary"
          textAlign="center"
          fontFamily="$body"
        >
          {searchQuery || filterStatus !== "all"
            ? "Try adjusting your search or filter"
            : "Add your first business to get started"}
        </Text>
        {!searchQuery && filterStatus === "all" && (
          <Button onPress={() => router.push("/(shared)/businesses/add")}>
            Add Business
          </Button>
        )}
      </YStack>
    </Card>
  );

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={Math.max(insets.top + 8, 16)}
    >
      <YStack gap="$4" paddingHorizontal="$4" paddingBottom="$2">
        <XStack gap="$2" alignItems="center">
          <BackButton />
          <YStack gap="$1" flex={1}>
            <Text
              fontSize="$8"
              fontWeight="bold"
              fontFamily="$heading"
              color="$color"
            >
              Businesses
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              {ownedCount > 0
                ? "Businesses you own or belong to"
                : "Businesses you belong to"}
            </Text>
          </YStack>
        </XStack>

        <YStack gap="$3">
          <XStack gap="$3" alignItems="center">
            <YStack flex={1} position="relative">
              <Input
                placeholder="Search businesses..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                paddingStart="$10"
              />
              <YStack position="absolute" left="$3" top="$5">
                <Search size={20} color="$colorMuted" />
              </YStack>
            </YStack>
            <Button
              variant="outline"
              icon={Plus}
              onPress={() => router.push("/(shared)/businesses/add")}
            >
              Add Business
            </Button>
          </XStack>

          <XStack gap="$2">
            <Button
              size="$2"
              variant={filterStatus === "all" ? "primary" : "outline"}
              onPress={() => setFilterStatus("all")}
            >
              {`All (${entries.length})`}
            </Button>
            <Button
              size="$2"
              variant={filterStatus === "active" ? "primary" : "outline"}
              onPress={() => setFilterStatus("active")}
            >
              {`Active (${entries.filter((e) => e.status === "active").length})`}
            </Button>
            <Button
              size="$2"
              variant={filterStatus === "inactive" ? "primary" : "outline"}
              onPress={() => setFilterStatus("inactive")}
            >
              {`Inactive (${entries.filter((e) => e.status !== "active").length})`}
            </Button>
          </XStack>
        </YStack>
      </YStack>
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderBusiness}
        ListEmptyComponent={ListEmptyComponent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetchAll} />
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

      <AppAlertDialog
        open={leaveTarget !== null}
        onOpenChange={() => setLeaveTarget(null)}
        title="Leave Business"
        description={`Are you sure you want to leave ${leaveTarget?.name || "this business"}? This will remove your access.`}
        confirmText="Leave"
        isDestructive
        onConfirm={() => {
          if (leaveTarget) {
            leaveMutation.mutate(leaveTarget.invitationId);
            setLeaveTarget(null);
          }
        }}
      />
    </YStack>
  );
}
