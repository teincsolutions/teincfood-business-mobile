// @ts-nocheck
import { YStack, Text, Card, Button, XStack, Separator, Switch } from "tamagui";
import {
  Truck,
  MapPin,
  Bell,
  ChevronRight,
  Navigation,
  Volume2,
  Clock,
  Palette,
} from "@tamagui/lucide-icons";
import { ScrollView } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

/**
 * Rider Settings Screen
 */
export default function RiderSettings() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const settingsItems = [
    {
      icon: Clock,
      label: "Operating Hours",
      description: "Set your availability schedule",
      route: "/(shared)/settings/operating-hours",
    },
    {
      icon: Truck,
      label: "Vehicle Information",
      description: "Type, plate number, color",
      route: "/(rider)/settings/vehicle-info",
    },
    {
      icon: MapPin,
      label: "Delivery Zones",
      description: "Preferred delivery areas",
      route: "/(rider)/settings/delivery-zones",
    },
    {
      icon: Navigation,
      label: "Navigation Settings",
      description: "Preferred maps app",
      route: "/(rider)/settings/navigation",
    },
    {
      label: "Theme",
      description: "Light, dark, or system",
      icon: Palette,
      route: "/(shared)/profile/theme",
    }
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView>
        <YStack padding="$4" gap="$4">
          <Text fontSize="$6" fontWeight="bold">
            Settings
          </Text>

          {/* Online Status */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1}>
                <Text fontWeight="bold">Online Status</Text>
                <Text color="$colorMuted" fontSize="$3">
                  {isOnline
                    ? "You are online and accepting deliveries"
                    : "You are offline"}
                </Text>
              </YStack>
              <Switch
                checked={isOnline}
                onCheckedChange={setIsOnline}
                backgroundColor={isOnline ? "$green10" : "$gray800"}
              >
                <Switch.Thumb backgroundColor="$background" />
              </Switch>
            </XStack>
          </Card>

          {/* Notifications */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1}>
                <Text fontWeight="bold">Notifications</Text>
                <Text color="$colorMuted" fontSize="$3">
                  Receive delivery requests and updates
                </Text>
              </YStack>
              <Switch
                size="$5"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                backgroundColor={notificationsEnabled ? "$primary" : "$color.gray900"}
              >
                <Switch.Thumb backgroundColor="$background" />
              </Switch>
            </XStack>
          </Card>

          {/* Auto Accept */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$3" alignItems="center">
                <YStack>
                  <Text fontWeight="bold">Auto-Accept Deliveries</Text>
                  <Text color="$colorMuted" fontSize="$3">
                    Automatically accept nearby delivery requests
                  </Text>
                </YStack>
              </XStack>
              <Switch
                size="$5"
                checked={autoAccept}
                onCheckedChange={setAutoAccept}
                backgroundColor={autoAccept ? "$primary" : "$color.gray900"}
              >
                <Switch.Thumb backgroundColor="$background" />
              </Switch>
            </XStack>
          </Card>

          {/* Sound Alerts */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$3" alignItems="center">
                <Volume2 size={20} color="$colorMuted" />
                <YStack>
                  <Text fontWeight="bold">Sound Alerts</Text>
                  <Text color="$colorMuted" fontSize="$3">
                    Play sound for new delivery requests
                  </Text>
                </YStack>
              </XStack>
              <Switch
                size="$5"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                backgroundColor={soundEnabled ? "$primary" : "$gray"}
              >
                <Switch.Thumb backgroundColor="$background" />
              </Switch>
            </XStack>
          </Card>

          {/* Settings Menu */}
          <Card padding="$4" bordered>
            <YStack gap="$1">
              {settingsItems.map((item, index) => (
                <YStack key={index}>
                  <Button
                    unstyled
                    flexDirection="row"
                    alignItems="center"
                    gap="$3"
                    padding="$3"
                    pressStyle={{ opacity: 0.7 }}
                    onPress={() => router.push(item.route)}
                  >
                    <item.icon size={20} color="$colorMuted" />
                    <YStack flex={1} alignItems="flex-start">
                      <Text fontWeight="bold">{item.label}</Text>
                      <Text color="$colorMuted" fontSize="$2">
                        {item.description}
                      </Text>
                    </YStack>
                    <ChevronRight size={16} color="$colorMuted" />
                  </Button>
                  {index < settingsItems.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Delivery Stats */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontWeight="bold">Delivery Statistics</Text>
              <Separator />
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Total Deliveries</Text>
                <Text fontWeight="bold">156</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Acceptance Rate</Text>
                <Text fontWeight="bold">94%</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Average Rating</Text>
                <Text fontWeight="bold">4.8 ★</Text>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
