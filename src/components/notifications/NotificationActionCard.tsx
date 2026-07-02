// @ts-nocheck
import { useState } from "react";
import { XStack } from "tamagui";
import { Check, X } from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";
import {
  useAcceptFleetInvitationMutation,
  useAcceptBusinessInvitationMutation,
} from "@/hooks/useInvitations";
import type { Notification } from "@/services/notifications.service";

interface Props {
  notification: Notification;
  onDone: () => void;
}

export function NotificationActionCard({ notification, onDone }: Props) {
  const [accepting, setAccepting] = useState(false);
  const acceptFleet = useAcceptFleetInvitationMutation();
  const acceptBusiness = useAcceptBusinessInvitationMutation();

  const payload = notification.payload ?? {};
  const actionRequired = payload.action_required === "true";
  const category = payload.notification_category;
  const code = payload.code;

  if (!actionRequired || !code) return null;

  const isRiderInvitation = category === "rider_invitation";
  const isBusinessInvitation = category === "business_member_invitation";
  if (!isRiderInvitation && !isBusinessInvitation) return null;

  const handleAccept = () => {
    setAccepting(true);
    const mutation = isRiderInvitation ? acceptFleet : acceptBusiness;
    mutation.mutate(
      { code },
      {
        onSettled: () => {
          setAccepting(false);
          onDone();
        },
        onError: () => {
          setAccepting(false);
        },
      },
    );
  };

  const isPending = acceptFleet.isPending || acceptBusiness.isPending;

  return (
    <XStack gap="$3" paddingTop="$2" justifyContent="flex-end">
      <Button
        flex={1}
        size="$3"
        backgroundColor="$green10"
        icon={<Check size={14} />}
        onPress={handleAccept}
        disabled={isPending}
      >
        {accepting ? "Accepting..." : "Accept"}
      </Button>
      <Button
        flex={1}
        size="$3"
        variant="outline"
        icon={<X size={14} />}
        onPress={onDone}
        disabled={isPending}
      >
        Dismiss
      </Button>
    </XStack>
  );
}
