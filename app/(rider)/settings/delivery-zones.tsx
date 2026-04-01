// @ts-nocheck
import { useState } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Card, Separator, Switch } from "tamagui";
import { MapPin, Check, Save, Navigation, ArrowLeft } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";

/**
 * Rider Delivery Zones Screen
 */
export default function DeliveryZones() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);

  // Mock delivery zones data
  const [zones, setZones] = useState([
    {
      id: "1",
      name: "Greater Accra",
      enabled: true,
      radius: "15 km",
      deliveries: 45,
    },
    { id: "2", name: "Tema", enabled: true, radius: "10 km", deliveries: 32 },
    { id: "3", name: "Kasoa", enabled: false, radius: "12 km", deliveries: 18 },
    { id: "4", name: "Madina", enabled: true, radius: "8 km", deliveries: 28 },
    {
      id: "5",
      name: "East Legon",
      enabled: true,
      radius: "5 km",
      deliveries: 22,
    },
    {
      id: "6",
      name: "Achimota",
      enabled: false,
      radius: "10 km",
      deliveries: 15,
    },
    {
      id: "7",
      name: "Dansoman",
      enabled: false,
      radius: "12 km",
      deliveries: 12,
    },
    { id: "8", name: "Spintex", enabled: true, radius: "8 km", deliveries: 20 },
  ]);

  const toggleZone = (zoneId) => {
    setZones(
      zones.map((zone) =>
        zone.id === zoneId ? { ...zone, enabled: !zone.enabled } : zone,
      ),
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      router.back();
    }, 1500);
  };

  const enabledZones = zones.filter((z) => z.enabled).length;

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
          Delivery Zones
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text fontSize="$4" color="$primary" fontWeight="bold">
            {isSaving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Summary Card */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <YStack gap="$3" alignItems="center">
              <MapPin size={40} color="$primary" />
              <Text fontSize="$5" fontWeight="bold">
                Active Delivery Zones
              </Text>
              <Text fontSize="$7" fontWeight="800" color="$primary">
                {enabledZones} / {zones.length}
              </Text>
              <Text color="$colorMuted" fontSize="$3" textAlign="center">
                Enable the zones where you want to receive delivery requests
              </Text>
            </YStack>
          </Card>

          {/* Map Placeholder */}
          <Card padding="$4" bordered>
            <YStack gap="$3" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">
                Coverage Map
              </Text>
              <YStack
                height={200}
                width="100%"
                backgroundColor="$gray3"
                borderRadius="$4"
                alignItems="center"
                justifyContent="center"
              >
                <Navigation size={48} color="$colorMuted" />
                <Text color="$colorMuted" marginTop="$2">
                  Interactive map coming soon
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* Zone List */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                Available Zones
              </Text>
              <Separator />
              {zones.map((zone, index) => (
                <YStack key={zone.id}>
                  <TouchableOpacity onPress={() => toggleZone(zone.id)}>
                    <XStack
                      padding="$3"
                      borderRadius="$4"
                      backgroundColor={zone.enabled ? "$green2" : "$gray2"}
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <XStack gap="$3" alignItems="center" flex={1}>
                        <YStack
                          width={40}
                          height={40}
                          borderRadius="$10"
                          backgroundColor={zone.enabled ? "$green10" : "$gray8"}
                          alignItems="center"
                          justifyContent="center"
                        >
                          {zone.enabled ? (
                            <Check size={20} color="white" />
                          ) : (
                            <MapPin size={20} color="white" />
                          )}
                        </YStack>
                        <YStack flex={1}>
                          <Text fontWeight="bold">{zone.name}</Text>
                          <XStack gap="$2" alignItems="center">
                            <Text fontSize="$2" color="$colorMuted">
                              Radius: {zone.radius}
                            </Text>
                            <Text fontSize="$2" color="$colorMuted">
                              • {zone.deliveries} deliveries
                            </Text>
                          </XStack>
                        </YStack>
                      </XStack>
                      <Switch
                        checked={zone.enabled}
                        onCheckedChange={() => toggleZone(zone.id)}
                        backgroundColor={zone.enabled ? "$green10" : "$gray8"}
                      >
                        <Switch.Thumb backgroundColor="white" />
                      </Switch>
                    </XStack>
                  </TouchableOpacity>
                  {index < zones.length - 1 && <Separator marginTop="$2" />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Tips Card */}
          <Card padding="$4" bordered backgroundColor="$yellow2">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                💡 Tips
              </Text>
              <Separator />
              <YStack gap="$2">
                <Text fontSize="$3">
                  • Enable zones with high delivery demand to maximize earnings
                </Text>
                <Text fontSize="$3">
                  • Consider your vehicle type when selecting zones
                </Text>
                <Text fontSize="$3">
                  • You can always adjust your zones later
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
