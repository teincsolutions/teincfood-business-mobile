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
  Building,
  Plus,
  Search,
  MapPin,
  Phone,
  Star,
  Clock,
  ChevronRight,
  Check,
  MoreVertical,
} from "@tamagui/lucide-icons";
import { useBusinessStore } from "@/stores/business.store";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components/ui";

export default function BusinessesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { businesses, setDefaultBusiness, getDefaultBusiness } = useBusinessStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && business.status === "active") ||
      (filterStatus === "inactive" && business.status !== "active");

    return matchesSearch && matchesStatus;
  });

  const handleSetDefault = (businessId: string) => {
    setDefaultBusiness(businessId);
  };

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
            Businesses
          </Text>
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
            Manage your business locations
          </Text>
        </YStack>

        {/* Search and Filter */}
        <YStack gap="$3">
          <XStack gap="$3" alignItems="center">
            <YStack flex={1} position="relative">
              <Input
                placeholder="Search businesses..."
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
              onPress={() => router.push("/(seller)/businesses/add")}
            >
              Add Business
            </Button>
          </XStack>

          {/* Status Filter */}
          <XStack gap="$2">
            <Button
              size="$2"
              variant={filterStatus === "all" ? "solid" : "outlined"}
              onPress={() => setFilterStatus("all")}
            >
              All ({businesses.length})
            </Button>
            <Button
              size="$2"
              variant={filterStatus === "active" ? "solid" : "outlined"}
              onPress={() => setFilterStatus("active")}
            >
              Active ({businesses.filter((b) => b.status === "active").length})
            </Button>
            <Button
              size="$2"
              variant={filterStatus === "inactive" ? "solid" : "outlined"}
              onPress={() => setFilterStatus("inactive")}
            >
              Inactive ({businesses.filter((b) => b.status !== "active").length})
            </Button>
          </XStack>
        </YStack>

        {/* Businesses List */}
        <YStack gap="$3">
          {filteredBusinesses.map((business) => {
            const isDefault = getDefaultBusiness()?.id === business.id;
            return (
              <Card
                key={business.id}
                padding="$4"
                bordered
                pressStyle={{ scale: 0.98, opacity: 0.9 }}
                onPress={() => router.push(`/(seller)/businesses/${business.id}`)}
              >
                <XStack gap="$3" alignItems="center">
                  <Avatar circular size="$5">
                    <Avatar.Image src={business.logoUrl} />
                    <Avatar.Fallback backgroundColor="$gray8">
                      <Text color="white" fontWeight="bold">
                        {business.name?.charAt(0) || "B"}
                      </Text>
                    </Avatar.Fallback>
                  </Avatar>

                  <YStack flex={1} gap="$1">
                    <XStack justifyContent="space-between" alignItems="center">
                      <XStack gap="$2" alignItems="center">
                        <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                          {business.name}
                        </Text>
                        {isDefault && (
                          <YStack
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$2"
                            backgroundColor="$blue2"
                          >
                            <Text fontSize="$2" color="$blue10" fontFamily="$body">
                              Default
                            </Text>
                          </YStack>
                        )}
                      </XStack>
                      <YStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={
                          business.status === "active" ? "$green2" : "$gray2"
                        }
                      >
                        <Text
                          fontSize="$2"
                          color={business.status === "active" ? "$green10" : "$gray10"}
                          fontFamily="$body"
                        >
                          {business.status === "active" ? "Active" : "Inactive"}
                        </Text>
                      </YStack>
                    </XStack>

                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                      {business.code}
                    </Text>

                    <XStack gap="$2" alignItems="center" marginTop="$1">
                      <MapPin size={14} color="$colorMuted" />
                      <Text fontSize="$3" color="$colorSecondary" flex={1} numberOfLines={1} fontFamily="$body">
                        {business.address?.city || business.address?.fullAddress || "No address"}
                      </Text>
                    </XStack>

                    {business.phone && (
                      <XStack gap="$2" alignItems="center">
                        <Phone size={14} color="$colorMuted" />
                        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                          {business.phone}
                        </Text>
                      </XStack>
                    )}

                    <XStack gap="$3" marginTop="$1">
                      <XStack gap="$1" alignItems="center">
                        <Star size={14} color="$yellow10" />
                        <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                          {business.rating?.toFixed(1) || "5.0"}
                        </Text>
                      </XStack>
                      <XStack gap="$1" alignItems="center">
                        <Clock size={14} color="$colorMuted" />
                        <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                          {business.todayOrders || 0} orders today
                        </Text>
                      </XStack>
                    </XStack>
                  </YStack>

                  <YStack gap="$2">
                    {!isDefault && business.status === "active" && (
                      <Button
                        size="$2"
                        variant="outlined"
                        onPress={() => handleSetDefault(business.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    <ChevronRight size={20} color="$colorMuted" />
                  </YStack>
                </XStack>
              </Card>
            );
          })}

          {filteredBusinesses.length === 0 && (
            <Card padding="$6" bordered>
              <YStack alignItems="center" gap="$3">
                <Building size={48} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="600" textAlign="center" fontFamily="$heading">
                  {searchQuery || filterStatus !== "all"
                    ? "No businesses found"
                    : "No businesses yet"}
                </Text>
                <Text fontSize="$4" color="$colorSecondary" textAlign="center" fontFamily="$body">
                  {searchQuery || filterStatus !== "all"
                    ? "Try adjusting your search or filter"
                    : "Add your first business to get started"}
                </Text>
                {!searchQuery && filterStatus === "all" && (
                  <Button onPress={() => router.push("/(seller)/businesses/add")}>
                    Add Business
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