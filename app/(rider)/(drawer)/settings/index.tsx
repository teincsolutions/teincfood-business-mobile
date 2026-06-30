// @ts-nocheck
import { useCallback } from "react";
import { ScrollView } from "react-native";
import { YStack, Text, Card, Button, XStack, Separator, Switch } from "tamagui";
import { useRouter } from "expo-router";
import {
  Truck,
  MapPin,
  ChevronRight,
  Navigation,
  Clock,
  FileText,
} from "@tamagui/lucide-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@/utils/error";

const RIDER_SETTINGS_KEYS = { profile: ["rider", "profile"] as const, vehicle: ["rider", "vehicle"] as const };

export default function RiderSettings() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: RIDER_SETTINGS_KEYS.profile,
    queryFn: async () => {
      const res = await api.get<any>("/riders/profile");
      return res.data;
    },
  });

  const { data: vehicle } = useQuery({
    queryKey: RIDER_SETTINGS_KEYS.vehicle,
    queryFn: async () => {
      const res = await api.get<any>("/riders/vehicle");
      return res.data;
    },
  });

  const toggleOnline = useMutation({
    mutationFn: () => api.patch("/riders/profile", { is_online: !profile?.is_online }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDER_SETTINGS_KEYS.profile });
      toast.success(profile?.is_online ? "You are now offline" : "You are now online");
    },
    onError: (e) => toast.error(extractApiErrorMessage(e)),
  });

  const isOnline = profile?.is_online ?? false;
  const vehicleInfo = vehicle ? `${vehicle.type || ""} · ${vehicle.plate_number || ""}` : "Not set";

  const settingsItems = [
    { icon: Clock, label: "Operating Hours", description: "Set your availability schedule", route: "/(shared)/settings/operating-hours" },
    { icon: Truck, label: "Vehicle Information", description: vehicleInfo, route: "/(rider)/settings/vehicle-info" },
    { icon: MapPin, label: "Delivery Zones", description: "Preferred delivery areas", route: "/(rider)/settings/delivery-zones" },
    { icon: Navigation, label: "Navigation Settings", description: "Preferred maps app", route: "/(rider)/settings/navigation" },
    { icon: FileText, label: "KYC Documents", description: `Status: ${profile?.kyc_status || "pending"}`, route: "/(shared)/kyc?type=user&role=rider" },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView>
        <YStack padding="$4" gap="$4">
          <Text fontSize="$6" fontWeight="bold">Settings</Text>

          {/* Online Status */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center">
              <YStack flex={1}>
                <Text fontWeight="bold">Online Status</Text>
                <Text color="$colorMuted" fontSize="$3">
                  {isOnline ? "You are online and accepting deliveries" : "You are offline"}
                </Text>
              </YStack>
              <Switch checked={isOnline} onCheckedChange={() => toggleOnline.mutate()} backgroundColor={isOnline ? "$green10" : "$gray800"}>
                <Switch.Thumb backgroundColor="$background" />
              </Switch>
            </XStack>
          </Card>

          {/* Settings Menu */}
          <Card padding="$4" bordered>
            <YStack gap="$1">
              {settingsItems.map((item, index) => (
                <YStack key={index}>
                  <Button unstyled flexDirection="row" alignItems="center" gap="$3" padding="$3" pressStyle={{ opacity: 0.7 }} onPress={() => router.push(item.route)}>
                    <item.icon size={20} color="$colorMuted" />
                    <YStack flex={1} alignItems="flex-start">
                      <Text fontWeight="bold">{item.label}</Text>
                      <Text color="$colorMuted" fontSize="$2" numberOfLines={1}>{item.description}</Text>
                    </YStack>
                    <ChevronRight size={16} color="$colorMuted" />
                  </Button>
                  {index < settingsItems.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Profile status */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontWeight="bold">Account Status</Text>
              <Separator />
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Rider Number</Text>
                <Text fontWeight="bold">{profile?.rider_number || "—"}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">KYC Status</Text>
                <Text fontWeight="bold" textTransform="capitalize">{profile?.kyc_status || "pending"}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">License</Text>
                <Text fontWeight="bold">{profile?.license_number || "—"}</Text>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
