// @ts-nocheck
import { ScrollView } from "react-native";
import {
  Avatar,
  Card,
  Separator,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BadgeCheck,
  CalendarDays,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "@tamagui/lucide-icons";
import { BackButton } from "@/components/ui";
import { CachedAvatarImage } from "@/components/ui/CachedAvatarImage";
import { useBusinessMemberQuery } from "@teincfood/core";

export default function SellerMemberDetailScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError } = useBusinessMemberQuery(memberId);
  const member = data?.data;

  if (isLoading) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$3"
        backgroundColor="$background"
      >
        <User size={48} color="$colorMuted" />
        <Text color="$colorSecondary">Loading member details...</Text>
      </YStack>
    );
  }

  if (isError || !member) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$3"
        backgroundColor="$background"
      >
        <User size={48} color="$colorMuted" />
        <Text color="$colorSecondary">Member not found</Text>
        <BackButton />
      </YStack>
    );
  }

  const fullName = member.user?.full_name || member.full_name || "Team member";
  const email = member.user?.email || member.email || "No email on file";
  const role = member.role || "member";
  const capabilities = Array.isArray(member.capabilities)
    ? member.capabilities
    : [];

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top + 8, 16)}>
      <XStack paddingHorizontal="$4" paddingBottom="$3" alignItems="center" gap="$3">
        <BackButton />
        <YStack flex={1}>
          <Text fontSize="$7" fontWeight="700" fontFamily="$heading">
            Member details
          </Text>
        </YStack>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Card padding="$5" bordered>
          <XStack alignItems="center" gap="$4">
            <Avatar circular size="$6">
              {member.avatar_url ? (
                <CachedAvatarImage src={member.avatar_url} />
              ) : (
                <Avatar.Fallback backgroundColor="$orangeMuted">
                  <User size={24} color="$orange" />
                </Avatar.Fallback>
              )}
            </Avatar>
            <YStack flex={1} gap="$1">
              <Text fontSize="$6" fontWeight="700" fontFamily="$heading">
                {fullName}
              </Text>
              <Text fontSize="$3" color="$colorSecondary">
                {`Role: ${role}`}
              </Text>
              <Text fontSize="$2" color={member.status === "active" ? "$success" : "$colorMuted"}>
                {`Status: ${member.status}`}
              </Text>
            </YStack>
            <BadgeCheck size={20} color="$success" />
          </XStack>
        </Card>

        <Card padding="$4" bordered>
          <YStack gap="$3">
            <XStack alignItems="center" gap="$3">
              <Mail size={16} color="$colorMuted" />
              <Text fontSize="$4" flexShrink={1}>
                {email}
              </Text>
            </XStack>
            {member.phone ? (
              <XStack alignItems="center" gap="$3">
                <Phone size={16} color="$colorMuted" />
                <Text fontSize="$4">{member.phone}</Text>
              </XStack>
            ) : null}
            {member.inserted_at ? (
              <XStack alignItems="center" gap="$3">
                <CalendarDays size={16} color="$colorMuted" />
                <Text fontSize="$3" color="$colorSecondary">
                  {`Joined ${new Date(member.inserted_at).toLocaleDateString()}`}
                </Text>
              </XStack>
            ) : null}
          </YStack>
        </Card>

        <Card padding="$4" bordered>
          <XStack alignItems="center" gap="$2" marginBottom="$3">
            <ShieldCheck size={16} color="$orange" />
            <Text fontSize="$4" fontWeight="600">
              Permissions
            </Text>
          </XStack>
          <Separator marginBottom="$3" />
          {capabilities.length > 0 ? (
            <YStack gap="$2">
              {capabilities.map((capability) => (
                <Text key={capability} fontSize="$3" color="$colorSecondary">
                  {capability.replaceAll("_", " ")}
                </Text>
              ))}
            </YStack>
          ) : (
            <Text fontSize="$3" color="$colorMuted">
              No explicit capabilities
            </Text>
          )}
        </Card>
      </ScrollView>
    </YStack>
  );
}
