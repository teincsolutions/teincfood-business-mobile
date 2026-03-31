// @ts-nocheck
import { useMemo, useState } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Bell,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Trash2,
  Check,
  Zap,
} from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";
import {
  useClearNotificationsMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsSSEStream,
  useNotificationsQuery,
} from "@/services/notifications.service";

const ICON_MAP: Record<string, any> = {
  order: { icon: Package, color: "$blue" },
  delivery: { icon: Truck, color: "$primary" },
  delivered: { icon: CheckCircle, color: "$green" },
  promo: { icon: Bell, color: "$starOrange" },
  system: { icon: Bell, color: "$colorSecondary" },
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { data: notificationsData = [] } = useNotificationsQuery();
  useNotificationsSSEStream(true);
  const { mutate: markAsRead } = useMarkNotificationReadMutation();
  const { mutate: markAllAsRead } = useMarkAllNotificationsReadMutation();
  const { mutate: clearAll } = useClearNotificationsMutation();
  const router = useRouter();
  const notifications = notificationsData;

  const [dialogOpen, setDialogOpen] = useState(false);

  const unread = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications],
  );
  const read = useMemo(
    () => notifications.filter((n) => n.read),
    [notifications],
  );

  const handleClearAll = () => {
    setDialogOpen(true);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins} min ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      return date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  if (notifications.length === 0) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
        padding="$5"
        paddingTop={insets.top + 40}
      >
        <Bell size={64} color="$gray200" />
        <Text
          fontSize="$6"
          fontWeight="700"
          fontFamily="$heading"
          marginTop="$4"
          color="$color"
        >
          No Notifications
        </Text>
        <Text
          fontSize="$4"
          color="$colorSecondary"
          fontFamily="$body"
          textAlign="center"
          marginTop="$2"
        >
          We'll notify you when something important happens!
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        bounces
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <YStack gap="$6" padding="$5">
          {/* Title & Actions */}
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <Text
                flex={1}
                fontSize="$8"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
                marginRight="$3"
                numberOfLines={1}
              >
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
                    icon={<Check size={14} color="$primary" />}
                    onPress={markAllAsRead}
                  >
                    <Text fontSize="$2" fontWeight="700" color="$primary">
                      Read All
                    </Text>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  width="auto"
                  height={32}
                  minWidth={0}
                  flexShrink={0}
                  backgroundColor="$backgroundStrong"
                  paddingHorizontal="$2.5"
                  icon={<Zap size={14} color="$primary" />}
                  onPress={() => router.push("/(buyer)/(notifications)/live-demo")}
                >
                  <Text fontSize="$2" fontWeight="700" color="$primary">
                    Demo
                  </Text>
                </Button>
                <Button
                  variant="ghost"
                  width="auto"
                  height={32}
                  minWidth={0}
                  flexShrink={0}
                  backgroundColor="$backgroundStrong"
                  paddingHorizontal="$2.5"
                  icon={<Trash2 size={14} color="$red" />}
                  onPress={handleClearAll}
                >
                  <Text fontSize="$2" fontWeight="700" color="$red">
                    Clear
                  </Text>
                </Button>
              </XStack>
            </XStack>
            {unread.length > 0 && (
              <XStack
                backgroundColor="$primary"
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius="$full"
                alignSelf="flex-start"
              >
                <Text
                  fontSize="$2"
                  fontWeight="700"
                  color="white"
                  fontFamily="$body"
                >
                  {unread.length} new
                </Text>
              </XStack>
            )}
          </YStack>

          {/* Grouped Notifications */}
          <YStack gap="$6">
            {unread.length > 0 && (
              <YStack gap="$2">
                <Text
                  fontSize="$3"
                  fontWeight="700"
                  color="$colorSecondary"
                  fontFamily="$body"
                  textTransform="uppercase"
                >
                  New
                </Text>
                <YStack
                  backgroundColor="$backgroundStrong"
                  borderRadius="$5"
                  overflow="hidden"
                >
                  {unread.map((notif, idx) => {
                    const config = ICON_MAP[notif.type] || ICON_MAP.order;
                    const Icon = config.icon;
                    return (
                      <TouchableOpacity
                        key={notif.id}
                        onPress={() => markAsRead(notif.id)}
                        activeOpacity={0.7}
                      >
                        <YStack>
                          <XStack
                            padding="$4"
                            gap="$3"
                            alignItems="flex-start"
                            backgroundColor="$orangeMuted"
                          >
                            <YStack
                              width={44}
                              height={44}
                              borderRadius="$full"
                              backgroundColor="$backgroundSoft"
                              justifyContent="center"
                              alignItems="center"
                              flexShrink={0}
                            >
                              <Icon size={20} color={config.color} />
                            </YStack>
                            <YStack flex={1} gap="$1">
                              <XStack
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Text
                                  fontSize="$4"
                                  fontWeight="700"
                                  fontFamily="$heading"
                                  color="$color"
                                  numberOfLines={1}
                                  flex={1}
                                >
                                  {notif.title}
                                </Text>
                                <XStack
                                  alignItems="center"
                                  gap="$1"
                                  flexShrink={0}
                                >
                                  <Clock size={12} color="$colorSecondary" />
                                  <Text
                                    fontSize="$2"
                                    color="$colorSecondary"
                                    fontFamily="$body"
                                  >
                                    {formatTime(notif.time)}
                                  </Text>
                                </XStack>
                              </XStack>
                              <Text
                                fontSize="$3"
                                color="$colorSecondary"
                                fontFamily="$body"
                                numberOfLines={2}
                              >
                                {notif.message}
                              </Text>
                            </YStack>
                          </XStack>
                          {idx < unread.length - 1 && (
                            <Separator borderColor="$borderColor" />
                          )}
                        </YStack>
                      </TouchableOpacity>
                    );
                  })}
                </YStack>
              </YStack>
            )}

            {read.length > 0 && (
              <YStack gap="$2">
                <Text
                  fontSize="$3"
                  fontWeight="700"
                  color="$colorSecondary"
                  fontFamily="$body"
                  textTransform="uppercase"
                >
                  Earlier
                </Text>
                <YStack
                  backgroundColor="$backgroundStrong"
                  borderRadius="$5"
                  overflow="hidden"
                >
                  {read.map((notif, idx) => {
                    const config = ICON_MAP[notif.type] || ICON_MAP.order;
                    const Icon = config.icon;
                    return (
                      <YStack key={notif.id}>
                        <XStack padding="$4" gap="$3" alignItems="flex-start">
                          <YStack
                            width={44}
                            height={44}
                            borderRadius="$full"
                            backgroundColor="$backgroundSoft"
                            justifyContent="center"
                            alignItems="center"
                            flexShrink={0}
                          >
                            <Icon size={20} color={config.color} />
                          </YStack>
                          <YStack flex={1} gap="$1">
                            <XStack
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Text
                                fontSize="$4"
                                fontWeight="600"
                                fontFamily="$body"
                                color="$color"
                                numberOfLines={1}
                                flex={1}
                              >
                                {notif.title}
                              </Text>
                              <XStack
                                alignItems="center"
                                gap="$1"
                                flexShrink={0}
                              >
                                <Clock size={12} color="$colorSecondary" />
                                <Text
                                  fontSize="$2"
                                  color="$colorSecondary"
                                  fontFamily="$body"
                                >
                                  {formatTime(notif.time)}
                                </Text>
                              </XStack>
                            </XStack>
                            <Text
                              fontSize="$3"
                              color="$colorSecondary"
                              fontFamily="$body"
                              numberOfLines={2}
                            >
                              {notif.message}
                            </Text>
                          </YStack>
                        </XStack>
                        {idx < read.length - 1 && (
                          <Separator borderColor="$borderColor" />
                        )}
                      </YStack>
                    );
                  })}
                </YStack>
              </YStack>
            )}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
