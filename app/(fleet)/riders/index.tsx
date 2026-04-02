// @ts-nocheck
import { useState } from "react";
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
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Car,
  MoreVertical,
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

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
    >
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
            Riders
          </Text>
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
            Manage your fleet riders
          </Text>
        </YStack>

        {/* Search and Filter */}
        <YStack gap="$3">
          <XStack gap="$3" alignItems="center">
            <YStack flex={1} position="relative">
              <Input
                placeholder="Search riders..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                paddingLeft="$4"
              />
              <YStack position="absolute" left="$3" top="$3">
                <Search size={20} color="$colorMuted" />
              </YStack>
            </YStack>
            <Button
              icon={Plus}
              onPress={() => router.push("/(fleet)/riders/add")}
            >
              Add Rider
            </Button>
          </XStack>

          {/* Status Filter */}
          <XStack gap="$2">
            <Button
              size="$2"
              variant={filterStatus === "all" ? "solid" : "outlined"}
              onPress={() => setFilterStatus("all")}
            >
              All ({riders.length})
            </Button>
            <Button
              size="$2"
              variant={filterStatus === "active" ? "solid" : "outlined"}
              onPress={() => setFilterStatus("active")}
            >
              Online ({riders.filter((r) => r.status === "active").length})
            </Button>
            <Button
              size="$2"
              variant={filterStatus === "inactive" ? "solid" : "outlined"}
              onPress={() => setFilterStatus("inactive")}
            >
              Offline ({riders.filter((r) => r.status !== "active").length})
            </Button>
          </XStack>
        </YStack>

        {/* Riders List */}
        <YStack gap="$3">
          {filteredRiders.map((rider) => (
            <Card
              key={rider.id}
              padding="$4"
              bordered
              pressStyle={{ scale: 0.98, opacity: 0.9 }}
              onPress={() => router.push(`/(fleet)/riders/${rider.id}`)}
            >
              <XStack gap="$3" alignItems="center">
                <Avatar circular size="$5">
                  <Avatar.Image src={rider.riderAvatarUrl} />
                  <Avatar.Fallback backgroundColor="$gray8">
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
                      backgroundColor={
                        rider.status === "active" ? "$green2" : "$gray2"
                      }
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

                  <XStack gap="$3" marginTop="$1">
                    <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                      {rider.totalDeliveries} deliveries
                    </Text>
                    <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                      •
                    </Text>
                    <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                      Rating: {rider.rating.toFixed(1)}
                    </Text>
                    <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                      •
                    </Text>
                    <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                      GHS {rider.totalEarnings.toFixed(2)}
                    </Text>
                  </XStack>
                </YStack>

                <ChevronRight size={20} color="$colorMuted" />
              </XStack>
            </Card>
          ))}

          {filteredRiders.length === 0 && (
            <Card padding="$6" bordered>
              <YStack alignItems="center" gap="$3">
                <Users size={48} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="600" textAlign="center">
                  {searchQuery || filterStatus !== "all"
                    ? "No riders found"
                    : "No riders yet"}
                </Text>
                <Text
                  fontSize="$4"
                  color="$colorSecondary"
                  textAlign="center"
                >
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
          )}
        </YStack>
      </YStack>
    </ScrollView>
  );
}