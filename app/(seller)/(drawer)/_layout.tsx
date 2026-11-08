// @ts-nocheck
import { useState, useMemo } from "react";
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
  ChefHat,
  LogOut,
  Menu,
  MessageSquare,
  Users,
  Bike,
  MailOpen,
  Truck,
  DollarSign,
  CreditCard,
  Tags,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useSecurityStore } from "@/stores/security.store";
import { authService } from "@/services/auth.service";
import { AppAlertDialog, Button, DrawerMenuItem } from "@/components/ui";
import { DrawerHeader } from "@/components/ui/DrawerHeader";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useResponsive } from "@/utils/responsive";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useFilteredNavItems } from "@/hooks/useBusinessNavItems";

const iconMap = {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  User,
  Settings,
  Bell,
  Monitor,
  ChefHat,
  MessageSquare,
  Users,
  Bike,
  MailOpen,
  Truck,
  DollarSign,
  CreditCard,
  Tags,
};

function mapIcon(name: string) {
  return iconMap[name] || LayoutDashboard;
}

function CustomDrawerContent(props: any) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const navItems = useFilteredNavItems();

  const activeRouteName = props.state?.routes?.[props.state?.index]?.name;

  const { businessUnread, personalUnread, notificationUnread } = useUnreadCounts();

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

  const badgeMap = {
    messages: businessUnread,
    notifications: notificationUnread,
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <DrawerHeader
        fallbackName="Seller"
        fallbackEmail=""
        onNavigateCreateBusiness={() => router.push("/(shared)/businesses/add")}
      />

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          backgroundColor: theme.background.val,
          paddingTop: 0,
        }}
        style={{ flex: 1, backgroundColor: theme.background.val }}
      >
        <YStack padding="$2" gap="$1">
          {navItems.map((item) => {
            if (item.separator) {
              return <Separator key={item.key} marginVertical="$2" />;
            }

            const Icon = mapIcon(item.icon);
            const badgeCount = badgeMap[item.key];

            return (
              <DrawerMenuItem
                key={item.key}
                icon={Icon}
                label={item.label}
                drawerName={item.drawerName}
                sharedPrefix={item.sharedPrefix}
                onPress={() => router.push(item.route)}
                isActive={isActive}
                badgeCount={badgeCount}
              />
            );
          })}

          <Separator marginVertical="$2" />

          <DrawerMenuItem
            icon={LogOut}
            label="Logout"
            onPress={() => setShowLogoutDialog(true)}
            danger
          />
        </YStack>
      </DrawerContentScrollView>

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
              fontFamily: "Manrope_600SemiBold",
              fontSize: 34,
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
            headerRight: () => (
              <Button
                circular
                size="$4"
                variant="ghost"
                marginEnd="$2"
                icon={<Bell size={22} />}
                onPress={() => router.push("/(shared)/notifications")}
              />
            ),
            drawerIcon: ({ color, size }) => (
              <LayoutDashboard color={color} size={size} />
            ),
          }}
          listeners={{ drawerItemPress: handleProtectedRoute }}
        />

        {/* Kiosk Mode — legacy (route kept for references) */}
        <Drawer.Screen
          name="dashboard/kiosk"
          options={{
            title: "Kiosk Mode",
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

        {/* Categories — custom screen header, drawer menu rendered via CustomDrawerContent */}
        <Drawer.Screen
          name="menu/categories/index"
          options={{
            headerShown: false,
            title: "Categories",
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
