// @ts-nocheck
import { useState } from "react";
import { FlatList } from "react-native";
import { YStack, XStack, Text, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building,
  Plus,
  Search,
  MapPin,
  ChevronRight,
} from "@tamagui/lucide-icons";
import { useBusinessStore } from "@/stores/business.store";
import { useRouter, useNavigation } from "expo-router";
import { Button, Input, BackButton } from "@/components/ui";

export default function BusinessesScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { businesses, setDefaultBusiness, getDefaultBusiness } =
    useBusinessStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.business_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const renderBusiness = ({ item: business }) => {
    const isDefault = getDefaultBusiness()?.id === business.id;
    const isActive = business.status === "active";
    return (
      <Card
        bordered
        overflow="hidden"
        marginBottom="$3"
        pressStyle={{ scale: 0.99, opacity: 0.9 }}
        onPress={() => router.push(`/(shared)/businesses/${business.id}`)}
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
                {business.name}
              </Text>
              {isDefault && (
                <XStack
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$10"
                  backgroundColor="$infoMuted"
                  borderWidth={1}
                  borderColor="$info"
                >
                  <Text
                    fontSize="$1"
                    color="$info"
                    fontFamily="$body"
                    fontWeight="600"
                  >
                    DEFAULT
                  </Text>
                </XStack>
              )}
              <XStack
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$10"
                backgroundColor={isActive ? "$successMuted" : "$backgroundSoft"}
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
            </XStack>
            <XStack gap="$1" alignItems="center">
              <MapPin size={13} color="$colorMuted" />
              <Text
                fontSize="$3"
                color="$colorSecondary"
                numberOfLines={1}
                fontFamily="$body"
              >
                {business.address?.city || "No address"}
              </Text>
            </XStack>
          </YStack>
          <XStack gap="$2" alignItems="center">
            {!isDefault && isActive && (
              <Button
                size="$2"
                variant="outline"
                onPress={(e) => {
                  e.stopPropagation();
                  handleSetDefault(business.id);
                }}
              >
                <Text fontSize="$2" fontFamily="$body">
                  Set Default
                </Text>
              </Button>
            )}
            <ChevronRight size={18} color="$colorMuted" />
          </XStack>
        </XStack>
      </Card>
    );
  };

  const ListHeaderComponent = () => (
    <YStack gap="$4" paddingBottom="$2">
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
            Manage your business locations
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
            All {`(${businesses.length})`}
          </Button>
          <Button
            size="$2"
            variant={filterStatus === "active" ? "primary" : "outline"}
            onPress={() => setFilterStatus("active")}
          >
            Active{" "}
            {`(${businesses.filter((b) => b.status === "active").length})`}
          </Button>
          <Button
            size="$2"
            variant={filterStatus === "inactive" ? "primary" : "outline"}
            onPress={() => setFilterStatus("inactive")}
          >
            Inactive{" "}
            {`(${businesses.filter((b) => b.status !== "active").length})`}
          </Button>
        </XStack>
      </YStack>
    </YStack>
  );

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
    <YStack flex={1} backgroundColor="$background">
      <FlatList
        data={filteredBusinesses}
        keyExtractor={(item) => item.id}
        renderItem={renderBusiness}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{
          padding: 16,
          paddingTop: Math.max(insets.top + 8, 16),
          paddingBottom: Math.max(insets.bottom + 20, 24),
          flexGrow: 1,
        }}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />
    </YStack>
  );
}
