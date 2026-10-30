//@ts-nocheck
import { useState } from "react";
import { XStack } from "tamagui";
import { Check, X } from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";
import {
  useAcceptFleetInvitationMutation,
  useAcceptBusinessInvitationMutation,
} from "@teincfood/core";
import { useNotificationsMutations } from "@teincfood/rn-notifications";
import * as sellerService from "@/services/seller.service";
import * as fleetService from "@/services/fleet.service";
import * as riderService from "@/services/rider.service";
import type { Notification } from "@teincfood/rn-notifications";

interface Props {
  notification: Notification;
  onDone: () => void;
  /** Current order status fetched in one batch by the notifications screen. */
  orderStatus?: string | null;
  /** Current join-request status fetched once by the notifications screen. */
  joinRequestStatus?: string | null;
  /** Current invitation status fetched once by the notifications screen. */
  invitationStatus?: string | null;
}

type ActionKind =
  | "invitation"
  | "accept_order"
  | "accept_delivery"
  | "review_join_request";

function resolveActionKind(
  payload: Record<string, unknown> | null,
): ActionKind | null {
  if (!payload) return null;
  const actionType = payload.action_type as string | undefined;
  if (actionType === "accept_order") return "accept_order";
  if (actionType === "accept_delivery" || actionType === "claim_delivery") {
    return "accept_delivery";
  }
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

export function NotificationActionCard({
  notification,
  onDone,
  orderStatus,
  joinRequestStatus,
  invitationStatus,
}: Props) {
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
  const currentOrderStatus =
    orderStatus ?? (payload.order_status as string | undefined);

  if (!actionKind) return null;
  if (notification.action_dismissed) return null;
  if (payload.action_required === "false" || payload.action_required === false) {
    return null;
  }

  if (actionKind === "accept_order" && currentOrderStatus) {
    if (currentOrderStatus !== "pending") {
      const accepted = [
        "accepted",
        "confirmed",
        "preparing",
        "ready",
        "waiting_pickup",
        "on_the_way",
        "arrived",
        "picked_up",
        "delivered",
      ].includes(currentOrderStatus);
      return (
        <XStack gap="$3" paddingTop="$2" justifyContent="flex-end">
          <Button
            variant={accepted ? "success" : "danger"}
            disabled
            icon={({ size, color }) =>
              accepted ? (
                <Check size={size} color={color} />
              ) : (
                <X size={size} color={color} />
              )
            }
          >
            {accepted ? "Accepted" : "Declined"}
          </Button>
        </XStack>
      );
    }
  }

  if (actionKind === "accept_delivery" && currentOrderStatus) {
    if (!["ready", "pending"].includes(currentOrderStatus)) {
      const claimed = ["waiting_pickup", "on_the_way", "arrived", "delivered"].includes(
        currentOrderStatus,
      );
      return (
        <XStack gap="$3" paddingTop="$2" justifyContent="flex-end">
          <Button
            variant={claimed ? "success" : "danger"}
            disabled
            icon={({ size, color }) =>
              claimed ? (
                <Check size={size} color={color} />
              ) : (
                <X size={size} color={color} />
              )
            }
          >
            {claimed ? "Claimed" : "Unavailable"}
          </Button>
        </XStack>
      );
    }
  }

  if (
    actionKind === "review_join_request" &&
    joinRequestStatus &&
    joinRequestStatus !== "pending"
  ) {
    const approved = joinRequestStatus === "approved";
    return (
      <XStack gap="$3" paddingTop="$2" justifyContent="flex-end">
        <Button
          variant={approved ? "success" : "danger"}
          disabled
          icon={({ size, color }) =>
            approved ? (
              <Check size={size} color={color} />
            ) : (
              <X size={size} color={color} />
            )
          }
        >
          {approved ? "Approved" : "Rejected"}
        </Button>
      </XStack>
    );
  }

  if (
    actionKind === "invitation" &&
    invitationStatus &&
    invitationStatus !== "pending"
  ) {
    return (
      <XStack gap="$3" paddingTop="$2" justifyContent="flex-end">
        <Button
          variant="success"
          disabled
          icon={({ size, color }) => <Check size={size} color={color} />}
        >
          Accepted
        </Button>
      </XStack>
    );
  }

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
          }
          break;
        case "accept_delivery":
          if (orderId) {
            await riderService.acceptDelivery(orderId);
          }
          break;
        case "review_join_request":
          if (joinRequestId) {
            await fleetService.approveJoinRequest(joinRequestId);
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
        case "accept_delivery":
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
        ? actionKind === "accept_delivery"
          ? "Claiming..."
          : "Accepting..."
        : actionKind === "accept_delivery"
          ? "Claim"
          : "Accept";

  const secondaryLabel =
    actionKind === "invitation" || actionKind === "accept_delivery"
      ? "Dismiss"
      : "Decline";

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
