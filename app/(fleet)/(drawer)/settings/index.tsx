// @ts-nocheck
import { useState } from "react";
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Card, Separator, Avatar } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Settings,
  Building,
  Percent,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  Edit,
  Save,
  MailOpen,
  Crown,
  FileText,
} from "@tamagui/lucide-icons";
import { useFleetStore } from "@/stores/fleet.store";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "expo-router";
import { BackButton, FormInput, Button, Input } from "@/components/ui";

export default function FleetSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { fleet, updateFleet } = useFleetStore();
  const [isEditing, setIsEditing] = useState(false);
  const [commissionRate, setCommissionRate] = useState(
    fleet?.commissionRate?.toString() || "15",
  );

  const handleSaveCommission = () => {
    const rate = parseFloat(commissionRate);
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      updateFleet({ commissionRate: rate });
      setIsEditing(false);
    }
  };

  const settingsItems = [
    {
      icon: Building,
      title: "My Businesses",
      description: "View and manage your businesses",
      onPress: () => router.push("/(fleet)/businesses"),
    },
    {
      icon: Building,
      title: "Fleet Profile",
      description: "Update company information and details",
      onPress: () => router.push("/(fleet)/settings/profile"),
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Manage notification preferences",
      onPress: () => router.push("/(shared)/notifications"),
    },
    {
      icon: MailOpen,
      title: "Invitations",
      description: "Pending rider invitations",
      onPress: () => router.push("/(shared)/invitations"),
    },
    {
      icon: Crown,
      title: "Subscription & Plan",
      description: "Plan, billing status, promos",
      onPress: () => router.push("/(shared)/wallet/plans"),
    },
    {
      icon: Shield,
      title: "Security",
      description: "Password, biometric, and security settings",
      onPress: () => router.push("/(shared)/profile/security"),
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      description: "Get help and contact support",
      onPress: () => router.push("/(shared)/profile/help"),
    },
    {
      icon: FileText,
      title: "Terms of Service",
      description: "The terms that govern your use of the platform",
      onPress: () => router.push("/(shared)/profile/terms"),
    },
    {
      icon: Shield,
      title: "Privacy Policy",
      description: "How we handle your information",
      onPress: () => router.push("/(shared)/profile/privacy-policy"),
    },
  ];

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
          <Text
            fontSize="$8"
            fontWeight="bold"
            fontFamily="$heading"
            color="$color"
          >
            Settings
          </Text>
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
            Manage your fleet settings and preferences
          </Text>
        </YStack>

        {/* Fleet Profile Card */}
        <Card padding="$4" bordered>
          <XStack gap="$3" alignItems="center">
            <Avatar circular size="$6">
              <Avatar.Image src={fleet?.logoUrl} />
              <Avatar.Fallback backgroundColor="$primary">
                <Text color="white" fontWeight="bold" fontSize="$6">
                  {fleet?.companyName?.charAt(0) || "F"}
                </Text>
              </Avatar.Fallback>
            </Avatar>
            <YStack flex={1}>
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                {fleet?.companyName || "Fleet Company"}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {fleet?.code || "FLEET-XX-000"}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {user?.email || "fleet@example.com"}
              </Text>
            </YStack>
            <Button
              size="$2"
              variant="ghost"
              icon={Edit}
              onPress={() => router.push("/(fleet)/settings/profile")}
            >
              Edit
            </Button>
          </XStack>
        </Card>

        {/* Commission Rate */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={40}
                  height={40}
                  borderRadius="$3"
                  backgroundColor="$blue2"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Percent size={20} color="$blue10" />
                </YStack>
                <YStack>
                  <Text
                    fontSize="$5"
                    fontWeight="600"
                    fontFamily="$heading"
                    color="$color"
                  >
                    Commission Rate
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Percentage of rider earnings
                  </Text>
                </YStack>
              </XStack>
              {isEditing ? (
                <XStack gap="$2" alignItems="center">
                  <Input
                    width={80}
                    value={commissionRate}
                    onChangeText={setCommissionRate}
                    keyboardType="numeric"
                    placeholder="15"
                  />
                  <Text fontSize="$4">%</Text>
                  <Button size="$2" icon={Save} onPress={handleSaveCommission}>
                    Save
                  </Button>
                </XStack>
              ) : (
                <XStack gap="$2" alignItems="center">
                  <Text
                    fontSize="$6"
                    fontWeight="600"
                    color="$blue10"
                    fontFamily="$heading"
                  >
                    {fleet?.commissionRate || 15}%
                  </Text>
                  <Button
                    size="$2"
                    variant="ghost"
                    icon={Edit}
                    onPress={() => setIsEditing(true)}
                  />
                </XStack>
              )}
            </XStack>
            <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
              This percentage will be deducted from each rider's earnings as
              your fleet commission
            </Text>
          </YStack>
        </Card>

        {/* Settings Menu */}
        <YStack gap="$2">
          <Text
            fontSize="$5"
            fontWeight="600"
            color="$colorSecondary"
            fontFamily="$heading"
          >
            General Settings
          </Text>
          {settingsItems.map((item, index) => (
            <Card
              key={index}
              padding="$4"
              bordered
              pressStyle={{ scale: 0.98, opacity: 0.9 }}
              onPress={item.onPress}
            >
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={40}
                  height={40}
                  borderRadius="$3"
                  backgroundColor="$gray2"
                  alignItems="center"
                  justifyContent="center"
                >
                  <item.icon size={20} color="$colorMuted" />
                </YStack>
                <YStack flex={1}>
                  <Text
                    fontSize="$5"
                    fontWeight="500"
                    fontFamily="$heading"
                    color="$color"
                  >
                    {item.title}
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    {item.description}
                  </Text>
                </YStack>
                <ChevronRight size={20} color="$colorMuted" />
              </XStack>
            </Card>
          ))}
        </YStack>

        {/* Fleet Stats */}
        <YStack gap="$3">
          <Text
            fontSize="$5"
            fontWeight="600"
            color="$colorSecondary"
            fontFamily="$heading"
          >
            Fleet Statistics
          </Text>
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between">
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Total Riders
                </Text>
                <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                  {fleet?.activeRiders || 0}
                </Text>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between">
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Total Vehicles
                </Text>
                <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                  {fleet?.totalVehicles || 0}
                </Text>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between">
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Fleet Status
                </Text>
                <YStack
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                  backgroundColor={
                    fleet?.status === "active" ? "$green2" : "$gray2"
                  }
                >
                  <Text
                    fontSize="$3"
                    color={fleet?.status === "active" ? "$green10" : "$gray10"}
                    textTransform="capitalize"
                    fontFamily="$body"
                  >
                    {fleet?.status || "Active"}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </Card>
        </YStack>

        {/* App Info */}
        <YStack gap="$2" alignItems="center" marginTop="$4">
          <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
            Teinc Food Business v1.0.0
          </Text>
          <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
            © 2026 Teinc Solutions
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  );
}
