// @ts-nocheck
import { useEffect, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card, Avatar } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users, Plus, Search, Phone, ChevronRight } from "@tamagui/lucide-icons";
import { useFleetRidersQuery } from "@teincfood/core";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components/ui";
import { MasterDetail, useResponsiveLayout } from "@/components/layout";
import { RiderDetailView } from "@/components/fleet/RiderDetailView";

export default function FleetRidersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Drawer content is single-pane at every size; details push normally.
  const isTwoPane = false;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: ridersRes,
    refetch,
    isRefetching,
  } = useFleetRidersQuery(true, {
    q: searchQuery || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });
  const riders = ridersRes?.data ?? [];
  const selectedRider = riders.find((rider) => rider.id === selectedId) ?? null;

  useEffect(() => {
    if (!isTwoPane) {
      setSelectedId(null);
      return;
    }
    if (!selectedId && riders.length > 0) {
      setSelectedId(riders[0].id);
    }
  }, [isTwoPane, riders, selectedId]);

  const openRider = (riderId: string) => {
    if (isTwoPane) {
      setSelectedId(riderId);
    } else {
      router.push(`/(fleet)/riders/${riderId}`);
    }
  };

  const renderRider = ({ item: rider }) => {
    const isSelected = isTwoPane && selectedId === rider.id;

    return (
      <Card
        padding="$4"
        bordered
        marginBottom="$3"
        borderColor={isSelected ? "$primary" : undefined}
        backgroundColor={isSelected ? "$backgroundSoft" : undefined}
        pressStyle={{ scale: 0.98, opacity: 0.9 }}
        onPress={() => openRider(rider.id)}
      >
        <XStack gap="$3" alignItems="center">
          <Avatar circular size="$5">
            <Avatar.Image src={rider.user?.avatar_url} />
            <Avatar.Fallback backgroundColor="$gray800">
              <Text color="white" fontWeight="bold">
                {(rider.user?.full_name || "R").charAt(0)}
              </Text>
            </Avatar.Fallback>
          </Avatar>

          <YStack flex={1} gap="$1">
            <XStack
              justifyContent="space-between"
              alignItems="center"
              gap="$2"
            >
              <Text
                fontSize="$5"
                fontWeight="600"
                fontFamily="$heading"
                flexShrink={1}
                numberOfLines={1}
              >
                {rider.user?.full_name || rider.rider_number || "Rider"}
              </Text>
              <YStack
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
                backgroundColor={
                  rider.is_online ? "$green2" : "$gray2"
                }
              >
                <Text
                  fontSize="$2"
                  color={rider.is_online ? "$green10" : "$gray10"}
                  fontFamily="$body"
                >
                  {rider.is_online ? "Online" : rider.status || "Offline"}
                </Text>
              </YStack>
            </XStack>

            <XStack gap="$3" alignItems="center">
              <XStack gap="$1" alignItems="center">
                <Phone size={14} color="$colorMuted" />
                <Text
                  fontSize="$3"
                  color="$colorSecondary"
                  fontFamily="$body"
                  numberOfLines={1}
                >
                  {rider.phone || "N/A"}
                </Text>
              </XStack>
            </XStack>
          </YStack>

          <ChevronRight size={20} color="$colorMuted" />
        </XStack>
      </Card>
    );
  };

  const header = (
    <YStack gap="$4" paddingTop="$4" paddingBottom="$2">
      <YStack gap="$2">
        <Text
          fontSize="$8"
          fontWeight="bold"
          fontFamily="$heading"
          color="$color"
        >
          Riders
        </Text>
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
          Manage your fleet riders
        </Text>
      </YStack>

      <YStack gap="$3">
        <XStack gap="$3" alignItems="center">
          <YStack flex={1} position="relative">
            <Input
              placeholder="Search riders..."
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
            onPress={() => router.push("/(fleet)/riders/add")}
          >
            Add Rider
          </Button>
        </XStack>

        <XStack gap="$2" flexWrap="wrap">
          <Button
            size="$2"
            variant={filterStatus === "all" ? "primary" : "outline"}
            onPress={() => setFilterStatus("all")}
          >
            All {`(${riders.length || "0"})`}
          </Button>
          <Button
            size="$2"
            variant={filterStatus === "available" ? "primary" : "outline"}
            onPress={() => setFilterStatus("available")}
          >
            Available
          </Button>
          <Button
            size="$2"
            variant={filterStatus === "busy" ? "primary" : "outline"}
            onPress={() => setFilterStatus("busy")}
          >
            Busy
          </Button>
          <Button
            size="$2"
            variant={filterStatus === "offline" ? "primary" : "outline"}
            onPress={() => setFilterStatus("offline")}
          >
            Offline
          </Button>
        </XStack>
      </YStack>
    </YStack>
  );

  const list = (
    <FlatList
      data={riders}
      keyExtractor={(item) => item.id}
      renderItem={renderRider}
      ListHeaderComponent={isTwoPane ? undefined : header}
      ListEmptyComponent={
        <Card bordered padding="$6">
          <YStack alignItems="center" gap="$3">
            <Users size={48} color="$colorMuted" />
            <Text
              fontSize="$5"
              fontWeight="600"
              textAlign="center"
              fontFamily="$heading"
            >
              {searchQuery || filterStatus !== "all"
                ? "No riders found"
                : "No riders yet"}
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              textAlign="center"
              fontFamily="$body"
            >
              {searchQuery || filterStatus !== "all"
                ? "Try adjusting your search or filter"
                : "Add your first rider to get started"}
            </Text>
            {!searchQuery && filterStatus === "all" && (
              <Button
                variant="primary"
                maxWidth={360}
                alignSelf="center"
                onPress={() => router.push("/(fleet)/riders/add")}
              >
                Add Rider
              </Button>
            )}
          </YStack>
        </Card>
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      contentContainerStyle={{
        paddingHorizontal: isTwoPane ? 12 : 16,
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
      initialNumToRender={10}
      windowSize={5}
      maxToRenderPerBatch={10}
      removeClippedSubviews
    />
  );

  if (!isTwoPane) {
    return (
      <YStack flex={1} backgroundColor="$background">
        <YStack flex={1} width="100%" maxWidth={960} alignSelf="center">
          {list}
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack width="100%" maxWidth={1060} alignSelf="center" paddingHorizontal="$4">
        {header}
      </YStack>
      <MasterDetail
        master={list}
        detail={
          selectedRider ? (
            <RiderDetailView
              riderId={selectedRider.id}
              initialRider={selectedRider}
              embedded
              onClose={() => setSelectedId(null)}
            />
          ) : null
        }
        empty={
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            gap="$3"
            padding="$6"
          >
            <Users size={56} color="$colorMuted" />
            <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
              Select a rider
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
              textAlign="center"
            >
              Choose a rider from the list to see their details.
            </Text>
          </YStack>
        }
      />
    </YStack>
  );
}
