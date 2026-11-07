// @ts-nocheck
import { useState } from "react";
import { Drawer } from "expo-router/drawer";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack, Separator } from "tamagui";
import {
  LayoutDashboard,
  Users,
  Car,
  DollarSign,
  User,
  LogIn,
  Settings,
  Bell,
  LogOut,
  Menu,
  MailOpen,
  MessageSquare,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/services/auth.service";
import { AppAlertDialog, DrawerMenuItem } from "@/components/ui";
import { DrawerHeader } from "@/components/ui/DrawerHeader";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useResponsive } from "@/utils/responsive";
import { useDeliveryRealtimeUpdates } from "@/hooks/useDeliveryRealtimeUpdates";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

/**
 * Custom Drawer Content for Fleet Manager
 */
function CustomDrawerContent(props: any) {
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

  const handleLogout = async () => {
    await authService.logout();
    clearAuth();
    setShowLogoutDialog(false);
    router.replace("/(auth)/login");
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <DrawerHeader
        fallbackName="Fleet Manager"
        fallbackEmail="fleet@example.com"
        onNavigateCreateBusiness={() => router.push("/(shared)/businesses/add")}
      />

      {/* Menu Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ backgroundColor: theme.background.val }}
        style={{ flex: 1, backgroundColor: theme.background.val }}
      >
        <YStack padding="$2" gap="$1">
          <DrawerMenuItem
            icon={LayoutDashboard}
            label="Dashboard"
            drawerName="dashboard/index"
            onPress={() => router.push("/(fleet)/dashboard")}
            isActive={isActive}
            fontFamily="$body"
          />

          <Separator marginVertical="$2" />

          <DrawerMenuItem
            icon={Users}
            label="Riders"
            drawerName="riders/index"
            onPress={() => router.push("/(fleet)/riders")}
            isActive={isActive}
            fontFamily="$body"
          />
          <DrawerMenuItem
            icon={Car}
            label="Vehicles"
            drawerName="vehicles/index"
            onPress={() => router.push("/(fleet)/vehicles")}
            isActive={isActive}
            fontFamily="$body"
          />
          <DrawerMenuItem
            icon={DollarSign}
            label="Earnings"
            drawerName="earnings/index"
            onPress={() => router.push("/(fleet)/earnings")}
            isActive={isActive}
            fontFamily="$body"
          />
          <DrawerMenuItem
            icon={DollarSign}
            label="Wallet"
            sharedPrefix="/(shared)/wallet"
            onPress={() => router.push("/(shared)/wallet")}
            isActive={isActive}
            fontFamily="$body"
          />

          <Separator marginVertical="$2" />

          <DrawerMenuItem
            icon={MessageSquare}
            label="Messages"
            sharedPrefix="/(communication)"
            onPress={() => router.push("/(communication)")}
            isActive={isActive}
            fontFamily="$body"
            badgeCount={businessUnread}
            secondaryBadgeCount={personalUnread}
          />
          <DrawerMenuItem
            icon={Bell}
            label="Notifications"
            sharedPrefix="/(shared)/notifications"
            onPress={() => router.push("/(shared)/notifications")}
            isActive={isActive}
            fontFamily="$body"
            badgeCount={notificationUnread}
          />
          <DrawerMenuItem
            icon={MailOpen}
            label="Invitations"
            sharedPrefix="/(shared)/invitations"
            onPress={() => router.push("/(shared)/invitations")}
            isActive={isActive}
            fontFamily="$body"
          />

          <DrawerMenuItem
            icon={Settings}
            label="Settings"
            drawerName="settings/index"
            onPress={() => router.push("/(fleet)/settings")}
            isActive={isActive}
            fontFamily="$body"
          />
          <DrawerMenuItem
            icon={User}
            label="Profile"
            drawerName="profile"
            onPress={() => router.push("/(fleet)/profile")}
            isActive={isActive}
            fontFamily="$body"
          />

          <Separator marginVertical="$2" />

          <DrawerMenuItem
            icon={LogOut}
            label="Logout"
            onPress={() => setShowLogoutDialog(true)}
            danger
            fontFamily="$body"
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
 * Fleet Manager Drawer Navigation
 * Contains Dashboard, Riders, Vehicles, Earnings, Settings, and Profile.
 */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function FleetDrawerLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(user && accessToken);
  const { isTablet, isLandscape } = useResponsive();

  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useDeliveryRealtimeUpdates(["fleet"]);

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
            fontSize: 36,
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
        {/* Dashboard */}
        <Drawer.Screen
          name="dashboard/index"
          options={{
            title: "Dashboard",
            drawerIcon: ({ color, size }) => (
              <LayoutDashboard color={color} size={size} />
            ),
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />

        {/* Riders */}
        <Drawer.Screen
          name="riders/index"
          options={{
            title: "Riders",
            drawerIcon: ({ color, size }) => (
              <Users color={color} size={size} />
            ),
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />

        {/* Vehicles */}
        <Drawer.Screen
          name="vehicles/index"
          options={{
            title: "Vehicles",
            drawerIcon: ({ color, size }) => <Car color={color} size={size} />,
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
        description="Please log in to your fleet manager account to access this section."
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
