// @ts-nocheck
import { useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  BarChart3,
  User,
  LogIn,
  Settings,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { AppAlertDialog } from "@/components/ui/AlertDialog";

/**
 * Seller Tab Navigation
 * Contains Dashboard, Orders, Menu, Analytics, and Profile tabs.
 */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function SellerTabsLayout() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(user && accessToken);

  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleProtectedRoute = (e: any) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowAuthDialog(true);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.primary.val,
          tabBarInactiveTintColor: theme.colorMuted.val,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: theme.borderColor.val as string,
            backgroundColor: theme.background.val as string,
            height: 65 + (insets.bottom > 0 ? insets.bottom - 10 : 0),
            paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontFamily: "Sen_600SemiBold",
            fontSize: 12,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />

        {/* Dashboard Tab */}
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <LayoutDashboard color={color as any} size={24} />
            ),
          }}
          listeners={{ tabPress: handleProtectedRoute }}
        />

        {/* Orders Tab */}
        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
            tabBarIcon: ({ color }) => (
              <ShoppingBag color={color as any} size={24} />
            ),
          }}
          listeners={{ tabPress: handleProtectedRoute }}
        />

        {/* Menu Tab */}
        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            tabBarIcon: ({ color }) => (
              <UtensilsCrossed color={color as any} size={24} />
            ),
          }}
          listeners={{ tabPress: handleProtectedRoute }}
        />

        {/* Analytics Tab */}
        <Tabs.Screen
          name="analytics"
          options={{
            title: "Analytics",
            tabBarIcon: ({ color }) => (
              <BarChart3 color={color as any} size={24} />
            ),
          }}
          listeners={{ tabPress: handleProtectedRoute }}
        />

        {/* Profile Tab */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <User color={color as any} size={24} />,
          }}
          listeners={{ tabPress: handleProtectedRoute }}
        />
      </Tabs>

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