// @ts-nocheck

import { useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";
import {
  Home,
  Truck,
  DollarSign,
  User,
  LogIn,
  MapPin,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { AppAlertDialog } from "@/components/ui/AlertDialog";

/**
 * Rider Tab Navigation
 * Contains Home, Deliveries, Earnings, and Profile tabs.
 */
export const unstable_settings = {
  initialRouteName: "index",
};

export default function RiderTabsLayout() {
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

        {/* Home Tab */}
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home color={color as any} size={24} />,
          }}
          listeners={{ tabPress: handleProtectedRoute }}
        />

        {/* Deliveries Tab */}
        <Tabs.Screen
          name="deliveries"
          options={{
            title: "Deliveries",
            tabBarIcon: ({ color }) => (
              <Truck color={color as any} size={24} />
            ),
          }}
          listeners={{ tabPress: handleProtectedRoute }}
        />

        {/* Earnings Tab */}
        <Tabs.Screen
          name="earnings"
          options={{
            title: "Earnings",
            tabBarIcon: ({ color }) => (
              <DollarSign color={color as any} size={24} />
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