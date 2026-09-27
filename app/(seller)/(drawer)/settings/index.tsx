// @ts-nocheck
import {
  YStack,
  Text,
  Card,
  XStack,
  Separator,
  Switch,
  ScrollView,
  Spinner,
  useMedia,
} from "tamagui";
import {
  Building,
  Clock,
  MapPin,
  CreditCard,
  Palette,
  ChevronRight,
  MailOpen,
  Printer,
  Percent,
  Monitor,
  ChefHat,
  Server,
  Crown,
} from "@tamagui/lucide-icons";
import { TouchableOpacity } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { useBusinessStore } from "@/stores/business.store";
import { useDisplayStore } from "@/stores/display.store";
import { useCustomerDisplayCapabilities } from "@/customer-display/CustomerDisplayController";
import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "@/hooks/useNotificationPreferences";
import * as businessService from "@/services/business.service";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@teincfood/core";
import { useHasCapability, useMyBusinessCapabilities } from "@/hooks/useMyBusinessCapabilities";

/**
 * Seller Settings Screen
 */
export default function SellerSettings() {
  const router = useRouter();
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const activeBusiness = useBusinessStore((state) => state.activeBusiness);
  const canManageProfile = useHasCapability("business_profile_manage");
  const canManageBilling = useHasCapability("finance_billing_manage");
  const canManageTax = useHasCapability("tax_rules_manage");
  const { data: membership } = useMyBusinessCapabilities();
  const myCaps = new Set(membership?.capabilities ?? []);
  const [isOpen, setIsOpen] = useState(activeBusiness?.manuallyClosed !== true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  const { data: prefsRes } = useNotificationPreferencesQuery();
  const updatePrefs = useUpdateNotificationPreferencesMutation();
  const notificationsEnabled = prefsRes?.data?.order_notifications ?? true;

  const calloutEnabled = useDisplayStore((s) => s.calloutDisplayEnabled);
  const kitchenEnabled = useDisplayStore((s) => s.kitchenDisplayEnabled);
  const customerDisplayEnabled = useDisplayStore((s) => s.customerDisplayEnabled);
  const customerDisplayCaps = useCustomerDisplayCapabilities();

  const handleToggleCallout = (enabled: boolean) => {
    if (enabled) {
      useDisplayStore.getState().enableCalloutDisplay();
    } else {
      useDisplayStore.getState().disableCalloutDisplay();
    }
  };

  const handleToggleKitchen = (enabled: boolean) => {
    if (enabled) {
      useDisplayStore.getState().enableKitchenDisplay();
    } else {
      useDisplayStore.getState().disableKitchenDisplay();
    }
  };

  const handleToggleCustomerDisplay = (enabled: boolean) => {
    if (enabled && !customerDisplayCaps?.supported) return;
    if (enabled) {
      useDisplayStore.getState().enableCustomerDisplay();
    } else {
      useDisplayStore.getState().disableCustomerDisplay();
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    updatePrefs.mutate({ order_notifications: enabled });
  };

  const handleToggleStore = async (open: boolean) => {
    if (!activeBusiness?.id) return;
    const previous = isOpen;
    setIsOpen(open);
    try {
      await businessService.toggleBusinessOpen(activeBusiness.id);
    } catch (e) {
      setIsOpen(previous);
      toast.error(extractApiErrorMessage(e));
    }
  };

  const handleCloseStore = async () => {
    if (!activeBusiness?.id) return;
    const previous = isOpen;
    setIsOpen(false);
    setShowCloseDialog(false);
    try {
      await businessService.toggleBusinessOpen(activeBusiness.id);
    } catch (e) {
      setIsOpen(previous);
      toast.error(extractApiErrorMessage(e));
    }
  };

  const handleBusinessProfile = () => {
    if (activeBusiness?.id) {
      router.push(`/(shared)/businesses/${activeBusiness.id}`);
    } else {
      router.push("/(shared)/businesses");
    }
  };

  const settingsItems = [
    {
      icon: Building,
      label: "My Businesses",
      description: activeBusiness
        ? "View all businesses you own or manage"
        : "Manage your businesses",
      route: "/(seller)/businesses",
    },
    {
      icon: Building,
      label: "Business Profile",
      description: activeBusiness
        ? `${activeBusiness.name} — update details, logo, description`
        : "Update your business details",
      onPress: handleBusinessProfile,
    },
    {
      icon: Clock,
      label: "Operating Hours",
      description: "Set your business hours",
      route: "/(shared)/settings/operating-hours",
      capability: "business_profile_manage",
    },
    {
      icon: MailOpen,
      label: "Invitations",
      description: "Pending member invitations",
      route: "/(shared)/invitations",
    },
    {
      icon: MapPin,
      label: "Delivery Settings",
      description: "Delivery radius, fees, minimum order",
      route: "/(seller)/settings/delivery-settings",
      capability: "business_profile_manage",
    },
    {
      icon: Printer,
      label: "Printer Settings",
      description: "Configure POS thermal printer",
      route: "/(seller)/settings/printer",
    },
    ...(activeBusiness && canManageTax
      ? [
          {
            icon: Percent,
            label: "Tax Settings",
            description: "Configure tax rules for orders",
            route: "/(seller)/settings/tax-settings",
          },
        ]
      : []),
    ...(canManageProfile
      ? [
          {
            icon: CreditCard,
            label: "Payment Settings",
            description: "Bank account, payout schedule",
            route: "/(seller)/settings/payment-settings",
          },
        ]
      : []),
    ...(canManageBilling
      ? [
          {
            icon: Crown,
            label: "Subscription & Plan",
            description: "Plan, billing status, promos",
            route: "/(shared)/wallet/plans",
          },
        ]
      : []),
    {
      icon: Server,
      label: "Local Node",
      description: "Multi-terminal LAN & offline mode",
      route: "/(seller)/settings/local-node",
    },
    {
      icon: Monitor,
      label: "Diagnostics",
      description: "Sync queue, DD, cloud reachability, wipe",
      route: "/(seller)/settings/diagnostics",
    },
    {
      icon: Palette,
      label: "Theme",
      description: "Light, dark, or system",
      route: "/(shared)/profile/theme",
    },
  ];

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      {...(media.md || media.lg
        ? { maxWidth: 600, alignSelf: "center", width: "100%" }
        : {})}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack
          paddingHorizontal="$4"
          paddingTop="$4"
          paddingBottom={insets.bottom + 24}
          gap="$4"
        >
          {/* Store Status */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center" gap="$3">
              <YStack flex={1}>
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  fontFamily="$body"
                  color="$color.white"
                >
                  Store Status
                </Text>
                <Text color="$colorSecondary" fontSize="$3" fontFamily="$body">
                  {isOpen
                    ? "Your store is open and accepting orders"
                    : "Your store is closed"}
                </Text>
              </YStack>
              <Switch
                size="$5"
                checked={isOpen}
                disabled={!canManageProfile}
                onCheckedChange={handleToggleStore}
                backgroundColor={isOpen ? "$color.green" : "$color.gray600"}
              >
                <Switch.Thumb animation="quick" backgroundColor="$white" />
              </Switch>
            </XStack>
          </Card>

          {/* Notifications */}
          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center" gap="$3">
              <YStack flex={1}>
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  fontFamily="$body"
                  color="$color.white"
                >
                  Order Notifications
                </Text>
                <Text color="$colorSecondary" fontSize="$3" fontFamily="$body">
                  Receive alerts for new orders and updates
                </Text>
              </YStack>
              <Switch
                size="$5"
                checked={notificationsEnabled}
                disabled={updatePrefs.isPending}
                onCheckedChange={handleToggleNotifications}
                backgroundColor={
                  notificationsEnabled ? "$color.orange" : "$color.gray600"
                }
              >
                <Switch.Thumb animation="quick" backgroundColor="$white" />
              </Switch>
              {updatePrefs.isPending && <Spinner size="small" />}
            </XStack>
          </Card>

          {/* Settings Menu */}
          <Card padding="$2" bordered>
            {settingsItems
              .filter(
                (item) =>
                  !(item as { capability?: string }).capability ||
                  myCaps.has((item as { capability?: string }).capability!),
              )
              .map((item, index) => (
              <YStack key={item.label}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    item.onPress ? item.onPress() : router.push(item.route)
                  }
                  style={{ paddingHorizontal: 12, paddingVertical: 14 }}
                >
                  <XStack alignItems="center" gap="$3">
                    <YStack
                      width={40}
                      height={40}
                      borderRadius={10}
                      backgroundColor="$backgroundSoft"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <item.icon size={20} color="$colorSecondary" />
                    </YStack>
                    <YStack flex={1}>
                      <Text
                        fontSize="$4"
                        fontWeight="700"
                        fontFamily="$body"
                        color="$color"
                      >
                        {item.label}
                      </Text>
                      <Text
                        fontSize="$2"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
                        {item.description}
                      </Text>
                    </YStack>
                    <ChevronRight size={16} color="$colorSecondary" />
                  </XStack>
                </TouchableOpacity>
                {index < settingsItems.length - 1 && (
                  <Separator marginHorizontal="$3" />
                )}
              </YStack>
            ))}
          </Card>

          {/* Display Settings */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text
                fontSize="$3"
                fontWeight="700"
                fontFamily="$body"
                color="$colorSecondary"
                textTransform="uppercase"
                letterSpacing={0.5}
              >
                Display Settings
              </Text>

              <XStack
                justifyContent="space-between"
                alignItems="center"
                gap="$3"
              >
                <YStack flex={1}>
                  <XStack gap="$2" alignItems="center">
                    <Monitor size={18} color="$colorSecondary" />
                    <Text
                      fontSize="$4"
                      fontWeight="700"
                      fontFamily="$body"
                      color="$color"
                    >
                      Callout Display
                    </Text>
                  </XStack>
                  <Text
                    color="$colorSecondary"
                    fontSize="$3"
                    fontFamily="$body"
                    marginLeft={26}
                  >
                    Customer order status screen for wall-mounted display
                  </Text>
                </YStack>
                <Switch
                  size="$5"
                  checked={calloutEnabled}
                  onCheckedChange={handleToggleCallout}
                  backgroundColor={calloutEnabled ? "$orange9" : "$gray600"}
                >
                  <Switch.Thumb animation="quick" backgroundColor="$white" />
                </Switch>
              </XStack>

              <Separator />

              <XStack
                justifyContent="space-between"
                alignItems="center"
                gap="$3"
              >
                <YStack flex={1}>
                  <XStack gap="$2" alignItems="center">
                    <ChefHat size={18} color="$colorSecondary" />
                    <Text
                      fontSize="$4"
                      fontWeight="700"
                      fontFamily="$body"
                      color="$color"
                    >
                      Kitchen Display
                    </Text>
                  </XStack>
                  <Text
                    color="$colorSecondary"
                    fontSize="$3"
                    fontFamily="$body"
                    marginLeft={26}
                  >
                    Order preparation pipeline for kitchen staff
                  </Text>
                </YStack>
                <Switch
                  size="$5"
                  checked={kitchenEnabled}
                  onCheckedChange={handleToggleKitchen}
                  backgroundColor={kitchenEnabled ? "$blue9" : "$gray600"}
                >
                  <Switch.Thumb animation="quick" backgroundColor="$white" />
                </Switch>
              </XStack>

              <Separator />

              {/* Customer Display — dual-screen POS (Android secondary display) */}
              <XStack
                justifyContent="space-between"
                alignItems="center"
                gap="$3"
              >
                <YStack flex={1}>
                  <XStack gap="$2" alignItems="center">
                    <Monitor size={18} color="$colorSecondary" />
                    <Text
                      fontSize="$4"
                      fontWeight="700"
                      fontFamily="$body"
                      color="$color"
                    >
                      Customer Display
                    </Text>
                  </XStack>
                  <Text
                    color="$colorSecondary"
                    fontSize="$3"
                    fontFamily="$body"
                    marginLeft={26}
                  >
                    {customerDisplayCaps?.supported
                      ? "Show the order and totals to the customer on a second display"
                      : customerDisplayCaps?.reason ??
                        "Checking for a second display…"}
                  </Text>
                </YStack>
                <Switch
                  size="$5"
                  disabled={!customerDisplayCaps?.supported}
                  checked={
                    customerDisplayEnabled &&
                    (customerDisplayCaps?.supported ?? false)
                  }
                  onCheckedChange={handleToggleCustomerDisplay}
                  backgroundColor={
                    customerDisplayEnabled && customerDisplayCaps?.supported
                      ? "$green9"
                      : "$gray600"
                  }
                  opacity={customerDisplayCaps?.supported ? 1 : 0.5}
                >
                  <Switch.Thumb animation="quick" backgroundColor="$white" />
                </Switch>
              </XStack>
            </YStack>
          </Card>

          {/* Danger Zone */}
          <Card padding="$4" bordered borderColor="$error">
            <YStack gap="$3">
              <Text
                fontSize="$3"
                fontWeight="700"
                fontFamily="$body"
                color="$red600"
                textTransform="uppercase"
                letterSpacing={0.5}
              >
                Danger Zone
              </Text>
              <Button
                variant="danger"
                width="100%"
                onPress={() => setShowCloseDialog(true)}
              >
                Close Store Temporarily
              </Button>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>

      <AppAlertDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        title="Close Store"
        description="This will temporarily close your store and stop accepting new orders. You can reopen at any time."
        confirmText="CLOSE STORE"
        isDestructive
        onConfirm={handleCloseStore}
      />
    </YStack>
  );
}
