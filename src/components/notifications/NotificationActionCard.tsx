//@ts-nocheck
import { useState } from "react";
import { XStack, Text } from "tamagui";
import { Check, X } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";
import {
  useAcceptFleetInvitationMutation,
  useAcceptBusinessInvitationMutation,
} from "@/hooks/useInvitations";
import { useNotificationsMutations } from "@teincfood/rn-notifications";
import * as sellerService from "@/services/seller.service";
import * as fleetService from "@/services/fleet.service";
import type { Notification } from "@teincfood/rn-notifications";

interface Props {
  notification: Notification;
  onDone: () => void;
}

type ActionKind = "invitation" | "accept_order" | "review_join_request";

function resolveActionKind(
  payload: Record<string, unknown> | null,
): ActionKind | null {
  if (!payload) return null;
  const actionType = payload.action_type as string | undefined;
  if (actionType === "accept_order") return "accept_order";
  if (actionType === "review_join_request") return "review_join_request";
  const category = payload.notification_category as string | undefined;
  if (
    category === "rider_invitation" ||
    category === "business_member_invitation"
  )
    return "invitation";
  if (!actionType && payload.action_required === "true") return "invitation";
  return null;
}

export function NotificationActionCard({ notification, onDone }: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const acceptFleet = useAcceptFleetInvitationMutation();
  const acceptBusiness = useAcceptBusinessInvitationMutation();
  const { dismissAction } = useNotificationsMutations();

  const payload = notification.payload ?? {};
  const actionKind = resolveActionKind(payload);
  const code = payload.code as string | undefined;
  const orderId = payload.order_id as string | undefined;
  const joinRequestId = payload.join_request_id as string | undefined;
  const route = payload.route as string | undefined;

  if (!actionKind) return null;

  const isPrimaryDisabled = accepting || dismissing;

  const handlePrimary = async () => {
    setAccepting(true);
    try {
      switch (actionKind) {
        case "invitation": {
          const category = payload.notification_category as string;
          const mutation =
            category === "rider_invitation" ? acceptFleet : acceptBusiness;
          await mutation.mutateAsync({ code });
          break;
        }
        case "accept_order":
          if (orderId) {
            await sellerService.acceptOrder(orderId);
            router.push(route ?? `/order/${orderId}`);
          }
          break;
        case "review_join_request":
          if (joinRequestId) {
            await fleetService.approveJoinRequest(joinRequestId);
            if (route) router.push(route);
          }
          break;
      }
      await dismissAction(notification.id);
    } catch {
      // error handled below
    }
    setAccepting(false);
    onDone();
  };

  const handleSecondary = async () => {
    setDismissing(true);
    try {
      switch (actionKind) {
        case "accept_order":
          if (orderId) await sellerService.rejectOrder(orderId);
          break;
        case "review_join_request":
          if (joinRequestId)
            await fleetService.rejectJoinRequest(joinRequestId);
          break;
        case "invitation":
          break;
      }
      await dismissAction(notification.id);
    } catch {
      // ignore
    }
    setDismissing(false);
    onDone();
  };

  const primaryLabel =
    actionKind === "review_join_request"
      ? accepting
        ? "Approving..."
        : "Approve"
      : accepting
        ? "Accepting..."
        : "Accept";

  const secondaryLabel = actionKind === "invitation" ? "Dismiss" : "Decline";

  return (
    <XStack gap="$3" paddingTop="$2" justifyContent="flex-end">
      <Button
        variant="success"
        icon={({ size, color }) => <Check size={size} color={color} />}
        onPress={handlePrimary}
        disabled={isPrimaryDisabled}
      >
        {primaryLabel}
      </Button>
      <Button
        variant="danger"
        icon={({ size, color }) => <X size={size} color={color} />}
        onPress={handleSecondary}
        disabled={isPrimaryDisabled}
      >
        {secondaryLabel}
      </Button>
    </XStack>
  );
}
