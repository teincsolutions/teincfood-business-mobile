// @ts-nocheck

import { useCallback, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { YStack, XStack, Text, Card, Spinner } from "tamagui";
import {
  Bell,
  ShoppingBag,
  DollarSign,
  Truck,
  MessageCircle,
  Check,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button } from "@/components/ui";
import {
  useNotificationsQuery,
  useNotificationsStream,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/hooks/useNotifications";
import { NotificationActionCard } from "@/components/notifications/NotificationActionCard";

function getIconComponent(type: string) {
  switch (type) {
    case "order": return ShoppingBag;
    case "delivery":
    case "delivered": return Truck;
    case "promo": return DollarSign;
    default: return MessageCircle;
  }
}

function getIconColor(type: string) {
  switch (type) {
    case "order": return "$primary";
    case "delivery":
    case "delivered": return "$success";
    case "promo": return "#f1c40f";
    default: return "$colorMuted";
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: notifications = [], isLoading, refetch, isRefetching } = useNotificationsQuery();
  useNotificationsStream(true);

  const markAsRead = useMarkNotificationReadMutation();
  const markAllAsRead = useMarkAllNotificationsReadMutation();

  const [completedActionIds, setCompletedActionIds] = useState<Set<string>>(new Set());

  const markActionDone = useCallback((id: string) => {
    setCompletedActionIds((prev) => new Set(prev).add(id));
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  const handleNotificationPress = useCallback((id: string) => {
    markAsRead.mutate(id);
  }, [markAsRead]);

  const handleMarkAllRead = useCallback(() => {
    markAllAsRead.mutate();
  }, [markAllAsRead]);

  const renderNotification = useCallback(({ item: notification }: { item: typeof notifications[0] }) => {
    const IconComponent = getIconComponent(notification.type);
    return (
      <Card
        padding="$4"
        bordered
        marginBottom="$3"
        backgroundColor={notification.read ? "$background" : "$primaryLight"}
        pressStyle={{ scale: 0.98, opacity: 0.9 }}
        onPress={() => handleNotificationPress(notification.id)}
      >
        <XStack gap="$3" alignItems="flex-start">
          <YStack
            width={44}
            height={44}
            backgroundColor={notification.read ? "$gray5" : "$primary"}
            borderRadius="$3"
            alignItems="center"
            justifyContent="center"
          >
            <IconComponent size={22} color={notification.read ? "$colorMuted" : "white"} />
          </YStack>
          <YStack flex={1} gap="$1">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontWeight={notification.read ? "normal" : "bold"}>
                {notification.title}
              </Text>
              {!notification.read && (
                <YStack width={8} height={8} backgroundColor="$primary" borderRadius="$10" />
              )}
            </XStack>
            <Text fontSize="$3" color="$colorMuted">{notification.message}</Text>
            <Text fontSize="$2" color="$colorMuted" marginTop="$1">
              {notification.created_at
                ? new Date(notification.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : ""}
            </Text>
          </YStack>
        </XStack>
      </Card>
    );
  }, [handleNotificationPress]);

  const renderSection = useCallback((title: string, items: typeof notifications, emptyText: string) => {
    if (items.length === 0) return null;
    return (
      <YStack gap="$1" marginBottom="$4">
        <Text fontSize="$4" fontWeight="bold" color="$colorMuted" paddingLeft="$1" marginBottom="$2">
          {title}
        </Text>
        {items.map((item) => (
          <Card
            key={item.id}
            padding="$4"
            bordered
            marginBottom="$2"
            backgroundColor={item.read ? "$background" : "$primaryLight"}
            pressStyle={{ scale: 0.98, opacity: 0.9 }}
            onPress={() => handleNotificationPress(item.id)}
          >
            <XStack gap="$3" alignItems="flex-start">
              <YStack
                width={44}
                height={44}
                backgroundColor={item.read ? "$gray5" : "$primary"}
                borderRadius="$3"
                alignItems="center"
                justifyContent="center"
              >
                {(() => {
                  const Icon = getIconComponent(item.type);
                  return <Icon size={22} color={item.read ? "$colorMuted" : "white"} />;
                })()}
              </YStack>
              <YStack flex={1} gap="$1">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight={item.read ? "normal" : "bold"}>{item.title}</Text>
                  {!item.read && (
                    <YStack width={8} height={8} backgroundColor="$primary" borderRadius="$10" />
                  )}
                </XStack>
                <Text fontSize="$3" color="$colorMuted">{item.message}</Text>
                <Text fontSize="$2" color="$colorMuted" marginTop="$1">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </Text>
                {!completedActionIds.has(item.id) && (
                  <NotificationActionCard
                    notification={item}
                    onDone={() => markActionDone(item.id)}
                  />
                )}
              </YStack>
            </XStack>
          </Card>
        ))}
      </YStack>
    );
  }, [handleNotificationPress, completedActionIds, markActionDone]);

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <BackButton />
          <Text fontSize="$7" fontWeight="bold">
            Notifications
          </Text>
          {unreadNotifications.length > 0 && (
            <YStack
              backgroundColor="$primary"
              borderRadius="$10"
              minWidth={24}
              height={24}
              alignItems="center"
              justifyContent="center"
              paddingHorizontal="$2"
            >
              <Text color="$background" fontSize="$2" fontWeight="bold">
                {unreadNotifications.length}
              </Text>
            </YStack>
          )}
        </XStack>
        {unreadNotifications.length > 0 && (
          <Button
            variant="outline"
            width="auto"
            height={40}
            paddingHorizontal="$3"
            onPress={handleMarkAllRead}
            loading={markAllAsRead.isPending}
            icon={<Check size={14} />}
          >
            Mark All Read
          </Button>
        )}
      </XStack>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={() => (
          <YStack padding="$4" paddingBottom={0}>
            {renderSection("New", unreadNotifications, "No new notifications")}
            {renderSection("Earlier", readNotifications, "No notifications yet")}
            {notifications.length === 0 && (
              <YStack padding="$8" alignItems="center" gap="$4">
                <Bell size={48} color="$colorMuted" />
                <Text fontSize="$5" color="$colorMuted">
                  No notifications yet
                </Text>
              </YStack>
            )}
          </YStack>
        )}
        keyExtractor={() => "header"}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      />
    </YStack>
  );
}
