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
  Select,
  Adapt,
  Sheet,
} from "tamagui";
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
  Building,
  ChevronDown,
  Check,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { useSecurityStore } from "@/stores/security.store";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { useResponsive } from "@/utils/responsive";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Custom Drawer Content
 */
function CustomDrawerContent(props: any) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const { businesses, activeBusiness, switchBusiness } = useActiveBusiness();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { isTablet } = useResponsive();

  const avatarSize = isTablet ? "$12" : "$10";
  const avatarTextSize = isTablet ? "$10" : "$8";
  const nameTextSize = isTablet ? "$6" : "$5";
  const emailTextSize = isTablet ? "$4" : "$3";

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
          <Avatar circular size={avatarSize}>
            <Avatar.Image src={user?.avatarUrl} />
            <Avatar.Fallback
              items="center"
              justify="center"
              backgroundColor="$color.gray50"
            >
              <Text color="$color" fontWeight="bold" fontSize={avatarTextSize}>
                {user?.fullName?.charAt(0) || "S"}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack flex={1}>
            <Text color="white" fontWeight="bold" fontSize={nameTextSize}>
              {user?.fullName || "Seller"}
            </Text>
            <Text color="white" opacity={0.8} fontSize={emailTextSize}>
              {user?.email || "seller@example.com"}
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
            onValueChange={switchBusiness}
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

            <Adapt when="maxSm" platform="touch">
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

            <Select.Content>
              <Select.ScrollUpButton
                items="center"
                justify="center"
                position="relative"
                width="100%"
                height="$3"
              >
                <ChevronDown size={20} />
              </Select.ScrollUpButton>

              <Select.Viewport
                minW={200}
                bg="$background"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <Select.Group>
                  <Select.Label fontWeight="700">Switch Business</Select.Label>
                  {businesses.map((b, i) => (
                    <Select.Item key={b.id} index={i} value={b.id}>
                      <Select.ItemText>{b.name}</Select.ItemText>
                      {activeBusiness?.id === b.id && (
                        <YStack marginLeft="$2">
                          <Check size={16} color="$primary" />
                        </YStack>
                      )}
                    </Select.Item>
                  ))}
                </Select.Group>
              </Select.Viewport>

              <Select.ScrollDownButton
                items="center"
                justify="center"
                position="relative"
                width="100%"
                height="$3"
              >
                <ChevronDown size={20} />
              </Select.ScrollDownButton>
            </Select.Content>
          </Select>
        ) : (
          <Button
            variant="outline"
            width="100%"
            icon={<Building size={16} />}
            onPress={() => router.push("/(seller)/businesses/add")}
          >
            Create a Business
          </Button>
        )}
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
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(seller)/dashboard")}
            icon={<LayoutDashboard size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Dashboard
            </Text>
          </Button>

          {/* Kiosk Mode */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(seller)/dashboard/kiosk")}
            icon={<Monitor size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Kiosk Mode
            </Text>
          </Button>

          <Separator marginVertical="$2" />

          {/* Orders */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(seller)/orders")}
            icon={<ShoppingBag size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Orders
            </Text>
          </Button>

          {/* Menu */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(seller)/menu")}
            icon={<UtensilsCrossed size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Menu
            </Text>
          </Button>

          {/* Analytics */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(seller)/analytics")}
            icon={<BarChart3 size={20} color={theme.color.val} />}
          >
            <Text flex={1} fontSize="$4">
              Analytics
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

          {/* Settings */}
          <Button
            unstyled
            flexDirection="row"
            alignItems="center"
            gap="$3"
            padding="$3"
            paddingLeft="$4"
            pressStyle={{ backgroundColor: "$gray3" }}
            onPress={() => router.push("/(seller)/settings")}
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
            onPress={() => router.push("/(seller)/profile")}
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
