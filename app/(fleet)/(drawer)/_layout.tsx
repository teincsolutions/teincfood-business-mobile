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
} from "tamagui";
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
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { AppAlertDialog, Button } from "@/components/ui";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useResponsive } from "@/utils/responsive";

/**
 * Custom Drawer Content for Fleet Manager
 */
function CustomDrawerContent(props: any) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

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
        paddingTop={Math.max(insets.top + 8, 24)}
        backgroundColor="$primary"
      >
        <XStack gap="$3" alignItems="center">
          <Avatar circular size="$5">
            <Avatar.Image src={user?.avatarUrl} />
            <Avatar.Fallback backgroundColor="$gray8">
              <Text color="white" fontWeight="bold">
                {user?.fullName?.charAt(0) || "F"}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack flex={1}>
          <Text color="white" fontWeight="bold" fontSize="$5" fontFamily="$heading">
            {user?.fullName || "Fleet Manager"}
          </Text>
          <Text color="white" opacity={0.8} fontSize="$3" fontFamily="$body">
            {user?.email || "fleet@example.com"}
          </Text>
          </YStack>
        </XStack>
      </YStack>

      {/* Menu Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ backgroundColor: theme.background.val }}
        style={{ flex: 1, backgroundColor: theme.background.val }}
      >
        <YStack padding="$2" gap="$1">
          {/* Dashboard */}
          <Button
            variant="ghost"
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            onPress={() => router.push("/(fleet)/dashboard")}
            icon={<LayoutDashboard size={20} color={theme.color.val} />}
            justifyContent="flex-start"
          >
            <Text flex={1} fontSize="$4" fontFamily="$body">
              Dashboard
            </Text>
          </Button>

          <Separator marginVertical="$2" />

          {/* Riders */}
          <Button
            variant="ghost"
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            onPress={() => router.push("/(fleet)/riders")}
            icon={<Users size={20} color={theme.color.val} />}
            justifyContent="flex-start"
          >
            <Text flex={1} fontSize="$4" fontFamily="$body">
              Riders
            </Text>
          </Button>

          {/* Vehicles */}
          <Button
            variant="ghost"
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            onPress={() => router.push("/(fleet)/vehicles")}
            icon={<Car size={20} color={theme.color.val} />}
            justifyContent="flex-start"
          >
            <Text flex={1} fontSize="$4" fontFamily="$body">
              Vehicles
            </Text>
          </Button>

          {/* Earnings */}
          <Button
            variant="ghost"
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            onPress={() => router.push("/(fleet)/earnings")}
            icon={<DollarSign size={20} color={theme.color.val} />}
            justifyContent="flex-start"
          >
            <Text flex={1} fontSize="$4" fontFamily="$body">
              Earnings
            </Text>
          </Button>

          <Separator marginVertical="$2" />

          {/* Notifications */}
          <Button
            variant="ghost"
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            onPress={() => router.push("/(shared)/notifications")}
            icon={<Bell size={20} color={theme.color.val} />}
            justifyContent="flex-start"
          >
            <Text flex={1} fontSize="$4" fontFamily="$body">
              Notifications
            </Text>
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            onPress={() => router.push("/(fleet)/settings")}
            icon={<Settings size={20} color={theme.color.val} />}
            justifyContent="flex-start"
          >
            <Text flex={1} fontSize="$4" fontFamily="$body">
              Settings
            </Text>
          </Button>

          {/* Profile */}
          <Button
            variant="ghost"
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            onPress={() => router.push("/(shared)/profile")}
            icon={<User size={20} color={theme.color.val} />}
            justifyContent="flex-start"
          >
            <Text flex={1} fontSize="$4" fontFamily="$body">
              Profile
            </Text>
          </Button>

          <Separator marginVertical="$2" />

          {/* Logout */}
          <Button
            variant="ghost"
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            onPress={() => setShowLogoutDialog(true)}
            icon={<LogOut size={20} color="$red10" />}
            justifyContent="flex-start"
          >
            <Text flex={1} fontSize="$4" color="$red10" fontFamily="$body">
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
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.background.val,
          },
          headerTintColor: theme.color.val,
          headerTitleStyle: {
            fontFamily: "$heading",
            fontSize: "$10",
          },
          drawerStyle: {
            backgroundColor: theme.background.val,
            width: isTablet ? 300 : 280,
          },
          sceneStyle: { backgroundColor: theme.background.val },
          drawerType: usePermanentDrawer ? "permanent" : "front",
          overlayColor: usePermanentDrawer ? "transparent" : "rgba(0,0,0,0.5)",
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
            drawerIcon: ({ color, size }) => (
              <Car color={color} size={size} />
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