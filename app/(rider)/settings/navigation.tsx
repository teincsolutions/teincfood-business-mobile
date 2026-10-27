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
import {
  useNavigationSettingsQuery,
  useUpdateNavigationSettingsMutation,
  useNavigationAppsQuery,
} from "@teincfood/core";

/**
 * Rider Navigation Settings Screen
 */
export default function NavigationSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // TanStack Query hooks
  const { data: settings, isLoading } = useNavigationSettingsQuery();
  const updateSettings = useUpdateNavigationSettingsMutation();
  const { data: navigationApps = [] } = useNavigationAppsQuery();

  const [selectedApp, setSelectedApp] = useState(
    settings?.selectedApp || "google_maps",
  );
  const [autoStart, setAutoStart] = useState(settings?.autoStart ?? true);
  const [avoidTolls, setAvoidTolls] = useState(settings?.avoidTolls ?? false);
  const [avoidHighways, setAvoidHighways] = useState(
    settings?.avoidHighways ?? false,
  );

  const handleSave = () => {
    updateSettings.mutate(
      {
        selectedApp: selectedApp as any,
        autoStart,
        avoidTolls,
        avoidHighways,
      },
      {
        onSuccess: () => router.back(),
      },
    );
  };

  const openAppStore = (appId) => {
    const urls = {
      google_maps: "https://apps.apple.com/app/google-maps/id585027354",
      waze: "https://apps.apple.com/app/waze-navigation/id323229106",
    };
    if (urls[appId]) {
      Linking.openURL(urls[appId]);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background" alignItems="center">
      {/* Header */}
      <XStack
        width="100%"
        maxWidth={960}
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
        <TouchableOpacity
          onPress={handleSave}
          disabled={updateSettings.isPending}
        >
          <Text fontSize="$4" color="$primary" fontWeight="bold">
            {updateSettings.isPending ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </XStack>

      <ScrollView style={{ width: "100%", maxWidth: 960 }} showsVerticalScrollIndicator={false}>
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
                  size="$6"
                  checked={autoStart}
                  onCheckedChange={setAutoStart}
                  backgroundColor={autoStart ? "$primary" : "$gray800"}
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
                  size="$6"
                  checked={avoidTolls}
                  onCheckedChange={setAvoidTolls}
                  backgroundColor={avoidTolls ? "$primary" : "$color.gray900"}
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
                  size="$6"
                  checked={avoidHighways}
                  onCheckedChange={setAvoidHighways}
                  backgroundColor={avoidHighways ? "$primary" : "$color.gray900"}
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
            width="100%"
            maxWidth={360}
            alignSelf="center"
            backgroundColor="$primary"
            icon={<Save size={18} />}
            onPress={handleSave}
            disabled={updateSettings.isPending}
            opacity={updateSettings.isPending ? 0.7 : 1}
          >
            {updateSettings.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
