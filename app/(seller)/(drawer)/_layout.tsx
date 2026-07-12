// @ts-nocheck
import { useState } from "react";
import { Drawer } from "expo-router/drawer";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack, Separator } from "tamagui";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  User,
  LogIn,
  Settings,
  Bell,
  Monitor,
  LogOut,
  Menu,
  MessageSquare,
  Users,
  Bike,
  MailOpen,
  Truck,
  DollarSign,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useSecurityStore } from "@/stores/security.store";
import { authService } from "@/services/auth.service";
import { AppAlertDialog, DrawerMenuItem } from "@/components/ui";
import { DrawerHeader } from "@/components/ui/DrawerHeader";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useResponsive } from "@/utils/responsive";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";

/**
 * Custom Drawer Content
 */
function CustomDrawerContent(props: any) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const activeRouteName = props.state?.routes?.[props.state?.index]?.name;

  const { total: totalUnread } = useUnreadCounts();

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
        fallbackName="Seller"
        fallbackEmail=""
        onNavigateCreateBusiness={() => router.push("/(shared)/businesses/add")}
      />

      {/* Menu Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          backgroundColor: theme.background.val,
          paddingTop: 0,
        }}
        style={{ flex: 1, backgroundColor: theme.background.val }}
      >
        <YStack padding="$2" gap="$1">
          <DrawerMenuItem
            icon={LayoutDashboard}
            label="Dashboard"
            drawerName="dashboard/index"
            onPress={() => router.push("/(seller)/dashboard")}
            isActive={isActive}
          />
          <DrawerMenuItem
            icon={Monitor}
            label="Kiosk Mode"
            drawerName="dashboard/kiosk"
            onPress={() => router.push("/(seller)/dashboard/kiosk")}
            isActive={isActive}
          />

          <Separator marginVertical="$2" />

          <DrawerMenuItem
            icon={ShoppingBag}
            label="Orders"
            drawerName="orders/index"
            onPress={() => router.push("/(seller)/orders")}
            isActive={isActive}
          />
          <DrawerMenuItem
            icon={Truck}
            label="Deliveries"
            drawerName="deliveries/index"
            onPress={() => router.push("/(seller)/deliveries")}
            isActive={isActive}
          />
          <DrawerMenuItem
            icon={UtensilsCrossed}
            label="Menu"
            drawerName="menu/index"
            onPress={() => router.push("/(seller)/menu")}
            isActive={isActive}
          />
          <DrawerMenuItem
            icon={BarChart3}
            label="Analytics"
            drawerName="analytics/index"
            onPress={() => router.push("/(seller)/analytics")}
            isActive={isActive}
          />
          <DrawerMenuItem
            icon={Users}
            label="Members"
            drawerName="members/index"
            onPress={() => router.push("/(seller)/members")}
            isActive={isActive}
          />
          <DrawerMenuItem
            icon={Bike}
            label="Riders"
            drawerName="riders/index"
            onPress={() => router.push("/(seller)/riders")}
            isActive={isActive}
          />

          <DrawerMenuItem
            icon={DollarSign}
            label="Wallet & Billing"
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
            badgeCount={totalUnread}
          />
          <DrawerMenuItem
            icon={Bell}
            label="Notifications"
            sharedPrefix="/(shared)/notifications"
            onPress={() => router.push("/(shared)/notifications")}
            isActive={isActive}
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
            onPress={() => router.push("/(seller)/settings")}
            isActive={isActive}
          />
          <DrawerMenuItem
            icon={User}
            label="Profile"
            drawerName="profile"
            onPress={() => router.push("/(seller)/profile")}
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
 * Seller Drawer Navigation
 * Contains Dashboard, Orders, Menu, Analytics, Settings, and Profile.
 */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function SellerDrawerLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(user && accessToken);
  const isBiometricEnabled = useSecurityStore(
    (state) => state.isBiometricEnabled,
  );
  const { isTablet, isLandscape } = useResponsive();

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
        screenOptions={({ navigation, route }) => {
          const isKioskScreen = route.name === "dashboard/kiosk";
          const shouldHideMenu = isKioskScreen && isBiometricEnabled;

          return {
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.background.val,
            },
            headerLeft: shouldHideMenu
              ? () => null
              : () => (
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
              fontSize: "$10",
            },
            drawerStyle: {
              backgroundColor: theme.background.val,
              width: isTablet ? 300 : 280,
            },
            sceneStyle: { backgroundColor: theme.background.val },
            drawerType: usePermanentDrawer ? "permanent" : "front",
            overlayColor: usePermanentDrawer
              ? "transparent"
              : "rgba(0,0,0,0.5)",
            swipeEnabled: !shouldHideMenu,
          };
        }}
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

        {/* Kiosk Mode */}
        <Drawer.Screen
          name="dashboard/kiosk"
          options={{
            title: "Kiosk Mode",
            drawerIcon: ({ color, size }) => (
              <Monitor color={color} size={size} />
            ),
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />

        {/* Orders */}
        <Drawer.Screen
          name="orders/index"
          options={{
            title: "Orders",
            drawerIcon: ({ color, size }) => (
              <ShoppingBag color={color} size={size} />
            ),
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

        {/* Menu */}
        <Drawer.Screen
          name="menu/index"
          options={{
            title: "Menu",
            drawerIcon: ({ color, size }) => (
              <UtensilsCrossed color={color} size={size} />
            ),
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />

        {/* Analytics */}
        <Drawer.Screen
          name="analytics/index"
          options={{
            title: "Analytics",
            drawerIcon: ({ color, size }) => (
              <BarChart3 color={color} size={size} />
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

        {/* Members — custom screen header, drawer menu rendered via CustomDrawerContent */}
        <Drawer.Screen
          name="members/index"
          options={{
            headerShown: false,
          }}
        />

        {/* Riders */}
        <Drawer.Screen
          name="riders/index"
          options={{
            title: "Riders",
            drawerIcon: ({ color, size }) => <Bike color={color} size={size} />,
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />
      </Drawer>

      <AppAlertDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="Login Required"
        description="Please log in to your seller account to access this section."
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
