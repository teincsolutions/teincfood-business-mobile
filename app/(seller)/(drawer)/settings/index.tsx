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
  Bell,
  AlertTriangle,
  ListOrdered,
} from "@tamagui/lucide-icons";
import { TouchableOpacity } from "react-native";
import { useState, useEffect } from "react";
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
import {
  useHasCapability,
  useMyBusinessCapabilities,
} from "@/hooks/useMyBusinessCapabilities";
import { useEntitlements, useHasFeature } from "@/hooks/useEntitlements";
import { useResponsive } from "@/utils/responsive";

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
  const canAcceptOnlineOrders = useHasFeature("seller.online_orders");
  const { isLoading: entitlementsLoading } = useEntitlements();
  const { data: membership } = useMyBusinessCapabilities();
  const myCaps = new Set(membership?.capabilities ?? []);
  // The switch is the owner's stored preference, not the current schedule.
  // `is_open` remains the effective buyer availability (preference AND hours).
  const manuallyClosed = activeBusiness?.manually_closed === true;
  const onlineOrderingEnabled =
    activeBusiness?.online_ordering_enabled ?? !manuallyClosed;
  const outsideHours =
    activeBusiness?.is_open === false && onlineOrderingEnabled;
  const approvedAndActive =
    activeBusiness?.status === "active" &&
    activeBusiness?.kyc_status === "approved";
  const planBlocksOnlineOrders = !entitlementsLoading && !canAcceptOnlineOrders;
  const canToggleOnlineOrdering =
    canManageProfile && approvedAndActive && !planBlocksOnlineOrders;

  const [isOpen, setIsOpen] = useState(onlineOrderingEnabled);
  const [isTogglingStore, setIsTogglingStore] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [activeSection, setActiveSection] = useState("store");

  useEffect(() => {
    if (!isTogglingStore) setIsOpen(onlineOrderingEnabled);
  }, [onlineOrderingEnabled, isTogglingStore]);

  const applyStoreStatus = (updated?: {
    is_open?: boolean;
    manually_closed?: boolean;
    online_ordering_enabled?: boolean;
  }) => {
    const current = useBusinessStore.getState().activeBusiness;
    if (!current || !updated) return;
    useBusinessStore.getState().setActiveBusiness({
      ...current,
      ...(updated.is_open !== undefined ? { is_open: updated.is_open } : {}),
      ...(updated.manually_closed !== undefined
        ? { manually_closed: updated.manually_closed }
        : {}),
      ...(updated.online_ordering_enabled !== undefined
        ? { online_ordering_enabled: updated.online_ordering_enabled }
        : {}),
    });
  };

  // Two-pane master-detail on tablet landscape (iPad/Android tablet) — the
  // settings list becomes a left rail and the selected section fills the pane.
  const { isTablet, isLandscape, width } = useResponsive();
  const isMasterDetail = isTablet && isLandscape && width >= 900;

  const { data: prefsRes } = useNotificationPreferencesQuery();
  const updatePrefs = useUpdateNotificationPreferencesMutation();
  const notificationsEnabled = prefsRes?.data?.order_notifications ?? true;

  const calloutEnabled = useDisplayStore((s) => s.calloutDisplayEnabled);
  const kitchenEnabled = useDisplayStore((s) => s.kitchenDisplayEnabled);
  const customerDisplayEnabled = useDisplayStore(
    (s) => s.customerDisplayEnabled,
  );
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

  const setOnlineOrdering = async (open: boolean) => {
    if (!activeBusiness?.id) return;
    // Pausing is always safe; resuming additionally requires the plan and
    // approval gates because it makes the shop available to buyers.
    if (open && !canToggleOnlineOrdering) return;
    if (!open && !canManageProfile) return;
    if (isOpen === open) {
      setShowCloseDialog(false);
      return;
    }

    const previous = isOpen;
    setIsOpen(open);
    setShowCloseDialog(false);
    setIsTogglingStore(true);
    try {
      const result = await businessService.toggleBusinessOpen(
        activeBusiness.id,
      );
      // Persist the server's new state so every screen (and the next mount of
      // this one) sees it instead of the pre-toggle business snapshot.
      applyStoreStatus(result?.data);
    } catch (e) {
      setIsOpen(previous);
      toast.error(extractApiErrorMessage(e));
    } finally {
      setIsTogglingStore(false);
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
          {
            icon: ListOrdered,
            label: "Order Flow",
            description: "Terminal order steps",
            route: "/(seller)/settings/order-flow",
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
      icon: AlertTriangle,
      label: "Offline Devices",
      description: "License status, connected terminals, remove devices",
      route: "/(seller)/settings/offline-device",
      capability: "business_members_manage",
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

  const visibleLinkItems = settingsItems.filter(
    (item) =>
      !(item as { capability?: string }).capability ||
      myCaps.has((item as { capability?: string }).capability!),
  );

  const openLinkItem = (item: (typeof settingsItems)[number]) => {
    if (item.onPress) item.onPress();
    else router.push(item.route);
  };

  const storeStatusCard = (
    <Card padding="$4" bordered>
      <XStack justifyContent="space-between" alignItems="center" gap="$3">
        <YStack flex={1}>
          <Text
            fontSize="$4"
            fontWeight="700"
            fontFamily="$body"
            color="$color.white"
          >
            Online Ordering
          </Text>
          <Text color="$colorSecondary" fontSize="$3" fontFamily="$body">
            {!approvedAndActive
              ? "Your business must be approved and active before it can accept online orders"
              : planBlocksOnlineOrders
                ? "Your current plan does not include online ordering"
                : outsideHours
                  ? "Online ordering is on — currently outside your operating hours"
                  : isOpen
                    ? "Online ordering is on — buyers can place orders"
                    : "Online ordering is paused — buyers cannot place orders"}
          </Text>
          <Text
            color="$colorSecondary"
            fontSize="$2"
            fontFamily="$body"
            marginTop="$1"
          >
            {!approvedAndActive
              ? "Complete approval and activation to enable online orders."
              : planBlocksOnlineOrders
                ? "Upgrade your plan to enable online ordering."
                : outsideHours
                  ? "Buyers can order again during your operating hours."
                  : "Pausing only stops new online orders. Walk-in POS orders still work during business hours."}
          </Text>
        </YStack>
        <Switch
          size="$5"
          checked={isOpen}
          disabled={!canToggleOnlineOrdering}
          onCheckedChange={(open) => void setOnlineOrdering(open)}
          backgroundColor={isOpen ? "$color.green" : "$color.gray600"}
        >
          <Switch.Thumb animation="quick" backgroundColor="$white" />
        </Switch>
      </XStack>
    </Card>
  );

  const notificationsCard = (
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
  );

  const linkListCard = (
    <Card padding="$2" bordered>
      {visibleLinkItems.map((item, index) => (
        <YStack key={item.label}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openLinkItem(item)}
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
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  {item.description}
                </Text>
              </YStack>
              <ChevronRight size={16} color="$colorSecondary" />
            </XStack>
          </TouchableOpacity>
          {index < visibleLinkItems.length - 1 && (
            <Separator marginHorizontal="$3" />
          )}
        </YStack>
      ))}
    </Card>
  );

  const displaySettingsCard = (
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

        <XStack justifyContent="space-between" alignItems="center" gap="$3">
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

        <XStack justifyContent="space-between" alignItems="center" gap="$3">
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
        <XStack justifyContent="space-between" alignItems="center" gap="$3">
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
                : (customerDisplayCaps?.reason ??
                  "Checking for a second display…")}
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
  );

  const dangerZoneCard = (
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
          variant={isOpen ? "danger" : "success"}
          width="100%"
          disabled={isOpen ? !canManageProfile : !canToggleOnlineOrdering}
          opacity={isOpen || canToggleOnlineOrdering ? 1 : 0.5}
          onPress={() => setShowCloseDialog(true)}
        >
          {isOpen
            ? "Pause Online Ordering"
            : canToggleOnlineOrdering
              ? "Resume Online Ordering"
              : "Online Ordering Unavailable"}
        </Button>
      </YStack>
    </Card>
  );

  // Ordered sections for the tablet master-detail rail. Inline sections render
  // in the detail pane; link sections navigate (and act as rows in the rail).
  const sections = [
    ...(canManageProfile
      ? [
          {
            key: "store",
            label: "Online Ordering",
            icon: Building,
            element: storeStatusCard,
          },
        ]
      : []),
    {
      key: "notifications",
      label: "Order Notifications",
      icon: Bell,
      element: notificationsCard,
    },
    {
      key: "display",
      label: "Display Settings",
      icon: Monitor,
      element: displaySettingsCard,
    },
    ...visibleLinkItems.map((item) => ({
      key: item.label,
      label: item.label,
      icon: item.icon,
      element: null,
      item,
    })),
    ...(canManageProfile
      ? [
          {
            key: "danger",
            label: "Danger Zone",
            icon: AlertTriangle,
            element: dangerZoneCard,
          },
        ]
      : []),
  ];

  if (isMasterDetail) {
    const active = sections.find((s) => s.key === activeSection) ?? sections[0];

    return (
      <YStack flex={1} backgroundColor="$background">
        <XStack flex={1}>
          <ScrollView
            width={320}
            borderRightWidth={1}
            borderRightColor="$borderColor"
            showsVerticalScrollIndicator={false}
          >
            <Text
              paddingHorizontal="$4"
              paddingTop="$4"
              paddingBottom="$2"
              fontSize="$3"
              fontWeight="700"
              fontFamily="$body"
              color="$colorSecondary"
              textTransform="uppercase"
              letterSpacing={0.5}
            >
              Settings
            </Text>
            <YStack padding="$2" gap="$1">
              {sections.map((section) => {
                const isActive = section.key === active.key;
                const isLink = Boolean((section as { item?: unknown }).item);
                return (
                  <TouchableOpacity
                    key={section.key}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (isLink) {
                        openLinkItem(
                          (section as { item: (typeof settingsItems)[number] })
                            .item,
                        );
                      } else {
                        setActiveSection(section.key);
                      }
                    }}
                  >
                    <XStack
                      alignItems="center"
                      gap="$3"
                      paddingHorizontal="$3"
                      paddingVertical="$3"
                      borderRadius={10}
                      backgroundColor={
                        isActive ? "$backgroundSoft" : "transparent"
                      }
                    >
                      <section.icon
                        size={20}
                        color={isActive ? "$color" : "$colorSecondary"}
                      />
                      <Text
                        flex={1}
                        fontSize="$4"
                        fontWeight={isActive ? "700" : "500"}
                        fontFamily="$body"
                        color="$color"
                      >
                        {section.label}
                      </Text>
                      {isLink ? (
                        <ChevronRight size={16} color="$colorSecondary" />
                      ) : null}
                    </XStack>
                  </TouchableOpacity>
                );
              })}
            </YStack>
          </ScrollView>

          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack
              padding="$4"
              gap="$4"
              paddingBottom={insets.bottom + 24}
              maxWidth={720}
              alignSelf="center"
              width="100%"
            >
              {active.element}
            </YStack>
          </ScrollView>
        </XStack>

        <AppAlertDialog
          open={showCloseDialog}
          onOpenChange={setShowCloseDialog}
          title={isOpen ? "Pause Online Ordering" : "Resume Online Ordering"}
          description={
            isOpen
              ? "This pauses new online orders only. Buyers will no longer see your restaurant, but walk-in POS orders and operating hours stay unchanged."
              : "This makes your restaurant visible to buyers again and allows new online orders during your operating hours."
          }
          confirmText={isOpen ? "PAUSE" : "RESUME"}
          isDestructive={isOpen}
          onConfirm={() => void setOnlineOrdering(!isOpen)}
        />
      </YStack>
    );
  }

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
          {canManageProfile && storeStatusCard}
          {notificationsCard}
          {linkListCard}
          {displaySettingsCard}
          {canManageProfile && dangerZoneCard}
        </YStack>
      </ScrollView>

      <AppAlertDialog
        open={showCloseDialog}
        onOpenChange={setShowCloseDialog}
        title={isOpen ? "Pause Online Ordering" : "Resume Online Ordering"}
        description={
          isOpen
            ? "This pauses new online orders only. Buyers will no longer see your restaurant, but walk-in POS orders and operating hours stay unchanged."
            : "This makes your restaurant visible to buyers again and allows new online orders during your operating hours."
        }
        confirmText={isOpen ? "PAUSE" : "RESUME"}
        isDestructive={isOpen}
        onConfirm={() => void setOnlineOrdering(!isOpen)}
      />
    </YStack>
  );
}
