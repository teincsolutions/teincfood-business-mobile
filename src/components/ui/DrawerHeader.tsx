// @ts-nocheck
import {
  YStack,
  XStack,
  Text,
  Avatar,
  Button,
  Select,
  Adapt,
  Sheet,
  ButtonIcon,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building,
  ChevronDown,
  Check,
  User,
  Copy,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { useProfileQuery } from "@/hooks/useProfile";
import { useResponsive } from "@/utils/responsive";
import { copyToClipboard } from "@/utils/copyToClipBoard";

interface DrawerHeaderProps {
  fallbackName?: string;
  fallbackEmail?: string;
  onNavigateCreateBusiness?: () => void;
}

export function DrawerHeader({
  fallbackName = "User",
  fallbackEmail = "",
  onNavigateCreateBusiness,
}: DrawerHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { businesses, activeBusiness, switchBusiness } = useActiveBusiness();
  const { data: profile } = useProfileQuery();
  const { isTablet } = useResponsive();

  const avatarSize = isTablet ? "$14" : "$12";
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
            <Avatar.Image src={profile?.avatar_url || user?.avatar_url} />
            <Avatar.Fallback
              justify="center"
              alignItems="center"
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
            {user?.email && (
              <Text color="white" opacity={0.8} fontSize={emailTextSize}>
                {user?.email}
              </Text>
            )}

            <XStack
              onPress={async () => {
                await copyToClipboard(activeBusiness?.business_number);
                console.log("ID copied", activeBusiness?.business_number);
                toast.success("Rider ID copied to clipboard");
              }}
              gap="$1"
              marginTop="$2"
              alignItems="center"
              paddingHorizontal="$2"
            >
              <Text
                fontSize="$1"
                color="white"
                opacity={0.6}
                verticalAlign={"bottom"}
              >
                Bus.ID: #{activeBusiness?.business_number}
                <Copy color="$white" size="$4" />
              </Text>
            </XStack>
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
