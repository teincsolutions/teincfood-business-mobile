// @ts-nocheck
import { useState } from "react";
import { FlatList } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Avatar,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Users,
  Plus,
  Search,
  Phone,
  Car,
  ChevronRight,
} from "@tamagui/lucide-icons";
import { useFleetStore } from "@/stores/fleet.store";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components/ui";

export default function FleetRidersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { riders } = useFleetStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const filteredRiders = riders.filter((rider) => {
    const matchesSearch =
      rider.riderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.riderPhone.includes(searchQuery) ||
      rider.riderEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && rider.status === "active") ||
      (filterStatus === "inactive" && rider.status !== "active");
    return matchesSearch && matchesStatus;
  });

  const renderRider = ({ item: rider }) => (
    <Card
      padding="$4"
      bordered
      marginBottom="$3"
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
      onPress={() => router.push(`/(fleet)/riders/${rider.id}`)}
    >
      <XStack gap="$3" alignItems="center">
        <Avatar circular size="$5">
          <Avatar.Image src={rider.riderAvatarUrl} />
          <Avatar.Fallback backgroundColor="$gray800">
            <Text color="white" fontWeight="bold">
              {rider.riderName?.charAt(0) || "R"}
            </Text>
          </Avatar.Fallback>
        </Avatar>

        <YStack flex={1} gap="$1">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
              {rider.riderName}
            </Text>
            <YStack
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
              backgroundColor={rider.status === "active" ? "$green2" : "$gray2"}
            >
              <Text
                fontSize="$2"
                color={rider.status === "active" ? "$green10" : "$gray10"}
                fontFamily="$body"
              >
                {rider.status === "active" ? "Online" : "Offline"}
              </Text>
            </YStack>
          </XStack>

          <XStack gap="$3" alignItems="center">
            <XStack gap="$1" alignItems="center">
              <Phone size={14} color="$colorMuted" />
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {rider.riderPhone}
              </Text>
            </XStack>
            {rider.vehiclePlateNumber && (
              <XStack gap="$1" alignItems="center">
                <Car size={14} color="$colorMuted" />
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  {rider.vehiclePlateNumber}
                </Text>
              </XStack>
            )}
          </XStack>
        </YStack>

        <ChevronRight size={20} color="$colorMuted" />
      </XStack>
    </Card>
  );

  const ListHeaderComponent = () => (
    <YStack gap="$4" padding="$4" paddingBottom="$2">
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
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

        <XStack gap="$2">
          <Button
            size="$2"
            variant={filterStatus === "all" ? "primary" : "outline"}
            onPress={() => setFilterStatus("all")}
          >
            All {`(${riders.length || "0"})`}
            </Button>
            <Button
              size="$2"
              variant={filterStatus === "active" ? "primary" : "outline"}
              onPress={() => setFilterStatus("active")}
            >
              Online {`(${riders.filter((r) => r.status === "active").length || "0"})`}
            </Button>
            <Button
              size="$2"
              variant={filterStatus === "inactive" ? "primary" : "outline"}
              onPress={() => setFilterStatus("inactive")}
            >
              Offline {`(${riders.filter((r) => r.status !== "active").length || "0"})`}
          </Button>
        </XStack>
      </YStack>
    </YStack>
  );

  const ListEmptyComponent = () => (
    <Card padding="$6" bordered margin="$4">
      <YStack alignItems="center" gap="$3">
        <Users size={48} color="$colorMuted" />
        <Text fontSize="$5" fontWeight="600" textAlign="center">
          {searchQuery || filterStatus !== "all"
            ? "No riders found"
            : "No riders yet"}
        </Text>
        <Text fontSize="$4" color="$colorSecondary" textAlign="center">
          {searchQuery || filterStatus !== "all"
            ? "Try adjusting your search or filter"
            : "Add your first rider to get started"}
        </Text>
        {!searchQuery && filterStatus === "all" && (
          <Button onPress={() => router.push("/(fleet)/riders/add")}>
            Add Rider
          </Button>
        )}
      </YStack>
    </Card>
  );

  return (
    <FlatList
      data={filteredRiders}
      keyExtractor={(item) => item.id}
      renderItem={renderRider}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
      initialNumToRender={10}
      windowSize={5}
      maxToRenderPerBatch={10}
      removeClippedSubviews
    />
  );
}
