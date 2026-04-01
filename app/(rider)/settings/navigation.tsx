// @ts-nocheck
import { useState } from "react";
import { ScrollView, TouchableOpacity, Linking } from "react-native";
import { YStack, XStack, Text, Card, Separator, Switch } from "tamagui";
import {
  Navigation,
  MapPin,
  Check,
  Save,
  ExternalLink,
  ArrowLeft,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";

/**
 * Rider Navigation Settings Screen
 */
export default function NavigationSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);

  // Navigation app options
  const [selectedApp, setSelectedApp] = useState("google_maps");
  const [autoStart, setAutoStart] = useState(true);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);

  const navigationApps = [
    {
      id: "google_maps",
      name: "Google Maps",
      description: "Most popular navigation app",
      icon: "🗺️",
      installed: true,
    },
    {
      id: "apple_maps",
      name: "Apple Maps",
      description: "Built-in iOS navigation",
      icon: "🍎",
      installed: true,
    },
    {
      id: "waze",
      name: "Waze",
      description: "Community-based traffic alerts",
      icon: "🚗",
      installed: false,
    },
  ];

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      router.back();
    }, 1500);
  };

  const openAppStore = (appId) => {
    // In real app, open app store to install the navigation app
    const urls = {
      google_maps: "https://apps.apple.com/app/google-maps/id585027354",
      waze: "https://apps.apple.com/app/waze-navigation/id323229106",
    };
    if (urls[appId]) {
      Linking.openURL(urls[appId]);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <Button
          variant="outline"
          width={44}
          height={44}
          borderRadius={22}
          paddingHorizontal={0}
          onPress={() => router.back()}
          icon={<ArrowLeft size={20} />}
        />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Navigation Settings
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text fontSize="$4" color="$primary" fontWeight="bold">
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Current Selection */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <YStack gap="$3" alignItems="center">
              <Navigation size={40} color="$primary" />
              <Text fontSize="$5" fontWeight="bold">
                Preferred Navigation App
              </Text>
              <Text fontSize="$4" color="$primary" fontWeight="800">
                {navigationApps.find((app) => app.id === selectedApp)?.name}
              </Text>
              <Text color="$colorMuted" fontSize="$3" textAlign="center">
                This app will open when you tap "Navigate" on deliveries
              </Text>
            </YStack>
          </Card>

          {/* Navigation Apps */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                Select Navigation App
              </Text>
              <Separator />
              {navigationApps.map((app, index) => (
                <YStack key={app.id}>
                  <TouchableOpacity
                    onPress={() => app.installed && setSelectedApp(app.id)}
                    disabled={!app.installed}
                  >
                    <XStack
                      padding="$3"
                      borderRadius="$4"
                      backgroundColor={
                        selectedApp === app.id ? "$primary" : "$gray2"
                      }
                      opacity={app.installed ? 1 : 0.5}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <XStack gap="$3" alignItems="center" flex={1}>
                        <Text fontSize="$6">{app.icon}</Text>
                        <YStack flex={1}>
                          <Text
                            fontWeight="bold"
                            color={selectedApp === app.id ? "white" : "$color"}
                          >
                            {app.name}
                          </Text>
                          <Text
                            fontSize="$2"
                            color={
                              selectedApp === app.id ? "white" : "$colorMuted"
                            }
                          >
                            {app.description}
                          </Text>
                        </YStack>
                      </XStack>
                      {selectedApp === app.id ? (
                        <Check size={20} color="white" />
                      ) : !app.installed ? (
                        <Button
                          size="$2"
                          variant="outline"
                          icon={<ExternalLink size={14} />}
                          onPress={() => openAppStore(app.id)}
                        >
                          Install
                        </Button>
                      ) : null}
                    </XStack>
                  </TouchableOpacity>
                  {index < navigationApps.length - 1 && (
                    <Separator marginTop="$2" />
                  )}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Navigation Options */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                Navigation Options
              </Text>
              <Separator />

              <XStack
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="$2"
              >
                <YStack flex={1}>
                  <Text fontWeight="bold">Auto-start Navigation</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    Automatically start navigation when accepting deliveries
                  </Text>
                </YStack>
                <Switch
                  checked={autoStart}
                  onCheckedChange={setAutoStart}
                  backgroundColor={autoStart ? "$primary" : "$gray8"}
                >
                  <Switch.Thumb backgroundColor="white" />
                </Switch>
              </XStack>

              <Separator />

              <XStack
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="$2"
              >
                <YStack flex={1}>
                  <Text fontWeight="bold">Avoid Tolls</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    Prefer routes without toll roads
                  </Text>
                </YStack>
                <Switch
                  checked={avoidTolls}
                  onCheckedChange={setAvoidTolls}
                  backgroundColor={avoidTolls ? "$primary" : "$gray8"}
                >
                  <Switch.Thumb backgroundColor="white" />
                </Switch>
              </XStack>

              <Separator />

              <XStack
                justifyContent="space-between"
                alignItems="center"
                paddingVertical="$2"
              >
                <YStack flex={1}>
                  <Text fontWeight="bold">Avoid Highways</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    Prefer local roads over highways
                  </Text>
                </YStack>
                <Switch
                  checked={avoidHighways}
                  onCheckedChange={setAvoidHighways}
                  backgroundColor={avoidHighways ? "$primary" : "$gray8"}
                >
                  <Switch.Thumb backgroundColor="white" />
                </Switch>
              </XStack>
            </YStack>
          </Card>

          {/* Tips */}
          <Card padding="$4" bordered backgroundColor="$yellow2">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                💡 Tips
              </Text>
              <Separator />
              <YStack gap="$2">
                <Text fontSize="$3">
                  • Google Maps provides the most accurate traffic data
                </Text>
                <Text fontSize="$3">
                  • Waze is great for real-time road alerts
                </Text>
                <Text fontSize="$3">
                  • You can change your navigation app anytime
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* Save Button */}
          <Button
            size="$5"
            backgroundColor="$primary"
            icon={<Save size={18} />}
            onPress={handleSave}
            disabled={isSaving}
            opacity={isSaving ? 0.7 : 1}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
