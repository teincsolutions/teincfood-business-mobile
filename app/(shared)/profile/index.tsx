// @ts-nocheck

import { YStack, Text, Card, Button, XStack, Separator, Avatar } from "tamagui";
import {
  User,
  Mail,
  Phone,
  HelpCircle,
  FileText,
  Shield,
  Palette,
  LogOut,
} from "@tamagui/lucide-icons";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useProfileQuery } from "@/hooks/useProfile";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Seller Profile Screen
 */
export default function SharedProfile() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { data: profile } = useProfileQuery();

  const displayName = profile?.full_name || user?.fullName || "User";
  const displayEmail = profile?.email || user?.email || "";
  const displayPhone = profile?.phone || user?.phone || "";

  const handleLogout = () => {
    clearAuth();
    router.replace("/(auth)/login");
  };

  const profileItems = [
    {
      icon: User,
      label: "Edit Profile",
      description: "Update your personal information",
      route: "/(shared)/profile/edit",
    },
    {
      icon: Shield,
      label: "Security",
      description: "Password, biometrics, 2FA",
      route: "/(shared)/profile/security",
    },
    {
      icon: Palette,
      label: "Theme",
      description: "Light, dark, or system",
      route: "/(shared)/profile/theme",
    },
    {
      icon: HelpCircle,
      label: "Help & Support",
      description: "FAQs, contact us",
      route: "/(shared)/profile/help",
    },
    {
      icon: FileText,
      label: "Terms of Service",
      description: "Read our terms",
      route: "/(shared)/profile/terms",
    },
    {
      icon: Shield,
      label: "Privacy Policy",
      description: "How we handle your data",
      route: "/(shared)/profile/privacy-policy",
    },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView>
        <YStack padding="$4" gap="$4">
          <Card padding="$4" bordered backgroundColor="$background">
            <XStack gap="$4" alignItems="center">
              <Avatar circular size="$12">
                <Avatar.Image src={profile?.avatar_url || user?.avatarUrl} />
                <Avatar.Fallback
                  backgroundColor="$primary"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="$background" fontWeight="bold" fontSize="$7">
                    {displayName?.charAt(0) || "U"}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              <YStack flex={1} gap="$1">
                <Text fontSize="$5" fontWeight="bold" color="$color">
                  {displayName}
                </Text>
                <Text color="$colorMuted" fontSize="$3">
                  {displayEmail}
                </Text>
                <Text color="$colorMuted" fontSize="$3">
                  {displayPhone}
                </Text>
              </YStack>
            </XStack>
          </Card>

          <Card padding="$4" bordered backgroundColor="$background">
            <YStack gap="$1">
              {profileItems.map((item, index) => (
                <YStack key={index}>
                  <Button
                    unstyled
                    flexDirection="row"
                    alignItems="center"
                    gap="$3"
                    padding="$3"
                    pressStyle={{ backgroundColor: "$backgroundHover" }}
                    onPress={() => router.push(item.route)}
                  >
                    <item.icon size={20} color="$colorMuted" />
                    <YStack flex={1} alignItems="flex-start">
                      <Text fontWeight="bold" color="$color">
                        {item.label}
                      </Text>
                      <Text color="$colorMuted" fontSize="$2">
                        {item.description}
                      </Text>
                    </YStack>
                  </Button>
                  {index < profileItems.length - 1 && (
                    <Separator backgroundColor="$borderColor" />
                  )}
                </YStack>
              ))}
            </YStack>
          </Card>

          <Button
            variant="outline"
            onPress={handleLogout}
            icon={<LogOut size={20} />}
          >
            Logout
          </Button>

          <YStack alignItems="center" padding="$4">
            <Text color="$colorMuted" fontSize="$2">
              TeincFoodBusiness v1.0.0
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
