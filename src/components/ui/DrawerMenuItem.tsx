// @ts-nocheck
import { useTheme, Button, Text, XStack } from "tamagui";

interface DrawerMenuItemProps {
  icon: React.ElementType;
  label: string;
  drawerName?: string;
  sharedPrefix?: string;
  onPress: () => void;
  isActive?: (routeName?: string, sharedPrefix?: string) => boolean;
  danger?: boolean;
  fontFamily?: string;
  badgeCount?: number;
  secondaryBadgeCount?: number;
}

export function DrawerMenuItem({
  icon: Icon,
  label,
  drawerName,
  sharedPrefix,
  onPress,
  isActive,
  danger,
  fontFamily,
  badgeCount,
  secondaryBadgeCount,
}: DrawerMenuItemProps) {
  const theme = useTheme();
  const active = drawerName || sharedPrefix ? isActive(drawerName, sharedPrefix) : false;
  const color = danger ? "$red10" : active ? "$primary" : theme.color.val;

  return (
    <Button
      unstyled
      borderRadius="$3"
      flexDirection="row"
      alignItems="center"
      gap="$3"
      padding="$3"
      paddingLeft="$4"
      backgroundColor={active ? "$primaryLight" : "transparent"}
      pressStyle={{ backgroundColor: danger ? "$red4" : "$gray3" }}
      onPress={onPress}
      icon={<Icon size={20} color={color} />}
      justifyContent="flex-start"
    >
      <XStack flex={1} alignItems="center" justifyContent="space-between">
        <Text
          fontSize="$4"
          fontFamily={fontFamily}
          color={color}
          fontWeight={active ? "700" : "400"}
        >
          {label}
        </Text>
        {badgeCount != null && badgeCount > 0 && (
          <XStack
            backgroundColor="$primary"
            borderRadius="$12"
            minWidth={22}
            height={22}
            paddingHorizontal="$1.5"
            alignItems="center"
            justifyContent="center"
          >
            <Text
              fontSize="$1"
              fontWeight="700"
              color="$white"
              lineHeight={14}
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </Text>
          </XStack>
        )}
        {secondaryBadgeCount != null && secondaryBadgeCount > 0 && (
          <XStack
            backgroundColor="$primary"
            borderRadius="$12"
            minWidth={20}
            height={20}
            paddingHorizontal="$1.5"
            marginLeft="$1"
            alignItems="center"
            justifyContent="center"
          >
            <Text
              fontSize={10}
              fontWeight="700"
              color="$white"
              lineHeight={12}
            >
              {secondaryBadgeCount > 99 ? "99+" : secondaryBadgeCount}
            </Text>
          </XStack>
        )}
      </XStack>
    </Button>
  );
}
