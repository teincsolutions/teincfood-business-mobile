// @ts-nocheck
import { useState, useEffect } from "react";
import { FlatList } from "react-native";
import { YStack, XStack, Text, Card, Avatar } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building,
  MapPin,
  Phone,
  Star,
  Clock,
  ChevronRight,
  Plus,
  Check,
} from "@tamagui/lucide-icons";
import { useBusinessStore } from "@/stores/business.store";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";

export default function SelectBusinessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { businesses, setActiveBusiness, getDefaultBusiness } =
    useBusinessStore();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const defaultBusiness = getDefaultBusiness();
    if (defaultBusiness) {
      setSelectedBusinessId(defaultBusiness.id);
    }
  }, []);

  const handleContinue = () => {
    if (selectedBusinessId) {
      const selectedBusiness = businesses.find(
        (b) => b.id === selectedBusinessId,
      );
      if (selectedBusiness) {
        setActiveBusiness(selectedBusiness as any);
        router.replace("/(seller)/(drawer)/dashboard");
      }
    }
  };

  const handleAddNewBusiness = () => {
    router.push("/(seller)/businesses/add");
  };

  const renderBusiness = ({ item: business }) => (
    <Card
      padding="$4"
      bordered
      marginBottom="$3"
      backgroundColor={
        selectedBusinessId === business.id ? "$primaryLight" : "$background"
      }
      borderColor={
        selectedBusinessId === business.id ? "$primary" : "$borderColor"
      }
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
      onPress={() => setSelectedBusinessId(business.id)}
    >
      <XStack gap="$3" alignItems="center">
        <Avatar circular size="$5">
          <Avatar.Image src={business.logoUrl} />
          <Avatar.Fallback backgroundColor="$gray800">
            <Text color="white" fontWeight="bold">
              {business.name?.charAt(0) || "B"}
            </Text>
          </Avatar.Fallback>
        </Avatar>

        <YStack flex={1} gap="$1">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
              {business.name}
            </Text>
            {selectedBusinessId === business.id && (
              <YStack
                width={24}
                height={24}
                borderRadius="$10"
                backgroundColor="$primary"
                alignItems="center"
                justifyContent="center"
              >
                <Check size={16} color="white" />
              </YStack>
            )}
          </XStack>

          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            {business.code}
          </Text>

          <XStack gap="$2" alignItems="center" marginTop="$1">
            <MapPin size={14} color="$colorMuted" />
            <Text
              fontSize="$3"
              color="$colorSecondary"
              flex={1}
              numberOfLines={1}
              fontFamily="$body"
            >
              {business.address?.city ||
                business.address?.fullAddress ||
                "No address"}
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

        <ChevronRight size={20} color="$colorMuted" />
      </XStack>
    </Card>
  );

  const ListHeaderComponent = () => (
    <YStack gap="$2" alignItems="center" paddingBottom="$2">
      <Text
        fontSize="$9"
        fontWeight="bold"
        fontFamily="$heading"
        color="$color"
      >
        Select Business
      </Text>
      <Text
        fontSize="$4"
        color="$colorSecondary"
        textAlign="center"
        fontFamily="$body"
      >
        Choose which business you want to manage
      </Text>
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
          No businesses yet
        </Text>
        <Text
          fontSize="$4"
          color="$colorSecondary"
          textAlign="center"
          fontFamily="$body"
        >
          Add your first business to get started
        </Text>
      </YStack>
    </Card>
  );

  const ListFooterComponent = () => (
    <YStack gap="$3" marginTop="$2">
      <Card
        padding="$4"
        bordered
        borderStyle="dashed"
        borderColor="$borderColor"
        pressStyle={{ scale: 0.98, opacity: 0.9 }}
        onPress={handleAddNewBusiness}
      >
        <XStack gap="$3" alignItems="center" justifyContent="center">
          <YStack
            width={40}
            height={40}
            borderRadius="$3"
            backgroundColor="$gray2"
            alignItems="center"
            justifyContent="center"
          >
            <Plus size={20} color="$colorMuted" />
          </YStack>
          <Text
            fontSize="$4"
            fontWeight="500"
            fontFamily="$heading"
            color="$color"
          >
            Add New Business
          </Text>
        </XStack>
      </Card>

      <Button
        size="$5"
        onPress={handleContinue}
        disabled={!selectedBusinessId}
        opacity={selectedBusinessId ? 1 : 0.5}
      >
        Continue to Dashboard
      </Button>
      <Button
        variant="outline"
        size="$5"
        onPress={() => router.push("/(seller)/businesses")}
      >
        Manage All Businesses
      </Button>
    </YStack>
  );

  return (
    <FlatList
      data={businesses}
      keyExtractor={(item) => item.id}
      renderItem={renderBusiness}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={{
        padding: 16,
        paddingTop: Math.max(insets.top + 20, 40),
        paddingBottom: Math.max(insets.bottom + 20, 24),
        flexGrow: 1,
      }}
      initialNumToRender={10}
      windowSize={5}
      maxToRenderPerBatch={10}
      removeClippedSubviews
    />
  );
}
