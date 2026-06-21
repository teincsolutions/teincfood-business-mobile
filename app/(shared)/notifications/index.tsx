// @ts-nocheck

import { useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { YStack, XStack, Text, Card } from "tamagui";
import {
  Bell,
  ShoppingBag,
  DollarSign,
  Truck,
  MessageCircle,
} from "@tamagui/lucide-icons";
import { useNotificationStore } from "@/stores/notification.store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button } from "@/components/ui";

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();

  const onRefresh = async () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleNotificationPress = (id: string) => {
    markAsRead(id);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const getIconComponent = (type: string) => {
    switch (type) {
      case "order": return ShoppingBag;
      case "delivery":
      case "delivered": return Truck;
      case "promo": return DollarSign;
      default: return MessageCircle;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "order": return "$primary";
      case "delivery":
      case "delivered": return "$success";
      case "promo": return "#f1c40f";
      default: return "$colorMuted";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const renderNotification = ({ item: notification }) => {
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
              {new Date(notification.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </YStack>
        </XStack>
      </Card>
    );
  };

  const ListEmptyComponent = () => (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$8" gap="$4">
      <Bell size={48} color="$colorMuted" />
      <Text fontSize="$5" color="$colorMuted">
        No notifications yet
      </Text>
    </YStack>
  );

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
          {unreadCount > 0 && (
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
                {unreadCount}
              </Text>
            </YStack>
          )}
        </XStack>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            width="auto"
            height={40}
            paddingHorizontal="$3"
            onPress={handleMarkAllRead}
          >
            Mark All Read
          </Button>
        )}
      </XStack>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{
          padding: 16,
          flexGrow: 1,
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />
    </YStack>
  );
}
