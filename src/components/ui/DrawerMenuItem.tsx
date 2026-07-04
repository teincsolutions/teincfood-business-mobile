// @ts-nocheck
import { useTheme, Button, Text } from "tamagui";

interface DrawerMenuItemProps {
  icon: React.ElementType;
  label: string;
  drawerName?: string;
  sharedPrefix?: string;
  onPress: () => void;
  isActive?: (routeName?: string, sharedPrefix?: string) => boolean;
  danger?: boolean;
  fontFamily?: string;
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
      <Text flex={1} fontSize="$4" fontFamily={fontFamily} color={color} fontWeight={active ? "700" : "400"}>
        {label}
      </Text>
    </Button>
  );
}
