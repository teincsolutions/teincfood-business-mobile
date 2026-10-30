// @ts-nocheck
import { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { YStack, XStack, Text, Spinner } from "tamagui";
import {
  Bell,
  Package,
  Truck,
  CheckCircle,
  Trash2,
  Check,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button, AppAlertDialog } from "@/components/ui";
import {
  buildNotificationRoute,
  useNotificationsList,
  useNotificationsMutations,
} from "@teincfood/rn-notifications";
import {
  useJoinRequestsQuery,
  useUserInvitationsQuery,
} from "@teincfood/core";
import { NotificationActionCard } from "@/components/notifications/NotificationActionCard";

const ICON_MAP: Record<string, [typeof Package, string]> = {
  order: [Package, "$primary"],
  delivery: [Truck, "$orange9"],
  delivered: [CheckCircle, "$green10"],
  promo: [Bell, "$orange9"],
  system: [Bell, "$colorSecondary"],
  announcement: [Bell, "$orange9"],
  invitation: [CheckCircle, "$green10"],
  join_request: [CheckCircle, "$primary"],
};

function getIcon(type: string): [typeof Package, string] {
  return ICON_MAP[type] ?? [Bell, "$colorSecondary"];
}

function formatTime(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateString).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useNotificationsList();
  const notifications = data?.notifications ?? [];

  const { markAsRead, markAllAsRead, clearAll } = useNotificationsMutations();

  // Fetch these once per screen, not once per notification card. Cards receive
  // the matching status by id/code, which removes the old per-row N+1 queries.
  const joinRequestsQuery = useJoinRequestsQuery();
  const invitationsQuery = useUserInvitationsQuery();

  const joinRequestStatuses = useMemo(() => {
    const map = new Map<string, string>();
    for (const request of joinRequestsQuery.data?.data ?? []) {
      if (request?.id) map.set(request.id, request.status);
    }
    return map;
  }, [joinRequestsQuery.data]);

  const invitationStatuses = useMemo(() => {
    const map = new Map<string, string>();
    for (const invitation of invitationsQuery.data?.data ?? []) {
      if (invitation?.code) map.set(invitation.code, invitation.status);
    }
    return map;
  }, [invitationsQuery.data]);

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const readTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unread = notifications.filter((n) => !n.read);
  const read_ = notifications.filter((n) => n.read);

  const handleMarkAsRead = useCallback(async (id: string) => {
    if (readTimeoutRef.current) clearTimeout(readTimeoutRef.current);
    readTimeoutRef.current = setTimeout(async () => {
      try { await markAsRead(id); } catch { /* ignore */ }
    }, 300);
  }, [markAsRead]);

  const handleMarkAllRead = useCallback(async () => {
    setIsMarkingAllRead(true);
    try { await markAllAsRead(); } catch { /* ignore */ }
    setIsMarkingAllRead(false);
  }, [markAllAsRead]);

  const handleClearAll = useCallback(async () => {
    setIsClearing(true);
    try { await clearAll(); } catch { /* ignore */ }
    setIsClearing(false);
    setShowClearDialog(false);
  }, [clearAll]);

  const handleNotificationPress = useCallback(
    (item: (typeof notifications)[0]) => {
      void handleMarkAsRead(item.id);

      // Deep-link into the order/delivery screen for this notification.
      const route = buildNotificationRoute((item.payload ?? {}) as any);
      if (route) router.push(route as any);
    },
    [handleMarkAsRead, router],
  );

  const renderItem = useCallback(({ item }: { item: (typeof notifications)[0] }) => {
    const [Icon, iconColor] = getIcon(item.type);
    const isRead = item.read;
    const payload = (item.payload ?? {}) as Record<string, any>;
    const joinRequestStatus = payload.join_request_id
      ? joinRequestStatuses.get(String(payload.join_request_id))
      : null;
    const invitationStatus = payload.code
      ? invitationStatuses.get(String(payload.code))
      : null;
    return (
      <YStack
        backgroundColor={isRead ? "$background" : "$orangeMuted"}
        borderBottomWidth={1}
        borderBottomColor="$gray100"
        onPress={() => handleNotificationPress(item)}
      >
        <YStack padding="$4" gap="$1">
          <XStack gap="$3" alignItems="flex-start">
            <YStack
              width={40}
              height={40}
              borderRadius="$3"
              backgroundColor={isRead ? "$gray100" : "$orangeLight"}
              alignItems="center"
              justifyContent="center"
            >
              <Icon size={20} color={isRead ? "$colorMuted" : iconColor} />
            </YStack>

            <YStack flex={1} gap={2}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize="$3"
                  fontWeight={isRead ? "400" : "700"}
                  fontFamily="$body"
                  color="$color"
                  flex={1}
                >
                  {item.title}
                </Text>
                <Text fontSize={11} color="$colorSecondary" fontFamily="$body">
                  {formatTime(item.created_at)}
                </Text>
              </XStack>

              <Text
                fontSize="$3"
                color="$colorSecondary"
                fontFamily="$body"
                numberOfLines={2}
              >
                {item.message}
              </Text>
            </YStack>
          </XStack>

          <NotificationActionCard
            notification={item}
            onDone={refetch}
            orderStatus={payload.order_status ?? payload.status}
            joinRequestStatus={joinRequestStatus}
            invitationStatus={invitationStatus}
          />
        </YStack>
      </YStack>
    );
  }, [
    handleNotificationPress,
    refetch,
    joinRequestStatuses,
    invitationStatuses,
  ]);

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  const sections: { title: string; data: typeof notifications }[] = [];
  if (unread.length > 0) sections.push({ title: "New", data: unread });
  if (read_.length > 0) sections.push({ title: "Earlier", data: read_ });

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        alignItems="center"
        gap="$3"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color" flex={1}>
          Notifications
        </Text>

        <XStack gap="$2" flexShrink={0} alignItems="center">
          {unread.length > 0 && (
            <Button
              variant="ghost"
              width="auto"
              height={32}
              minWidth={0}
              flexShrink={0}
              backgroundColor="$backgroundStrong"
              paddingHorizontal="$2.5"
              icon={isMarkingAllRead ? <Spinner size={14} color="$primary" /> : <Check size={14} color="$primary" />}
              onPress={handleMarkAllRead}
              disabled={isMarkingAllRead}
            >
              <Text fontSize="$2" fontWeight="700" color="$primary">
                {isMarkingAllRead ? "..." : "Read All"}
              </Text>
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              width="auto"
              height={32}
              minWidth={0}
              flexShrink={0}
              backgroundColor="$backgroundStrong"
              paddingHorizontal="$2.5"
              icon={isClearing ? <Spinner size={14} color="$error" /> : <Trash2 size={14} color="$error" />}
              onPress={() => setShowClearDialog(true)}
              disabled={isClearing}
            >
              <Text fontSize="$2" fontWeight="700" color="$error">
                {isClearing ? "..." : "Clear"}
              </Text>
            </Button>
          )}
        </XStack>
      </XStack>

      {/* List */}
      <FlatList
        data={sections.flatMap((s) => [{ _section: true, title: s.title }, ...s.data])}
        keyExtractor={(item: any) => item._section ? `section-${item.title}` : item.id}
        renderItem={({ item }: any) => {
          if (item._section) {
            return (
              <XStack
                paddingHorizontal="$4"
                paddingVertical="$3"
                backgroundColor="$background"
                gap="$2"
                alignItems="center"
              >
                <Text
                  fontSize="$3"
                  fontWeight="700"
                  fontFamily="$heading"
                  color="$colorSecondary"
                  letterSpacing={0.5}
                  textTransform="uppercase"
                >
                  {item.title}
                </Text>
                {item.title === "New" && (
                  <YStack
                    backgroundColor="$primary"
                    borderRadius="$full"
                    minWidth={18}
                    height={18}
                    alignItems="center"
                    justifyContent="center"
                    paddingHorizontal={4}
                  >
                    <Text fontSize={10} fontWeight="800" color="white">
                      {unread.length}
                    </Text>
                  </YStack>
                )}
              </XStack>
            );
          }
          return renderItem({ item });
        }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 80,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <YStack flex={1} alignItems="center" justifyContent="center" paddingVertical="$10" gap="$2">
            <Bell size={48} color="$gray200" />
            <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color" marginTop="$2">
              No notifications yet
            </Text>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
              Notifications from your orders and activity will appear here.
            </Text>
          </YStack>
        }
      />

      {/* Clear All Confirmation */}
      <AppAlertDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        title="Clear All Notifications"
        description="Are you sure? This action cannot be undone."
        confirmText="Clear"
        onConfirm={handleClearAll}
        cancelText="Cancel"
      />
    </YStack>
  );
}
