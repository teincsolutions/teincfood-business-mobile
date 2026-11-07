// @ts-nocheck — Tamagui stack props don't typecheck under this repo's tsconfig.
import { useEffect, useState } from "react";
import { YStack, XStack, Text, Card } from "tamagui";
import { useRouter } from "expo-router";
import { MailOpen, X } from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";
import { useUserInvitationsQuery } from "@teincfood/core";
import { useAuthStore } from "@/stores/auth.store";
import { getItem, setItem } from "@/utils/storage";

const DISMISSED_KEY = "pending_invites_dismissed";

/**
 * Post-login banner: surfaces pending business/rider invitations with
 * explicit actions. Dismissal is persisted so it does not reappear on the
 * next screen visit; a newly received invitation makes it visible again.
 */
export function PendingInvitesBanner() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? "anonymous");
  const storageKey = `${DISMISSED_KEY}:${userId}`;
  const readDismissed = () => {
    const stored = getItem<string[]>(storageKey);
    return Array.isArray(stored) ? stored : [];
  };
  const [dismissedIds, setDismissedIds] = useState<string[]>(readDismissed);
  const { data: invitesRes } = useUserInvitationsQuery();

  useEffect(() => {
    setDismissedIds(readDismissed());
  }, [storageKey]);

  // `business_owner` is the user's own business, and `rider_linked` is an
  // accepted relationship — neither is an invitation to join a team.
  const pending = (invitesRes?.data ?? []).filter(
    (i) =>
      i.status === "pending" &&
      (i.type === "business_member" || i.type === "fleet_rider"),
  );

  const pendingIds = pending.map((i) => i.id);
  const allDismissed =
    pendingIds.length > 0 &&
    pendingIds.every((id) => dismissedIds.includes(id));

  if (allDismissed || pending.length === 0) return null;

  const dismiss = () => {
    const next = Array.from(new Set(pendingIds));
    setDismissedIds(next);
    setItem(storageKey, next);
  };

  const pendingCount = pending.length;

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
            onPress={dismiss}
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
