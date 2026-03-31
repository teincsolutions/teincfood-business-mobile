import { useState } from "react";
import { Tabs, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "tamagui";
import { Home, ShoppingBag, Bell, User, LogIn } from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { AppAlertDialog } from "@/components/ui/AlertDialog";

/**
 * Main Buyer Tab Navigation
 * Contains Home, Orders, Notifications, and Profile tabs.
 * Cart is hidden from the tab bar but accessible via routing.
 */

// This tells Expo Router which tab to show first
export const unstable_settings = {
  initialRouteName: "index",
};

export default function BuyerTabsLayout() {
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
        <Tabs.Screen
          name="(home)"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Home color={color as any} size={24} />,
          }}
        />

        <Tabs.Screen
          name="(orders)"
          options={{
            title: "Orders",
            tabBarIcon: ({ color }) => (
              <ShoppingBag color={color as any} size={24} />
            ),
          }}
          listeners={{ tabPress: handleProtectedRoute }}
        />
        <Tabs.Screen
          name="(notifications)"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color }) => <Bell color={color as any} size={24} />,
          }}
          listeners={{ tabPress: handleProtectedRoute }}
        />
        <Tabs.Screen
          name="(profile)"
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
        description="Please log in to your account to view this section."
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
