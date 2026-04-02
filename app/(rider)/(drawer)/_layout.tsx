// @ts-nocheck
import { useState } from "react";
import { Drawer } from "expo-router/drawer";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, YStack, XStack, Text, Avatar, Separator, Button } from "tamagui";
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
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { useResponsive } from "@/utils/responsive";

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

  const handleLogout = () => {
    clearAuth();
    setShowLogoutDialog(false);
    router.replace("/(auth)/login");
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* User Profile Section */}
      <YStack padding="$4" paddingTop={insets.top + 24} backgroundColor="$primary">
        <XStack gap="$3" alignItems="center">
          <Avatar circular size="$5">
            <Avatar.Image
              src={user?.avatarUrl}
            />
            <Avatar.Fallback backgroundColor="$gray8">
              <Text color="white" fontWeight="bold">
                {user?.fullName?.charAt(0) || "R"}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack flex={1}>
            <Text color="white" fontWeight="bold" fontSize="$5">
              {user?.fullName || "Rider"}
            </Text>
            <Text color="white" opacity={0.8} fontSize="$3">
              {user?.email || "rider@example.com"}
            </Text>
            <XStack gap="$2" alignItems="center" marginTop="$1">
              <YStack
                width={8}
                height={8}
                borderRadius="$10"
                backgroundColor={user?.isOnline ? "$green10" : "$gray8"}
              />
              <Text color="white" opacity={0.8} fontSize="$2">
                {user?.isOnline ? "Online" : "Offline"}
              </Text>
            </XStack>
          </YStack>
        </XStack>
      </YStack>

      {/* Menu Items */}
      <DrawerContentScrollView {...props} style={{ flex: 1 }}>
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
            <Text flex={1} fontSize="$4">Home</Text>
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
            <Text flex={1} fontSize="$4">Deliveries</Text>
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
            <Text flex={1} fontSize="$4">Earnings</Text>
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
            <Text flex={1} fontSize="$4">Messages</Text>
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
            <Text flex={1} fontSize="$4">Notifications</Text>
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
            <Text flex={1} fontSize="$4">Settings</Text>
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
            <Text flex={1} fontSize="$4">Profile</Text>
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
            <Text flex={1} fontSize="$4" color="$red10">Logout</Text>
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
            fontFamily: "Sen_600SemiBold",
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

        {/* Home */}
        <Drawer.Screen
          name="home/index"
          options={{
            title: "Home",
            headerShown: false,
            drawerIcon: ({ color, size }) => (
              <Home color={color} size={size} />
            ),
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
          name="profile/index"
          options={{
            title: "Profile",
            drawerIcon: ({ color, size }) => (
              <User color={color} size={size} />
            ),
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