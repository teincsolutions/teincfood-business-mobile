// @ts-nocheck
import { YStack, XStack, Text, Avatar, Button, Select, Adapt, Sheet } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building,
  ChevronDown,
  Check,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { useResponsive } from "@/utils/responsive";

interface DrawerHeaderProps {
  fallbackName?: string;
  fallbackEmail?: string;
  onNavigateCreateBusiness?: () => void;
}

export function DrawerHeader({
  fallbackName = "User",
  fallbackEmail = "user@example.com",
  onNavigateCreateBusiness,
}: DrawerHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { businesses, activeBusiness, switchBusiness } = useActiveBusiness();
  const { isTablet } = useResponsive();

  const avatarSize = isTablet ? "$12" : "$10";
  const avatarTextSize = isTablet ? "$10" : "$8";
  const nameTextSize = isTablet ? "$6" : "$5";
  const emailTextSize = isTablet ? "$4" : "$3";

  const handleCreateBusiness = () => {
    if (onNavigateCreateBusiness) {
      onNavigateCreateBusiness();
    }
  };

  return (
    <>
      {/* User Profile Section */}
      <YStack
        padding="$4"
        paddingTop={Math.max(insets.top + 8, 24)}
        backgroundColor="$primary"
      >
        <XStack gap="$3" alignItems="center">
          <Avatar circular size={avatarSize}>
            <Avatar.Image src={user?.avatarUrl} />
            <Avatar.Fallback
              items="center"
              justify="center"
              backgroundColor="$color.gray50"
            >
              <Text color="$color" fontWeight="bold" fontSize={avatarTextSize}>
                {user?.fullName?.charAt(0) || fallbackName.charAt(0)}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack flex={1}>
            <Text color="white" fontWeight="bold" fontSize={nameTextSize}>
              {user?.fullName || fallbackName}
            </Text>
            <Text color="white" opacity={0.8} fontSize={emailTextSize}>
              {user?.email || fallbackEmail}
            </Text>
          </YStack>
        </XStack>
      </YStack>

      {/* Business Switcher / Create */}
      <YStack
        backgroundColor="$primaryLight"
        paddingHorizontal="$3"
        paddingVertical="$3"
      >
        {businesses.length > 0 ? (
          <Select
            value={activeBusiness?.id ?? ""}
            onValueChange={(id) => switchBusiness(id)}
            disablePreventBodyScroll
          >
            <Select.Trigger
              width="100%"
              borderRadius="$4"
              backgroundColor="$background"
              borderWidth={1}
              borderColor="$borderColor"
              iconAfter={ChevronDown}
              paddingHorizontal="$3"
              paddingVertical="$1"
            >
              <Select.Value placeholder="Select business" />
            </Select.Trigger>

            <Adapt platform="touch">
              <Sheet native modal dismissOnSnapToBottom animation="medium">
                <Sheet.Frame>
                  <Sheet.ScrollView>
                    <Adapt.Contents />
                  </Sheet.ScrollView>
                </Sheet.Frame>
                <Sheet.Overlay
                  bg="$shadowColor"
                  animation="lazy"
                  enterStyle={{ opacity: 0 }}
                  exitStyle={{ opacity: 0 }}
                />
              </Sheet>
            </Adapt>

            <Select.Content style={{ display: "none" }}>
              <Select.Viewport bg="$background">
                <Select.Group>
                  {businesses.map((b, i) => (
                    <Select.Item key={b.id} index={i} value={b.id}>
                      <Select.ItemText>{b.name}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>
            </Select.Content>
          </Select>
        ) : (
          <Button
            variant="outline"
            width="100%"
            icon={<Building size={16} />}
            onPress={handleCreateBusiness}
          >
            Create a Business
          </Button>
        )}
      </YStack>
    </>
  );
}
