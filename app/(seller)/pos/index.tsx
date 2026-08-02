// @ts-nocheck
import { useState, useMemo, useCallback, useEffect } from "react";
import { RefreshControl, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useKeepAwake, deactivateKeepAwake } from "expo-keep-awake";
import * as LocalAuthentication from "expo-local-authentication";
import {
  YStack,
  XStack,
  Text,
  Card,
  Input,
  Image,
  Separator,
  Spinner,
  useMedia,
  ScrollView,
} from "tamagui";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  Clock,
  Utensils,
  Banknote,
  Smartphone,
  User,
  Phone,
  Search,
  X,
  LayoutList,
  Package,
  ArrowLeft,
  LogOut,
  DoorClosed,
  PanelLeftClose,
  Printer,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { formatPriceFromMinor } from "@/utils/currency";
import { useResponsive } from "@/utils/responsive";
import { useMenuItemsQuery, useMenuCategoriesQuery } from "@/hooks/menu.hooks";
import {
  useCreatePOSOrderMutation,
  usePOSOrdersQuery,
  usePOSOrderPreviewQuery,
  POS_KEYS,
} from "@/hooks/pos.hooks";
import {
  useAcceptKioskOrderMutation,
  useStartPreparingKioskOrderMutation,
  useMarkKioskOrderReadyMutation,
} from "@/hooks/kiosk.hooks";
import { usePOSStore } from "@/stores/pos.store";
import { usePrinterStore } from "@/stores/printer.store";
import { useSecurityStore } from "@/stores/security.store";
import { useConnectivityStore } from "@/stores/connectivity.store";
import { useOrderRealtimeUpdates } from "@/hooks/useOrderRealtimeUpdates";
import { usePOSPaymentFlow } from "@/hooks/usePOSPaymentFlow";
import { printService } from "@/services/print.service";
import type {
  MenuItem,
  MenuItemVariantResponse,
  MenuItemAddonResponse,
} from "@/types/api/menu.api";
import type { SellerOrder } from "@/types/api/seller.api";
import type {
  POSTab,
  POSOrderType,
  POSPaymentMethod,
  POSCartItem,
} from "@/types/pos.types";
import {
  MenuItemCard,
  CashPaymentSheet,
  PaymentProcessingModal,
} from "@/components/pos";
import { PendingOrderCard, PreparingOrderCard } from "@/components/kiosk";
import { Badge } from "@/components/ui/Badge";
import { FlatList } from "react-native-gesture-handler";
import { Button } from "@/components/ui";

export default function POSTerminal() {
  const [activeTab, setActiveTab] = useState<POSTab>("new_order");
  const [exiting, setExiting] = useState(false);
  const router = useRouter();
  const isBiometricEnabled = useSecurityStore((s) => s.isBiometricEnabled);
  const insets = useSafeAreaInsets();

  useKeepAwake();
  useOrderRealtimeUpdates(POS_KEYS.all);

  const handleExit = useCallback(async () => {
    if (!isBiometricEnabled) {
      deactivateKeepAwake();
      router.back();
      return;
    }
    setExiting(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify identity to exit POS Mode",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (result.success) {
        deactivateKeepAwake();
        router.back();
      }
    } catch (err) {
      console.error("Biometric auth error:", err);
    } finally {
      setExiting(false);
    }
  }, [isBiometricEnabled, router]);

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onExit={handleExit}
        exiting={exiting}
      />
      {activeTab === "new_order" && <NewOrderTab />}
      {activeTab === "in_progress" && <InProgressTab />}
      {activeTab === "today" && <TodayTab />}
    </YStack>
  );
}

function TabBar({
  activeTab,
  onTabChange,
  onExit,
  exiting,
}: {
  activeTab: POSTab;
  onTabChange: (tab: POSTab) => void;
  onExit: () => void;
  exiting: boolean;
}) {
  const { isTablet } = useResponsive();
  const itemCount = usePOSStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const defaultPrinterId = usePrinterStore((s) => s.defaultPrinterId);
  const printers = usePrinterStore((s) => s.printers);
  const autoPrint = usePrinterStore((s) => s.autoPrint);
  const defaultPrinter = printers.find((p) => p.id === defaultPrinterId);
  const hasPrinter = !!defaultPrinter;

  const tabs: { key: POSTab; label: string; icon: any; badge?: number }[] = [
    {
      key: "new_order",
      label: "New Order",
      icon: ShoppingCart,
      badge: itemCount > 0 ? itemCount : undefined,
    },
    { key: "in_progress", label: "In Progress", icon: Clock },
    { key: "today", label: "Today", icon: LayoutList },
  ];

  return (
    <XStack
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingHorizontal="$2"
      alignItems="center"
    >
      <Button
        chromeless
        circular
        width={44}
        height={44}
        padding={0}
        margin="$2"
        pressStyle={{ opacity: 0.6 }}
        disabled={exiting}
        onPress={onExit}
      >
        {exiting ? (
          <Spinner size="small" />
        ) : (
          <PanelLeftClose size={20} color="$colorSecondary" />
        )}
      </Button>

      <XStack gap="$1" alignItems="center" marginRight="$2">
        <YStack
          width={8}
          height={8}
          borderRadius="$full"
          backgroundColor={hasPrinter ? "$success" : "$gray8"}
        />
        <Text fontSize="$2" color="$colorMuted" numberOfLines={1} maxWidth={80}>
          {hasPrinter ? defaultPrinter.name : "No printer"}
        </Text>
      </XStack>

      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return isTablet ? (
          <Button
            key={tab.key}
            flex={1}
            backgroundColor={isActive ? "$primary" : "transparent"}
            color={isActive ? "$white" : "$color"}
            borderWidth={0}
            borderRadius="$3"
            margin="$2"
            height={40}
            pressStyle={{ opacity: 0.8 }}
            onPress={() => onTabChange(tab.key)}
            icon={<tab.icon size={16} />}
          >
            {tab.label}
            {tab.badge != null ? ` (${tab.badge})` : ""}
          </Button>
        ) : (
          <Button
            key={tab.key}
            flex={1}
            backgroundColor={isActive ? "$primary" : "transparent"}
            color={isActive ? "$white" : "$color"}
            borderWidth={0}
            borderRadius="$3"
            margin="$2"
            height={40}
            pressStyle={{ opacity: 0.8 }}
            onPress={() => onTabChange(tab.key)}
            icon={<tab.icon size={16} />}
          />
        );
      })}
    </XStack>
  );
}

function NewOrderTab() {
  const { isTablet, isLandscape } = useResponsive();
  const items = usePOSStore((s) => s.items);
  const [showCheckout, setShowCheckout] = useState(false);

  if (isTablet && isLandscape) {
    return (
      <XStack flex={1}>
        <YStack flex={0.6}>
          <MenuBrowser />
        </YStack>
        <YStack flex={0.4} borderLeftWidth={1} borderLeftColor="$borderColor">
          {showCheckout ? (
            <CheckoutPanel onBack={() => setShowCheckout(false)} />
          ) : (
            <CartPanel onCheckout={() => setShowCheckout(true)} />
          )}
        </YStack>
      </XStack>
    );
  }

  return (
    <YStack flex={1}>
      {showCheckout ? (
        <CheckoutPanel onBack={() => setShowCheckout(false)} />
      ) : (
        <YStack flex={1}>
          <MenuBrowser />
          {items.length > 0 && (
            <CartBar onCheckout={() => setShowCheckout(true)} />
          )}
        </YStack>
      )}
    </YStack>
  );
}

// ── Menu Browser ────────────────────────────────────────────────────────────

function MenuBrowser() {
  const media = useMedia();
  const isTablet = media.md;
  const foodColumns = isTablet ? 3 : 2;
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories } = useMenuCategoriesQuery();
  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (activeCategoryId) f.category_ids = activeCategoryId;
    if (searchQuery) f.search = searchQuery;
    return f;
  }, [activeCategoryId, searchQuery]);
  const { data: menuItems, isFetching } = useMenuItemsQuery(filters);

  const categoryList = useMemo(() => categories?.data ?? [], [categories]);
  const itemsList = useMemo(() => menuItems ?? [], [menuItems]);

  return (
    <YStack flex={1}>
      <YStack>
        <XStack paddingHorizontal="$5" paddingVertical="$3" gap="$2">
          <YStack
            flex={1}
            flexDirection="row"
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
            paddingHorizontal="$3"
            gap="$2"
            items={"center"}
          >
            <Search size={18} color="$colorSecondary" />
            <Input
              flex={1}
              placeholder="Search menu items..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              borderWidth={0}
              backgroundColor="transparent"
              height={44}
              fontSize="$4"
            />
            {searchQuery ? (
              <Button
                size="$3"
                chromeless
                padding={0}
                onPress={() => setSearchQuery("")}
              >
                <X size={16} color="$colorSecondary" />
              </Button>
            ) : null}
          </YStack>
        </XStack>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          paddingHorizontal="$5"
        >
          <XStack gap="$2">
            <CategoryPill
              label="All"
              active={activeCategoryId == null}
              onPress={() => setActiveCategoryId(null)}
            />
            {categoryList.map((cat) => (
              <CategoryPill
                key={cat.id}
                label={cat.name}
                active={activeCategoryId === cat.id}
                onPress={() =>
                  setActiveCategoryId(
                    activeCategoryId === cat.id ? null : cat.id,
                  )
                }
              />
            ))}
          </XStack>
        </ScrollView>
      </YStack>
      {isFetching ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$primary" />
        </YStack>
      ) : itemsList.length === 0 ? (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          padding="$8"
        >
          <Utensils size={80} color="$gray200" />
          <Text
            fontSize="$5"
            fontWeight="600"
            color="$colorSecondary"
            marginTop="$4"
          >
            No menu items found
          </Text>
        </YStack>
      ) : (
        <FlatList
          key={`pos-menu-grid-${foodColumns}`}
          data={itemsList}
          keyExtractor={(item) => item.id}
          numColumns={foodColumns}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 20,
            paddingBottom: 40,
            gap: 16,
            flex: 1,
          }}
          renderItem={({ item }) => (
            <YStack mx="$1.5">
              <MenuItemCard item={item} />
            </YStack>
          )}
          initialNumToRender={10}
          windowSize={5}
        />
      )}
    </YStack>
  );
}

function CategoryPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      size="$3"
      height={36}
      backgroundColor={active ? "$primary" : "$backgroundSoft"}
      color={active ? "white" : "$color"}
      borderRadius="$full"
      borderWidth={active ? 0 : 1}
      borderColor="$borderColor"
      pressStyle={{ opacity: 0.8 }}
      onPress={onPress}
    >
      {label}
    </Button>
  );
}

// ── Cart Bar (phone bottom bar) ─────────────────────────────────────────────

function CartBar({ onCheckout }: { onCheckout: () => void }) {
  const items = usePOSStore((s) => s.items);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + item.unit_price_minor * item.quantity,
    0,
  );

  return (
    <XStack
      padding="$4"
      backgroundColor="$primary"
      justifyContent="space-between"
      alignItems="center"
    >
      <YStack>
        <Text color="white" fontSize="$5" fontWeight="800" fontFamily="$body">
          {formatPriceFromMinor(total)}
        </Text>
        <Text color="white" opacity={0.8} fontSize="$3" fontFamily="$body">
          {itemCount} item{itemCount !== 1 ? "s" : ""}
        </Text>
      </YStack>
      <Button
        backgroundColor="white"
        color="$primary"
        fontWeight="700"
        fontFamily="$body"
        height={44}
        pressStyle={{ opacity: 0.8 }}
        onPress={onCheckout}
      >
        View Cart
      </Button>
    </XStack>
  );
}

// ── Cart Panel ──────────────────────────────────────────────────────────────

function CartPanel({ onCheckout }: { onCheckout: () => void }) {
  const items = usePOSStore((s) => s.items);
  const removeItem = usePOSStore((s) => s.removeItem);
  const updateQuantity = usePOSStore((s) => s.updateQuantity);
  const clearCart = usePOSStore((s) => s.clearCart);

  const total = items.reduce(
    (sum, item) => sum + item.unit_price_minor * item.quantity,
    0,
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        justifyContent="space-between"
        alignItems="center"
        padding="$5"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <ArrowLeft size={20} color="$color" />
          <Text
            fontSize="$6"
            fontWeight="700"
            fontFamily="$heading"
            color="$color"
          >
            Cart
          </Text>
        </XStack>
        {items.length > 0 && (
          <Button
            variant="dangerOutline"
            size="$3"
            height={40}
            pressStyle={{ opacity: 0.8 }}
            onPress={clearCart}
          >
            <Trash2 size={16} /> Clear
          </Button>
        )}
      </XStack>

      <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>
        <YStack padding="$5" gap="$3">
          {items.map((item) => (
            <Card
              key={item.id}
              flexDirection="row"
              padding="$3"
              backgroundColor="$backgroundStrong"
              borderRadius="$4"
              alignItems="center"
            >
              <YStack
                width={72}
                height={72}
                borderRadius="$4"
                backgroundColor="$backgroundSoft"
                alignItems="center"
                justifyContent="center"
                overflow="hidden"
              >
                {item.menu_item.image_url ? (
                  <Image
                    source={{ uri: item.menu_item.image_url }}
                    width="100%"
                    height="100%"
                  />
                ) : (
                  <Utensils size={20} color="$colorSecondary" />
                )}
              </YStack>

              <YStack
                flex={1}
                marginLeft="$3"
                justifyContent="space-between"
                minHeight={72}
              >
                <YStack gap="$1">
                  <Text
                    fontSize="$4"
                    fontWeight="700"
                    fontFamily="$heading"
                    color="$color"
                    numberOfLines={1}
                  >
                    {item.menu_item.name}
                  </Text>
                  {item.selected_variant && (
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                      numberOfLines={1}
                    >
                      {item.selected_variant.name}
                    </Text>
                  )}
                  {item.selected_addons.length > 0 && (
                    <Text
                      fontSize="$2"
                      color="$colorSecondary"
                      fontFamily="$body"
                      numberOfLines={1}
                    >
                      + {item.selected_addons.map((a) => a.name).join(", ")}
                    </Text>
                  )}
                </YStack>

                <XStack
                  justifyContent="space-between"
                  alignItems="center"
                  marginTop="$2"
                >
                  <XStack
                    backgroundColor="$backgroundSoft"
                    borderRadius="$full"
                    alignItems="center"
                  >
                    <Button
                      chromeless
                      circular
                      width={32}
                      height={32}
                      padding={0}
                      pressStyle={{ opacity: 0.7 }}
                      onPress={() =>
                        item.quantity <= 1
                          ? removeItem(item.id)
                          : updateQuantity(item.id, item.quantity - 1)
                      }
                    >
                      {item.quantity <= 1 ? (
                        <Trash2 size={14} color="$error" />
                      ) : (
                        <Minus size={14} color="$color" />
                      )}
                    </Button>
                    <Text
                      fontSize="$4"
                      fontWeight="700"
                      fontFamily="$body"
                      minWidth={24}
                      textAlign="center"
                    >
                      {item.quantity}
                    </Text>
                    <Button
                      chromeless
                      circular
                      width={32}
                      height={32}
                      padding={0}
                      pressStyle={{ opacity: 0.7 }}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={14} color="$color" />
                    </Button>
                  </XStack>
                  <Text
                    fontSize="$5"
                    fontWeight="800"
                    fontFamily="$body"
                    color="$primary"
                  >
                    {formatPriceFromMinor(
                      item.unit_price_minor * item.quantity,
                    )}
                  </Text>
                </XStack>
              </YStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>

      {items.length > 0 && (
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          padding="$5"
          backgroundColor="$background"
          borderTopWidth={1}
          borderTopColor="$borderColor"
          gap="$3"
        >
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$4" fontFamily="$body" color="$colorSecondary">
              Subtotal
            </Text>
            <Text
              fontSize="$5"
              fontWeight="800"
              fontFamily="$body"
              color="$color"
            >
              {formatPriceFromMinor(total)}
            </Text>
          </XStack>
          <Button
            backgroundColor="$primary"
            color="white"
            fontWeight="700"
            fontFamily="$body"
            height={52}
            pressStyle={{ opacity: 0.8 }}
            onPress={onCheckout}
          >
            Proceed to Checkout — {formatPriceFromMinor(total)}
          </Button>
        </YStack>
      )}

      {items.length === 0 && (
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          padding="$8"
        >
          <ShoppingCart size={80} color="$gray200" />
          <Text
            fontSize="$5"
            fontWeight="600"
            color="$colorSecondary"
            marginTop="$4"
            textAlign="center"
          >
            Your cart is empty
          </Text>
          <Text
            fontSize="$3"
            color="$colorSecondary"
            marginTop="$2"
            textAlign="center"
          >
            Tap menu items to add them to the cart
          </Text>
        </YStack>
      )}
    </YStack>
  );
}

// ── Checkout Panel (matches buyer cart checkout patterns) ───────────────────

function CheckoutPanel({ onBack }: { onBack: () => void }) {
  const items = usePOSStore((s) => s.items);
  const checkoutForm = usePOSStore((s) => s.checkoutForm);
  const updateCheckoutForm = usePOSStore((s) => s.updateCheckoutForm);
  const clearAll = usePOSStore((s) => s.clearAll);
  const createOrder = useCreatePOSOrderMutation();
  const [showCashSheet, setShowCashSheet] = useState(false);
  const [lastOrderNumber, setLastOrderNumber] = useState<string | null>(null);
  const [lastCompletedOrderId, setLastCompletedOrderId] = useState<
    string | null
  >(null);
  const paymentFlow = usePOSPaymentFlow();
  const isCloudReachable = useConnectivityStore(
    (s) => s.isCloudReachable === "reachable",
  );
  const previewOrder = usePOSOrderPreviewQuery(
    items,
    checkoutForm.order_type,
    checkoutForm.customer_name,
  );

  const localTotal = items.reduce(
    (sum, item) => sum + item.unit_price_minor * item.quantity,
    0,
  );

  const serverPricing = previewOrder.data?.data;
  const total = serverPricing?.total_minor ?? localTotal;
  const taxLines = serverPricing?.tax_lines ?? [];

  const orderTypes: { key: POSOrderType; label: string }[] = [
    { key: "takeout", label: "Takeout" },
    { key: "dine_in", label: "Dine-in" },
  ];

  const paymentMethods: {
    key: POSPaymentMethod;
    label: string;
    icon: any;
    description: string;
    disabled?: boolean;
  }[] = [
    {
      key: "cash",
      label: "Cash",
      icon: Banknote,
      description: "Collect payment at counter",
    },
    {
      key: "mobile_money",
      label: "Mobile Money",
      icon: Smartphone,
      description: isCloudReachable ? "Pay via Paystack" : "Requires internet",
      disabled: !isCloudReachable,
    },
  ];

  // Switch to cash automatically when mobile money is selected offline.
  useEffect(() => {
    if (
      !isCloudReachable &&
      checkoutForm.pos_payment_method === "mobile_money"
    ) {
      updateCheckoutForm({ pos_payment_method: "cash" });
    }
  }, [isCloudReachable, checkoutForm.pos_payment_method, updateCheckoutForm]);

  const executePlaceOrder = useCallback(() => {
    const { autoPrint } = usePrinterStore.getState();

    const orderItems = items.map((i) => ({
      menu_item_id: i.menu_item.id,
      quantity: i.quantity,
      variant_id: i.selected_variant?.id,
      addon_ids:
        i.selected_addons.length > 0
          ? i.selected_addons.map((a) => a.addon_id)
          : undefined,
    }));

    console.debug(
      "[POS] Checkout initiated",
      JSON.stringify({
        item_count: orderItems.length,
        total_minor: total,
        payment_method: checkoutForm.pos_payment_method,
        order_type: checkoutForm.order_type,
        customer_name: checkoutForm.customer_name,
        isCloudReachable,
        isOnline: useConnectivityStore.getState().isOnline,
        timestamp: new Date().toISOString(),
      }),
    );

    createOrder.mutate(
      {
        order_type: checkoutForm.order_type,
        customer_name: checkoutForm.customer_name || undefined,
        customer_phone: checkoutForm.customer_phone,
        pos_payment_method: checkoutForm.pos_payment_method,
        items: orderItems,
      },
      {
        onSuccess: (response) => {
          const orderId = response.id;
          const calloutNumber = response.callout_number;
          setLastOrderNumber(response.order_number);
          clearAll();
          toast.success(`Order #${calloutNumber} placed!`);

          console.debug(
            "[POS] Checkout succeeded",
            JSON.stringify({
              order_id: orderId,
              order_number: response.order_number,
              callout_number: calloutNumber,
              status: response.status,
              is_paid: response.is_paid,
              total_minor: response.total_minor,
              timestamp: new Date().toISOString(),
            }),
          );

          if (checkoutForm.pos_payment_method === "cash") {
            if (autoPrint) {
              printService.printOrderReceipt(orderId);
            }
          } else {
            if (autoPrint) {
              setLastCompletedOrderId(orderId);
            }
            paymentFlow.startCheckout(orderId, total);
          }
        },
        onError: (error) => {
          console.debug(
            "[POS] Checkout failed",
            JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
              payment_method: checkoutForm.pos_payment_method,
              timestamp: new Date().toISOString(),
            }),
          );
        },
      },
    );
  }, [
    items,
    checkoutForm,
    createOrder,
    clearAll,
    total,
    paymentFlow.startCheckout,
  ]);

  const handlePlaceOrder = useCallback(() => {
    if (
      checkoutForm.pos_payment_method === "mobile_money" &&
      !isCloudReachable
    ) {
      toast.error("Mobile money requires an internet connection");
      updateCheckoutForm({ pos_payment_method: "cash" });
      return;
    }

    if (checkoutForm.pos_payment_method === "cash") {
      setShowCashSheet(true);
    } else {
      executePlaceOrder();
    }
  }, [
    checkoutForm.pos_payment_method,
    isCloudReachable,
    executePlaceOrder,
    updateCheckoutForm,
  ]);

  useEffect(() => {
    if (paymentFlow.state === "success") {
      if (lastCompletedOrderId) {
        printService.printOrderReceipt(lastCompletedOrderId);
        setLastCompletedOrderId(null);
      }
      const timer = setTimeout(() => paymentFlow.reset(), 2000);
      return () => clearTimeout(timer);
    }
  }, [paymentFlow.state, paymentFlow.reset, lastCompletedOrderId]);

  useEffect(() => {
    if (paymentFlow.state === "failed") {
      setLastCompletedOrderId(null);
    }
  }, [paymentFlow.state]);

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        alignItems="center"
        padding="$5"
        gap="$4"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Button
          chromeless
          circular
          width={40}
          height={40}
          padding={0}
          pressStyle={{ opacity: 0.7 }}
          onPress={onBack}
        >
          <ArrowLeft size={20} color="$color" />
        </Button>
        <Text
          fontSize="$6"
          fontWeight="700"
          fontFamily="$heading"
          color="$color"
        >
          Checkout
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ paddingBottom: 200 }}>
        <YStack padding="$5" gap="$5">
          {/* Customer Details */}
          <YStack gap="$3">
            <Text
              fontSize="$5"
              fontWeight="700"
              fontFamily="$heading"
              color="$color"
            >
              Customer Details
            </Text>
            <YStack
              gap="$3"
              backgroundColor="$backgroundStrong"
              padding="$4"
              borderRadius="$5"
            >
              <XStack alignItems="center" gap="$3">
                <YStack
                  backgroundColor="$backgroundSoft"
                  padding="$2"
                  borderRadius="$3"
                >
                  <User size={20} color="$primary" />
                </YStack>
                <Input
                  flex={1}
                  placeholder="Customer name"
                  value={checkoutForm.customer_name}
                  onChangeText={(v) => updateCheckoutForm({ customer_name: v })}
                  backgroundColor="$background"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$3"
                  height={44}
                  fontSize="$4"
                />
              </XStack>
              <XStack alignItems="center" gap="$3">
                <YStack
                  backgroundColor="$backgroundSoft"
                  padding="$2"
                  borderRadius="$3"
                >
                  <Phone size={20} color="$primary" />
                </YStack>
                <Input
                  flex={1}
                  placeholder="Phone number (optional)"
                  keyboardType="phone-pad"
                  value={checkoutForm.customer_phone}
                  onChangeText={(v) =>
                    updateCheckoutForm({ customer_phone: v })
                  }
                  backgroundColor="$background"
                  borderWidth={1}
                  borderColor="$borderColor"
                  borderRadius="$3"
                  height={44}
                  fontSize="$4"
                />
              </XStack>
            </YStack>
          </YStack>

          {/* Order Type */}
          <YStack gap="$3">
            <Text
              fontSize="$5"
              fontWeight="700"
              fontFamily="$heading"
              color="$color"
            >
              Order Type
            </Text>
            <XStack gap="$3">
              {orderTypes.map((t) => (
                <YStack
                  key={t.key}
                  flex={1}
                  backgroundColor={
                    checkoutForm.order_type === t.key
                      ? "$primary"
                      : "$backgroundStrong"
                  }
                  borderRadius="$4"
                  padding="$4"
                  gap="$2"
                  alignItems="center"
                  pressStyle={{ opacity: 0.8 }}
                  onPress={() => updateCheckoutForm({ order_type: t.key })}
                >
                  <Text
                    fontSize="$4"
                    fontWeight="700"
                    fontFamily="$heading"
                    color={
                      checkoutForm.order_type === t.key ? "white" : "$color"
                    }
                  >
                    {t.label}
                  </Text>
                </YStack>
              ))}
            </XStack>
          </YStack>

          {/* Payment Method */}
          <YStack gap="$3">
            <Text
              fontSize="$5"
              fontWeight="700"
              fontFamily="$heading"
              color="$color"
            >
              Payment Method
            </Text>
            <XStack gap="$3">
              {paymentMethods.map((pm) => {
                const selected = checkoutForm.pos_payment_method === pm.key;
                return (
                  <YStack
                    key={pm.key}
                    flex={1}
                    backgroundColor={
                      selected ? "$primary" : "$backgroundStrong"
                    }
                    borderRadius="$4"
                    padding="$4"
                    gap="$2"
                    alignItems="center"
                    pressStyle={pm.disabled ? undefined : { opacity: 0.8 }}
                    opacity={pm.disabled ? 0.5 : 1}
                    disabled={pm.disabled}
                    onPress={
                      pm.disabled
                        ? undefined
                        : () =>
                            updateCheckoutForm({ pos_payment_method: pm.key })
                    }
                  >
                    <YStack
                      backgroundColor={
                        selected && !pm.disabled
                          ? "rgba(255,255,255,0.2)"
                          : "$backgroundSoft"
                      }
                      padding="$2"
                      borderRadius="$3"
                    >
                      <pm.icon
                        size={20}
                        color={selected ? "white" : "$primary"}
                      />
                    </YStack>
                    <Text
                      fontSize="$3"
                      fontWeight="700"
                      fontFamily="$heading"
                      color={selected ? "white" : "$color"}
                      textAlign="center"
                    >
                      {pm.label}
                    </Text>
                    <Text
                      fontSize="$2"
                      fontFamily="$body"
                      color={
                        selected ? "rgba(255,255,255,0.8)" : "$colorSecondary"
                      }
                      textAlign="center"
                      numberOfLines={1}
                    >
                      {pm.description}
                    </Text>
                  </YStack>
                );
              })}
            </XStack>
          </YStack>

          {/* Bill Details */}
          <YStack
            padding="$5"
            backgroundColor="$backgroundStrong"
            borderRadius="$5"
            gap="$3"
          >
            <Text
              fontSize="$5"
              fontWeight="700"
              fontFamily="$heading"
              color="$color"
            >
              Bill Details
            </Text>
            {items.map((i) => (
              <XStack
                key={i.id}
                justifyContent="space-between"
                alignItems="flex-start"
              >
                <YStack flex={1} marginRight="$3">
                  <Text
                    fontSize="$4"
                    fontFamily="$body"
                    color="$color"
                    numberOfLines={1}
                  >
                    {i.quantity}x {i.menu_item.name}
                  </Text>
                  {i.selected_variant && (
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      {i.selected_variant.name}
                    </Text>
                  )}
                  {i.selected_addons.length > 0 && (
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                      numberOfLines={1}
                    >
                      + {i.selected_addons.map((a) => a.name).join(", ")}
                    </Text>
                  )}
                </YStack>
                <Text
                  fontSize="$4"
                  fontWeight="600"
                  fontFamily="$body"
                  color="$color"
                >
                  {formatPriceFromMinor(i.unit_price_minor * i.quantity)}
                </Text>
              </XStack>
            ))}
            {previewOrder.isFetching && (
              <XStack justifyContent="center" alignItems="center" gap="$2">
                <Spinner size="small" color="$colorSecondary" />
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Calculating...
                </Text>
              </XStack>
            )}
            <Separator marginVertical="$2" borderColor="$borderColor" />
            {serverPricing && (
              <>
                {taxLines.map((tl) => (
                  <XStack
                    key={tl.id ?? tl.name}
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Text
                      fontSize="$4"
                      fontFamily="$body"
                      color="$colorSecondary"
                    >
                      {tl.name}
                    </Text>
                    <Text
                      fontSize="$4"
                      fontFamily="$body"
                      color="$colorSecondary"
                    >
                      {formatPriceFromMinor(tl.tax_amount_minor ?? 0)}
                    </Text>
                  </XStack>
                ))}
                {taxLines.length === 0 && serverPricing.tax_minor > 0 && (
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text
                      fontSize="$4"
                      fontFamily="$body"
                      color="$colorSecondary"
                    >
                      Taxes
                    </Text>
                    <Text
                      fontSize="$4"
                      fontFamily="$body"
                      color="$colorSecondary"
                    >
                      {formatPriceFromMinor(serverPricing.tax_minor)}
                    </Text>
                  </XStack>
                )}
              </>
            )}
            <Separator marginVertical="$2" borderColor="$borderColor" />
            <XStack justifyContent="space-between" alignItems="center">
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
              >
                Total
              </Text>
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$primary"
              >
                {formatPriceFromMinor(total)}
              </Text>
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>

      <YStack
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        padding="$5"
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$borderColor"
      >
        <Button
          backgroundColor="$primary"
          color="white"
          fontWeight="700"
          fontFamily="$body"
          height={52}
          disabled={createOrder.isPending}
          pressStyle={{ opacity: 0.8 }}
          onPress={handlePlaceOrder}
        >
          {createOrder.isPending ? (
            <Spinner size="small" color="white" />
          ) : (
            `Place Order — ${formatPriceFromMinor(total)}`
          )}
        </Button>
      </YStack>

      <CashPaymentSheet
        open={showCashSheet}
        onOpenChange={setShowCashSheet}
        totalMinor={total}
        onConfirm={() => {
          setShowCashSheet(false);
          executePlaceOrder();
        }}
        isProcessing={createOrder.isPending}
      />

      <PaymentProcessingModal
        open={paymentFlow.state !== "idle"}
        state={paymentFlow.state}
        errorMsg={paymentFlow.errorMsg}
        orderNumber={lastOrderNumber}
        amountMinor={total}
        onClose={paymentFlow.reset}
      />
    </YStack>
  );
}

// ── In Progress Tab (kiosk-style responsive grid) ──────────────────────────

const getTimeSince = (dateString: string | null | undefined): number => {
  if (!dateString) return 0;
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
};

function POSReadyCard({
  order,
  onPrint,
}: {
  order: SellerOrder;
  onPrint?: (id: string) => void;
}) {
  return (
    <Card
      padding="$4"
      bordered
      backgroundColor="$green2"
      borderColor="$success"
      borderWidth={1}
    >
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$7" fontWeight="bold" fontFamily="$heading">
            {order.order_number}
          </Text>
          <Badge backgroundColor="$success" size="$2">
            <Text color="white" fontSize="$1" fontWeight="bold">
              READY
            </Text>
          </Badge>
        </XStack>
        {order.customer_name && (
          <Text fontSize="$4" color="$colorMuted" fontFamily="$body">
            {order.customer_name}
          </Text>
        )}
        <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
          {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
        </Text>
        <XStack justifyContent="flex-end">
          {onPrint && (
            <Button
              size="$2"
              variant="outline"
              onPress={() => onPrint(order.id)}
            >
              <Printer size={14} />
            </Button>
          )}
        </XStack>
      </YStack>
    </Card>
  );
}

function InProgressTab() {
  const { data: orders, isFetching, refetch } = usePOSOrdersQuery();
  const acceptOrder = useAcceptKioskOrderMutation();
  const startPreparing = useStartPreparingKioskOrderMutation();
  const markReady = useMarkKioskOrderReadyMutation();
  const { width } = useResponsive();

  const isTablet = width >= 768;
  const isLargeTablet = width >= 1024;

  const activeOrders = useMemo(
    () =>
      (orders ?? []).filter((o) =>
        [
          "pending",
          "awaiting_payment",
          "accepted",
          "preparing",
          "ready",
        ].includes(o.status),
      ),
    [orders],
  );
  const pendingOrders = useMemo(
    () =>
      activeOrders.filter(
        (o) => o.status === "pending" || o.status === "accepted",
      ),
    [activeOrders],
  );
  const preparingOrders = useMemo(
    () => activeOrders.filter((o) => o.status === "preparing"),
    [activeOrders],
  );
  const readyOrders = useMemo(
    () => activeOrders.filter((o) => o.status === "ready"),
    [activeOrders],
  );

  if (isFetching) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  if (isFetching) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {isTablet ? (
        <XStack padding="$4" gap="$4" alignItems="flex-start">
          <YStack flex={1} minWidth={280} gap="$3">
            <XStack gap="$2" alignItems="center">
              <Clock size={20} color="$orange10" />
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Pending Orders
              </Text>
              <Badge backgroundColor="$orange10" size="$2">
                <Text color="white" fontSize="$1" fontWeight="bold">
                  {pendingOrders.length}
                </Text>
              </Badge>
            </XStack>
            {pendingOrders.length === 0 ? (
              <Card
                padding="$6"
                backgroundColor="$backgroundStrong"
                borderRadius="$4"
                alignItems="center"
                gap="$2"
              >
                <CheckCircle size={36} color="$gray200" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  No pending orders
                </Text>
              </Card>
            ) : (
              pendingOrders.map((order) => (
                <PendingOrderCard
                  key={order.id}
                  order={order}
                  getTimeSince={getTimeSince}
                  onAccept={() => acceptOrder.mutate(order.id)}
                  onReject={() => {}}
                  onStartPreparing={() => startPreparing.mutate(order.id)}
                  onViewDetails={() => {}}
                  onPrint={(id) => printService.printOrderReceipt(id)}
                />
              ))
            )}
          </YStack>

          {isLargeTablet ? (
            <>
              <YStack flex={1} minWidth={280} gap="$3">
                <XStack gap="$2" alignItems="center">
                  <Utensils size={20} color="$blue10" />
                  <Text
                    fontSize="$5"
                    fontWeight="700"
                    fontFamily="$heading"
                    color="$color"
                  >
                    Preparing
                  </Text>
                  <Badge backgroundColor="$blue10" size="$2">
                    <Text color="white" fontSize="$1" fontWeight="bold">
                      {preparingOrders.length}
                    </Text>
                  </Badge>
                </XStack>
                {preparingOrders.length === 0 ? (
                  <Card
                    padding="$6"
                    backgroundColor="$backgroundStrong"
                    borderRadius="$4"
                    alignItems="center"
                    gap="$2"
                  >
                    <CheckCircle size={36} color="$gray200" />
                    <Text
                      fontSize="$4"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      No preparing orders
                    </Text>
                  </Card>
                ) : (
                  preparingOrders.map((order) => (
                    <PreparingOrderCard
                      key={order.id}
                      order={order}
                      onMarkReady={() => markReady.mutate(order.id)}
                      onViewDetails={() => {}}
                      onPrint={(id) => printService.printOrderReceipt(id)}
                    />
                  ))
                )}
              </YStack>

              <YStack flex={1} minWidth={280} gap="$3">
                <XStack gap="$2" alignItems="center">
                  <CheckCircle size={20} color="$green10" />
                  <Text
                    fontSize="$5"
                    fontWeight="700"
                    fontFamily="$heading"
                    color="$color"
                  >
                    Ready
                  </Text>
                  <Badge backgroundColor="$green10" size="$2">
                    <Text color="white" fontSize="$1" fontWeight="bold">
                      {readyOrders.length}
                    </Text>
                  </Badge>
                </XStack>
                {readyOrders.length === 0 ? (
                  <Card
                    padding="$6"
                    backgroundColor="$backgroundStrong"
                    borderRadius="$4"
                    alignItems="center"
                    gap="$2"
                  >
                    <CheckCircle size={36} color="$gray200" />
                    <Text
                      fontSize="$4"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      No ready orders
                    </Text>
                  </Card>
                ) : (
                  readyOrders.map((order) => (
                    <POSReadyCard
                      key={order.id}
                      order={order}
                      onPrint={(id) => printService.printOrderReceipt(id)}
                    />
                  ))
                )}
              </YStack>
            </>
          ) : (
            <YStack flex={1} minWidth={280} gap="$4">
              <YStack gap="$3">
                <XStack gap="$2" alignItems="center">
                  <Utensils size={20} color="$blue10" />
                  <Text
                    fontSize="$5"
                    fontWeight="700"
                    fontFamily="$heading"
                    color="$color"
                  >
                    Preparing
                  </Text>
                  <Badge backgroundColor="$blue10" size="$2">
                    <Text color="white" fontSize="$1" fontWeight="bold">
                      {preparingOrders.length}
                    </Text>
                  </Badge>
                </XStack>
                {preparingOrders.length === 0 ? (
                  <Card
                    padding="$6"
                    backgroundColor="$backgroundStrong"
                    borderRadius="$4"
                    alignItems="center"
                    gap="$2"
                  >
                    <CheckCircle size={36} color="$gray200" />
                    <Text
                      fontSize="$4"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      No preparing orders
                    </Text>
                  </Card>
                ) : (
                  preparingOrders.map((order) => (
                    <PreparingOrderCard
                      key={order.id}
                      order={order}
                      onMarkReady={() => markReady.mutate(order.id)}
                      onViewDetails={() => {}}
                      onPrint={(id) => printService.printOrderReceipt(id)}
                    />
                  ))
                )}
              </YStack>

              <YStack gap="$3">
                <XStack gap="$2" alignItems="center">
                  <CheckCircle size={20} color="$green10" />
                  <Text
                    fontSize="$5"
                    fontWeight="700"
                    fontFamily="$heading"
                    color="$color"
                  >
                    Ready
                  </Text>
                  <Badge backgroundColor="$green10" size="$2">
                    <Text color="white" fontSize="$1" fontWeight="bold">
                      {readyOrders.length}
                    </Text>
                  </Badge>
                </XStack>
                {readyOrders.length === 0 ? (
                  <Card
                    padding="$6"
                    backgroundColor="$backgroundStrong"
                    borderRadius="$4"
                    alignItems="center"
                    gap="$2"
                  >
                    <CheckCircle size={36} color="$gray200" />
                    <Text
                      fontSize="$4"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      No ready orders
                    </Text>
                  </Card>
                ) : (
                  readyOrders.map((order) => (
                    <POSReadyCard
                      key={order.id}
                      order={order}
                      onPrint={(id) => printService.printOrderReceipt(id)}
                    />
                  ))
                )}
              </YStack>
            </YStack>
          )}
        </XStack>
      ) : (
        <YStack padding="$4" gap="$4">
          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <Clock size={20} color="$orange10" />
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Pending
              </Text>
              <Badge backgroundColor="$orange10" size="$2">
                <Text color="white" fontSize="$1" fontWeight="bold">
                  {pendingOrders.length}
                </Text>
              </Badge>
            </XStack>
            {pendingOrders.length === 0 ? (
              <Card
                padding="$6"
                backgroundColor="$backgroundStrong"
                borderRadius="$4"
                alignItems="center"
                gap="$2"
              >
                <CheckCircle size={36} color="$gray200" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  No pending orders
                </Text>
              </Card>
            ) : (
              pendingOrders.map((order) => (
                <PendingOrderCard
                  key={order.id}
                  order={order}
                  getTimeSince={getTimeSince}
                  onAccept={() => acceptOrder.mutate(order.id)}
                  onReject={() => {}}
                  onStartPreparing={() => startPreparing.mutate(order.id)}
                  onViewDetails={() => {}}
                  onPrint={(id) => printService.printOrderReceipt(id)}
                />
              ))
            )}
          </YStack>

          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <Utensils size={20} color="$blue10" />
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Preparing
              </Text>
              <Badge backgroundColor="$blue10" size="$2">
                <Text color="white" fontSize="$1" fontWeight="bold">
                  {preparingOrders.length}
                </Text>
              </Badge>
            </XStack>
            {preparingOrders.length === 0 ? (
              <Card
                padding="$6"
                backgroundColor="$backgroundStrong"
                borderRadius="$4"
                alignItems="center"
                gap="$2"
              >
                <CheckCircle size={36} color="$gray200" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  No preparing orders
                </Text>
              </Card>
            ) : (
              preparingOrders.map((order) => (
                <PreparingOrderCard
                  key={order.id}
                  order={order}
                  onMarkReady={() => markReady.mutate(order.id)}
                  onViewDetails={() => {}}
                  onPrint={(id) => printService.printOrderReceipt(id)}
                />
              ))
            )}
          </YStack>

          <YStack gap="$3">
            <XStack gap="$2" alignItems="center">
              <CheckCircle size={20} color="$green10" />
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Ready
              </Text>
              <Badge backgroundColor="$green10" size="$2">
                <Text color="white" fontSize="$1" fontWeight="bold">
                  {readyOrders.length}
                </Text>
              </Badge>
            </XStack>
            {readyOrders.length === 0 ? (
              <Card
                padding="$6"
                backgroundColor="$backgroundStrong"
                borderRadius="$4"
                alignItems="center"
                gap="$2"
              >
                <CheckCircle size={36} color="$gray200" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  No ready orders
                </Text>
              </Card>
            ) : (
              readyOrders.map((order) => (
                <POSReadyCard
                  key={order.id}
                  order={order}
                  onPrint={(id) => printService.printOrderReceipt(id)}
                />
              ))
            )}
          </YStack>
        </YStack>
      )}
    </ScrollView>
  );
}

// ── Today Tab ───────────────────────────────────────────────────────────────

function TodayTab() {
  const today = new Date().toISOString().split("T")[0];
  const {
    data: orders,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePOSOrdersQuery({
    date_from: today,
    date_to: today,
  });
  const insets = useSafeAreaInsets();

  const allTodayOrders = useMemo(() => orders ?? [], [orders]);

  const ACTIVE_STATUSES = [
    "pending",
    "awaiting_payment",
    "accepted",
    "preparing",
    "ready",
  ];
  const COMPLETED_STATUSES = ["delivered", "completed", "cancelled"];

  const activeOrders = useMemo(
    () => allTodayOrders.filter((o) => ACTIVE_STATUSES.includes(o.status)),
    [allTodayOrders],
  );
  const completedOrders = useMemo(
    () => allTodayOrders.filter((o) => COMPLETED_STATUSES.includes(o.status)),
    [allTodayOrders],
  );

  const sortedOrders = useMemo(
    () => [...activeOrders, ...completedOrders],
    [activeOrders, completedOrders],
  );

  const showActive = activeOrders.length > 0;
  const showCompleted = completedOrders.length > 0;

  const statusColor = (status: string) => {
    if (["pending", "awaiting_payment", "accepted"].includes(status))
      return "$orange9";
    if (status === "preparing") return "$blue9";
    if (status === "ready") return "$green9";
    if (status === "cancelled") return "$red9";
    return "$gray9";
  };

  return (
    <FlatList
      data={sortedOrders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          tintColor="$primary"
        />
      }
      onEndReached={() => {
        if (hasNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <YStack marginBottom="$4">
          <Text
            fontSize="$6"
            fontWeight="700"
            fontFamily="$heading"
            color="$color"
          >
            Today's Orders
          </Text>
          <Text
            fontSize="$4"
            color="$colorSecondary"
            fontFamily="$body"
            marginTop="$1"
          >
            {allTodayOrders.length} order
            {allTodayOrders.length !== 1 ? "s" : ""}
            {showActive ? ` (${activeOrders.length} active)` : ""}
          </Text>
        </YStack>
      }
      ListEmptyComponent={
        <YStack padding="$8" alignItems="center" gap="$3">
          <Package size={80} color="$gray200" />
          <Text
            fontSize="$5"
            fontWeight="600"
            color="$colorSecondary"
            textAlign="center"
          >
            No orders today yet
          </Text>
          <Button variant="outline" height={44} onPress={refetch}>
            Refresh
          </Button>
        </YStack>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <YStack padding="$4" alignItems="center">
            <Spinner size="small" color="$primary" />
          </YStack>
        ) : null
      }
      renderItem={({ item, index }) => (
        <>
          {index === 0 && showActive && (
            <YStack paddingVertical="$2" paddingHorizontal="$1">
              <Text
                fontSize="$4"
                fontWeight="700"
                fontFamily="$heading"
                color="$orange10"
              >
                In Progress
              </Text>
            </YStack>
          )}
          {index === activeOrders.length && showCompleted && (
            <YStack paddingVertical="$2" paddingHorizontal="$1" marginTop="$2">
              <Text
                fontSize="$4"
                fontWeight="700"
                fontFamily="$heading"
                color="$gray10"
              >
                Completed
              </Text>
            </YStack>
          )}
          <Card
            elevate
            padding="$4"
            marginBottom="$3"
            backgroundColor="$backgroundStrong"
            borderRadius="$5"
          >
            <XStack justifyContent="space-between" alignItems="flex-start">
              <YStack flex={1} gap="$1">
                <Text
                  fontWeight="700"
                  fontSize="$5"
                  fontFamily="$heading"
                  color="$color"
                >
                  {item.order_number}
                </Text>
                {item.customer_name && (
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    {item.customer_name}
                  </Text>
                )}
                {item.user && !item.customer_name && (
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    {item.user.full_name}
                  </Text>
                )}
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  {new Date(item.inserted_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </YStack>
              <YStack alignItems="flex-end" gap="$1">
                <Text
                  fontWeight="800"
                  fontSize="$5"
                  fontFamily="$body"
                  color="$primary"
                >
                  {formatPriceFromMinor(item.total_minor)}
                </Text>
                <YStack
                  backgroundColor={statusColor(item.status)}
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$full"
                >
                  <Text
                    fontSize="$2"
                    color="white"
                    fontWeight="700"
                    textTransform="capitalize"
                  >
                    {item.status.replace(/_/g, " ")}
                  </Text>
                </YStack>
                <Button
                  size="$2"
                  icon={<Printer size={14} />}
                  variant="outline"
                  marginTop="$2"
                  onPress={() => printService.printOrderReceipt(item.id)}
                />
              </YStack>
            </XStack>
          </Card>
        </>
      )}
      initialNumToRender={10}
      windowSize={5}
      maxToRenderPerBatch={10}
      removeClippedSubviews
    />
  );
}
