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
  FileText,
  Eye,
  XCircle,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import {
  formatPriceFromMinor,
  useCachedImageUrl,
  isUnpaid,
  isCancellable,
  cancelLabelFor,
  nextActionFor,
  isDeliveryOrder,
  getCustomerDisplay,
  formatDate,
} from "@teincfood/core";
import { useResponsive } from "@/utils/responsive";
import { useMenuItemsQuery, useMenuCategoriesQuery } from "@/hooks/menu.hooks";
import { useBusinessTaxRulesQuery } from "@teincfood/core";
import { buildItemSnapshots } from "@teincfood/core";
import { calculatePricing } from "@teincfood/core";
import {
  useCreatePOSOrderMutation,
  usePOSOrdersQuery,
  usePOSOrderPreviewQuery,
  useBusinessOpenNow,
} from "@teincfood/core";
import {
  useAcceptKioskOrderMutation,
  useStartPreparingKioskOrderMutation,
  useMarkKioskOrderReadyMutation,
  useAvailableRidersQuery,
} from "@/hooks/kiosk.hooks";
import { usePOSStore } from "@/stores/pos.store";
import { useCustomerDisplayStore } from "@/stores/customer-display.store";
import { usePrinterStore } from "@/stores/printer.store";
import { useSecurityStore } from "@/stores/security.store";
import { useConnectivityStore } from "@/stores/connectivity.store";
import { useBusinessStore } from "@/stores/business.store";
import {
  useCompletePickupMutation,
  useConfirmHandoverMutation,
  useAssignRiderMutation,
  useCancelOrderMutation,
  useConfirmCashPaymentMutation,
} from "@/hooks/seller.hooks";
import { CachedAvatarImage } from "@/components/ui/CachedAvatarImage";
import { usePOSPaymentFlow } from "@/hooks/usePOSPaymentFlow";
import {
  enabledPosPaymentMethods,
  usePaymentSettingsQuery,
} from "@/hooks/usePaymentSettings";
import { printService } from "@/services/print.service";
import { paymentService } from "@/services/payment.service";
import type { MomoProvider, MomoQuote } from "@/types/payment";
import type {
  MenuItem,
  MenuItemVariantResponse,
  MenuItemAddonResponse,
} from "@teincfood/core";
import type { SellerOrder } from "@teincfood/core";
import type {
  POSTab,
  POSOrderType,
  POSPaymentMethod,
  POSCartItem,
} from "@teincfood/core";
import {
  FoodCard,
  CashPaymentSheet,
  PaymentProcessingModal,
} from "@/components/pos";
import {
  PendingOrderCard,
  PreparingOrderCard,
  ReadyOrderCard,
  RiderSelectionSheet,
} from "@/components/kiosk";
import { Badge } from "@/components/ui/Badge";
import { CachedImage } from "@/components/ui/CachedImage";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { ReceiptPreviewSheet } from "@/components/orders/ReceiptPreviewSheet";
import { FlatList } from "react-native-gesture-handler";
import { Button } from "@/components/ui";

export default function POSTerminal() {
  const [activeTab, setActiveTab] = useState<POSTab>("new_order");
  const [exiting, setExiting] = useState(false);
  const router = useRouter();
  const isBiometricEnabled = useSecurityStore((s) => s.isBiometricEnabled);
  const insets = useSafeAreaInsets();

  useKeepAwake();
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
  const [view, setView] = useState<"menu" | "cart" | "checkout">("menu");

  if (isTablet && isLandscape) {
    return (
      <XStack flex={1}>
        <YStack flex={0.6}>
          <MenuBrowser />
        </YStack>
        <YStack flex={0.4} borderLeftWidth={1} borderLeftColor="$borderColor">
          {view === "checkout" ? (
            <CheckoutPanel onBack={() => setView("cart")} />
          ) : (
            <CartPanel onCheckout={() => setView("checkout")} />
          )}
        </YStack>
      </XStack>
    );
  }

  return (
    <YStack flex={1}>
      {view === "checkout" ? (
        <CheckoutPanel onBack={() => setView("cart")} />
      ) : view === "cart" ? (
        <CartPanel
          onBack={() => setView("menu")}
          onCheckout={() => setView("checkout")}
        />
      ) : (
        <YStack flex={1}>
          <YStack flex={1}>
            <MenuBrowser />
          </YStack>
          {items.length > 0 && <CartBar onCheckout={() => setView("cart")} />}
        </YStack>
      )}
    </YStack>
  );
}

// ── Menu Browser ────────────────────────────────────────────────────────────

function MenuBrowser() {
  const { isTablet, isLandscape, width } = useResponsive();
  const isTabletLandscape = isTablet && isLandscape;
  const foodColumns = isTablet ? 3 : 2;
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const effectiveWidth =
    measuredWidth ?? (isTabletLandscape ? width * 0.6 : width);
  const cardWidth =
    (effectiveWidth - 40 - (foodColumns - 1) * 16) / foodColumns;

  const { data: categories } = useMenuCategoriesQuery();
  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (activeCategoryId) f.category_ids = activeCategoryId;
    if (searchQuery) f.search = searchQuery;
    return f;
  }, [activeCategoryId, searchQuery]);
  const { data: menuItems, isPending: menuPending } =
    useMenuItemsQuery(filters);

  const categoryList = useMemo(() => categories?.data ?? [], [categories]);
  const itemsList = useMemo(() => menuItems ?? [], [menuItems]);

  return (
    <YStack
      flex={1}
      onLayout={(e: any) => setMeasuredWidth(e.nativeEvent.layout.width)}
    >
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
      {menuPending ? (
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
          columnWrapperStyle={foodColumns > 1 ? { gap: 16 } : undefined}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 20,
            paddingBottom: 40,
            gap: 16,
          }}
          renderItem={({ item }) => (
            <YStack width={cardWidth}>
              <FoodCard item={item} />
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

  const insets = useSafeAreaInsets();
  return (
    <XStack
      width="100%"
      padding="$4"
      paddingBottom={insets.bottom ? insets.bottom + 12 : 16}
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

function CartPanel({
  onCheckout,
  onBack,
}: {
  onCheckout: () => void;
  onBack?: () => void;
}) {
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
          {onBack ? (
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
          ) : (
            <ArrowLeft size={20} color="$color" />
          )}
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
                  <CachedImage
                    source={{ uri: item.menu_item.image_url }}
                    style={{ width: "100%", height: "100%" }}
                    placeholder={<Utensils size={20} color="$colorSecondary" />}
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
  const [showClosedDialog, setShowClosedDialog] = useState(false);
  const [momoPhone, setMomoPhone] = useState("");
  const [momoProvider, setMomoProvider] = useState<MomoProvider>("mtn");
  const [momoQuote, setMomoQuote] = useState<MomoQuote | null>(null);
  const router = useRouter();
  const paymentFlow = usePOSPaymentFlow();
  const isCloudReachable = useConnectivityStore(
    (s) => s.isCloudReachable === "reachable",
  );
  const previewOrder = usePOSOrderPreviewQuery(
    items,
    checkoutForm.order_type,
    checkoutForm.customer_name,
  );
  const { data: taxRules } = useBusinessTaxRulesQuery(true);
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const paymentSettingsQuery = usePaymentSettingsQuery(activeBusiness?.id);
  const enabledPaymentMethods = useMemo(
    () => enabledPosPaymentMethods(paymentSettingsQuery.data?.data),
    [paymentSettingsQuery.data],
  );
  const enabledPaymentMethodKey = enabledPaymentMethods.join("|");
  const hasUsablePaymentMethod = enabledPaymentMethods.some(
    (method) => method !== "mobile_money" || isCloudReachable,
  );
  const businessOpen = useBusinessOpenNow(activeBusiness?.id, true, "pos");
  const isBusinessClosed =
    !!activeBusiness?.id &&
    !businessOpen.isLoading &&
    businessOpen.data &&
    !businessOpen.data.open;
  // Hard-block copy for the closed dialog — reason-aware so staff know
  // whether to flip the store toggle or fix operating hours.
  const closedDialogDescription =
    businessOpen.data?.reason === "manually_closed"
      ? "This store is manually closed. No new orders can be placed until it is reopened."
      : businessOpen.data?.reason === "no_hours_configured"
        ? "Operating hours are not set yet. Configure them to start accepting orders."
        : "This store is outside its operating hours. No new orders can be placed right now.";

  // Server-parity local pricing (offline/no-preview fallback):
  // mirrors backend calculate_pos_pricing so inclusive taxes stay embedded in
  // item prices and only exclusive taxes are added to the total.
  const localPricing = useMemo(() => {
    if (items.length === 0) return null;
    try {
      const currency =
        (
          activeBusiness as unknown as {
            currency?: string;
            currency_code?: string;
          }
        )?.currency ??
        (activeBusiness as unknown as { currency_code?: string })
          ?.currency_code ??
        "GHS";
      return calculatePricing({
        items,
        taxRules: taxRules?.data ?? [],
        currency_code: currency,
      });
    } catch {
      return null;
    }
  }, [
    items,
    taxRules,
    (activeBusiness as unknown as { currency?: string })?.currency,
    (activeBusiness as unknown as { currency_code?: string })?.currency_code,
  ]);

  const serverPricing = previewOrder.data?.data;
  // Prefer the authoritative cloud preview; fall back to the local engine.
  const total = serverPricing?.total_minor ?? localPricing?.total_minor ?? 0;
  const taxLines = serverPricing?.tax_lines ?? localPricing?.tax_lines ?? [];
  const payableTotal =
    checkoutForm.pos_payment_method === "mobile_money" && momoQuote
      ? momoQuote.total_minor
      : total;
  const showLocalPricing = !serverPricing && !!localPricing;

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
  }[] = (
    [
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
        description: isCloudReachable
          ? "Approve prompt on customer phone"
          : "Requires internet",
        disabled: !isCloudReachable,
      },
    ] as const
  ).filter((method) => enabledPaymentMethods.includes(method.key));

  // Prefill the customer's phone when the teller has already captured it.
  useEffect(() => {
    if (!momoPhone && checkoutForm.customer_phone) {
      setMomoPhone(checkoutForm.customer_phone);
    }
  }, [checkoutForm.customer_phone, momoPhone]);

  // Show the customer-paid MoMo fee before the order is placed.
  useEffect(() => {
    if (
      checkoutForm.pos_payment_method !== "mobile_money" ||
      !activeBusiness?.id ||
      total <= 0
    ) {
      setMomoQuote(null);
      return;
    }

    let cancelled = false;
    paymentService
      .getMomoQuote({ business_id: activeBusiness.id, amount_minor: total })
      .then((response) => {
        if (!cancelled) setMomoQuote(response.data);
      })
      .catch(() => {
        if (!cancelled) setMomoQuote(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activeBusiness?.id, checkoutForm.pos_payment_method, total]);

  // Switch away from a method the merchant disabled in Payment Settings.
  useEffect(() => {
    if (enabledPaymentMethods.length === 0) return;
    if (!enabledPaymentMethods.includes(checkoutForm.pos_payment_method)) {
      updateCheckoutForm({ pos_payment_method: enabledPaymentMethods[0] });
    }
  }, [
    enabledPaymentMethodKey,
    enabledPaymentMethods,
    checkoutForm.pos_payment_method,
    updateCheckoutForm,
  ]);

  // Switch to cash automatically when mobile money is selected offline.
  useEffect(() => {
    if (
      !isCloudReachable &&
      checkoutForm.pos_payment_method === "mobile_money"
    ) {
      const cashEnabled = enabledPaymentMethods.includes("cash");
      if (cashEnabled) {
        updateCheckoutForm({ pos_payment_method: "cash" });
      }
    }
  }, [
    isCloudReachable,
    checkoutForm.pos_payment_method,
    updateCheckoutForm,
    enabledPaymentMethods,
  ]);

  const executePlaceOrder = useCallback(() => {
    // Re-check after the cash sheet: hours may have flipped while it was open.
    if (isBusinessClosed) {
      setShowClosedDialog(true);
      return;
    }
    const { autoPrint } = usePrinterStore.getState();

    const subtotalMinor =
      serverPricing?.subtotal_minor ?? localPricing?.subtotal_minor ?? total;
    const taxMinor = serverPricing?.tax_minor ?? localPricing?.tax_minor ?? 0;

    const orderItems = items.map((i) => ({
      menu_item_id: i.menu_item.id,
      quantity: i.quantity,
      variant_id: i.selected_variant?.id,
      addon_ids:
        i.selected_addons.length > 0
          ? i.selected_addons.map((a) => a.addon_id)
          : undefined,
    }));
    // Canonical sale-time snapshots (core contract): variant + addon
    // names are embedded so history never re-resolves the menu.
    const itemSnapshots = buildItemSnapshots(items as never);

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
        total_minor: total,
        subtotal_minor: subtotalMinor,
        tax_minor: taxMinor,
        tax_lines: taxLines,
        items: orderItems,
        item_snapshots: itemSnapshots,
      } as unknown as Parameters<typeof createOrder.mutate>[0],
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
            useCustomerDisplayStore.getState().showConfirmation({
              orderNumber: response.order_number,
              totalMinor: response.total_minor ?? total,
              currency:
                (
                  useBusinessStore.getState().activeBusiness as unknown as {
                    currency?: string;
                  }
                )?.currency ?? "GHS",
            });
          } else {
            if (autoPrint) {
              setLastCompletedOrderId(orderId);
            }
            useCustomerDisplayStore.getState().setPaymentStatus("processing");
            paymentFlow.startCheckout(orderId, total, {
              phone: momoPhone,
              provider: momoProvider,
            });
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
          // Lib hours-guard rejections are coded — hard-block with a dialog
          // that routes staff to operating hours (covers stale-cache races
          // where the online check passed but the guard rejected after).
          const code = (error as { code?: string })?.code;
          if (code === "BUSINESS_CLOSED" || code === "HOURS_NOT_SYNCED") {
            setShowClosedDialog(true);
          } else {
            toast.error(
              error instanceof Error ? error.message : "Failed to place order",
            );
          }
        },
      },
    );
  }, [
    isBusinessClosed,
    items,
    checkoutForm,
    createOrder,
    clearAll,
    total,
    paymentFlow.startCheckout,
  ]);

  const handlePlaceOrder = useCallback(() => {
    if (isBusinessClosed) {
      setShowClosedDialog(true);
      return;
    }
    if (!enabledPaymentMethods.includes(checkoutForm.pos_payment_method)) {
      toast.error("This payment method is disabled in Payment Settings");
      return;
    }
    if (
      checkoutForm.pos_payment_method === "mobile_money" &&
      !isCloudReachable
    ) {
      toast.error("Mobile money requires an internet connection");
      if (enabledPaymentMethods.includes("cash")) {
        updateCheckoutForm({ pos_payment_method: "cash" });
      }
      return;
    }

    if (
      checkoutForm.pos_payment_method === "mobile_money" &&
      momoPhone.replace(/\D/g, "").length < 9
    ) {
      toast.error("Enter the customer mobile-money number");
      return;
    }

    if (checkoutForm.pos_payment_method === "cash") {
      setShowCashSheet(true);
    } else {
      executePlaceOrder();
    }
  }, [
    isBusinessClosed,
    checkoutForm.pos_payment_method,
    isCloudReachable,
    executePlaceOrder,
    updateCheckoutForm,
    enabledPaymentMethods,
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

  // ── Customer display (secondary screen) ──
  useEffect(() => {
    useCustomerDisplayStore
      .getState()
      .beginPayment(checkoutForm.pos_payment_method as never);
    return () => useCustomerDisplayStore.getState().reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const s = paymentFlow.state;
    const currency =
      (activeBusiness as unknown as { currency?: string })?.currency ?? "GHS";
    if (s === "awaiting_confirmation") {
      useCustomerDisplayStore.getState().setPaymentStatus("processing");
    } else if (s === "failed") {
      useCustomerDisplayStore.getState().setPaymentStatus("failed");
    } else if (s === "success" && lastOrderNumber) {
      useCustomerDisplayStore.getState().showConfirmation({
        orderNumber: lastOrderNumber,
        totalMinor: total,
        currency,
      });
    }
  }, [paymentFlow.state, lastOrderNumber, total, activeBusiness]);

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
                        : () => {
                            updateCheckoutForm({ pos_payment_method: pm.key });
                            useCustomerDisplayStore
                              .getState()
                              .beginPayment(pm.key as never);
                          }
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
            {paymentMethods.length === 0 ? (
              <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
                No POS payment methods are enabled. Turn on Cash or Mobile
                Money in Settings → Payment.
              </Text>
            ) : null}
          </YStack>

          {checkoutForm.pos_payment_method === "mobile_money" ? (
            <YStack
              gap="$3"
              padding="$4"
              backgroundColor="$backgroundStrong"
              borderRadius="$5"
            >
              <Text
                fontSize="$4"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                Customer Mobile Money
              </Text>
              <XStack gap="$2">
                {[
                  { key: "mtn" as MomoProvider, label: "MTN" },
                  { key: "vod" as MomoProvider, label: "Telecel" },
                  { key: "atl" as MomoProvider, label: "AirtelTigo" },
                ].map((provider) => {
                  const selected = momoProvider === provider.key;
                  return (
                    <YStack
                      key={provider.key}
                      flex={1}
                      alignItems="center"
                      paddingVertical="$3"
                      borderRadius="$3"
                      borderWidth={1}
                      borderColor={selected ? "$primary" : "$borderColor"}
                      backgroundColor={
                        selected ? "$primary" : "$backgroundSoft"
                      }
                      onPress={() => setMomoProvider(provider.key)}
                    >
                      <Text
                        fontSize="$2"
                        fontWeight="700"
                        fontFamily="$body"
                        color={selected ? "white" : "$color"}
                      >
                        {provider.label}
                      </Text>
                    </YStack>
                  );
                })}
              </XStack>
              <Input
                value={momoPhone}
                onChangeText={setMomoPhone}
                placeholder="Customer MoMo number (e.g. 0551234987)"
                keyboardType="phone-pad"
                backgroundColor="$backgroundSoft"
                borderWidth={0}
                height={48}
              />
              <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                The customer approves the prompt on their phone. No browser is
                opened.
              </Text>
            </YStack>
          ) : null}

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
            {previewOrder.isFetching && isCloudReachable && (
              <XStack justifyContent="center" alignItems="center" gap="$2">
                <Spinner size="small" color="$colorSecondary" />
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Calculating...
                </Text>
              </XStack>
            )}
            <Separator marginVertical="$2" borderColor="$borderColor" />
            {(serverPricing || showLocalPricing) && (
              <>
                {taxLines.map((tl) => (
                  <XStack
                    key={tl.id ?? tl.name}
                    justifyContent="space-between"
                    alignItems="center"
                    gap="$2"
                  >
                    <Text
                      fontSize="$4"
                      fontFamily="$body"
                      color="$colorSecondary"
                      flexShrink={1}
                    >
                      {showLocalPricing && tl.is_inclusive
                        ? `${tl.name} (included)`
                        : tl.name}
                    </Text>
                    <Text
                      fontSize="$4"
                      fontFamily="$body"
                      color={
                        tl.is_inclusive ? "$colorMuted" : "$colorSecondary"
                      }
                    >
                      {formatPriceFromMinor(tl.tax_amount_minor ?? 0)}
                    </Text>
                  </XStack>
                ))}
                {taxLines.length === 0 &&
                  (serverPricing?.tax_minor ?? localPricing?.tax_minor ?? 0) >
                    0 && (
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
                        {formatPriceFromMinor(
                          serverPricing?.tax_minor ??
                            localPricing?.tax_minor ??
                            0,
                        )}
                      </Text>
                    </XStack>
                  )}
              </>
            )}
            {checkoutForm.pos_payment_method === "mobile_money" && momoQuote ? (
              <>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize="$4"
                    fontFamily="$body"
                    color="$colorSecondary"
                  >
                    Mobile Money Charge
                  </Text>
                  <Text
                    fontSize="$4"
                    fontFamily="$body"
                    color="$colorSecondary"
                  >
                    {formatPriceFromMinor(momoQuote.fee_minor)}
                  </Text>
                </XStack>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize="$4"
                    fontFamily="$body"
                    color="$colorSecondary"
                  >
                    Order Total
                  </Text>
                  <Text
                    fontSize="$4"
                    fontFamily="$body"
                    color="$colorSecondary"
                  >
                    {formatPriceFromMinor(total)}
                  </Text>
                </XStack>
              </>
            ) : null}
            <Separator marginVertical="$2" borderColor="$borderColor" />
            <XStack justifyContent="space-between" alignItems="center">
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
              >
                {checkoutForm.pos_payment_method === "mobile_money"
                  ? "Pay Total"
                  : "Total"}
              </Text>
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$primary"
              >
                {formatPriceFromMinor(
                  checkoutForm.pos_payment_method === "mobile_money" &&
                    momoQuote
                    ? momoQuote.total_minor
                    : total,
                )}
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
          disabled={
            createOrder.isPending ||
            isBusinessClosed ||
            !hasUsablePaymentMethod
          }
          pressStyle={{ opacity: 0.8 }}
          onPress={handlePlaceOrder}
        >
          {createOrder.isPending ? (
            <Spinner size="small" color="white" />
          ) : isBusinessClosed ? (
            "Business Closed"
          ) : !hasUsablePaymentMethod ? (
            "No Payment Method"
          ) : (
            `Place Order — ${formatPriceFromMinor(payableTotal)}`
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
        amountMinor={momoQuote?.total_minor ?? total}
        nextAction={paymentFlow.nextAction}
        displayText={paymentFlow.displayText}
        isSubmittingOtp={paymentFlow.isSubmittingOtp}
        onSubmitOtp={paymentFlow.submitOtp}
        onClose={paymentFlow.reset}
      />

      <AppAlertDialog
        open={showClosedDialog}
        onOpenChange={setShowClosedDialog}
        title="Business Closed"
        description={closedDialogDescription}
        confirmText="View Operating Hours"
        cancelText="Close"
        onConfirm={() => {
          setShowClosedDialog(false);
          router.push("/(shared)/settings/operating-hours");
        }}
      />
    </YStack>
  );
}

// ── In Progress Tab (kiosk-style responsive grid) ──────────────────────────

const getTimeSince = (dateString: string | null | undefined): number => {
  if (!dateString) return 0;
  return Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
};

/**
 * Shared rider-assignment flow for POS tabs (In Progress + Today).
 * Delivery assign is strictly online: the sheet lists live riders, select
 * assigns via POST /deliveries/assign, failures toast loudly (code-surfaced).
 */
function useRiderAssign() {
  const [showRiderSheet, setShowRiderSheet] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const assignRider = useAssignRiderMutation();
  const { data: riders } = useAvailableRidersQuery(showRiderSheet);
  const openFor = useCallback((orderId: string) => {
    setSelectedOrderId(orderId);
    setShowRiderSheet(true);
  }, []);
  const handleSelectRider = useCallback(
    async (riderId: string) => {
      if (!selectedOrderId) return;
      const orderId = selectedOrderId;
      setShowRiderSheet(false);
      setSelectedOrderId(null);
      try {
        await assignRider.mutateAsync({ orderId, riderId });
        toast.success("Rider assigned");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to assign rider");
      }
    },
    [selectedOrderId, assignRider],
  );
  const sheet = (
    <RiderSelectionSheet
      visible={showRiderSheet}
      onClose={() => {
        setShowRiderSheet(false);
        setSelectedOrderId(null);
      }}
      riders={(riders as any) ?? []}
      onSelectRider={handleSelectRider}
    />
  );
  return { openFor, sheet };
}

function POSReadyCard({
  order,
  onPrint,
  onCompletePickup,
  onAssignRider,
  onHandover,
  onCancel,
}: {
  order: SellerOrder;
  onPrint?: (id: string) => void;
  onCompletePickup?: (id: string) => void;
  onAssignRider?: (id: string) => void;
  onHandover?: (deliveryId: string) => void;
  onCancel?: (order: SellerOrder) => void;
}) {
  const callout =
    (order as any).callout_number ?? order.order_number?.slice(-3) ?? "";
  // Single source: delivery = order_type delivery OR delivery_id present.
  // Never offer complete-pickup for delivery (backend 422 INVALID_TRANSITION).
  const isDelivery = isDeliveryOrder(order as any);
  const hasDelivery = !!(order as any).delivery_id;
  const minutes = order.inserted_at
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(order.inserted_at).getTime()) / 60000,
        ),
      )
    : 0;
  return (
    <Card
      padding="$4"
      bordered
      backgroundColor="$green2"
      borderColor="$success"
      borderWidth={1}
    >
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$6" fontWeight="bold">
            {order.order_number}
          </Text>
          <XStack gap="$2" alignItems="center">
            <Clock size={14} color="$colorMuted" />
            <Text fontSize="$2" color="$colorMuted">
              {minutes}m ago
            </Text>
          </XStack>
        </XStack>
        <Badge backgroundColor="$success" size="$2" alignSelf="flex-start">
          <Text color="white" fontSize="$1" fontWeight="bold">
            READY
          </Text>
        </Badge>
        {callout ? (
          <Text fontSize="$2" color="$primary" fontWeight="700">
            Callout #{callout}
          </Text>
        ) : null}
        {order.customer_name ? (
          <XStack gap="$1" alignItems="center">
            <User size={14} color="$colorMuted" />
            <Text fontSize="$3" color="$colorMuted">
              {order.customer_name}
            </Text>
          </XStack>
        ) : null}
        <YStack gap="$1">
          {(order.items || []).map((item: any) => {
            const variantName =
              item.variant_name || item.selected_variant?.name;
            const addons = item.addons || item.selected_addons || [];
            return (
              <YStack key={item.id} gap="$1">
                <XStack justifyContent="space-between">
                  <Text fontSize="$3" flex={1} numberOfLines={2}>
                    {item.quantity}x {item.menu_item?.name || item.name}{" "}
                    {variantName ? `· ${variantName}` : ""}
                  </Text>
                  <Text fontSize="$3" color="$colorMuted">
                    {formatPriceFromMinor(
                      item.subtotal ?? item.unit_price * item.quantity,
                      (order as any).currency,
                    )}
                  </Text>
                </XStack>
                {addons.length > 0 && (
                  <Text fontSize="$2" color="$colorMuted" paddingLeft="$2">
                    + {addons.map((a: any) => a.name).join(", ")}
                  </Text>
                )}
              </YStack>
            );
          })}
        </YStack>
        {order.notes ? (
          <XStack gap="$2" alignItems="flex-start">
            <FileText size={14} color="$info" />
            <Text fontSize="$2" color="$info" flex={1}>
              {order.notes}
            </Text>
          </XStack>
        ) : null}
        <Separator />
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="bold" color="$primary">
            {formatPriceFromMinor(
              (order as any).total_minor,
              (order as any).currency,
            )}
          </Text>
          <XStack gap="$2" alignItems="center">
            {onPrint && (
              <Button
                height={32}
                width={36}
                padding={0}
                variant="outline"
                borderColor="$borderColor"
                backgroundColor="$background"
                onPress={() => onPrint(order.id)}
              >
                <Printer size={14} color="$color" />
              </Button>
            )}
          </XStack>
        </XStack>
        <XStack gap="$2" flexWrap="wrap">
          {isDelivery ? (
            hasDelivery && !(order as any).merchant_handover_confirmed_at ? (
              <Button
                height={36}
                paddingHorizontal="$3"
                backgroundColor="$primary"
                borderRadius="$3"
                onPress={() => onHandover?.((order as any).delivery_id!)}
              >
                <Text color="white" fontSize="$3" fontWeight="700">
                  Handover to rider
                </Text>
              </Button>
            ) : (
              <Button
                height={36}
                paddingHorizontal="$3"
                backgroundColor="$primary"
                borderRadius="$3"
                onPress={() => onAssignRider?.(order.id)}
              >
                <Text color="white" fontSize="$3" fontWeight="700">
                  Assign rider
                </Text>
              </Button>
            )
          ) : onCompletePickup ? (
            <Button
              height={36}
              paddingHorizontal="$3"
              backgroundColor="$primary"
              borderRadius="$3"
              onPress={() => onCompletePickup(order.id)}
            >
              <Text color="white" fontSize="$3" fontWeight="700">
                {(order as any).order_type === "dine_in"
                  ? "Complete"
                  : "Picked up"}
              </Text>
            </Button>
          ) : null}
          {onCancel ? (
            <Button
              height={36}
              paddingHorizontal="$3"
              backgroundColor="white"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$3"
              onPress={() => onCancel(order)}
            >
              <Text fontSize="$3" fontWeight="700" color="$error">
                Cancel
              </Text>
            </Button>
          ) : null}
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
  const completePickup = useCompletePickupMutation();
  const confirmHandover = useConfirmHandoverMutation();
  const cancelOrder = useCancelOrderMutation();
  const { isTablet, isLandscape } = useResponsive();
  const isTabletLandscape = isTablet && isLandscape;
  const { openFor: openRiderSheet, sheet: riderSheet } = useRiderAssign();

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

  // Only block on the very first load. Background refetches must not replace
  // the board with a full-screen spinner — that is the POS flicker operators
  // see while the queue polls.
  if (isFetching && !orders) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {isTabletLandscape ? (
        <XStack padding="$5" gap="$4" alignItems="flex-start">
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
                  onCompletePickup={(id) => completePickup.mutate(id)}
                  onAssignRider={openRiderSheet}
                  onHandover={(deliveryId) =>
                    confirmHandover.mutate(deliveryId)
                  }
                  onCancel={(o) => cancelOrder.mutate(o.id)}
                />
              ))
            )}
          </YStack>
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
                  onCompletePickup={(id) => completePickup.mutate(id)}
                  onAssignRider={openRiderSheet}
                  onHandover={(deliveryId) =>
                    confirmHandover.mutate(deliveryId)
                  }
                  onCancel={(o) => cancelOrder.mutate(o.id)}
                />
              ))
            )}
          </YStack>
        </YStack>
      )}
      {riderSheet}
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
  const { isTablet, isLandscape, width } = useResponsive();
  const isTabletLandscape = isTablet && isLandscape;
  const router = useRouter();
  const acceptOrder = useAcceptKioskOrderMutation();
  const startPreparing = useStartPreparingKioskOrderMutation();
  const markReady = useMarkKioskOrderReadyMutation();
  const completePickup = useCompletePickupMutation();
  const cancelOrder = useCancelOrderMutation();
  const confirmCashPayment = useConfirmCashPaymentMutation();
  const confirmHandover = useConfirmHandoverMutation();
  const { openFor: openRiderSheet, sheet: riderSheet } = useRiderAssign();
  const [previewOrder, setPreviewOrder] = useState<SellerOrder | null>(null);
  const previewSheet = (
    <ReceiptPreviewSheet
      open={previewOrder !== null}
      onOpenChange={(open) => {
        if (!open) setPreviewOrder(null);
      }}
      order={previewOrder}
    />
  );

  const allTodayOrders = useMemo(() => orders ?? [], [orders]);

  const ACTIVE_STATUSES = [
    "pending",
    "awaiting_payment",
    "accepted",
    "preparing",
    "ready",
  ];
  const COMPLETED_STATUSES = ["delivered", "cancelled"];

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

  // Tablet landscape table layout (row, not card) — mirrors desktop TodayTable
  const COL_ORDER_TODAY = 130;
  const COL_CUSTOMER_TODAY = 140;
  const COL_TYPE_TODAY = 90;
  const COL_PAYMENT_TODAY = 110;
  const COL_STATUS_TODAY = 120;
  const COL_DELIVERY_TODAY = 110;
  const COL_TIME_TODAY = 100;
  const COL_TOTAL_TODAY = 100;
  const COL_ACTIONS_TODAY = 264;
  const tableTotalToday =
    COL_ORDER_TODAY +
    COL_CUSTOMER_TODAY +
    COL_TYPE_TODAY +
    COL_PAYMENT_TODAY +
    COL_STATUS_TODAY +
    COL_DELIVERY_TODAY +
    COL_TIME_TODAY +
    COL_TOTAL_TODAY +
    COL_ACTIONS_TODAY +
    48;

  const statusBg = (status: string) => {
    if (["pending", "awaiting_payment"].includes(status)) return "#f59e0b";
    if (status === "accepted") return "#3b82f6";
    if (status === "preparing") return "#8b5cf6";
    if (status === "ready") return "#10b981";
    if (status === "delivered") return "#22c55e";
    if (status === "cancelled") return "#ef4444";
    return "#9ca3af";
  };

  const fmt = (st: string) =>
    st.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

  const todayTableHeader = (
    <XStack
      borderBottomWidth={2}
      borderBottomColor="$borderColor"
      paddingVertical="$3"
      paddingHorizontal="$4"
      backgroundColor="$backgroundSoft"
    >
      <Text
        fontWeight="bold"
        fontSize="$3"
        color="$colorMuted"
        width={COL_ORDER_TODAY}
      >
        Order
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$3"
        color="$colorMuted"
        width={COL_CUSTOMER_TODAY}
      >
        Customer
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$3"
        color="$colorMuted"
        width={COL_TYPE_TODAY}
      >
        Type
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$3"
        color="$colorMuted"
        width={COL_PAYMENT_TODAY}
      >
        Payment
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$3"
        color="$colorMuted"
        width={COL_STATUS_TODAY}
      >
        Status
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$3"
        color="$colorMuted"
        width={COL_DELIVERY_TODAY}
      >
        Delivery
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$3"
        color="$colorMuted"
        width={COL_TIME_TODAY}
      >
        Placed
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$3"
        color="$colorMuted"
        width={COL_TOTAL_TODAY}
        textAlign="right"
      >
        Total
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$3"
        color="$colorMuted"
        width={COL_ACTIONS_TODAY}
        textAlign="right"
      >
        Actions
      </Text>
    </XStack>
  );

  const renderTabletTodayRow = ({ item }: { item: SellerOrder }) => {
    const action = nextActionFor(item);
    const {
      name: customerName,
      avatarUrl,
      isWalkIn,
      tellerName,
    } = getCustomerDisplay(item as any);
    const handleAction = () => {
      if (!action) return;
      if (action.key === "accept") acceptOrder.mutate(item.id);
      if (action.key === "start_preparing") startPreparing.mutate(item.id);
      if (action.key === "mark_ready") markReady.mutate(item.id);
      // Walk-in only: nextActionFor never returns this for delivery orders.
      if (action.key === "complete_pickup") completePickup.mutate(item.id);
      // Delivery flow (strictly online): ready without rider → assign sheet,
      // ready/waiting_pickup with rider → merchant handover confirm.
      if (action.key === "assign_rider") openRiderSheet(item.id);
      if (action.key === "confirm_handover") {
        const deliveryId = (item as any).delivery_id as string | undefined;
        if (!deliveryId) {
          toast.error("No delivery assigned yet — assign a rider first");
          return;
        }
        confirmHandover.mutate(deliveryId);
      }
    };
    return (
      <XStack
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        paddingVertical="$3"
        paddingHorizontal="$4"
        alignItems="center"
      >
        <YStack width={COL_ORDER_TODAY}>
          <Text fontWeight="bold" fontSize="$3" numberOfLines={1}>
            {item.order_number}
          </Text>
          {item.callout_number != null && (
            <Text fontSize="$2" color="$colorMuted">
              #{item.callout_number}
            </Text>
          )}
        </YStack>
        <XStack width={COL_CUSTOMER_TODAY} gap="$2" alignItems="center">
          {avatarUrl ? (
            <CachedAvatarImage src={avatarUrl} size={24} borderRadius={12} />
          ) : (
            <YStack
              width={24}
              height={24}
              borderRadius={12}
              backgroundColor={isWalkIn ? "$orange5" : "$backgroundStrong"}
              alignItems="center"
              justifyContent="center"
            >
              <User size={12} color={isWalkIn ? "$orange10" : "$colorMuted"} />
            </YStack>
          )}
          <YStack flex={1} gap={0}>
            <Text fontSize="$3" numberOfLines={1} fontWeight="500">
              {customerName || "—"}
            </Text>
            {isWalkIn && tellerName && (
              <Text fontSize="$1" color="$colorMuted" numberOfLines={1}>
                Teller: {tellerName}
              </Text>
            )}
          </YStack>
        </XStack>
        <Text fontSize="$3" width={COL_TYPE_TODAY} numberOfLines={1}>
          {fmt((item.order_type ?? "pos") as string)}
        </Text>
        <YStack width={COL_PAYMENT_TODAY}>
          <Text fontSize="$3" numberOfLines={1}>
            {fmt(
              (item.pos_payment_method ??
                item.payment_mode ??
                "cash") as string,
            )}
          </Text>
          {isUnpaid(item) && (
            <Text fontSize="$2" fontWeight="700" color="$warning">
              UNPAID
            </Text>
          )}
        </YStack>
        <YStack width={COL_STATUS_TODAY} alignItems="center">
          <YStack
            backgroundColor={statusBg(item.status)}
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$full"
          >
            <Text
              fontSize="$2"
              color="white"
              fontWeight="700"
              numberOfLines={1}
            >
              {fmt(item.status)}
            </Text>
          </YStack>
        </YStack>
        <Text fontSize="$3" width={COL_DELIVERY_TODAY} numberOfLines={1}>
          {item.delivery_id ? (item.rider?.name ?? "Awaiting rider") : "—"}
        </Text>
        <Text
          fontSize="$3"
          color="$colorMuted"
          width={COL_TIME_TODAY}
          numberOfLines={1}
        >
          {formatDate(item.inserted_at)}
        </Text>
        <Text
          fontSize="$3"
          fontWeight="700"
          color="$primary"
          width={COL_TOTAL_TODAY}
          textAlign="right"
        >
          {formatPriceFromMinor(item.total_minor)}
        </Text>
        <XStack
          width={COL_ACTIONS_TODAY}
          justifyContent="flex-end"
          gap="$1"
          alignItems="center"
        >
          <Button
            size="$2"
            variant="outline"
            height={36}
            width={36}
            padding={0}
            icon={<Eye size={14} />}
            onPress={() => router.push(`/(seller)/orders/${item.id}`)}
          />
          <Button
            size="$2"
            variant="outline"
            height={36}
            width={36}
            padding={0}
            icon={<FileText size={14} />}
            onPress={() => setPreviewOrder(item)}
          />
          <Button
            size="$2"
            variant="outline"
            height={36}
            width={36}
            padding={0}
            icon={<Printer size={14} />}
            onPress={() => printService.printOrderReceipt(item.id)}
          />
          {action && (
            <Button
              size="$2"
              backgroundColor="$primary"
              borderRadius="$2"
              height={36}
              paddingHorizontal="$3"
              onPress={handleAction}
            >
              <Text color="white" fontSize="$2" fontWeight="700">
                {action.label}
              </Text>
            </Button>
          )}
          {isUnpaid(item) && item.status !== "cancelled" && (
            <Button
              size="$2"
              variant="outline"
              height={36}
              width={36}
              padding={0}
              icon={<Banknote size={14} />}
              onPress={() => confirmCashPayment.mutate(item.id)}
            />
          )}
          {isCancellable(item.status) && (
            <Button
              size="$2"
              variant="outline"
              height={36}
              width={36}
              padding={0}
              icon={<XCircle size={14} />}
              chromeless
              onPress={() => cancelOrder.mutate(item.id)}
            />
          )}
        </XStack>
      </XStack>
    );
  };

  if (isTabletLandscape) {
    return (
      <>
        <YStack flex={1} backgroundColor="$background">
          <YStack marginBottom="$2" paddingHorizontal="$5" paddingTop="$4">
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            <YStack width={tableTotalToday} flex={1}>
              {todayTableHeader}
              {allTodayOrders.length === 0 ? (
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
              ) : (
                <FlatList
                  data={sortedOrders}
                  keyExtractor={(item) => item.id}
                  renderItem={renderTabletTodayRow}
                  onEndReached={() => {
                    if (hasNextPage) fetchNextPage();
                  }}
                  onEndReachedThreshold={0.5}
                  refreshControl={
                    <RefreshControl
                      refreshing={isFetching}
                      onRefresh={refetch}
                      tintColor="$primary"
                    />
                  }
                  contentContainerStyle={{
                    paddingBottom: Math.max(insets.bottom + 20, 24),
                  }}
                  ListFooterComponent={
                    isFetchingNextPage ? (
                      <YStack padding="$4" alignItems="center">
                        <Spinner size="small" color="$primary" />
                      </YStack>
                    ) : null
                  }
                  initialNumToRender={20}
                  windowSize={10}
                  maxToRenderPerBatch={15}
                  removeClippedSubviews={false}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                />
              )}
            </YStack>
          </ScrollView>
        </YStack>
        {riderSheet}
        {previewSheet}
      </>
    );
  }

  return (
    <>
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
        renderItem={({ item, index }) => {
          const action = nextActionFor(item);
          const {
            name: customerName,
            avatarUrl,
            isWalkIn,
            tellerName,
          } = getCustomerDisplay(item as any);
          const handleAction = () => {
            if (!action) return;
            if (action.key === "accept") acceptOrder.mutate(item.id);
            if (action.key === "start_preparing")
              startPreparing.mutate(item.id);
            if (action.key === "mark_ready") markReady.mutate(item.id);
            // Walk-in only: nextActionFor never returns this for delivery orders.
            if (action.key === "complete_pickup")
              completePickup.mutate(item.id);
            // Delivery flow (strictly online): ready without rider → assign sheet,
            // ready/waiting_pickup with rider → merchant handover confirm.
            if (action.key === "assign_rider") openRiderSheet(item.id);
            if (action.key === "confirm_handover") {
              const deliveryId = (item as any).delivery_id as
                string | undefined;
              if (!deliveryId) {
                toast.error("No delivery assigned yet — assign a rider first");
                return;
              }
              confirmHandover.mutate(deliveryId);
            }
          };
          return (
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
                <YStack
                  paddingVertical="$2"
                  paddingHorizontal="$1"
                  marginTop="$2"
                >
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
                <YStack gap="$2">
                  <XStack
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <YStack flex={1} gap="$1">
                      <Text
                        fontWeight="700"
                        fontSize="$5"
                        fontFamily="$heading"
                        color="$color"
                      >
                        {item.order_number}
                      </Text>
                      {item.callout_number != null && (
                        <Text fontSize="$2" color="$primary" fontWeight="700">
                          Callout #{item.callout_number}
                        </Text>
                      )}
                      <XStack gap="$2" alignItems="center">
                        {avatarUrl ? (
                          <CachedAvatarImage
                            src={avatarUrl}
                            size={22}
                            borderRadius={11}
                          />
                        ) : (
                          <YStack
                            width={22}
                            height={22}
                            borderRadius={11}
                            backgroundColor={
                              isWalkIn ? "$orange5" : "$backgroundStrong"
                            }
                            alignItems="center"
                            justifyContent="center"
                          >
                            <User
                              size={11}
                              color={isWalkIn ? "$orange10" : "$colorMuted"}
                            />
                          </YStack>
                        )}
                        <YStack gap={0}>
                          <Text
                            fontSize="$3"
                            color="$colorSecondary"
                            fontWeight="500"
                          >
                            {customerName || "—"}
                          </Text>
                          {isWalkIn && tellerName && (
                            <Text fontSize="$1" color="$colorMuted">
                              Teller: {tellerName}
                            </Text>
                          )}
                        </YStack>
                      </XStack>
                      <Text fontSize="$2" color="$colorMuted">
                        {fmt((item.order_type ?? "pos") as string)} ·{" "}
                        {fmt(
                          (item.pos_payment_method ??
                            item.payment_mode ??
                            "cash") as string,
                        )}
                      </Text>
                      {item.delivery_id && (
                        <Text fontSize="$2" color="$colorMuted">
                          {item.rider?.name ?? "Awaiting rider"}
                        </Text>
                      )}
                      <Text fontSize="$2" color="$colorMuted">
                        {formatDate(item.inserted_at)}
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
                        backgroundColor={statusBg(item.status)}
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$full"
                      >
                        <Text fontSize="$2" color="white" fontWeight="700">
                          {fmt(item.status)}
                        </Text>
                      </YStack>
                      {isUnpaid(item) && (
                        <Text fontSize="$2" fontWeight="700" color="$warning">
                          UNPAID
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                  <Separator marginVertical="$1" borderColor="$borderColor" />
                  <XStack gap="$2" flexWrap="wrap" justifyContent="flex-end">
                    <Button
                      size="$2"
                      variant="outline"
                      icon={<Eye size={14} />}
                      onPress={() => router.push(`/(seller)/orders/${item.id}`)}
                    />
                    <Button
                      size="$2"
                      variant="outline"
                      icon={<FileText size={14} />}
                      onPress={() => setPreviewOrder(item)}
                    />
                    <Button
                      size="$2"
                      variant="outline"
                      icon={<Printer size={14} />}
                      onPress={() => printService.printOrderReceipt(item.id)}
                    />
                    {action && (
                      <Button
                        size="$2"
                        backgroundColor="$primary"
                        borderRadius="$2"
                        onPress={handleAction}
                      >
                        <Text color="white" fontSize="$2" fontWeight="700">
                          {action.label}
                        </Text>
                      </Button>
                    )}
                    {isUnpaid(item) && item.status !== "cancelled" && (
                      <Button
                        size="$2"
                        variant="outline"
                        icon={<Banknote size={14} />}
                        onPress={() => confirmCashPayment.mutate(item.id)}
                      />
                    )}
                    {isCancellable(item.status) && (
                      <Button
                        size="$2"
                        variant="outline"
                        icon={<XCircle size={14} />}
                        chromeless
                        onPress={() => cancelOrder.mutate(item.id)}
                      />
                    )}
                  </XStack>
                </YStack>
              </Card>
            </>
          );
        }}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />
      {riderSheet}
      {previewSheet}
    </>
  );
}
