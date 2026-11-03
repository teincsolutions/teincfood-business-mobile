// @ts-nocheck
import { useState } from "react";
import { Drawer } from "expo-router/drawer";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useTheme,
  YStack,
  XStack,
  Text,
  Avatar,
  Separator,
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
import { authService } from "@/services/auth.service";
import { useRiderProfileQuery } from "@teincfood/core";
import { useRiderLocationTracking } from "@/hooks/useRiderLocationTracking";
import { AppAlertDialog, DrawerMenuItem } from "@/components/ui";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useResponsive } from "@/utils/responsive";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { copyToClipboard } from "@teincfood/core";
import { toast } from "sonner-native";

/**
 * Custom Drawer Content for Rider
 */
function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const activeRouteName = props.state?.routes?.[props.state?.index]?.name;

  const { businessUnread, personalUnread, notificationUnread } =
    useUnreadCounts();

  const isActive = (routeName?: string, sharedPrefix?: string) => {
    if (routeName && activeRouteName === routeName) return true;
    if (sharedPrefix && pathname.startsWith(sharedPrefix)) return true;
    return false;
  };
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

  const handleLogout = async () => {
    await authService.logout();
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
            <Avatar.Image src={riderProfile?.avatar_url || user?.avatar_url} />
            <Avatar.Fallback
              justify="center"
              alignItems="center"
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
            {riderProfile?.rider_number && (
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
            )}
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
          <DrawerMenuItem
            icon={Home}
            label="Dashboard"
            drawerName="home/index"
            onPress={() => router.push("/(rider)/home")}
            isActive={isActive}
          />

          <Separator marginVertical="$2" />

          <DrawerMenuItem
            icon={Truck}
            label="Deliveries"
            drawerName="deliveries/index"
            onPress={() => router.push("/(rider)/deliveries")}
            isActive={isActive}
          />
          <DrawerMenuItem
            icon={DollarSign}
            label="Earnings"
            drawerName="earnings/index"
            onPress={() => router.push("/(rider)/earnings")}
            isActive={isActive}
          />
          <DrawerMenuItem
            icon={DollarSign}
            label="Wallet"
            sharedPrefix="/(shared)/wallet"
            onPress={() => router.push("/(shared)/wallet")}
            isActive={isActive}
          />

          <Separator marginVertical="$2" />

          <DrawerMenuItem
            icon={MessageSquare}
            label="Messages"
            sharedPrefix="/(communication)"
            onPress={() => router.push("/(communication)")}
            isActive={isActive}
            badgeCount={businessUnread}
            secondaryBadgeCount={personalUnread}
          />
          <DrawerMenuItem
            icon={Bell}
            label="Notifications"
            sharedPrefix="/(shared)/notifications"
            onPress={() => router.push("/(shared)/notifications")}
            isActive={isActive}
            badgeCount={notificationUnread}
          />
          <DrawerMenuItem
            icon={MailOpen}
            label="Invitations"
            sharedPrefix="/(shared)/invitations"
            onPress={() => router.push("/(shared)/invitations")}
            isActive={isActive}
          />

          <DrawerMenuItem
            icon={Settings}
            label="Settings"
            drawerName="settings/index"
            onPress={() => router.push("/(rider)/settings")}
            isActive={isActive}
          />
          <DrawerMenuItem
            icon={User}
            label="Profile"
            drawerName="profile"
            onPress={() => router.push("/(rider)/profile")}
            isActive={isActive}
          />

          <Separator marginVertical="$2" />

          <DrawerMenuItem
            icon={LogOut}
            label="Logout"
            onPress={() => setShowLogoutDialog(true)}
            danger
          />
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
            fontFamily: "Manrope_600SemiBold",
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
