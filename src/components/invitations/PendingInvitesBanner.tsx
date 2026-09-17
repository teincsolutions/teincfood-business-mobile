// @ts-nocheck — Tamagui stack props don't typecheck under this repo's tsconfig.
import { useState } from "react";
import { YStack, XStack, Text, Card } from "tamagui";
import { useRouter } from "expo-router";
import { MailOpen, X } from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";
import { useUserInvitationsQuery } from "@teincfood/core";

/**
 * Post-login banner: surfaces pending business/rider invitations with
 * explicit actions. Dismissible for the session; nothing auto-accepts.
 */
export function PendingInvitesBanner() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const { data: invitesRes } = useUserInvitationsQuery();

  const pendingCount = (invitesRes?.data ?? []).filter(
    (i) => i.status === "pending",
  ).length;

  if (dismissed || pendingCount === 0) return null;

  return (
    <Card padding="$4" bordered backgroundColor="$blue2" borderColor="$blue8">
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center">
            <MailOpen size={18} color="$blue10" />
            <Text fontSize="$4" fontWeight="700" color="$blue10">
              {pendingCount === 1
                ? "You have 1 pending invitation"
                : `You have ${pendingCount} pending invitations`}
            </Text>
          </XStack>
          <Button
            circular
            size="$2"
            variant="ghost"
            onPress={() => setDismissed(true)}
            icon={<X size={14} />}
          />
        </XStack>
        <Text fontSize="$3" color="$colorMuted">
          A business invited you to join their team. Review and accept or decline.
        </Text>
        <Button
          size="$3"
          onPress={() => router.push("/(shared)/invitations")}
        >
          View invitations
        </Button>
      </YStack>
    </Card>
  );
}
