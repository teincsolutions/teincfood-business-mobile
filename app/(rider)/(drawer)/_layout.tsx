// @ts-nocheck
import { useState } from "react";
import { Drawer } from "expo-router/drawer";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useTheme,
  YStack,
  XStack,
  Text,
  Avatar,
  Separator,
  Button,
  Spinner,
  ButtonIcon,
} from "tamagui";
import {
  Home,
  Truck,
  DollarSign,
  User,
  LogIn,
  Settings,
  Bell,
  LogOut,
  MapPin,
  MessageSquare,
  Menu,
  Copy,
  MailOpen,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useRiderProfileQuery } from "@/hooks/useRider";
import { useRiderLocationTracking } from "@/hooks/useRiderLocationTracking";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useResponsive } from "@/utils/responsive";
import { copyToClipboard } from "@/utils/copyToClipBoard";
import { toast } from "sonner-native";

/**
 * Custom Drawer Content for Rider
 */
function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { data: riderProfile, isLoading: profileLoading } =
    useRiderProfileQuery();
  const riderStatus = riderProfile?.status ?? "offline";
  const statusLabel =
    riderStatus === "available"
      ? "Online"
      : riderStatus === "busy"
        ? "Busy"
        : "Offline";
  const statusColor =
    riderStatus === "available"
      ? "$green10"
      : riderStatus === "busy"
        ? "$yellow10"
        : "$gray800";

  const handleLogout = () => {
    clearAuth();
    setShowLogoutDialog(false);
    router.replace("/(auth)/login");
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* User Profile Section */}
      <YStack
        padding="$4"
        paddingTop={insets.top + 24}
        backgroundColor="$primary"
      >
        <XStack gap="$3" alignItems="center">
          <Avatar circular size="$16">
            <Avatar.Image src={user?.avatarUrl} />
            <Avatar.Fallback
              items="center"
              justify="center"
              backgroundColor="$color.gray50"
            >
              <Text color="$color" fontWeight="bold" fontSize="$8">
                {user?.fullName?.charAt(0) || "R"}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack flex={1}>
            <Text color="white" fontWeight="bold" fontSize="$5">
              {user?.fullName || "Rider"}
            </Text>
            <XStack gap="$2" alignItems="center">
              <Text color="white" opacity={0.8} fontSize="$3">
                {user?.email || "rider@example.com"}
              </Text>
            </XStack>
            <XStack
              onPress={async () => {
                await copyToClipboard(riderProfile?.rider_number);
                console.log("ID copied", riderProfile?.rider_number);
                toast.success("Rider ID copied to clipboard");
              }}
              gap="$1"
              marginTop="$2"
              alignItems="center"
            >
              <Text
                color="white"
                opacity={0.6}
                verticalAlign={"bottom"}
                fontSize="$2"
              >
                Rider ID: #{riderProfile?.rider_number}
              </Text>
              <ButtonIcon color="$color.gray300">
                <Copy color="$white" />
              </ButtonIcon>
            </XStack>
          </YStack>
        </XStack>
      </YStack>

      {/* Menu Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 0 }}
        style={{ flex: 1 }}
      >
        <YStack padding="$2" gap="$1">
          {/* Home */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(rider)/home")}
            icon={<Home size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Dashboard
            </Text>
          </Button>

          <Separator marginVertical="$2" />

          {/* Deliveries */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(rider)/deliveries")}
            icon={<Truck size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Deliveries
            </Text>
          </Button>

          {/* Earnings */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(rider)/earnings")}
            icon={<DollarSign size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Earnings
            </Text>
          </Button>

          {/* Wallet & Billing */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(shared)/wallet")}
            icon={<DollarSign size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Wallet & Billing
            </Text>
          </Button>

          <Separator marginVertical="$2" />

          {/* Messages */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(communication)")}
            icon={<MessageSquare size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Messages
            </Text>
          </Button>

          {/* Notifications */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(shared)/notifications")}
            icon={<Bell size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Notifications
            </Text>
          </Button>

          {/* Invitations */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(shared)/invitations")}
            icon={<MailOpen size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Invitations
            </Text>
          </Button>

          {/* Settings */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(rider)/settings")}
            icon={<Settings size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Settings
            </Text>
          </Button>

          {/* Profile */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(rider)/profile")}
            icon={<User size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Profile
            </Text>
          </Button>

          <Separator marginVertical="$2" />

          {/* Logout */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$red4" }}
            onPress={() => setShowLogoutDialog(true)}
            icon={<LogOut size={20} color="$red10" />}
          >
            <Text flex={1} fontSize="$4" color="$red10">
              Logout
            </Text>
          </Button>
        </YStack>
      </DrawerContentScrollView>

      {/* Logout Confirmation Dialog */}
      <AppAlertDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="Logout"
        description="Are you sure you want to logout?"
        icon={LogOut}
        confirmText="LOGOUT"
        onConfirm={handleLogout}
      />
    </YStack>
  );
}

/**
 * Rider Drawer Navigation
 * Contains Home, Deliveries, Earnings, Settings, and Profile.
 */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function RiderDrawerLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(user && accessToken);
  const { isTablet, isLandscape } = useResponsive();

  const { data: riderProfile } = useRiderProfileQuery();
  const isOnline = riderProfile?.status !== "offline";
  useRiderLocationTracking({ riderId: riderProfile?.id, enabled: isOnline });

  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleProtectedRoute = (e: any) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowAuthDialog(true);
    }
  };

  const usePermanentDrawer = isTablet && isLandscape;

  return (
    <>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.background.val,
          },
          headerLeft: () => (
            <Menu
              size="$8"
              marginStart="$2"
              color={theme.color.val}
              onPress={() => navigation.toggleDrawer()}
            />
          ),
          headerTintColor: theme.color.val,
          headerTitleStyle: {
            fontFamily: "Sen_600SemiBold",
          },
          drawerStyle: {
            backgroundColor: theme.background.val,
            width: isTablet ? 300 : 280,
          },
          sceneStyle: { backgroundColor: theme.background.val },
          drawerType: usePermanentDrawer ? "permanent" : "front",
          overlayColor: usePermanentDrawer ? "transparent" : "rgba(0,0,0,0.5)",
        })}
      >
        {/* Home */}
        <Drawer.Screen
          name="home/index"
          options={{
            title: "Home",
            headerShown: false,
            drawerIcon: ({ color, size }) => <Home color={color} size={24} />,
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />

        {/* Deliveries */}
        <Drawer.Screen
          name="deliveries/index"
          options={{
            title: "Deliveries",
            headerShown: false,
            drawerIcon: ({ color, size }) => (
              <Truck color={color} size={size} />
            ),
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />

        {/* Earnings */}
        <Drawer.Screen
          name="earnings/index"
          options={{
            title: "Earnings",
            drawerIcon: ({ color, size }) => (
              <DollarSign color={color} size={size} />
            ),
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />

        {/* Settings */}
        <Drawer.Screen
          name="settings/index"
          options={{
            title: "Settings",
            drawerIcon: ({ color, size }) => (
              <Settings color={color} size={size} />
            ),
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />

        {/* Profile */}
        <Drawer.Screen
          name="profile"
          options={{
            title: "Profile",
            drawerIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />
      </Drawer>

      <AppAlertDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="Login Required"
        description="Please log in to your rider account to access this section."
        icon={LogIn}
        confirmText="LOG IN"
        onConfirm={() => {
          setShowAuthDialog(false);
          router.push("/(auth)/login");
        }}
      />
    </>
  );
}
