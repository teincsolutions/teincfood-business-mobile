// @ts-nocheck — Tamagui stack props (alignItems/padding/etc.) don't typecheck
// under this repo's tsconfig; every other Tamagui screen uses the same escape.
import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Spinner,
  Separator,
  useMedia,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Crown, TicketPercent, X } from "@tamagui/lucide-icons";
import { BackButton, Button, FormInput } from "@/components/ui";
import { toast } from "sonner-native";
import {
  referenceSyncService,
  useIsEffectivelyOnline,
  type Promo,
} from "@teincfood/core";
import {
  useSubscriptionPlansQuery,
  useMySubscriptionQuery,
  useCheckoutSubscriptionMutation,
  useBusinessPromosQuery,
  useCreatePromoMutation,
  useDeletePromoMutation,
} from "@/hooks/useSubscription";
import { BillingCard } from "@/components/subscription/BillingCard";
import { useEntitlements, useHasFeature } from "@/hooks/useEntitlements";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { useBusinessStore } from "@/stores/business.store";
import { useRoleStore } from "@/stores/role.store";
import type { SubscriptionPlan } from "@/services/subscription.service";

type Tab = "plan" | "promos";

function formatMoney(minor: number, currency: string): string {
  return `${currency} ${(minor / 100).toFixed(2)}`;
}

const FEATURE_LABELS: Record<string, string> = {
  "analytics.overview": "Analytics overview",
  "analytics.sales_trends": "Sales trends",
  "analytics.channel_split": "Online vs local",
  "analytics.teller_performance": "Teller performance",
  "analytics.payment_methods": "Payment methods",
  "analytics.order_types": "Order types",
  "analytics.hourly_heatmap": "Hourly heatmap",
  "analytics.export": "Export reports",
  "analytics.scheduled_reports": "Scheduled reports",
  "seller.online_orders": "Online orders",
  "seller.pos.terminal": "POS terminal",
  "seller.promo": "Promo campaigns",
  "fleet.dispatch": "Dispatch",
  "limits.menu_items": "Menus",
  "limits.members": "Members",
  "limits.terminals_linked": "Terminals",
  "limits.promo_active": "Active promos",
  "limits.riders": "Riders",
  "limits.vehicles": "Vehicles",
};

function FeatureMatrix({ features }: { features: Record<string, unknown> }) {
  const media = useMedia();
  const twoColumns = media.md || media.lg;
  const entries = useMemo(
    () => Object.entries(features).filter(([key]) => key in FEATURE_LABELS),
    [features],
  );

  if (entries.length === 0) {
    return (
      <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
        {`Standard features included`}
      </Text>
    );
  }

  return (
    <XStack flexWrap="wrap" gap="$2">
      {entries.map(([key, value]) => {
        const label = FEATURE_LABELS[key] ?? key;
        const isBoolean = typeof value === "boolean";
        const included = value === true;

        return (
          <XStack
            key={key}
            width={twoColumns ? "48%" : "100%"}
            minHeight={28}
            alignItems="center"
            gap="$2"
          >
            {isBoolean ? (
              <YStack
                width={20}
                height={20}
                flexShrink={0}
                borderRadius={10}
                alignItems="center"
                justifyContent="center"
                backgroundColor={included ? "$green3" : "$backgroundSoft"}
              >
                {included ? (
                  <Check size={12} color="$green10" />
                ) : (
                  <X size={12} color="$colorMuted" />
                )}
              </YStack>
            ) : (
              <YStack
                minWidth={20}
                flexShrink={0}
                paddingHorizontal="$1.5"
                paddingVertical="$0.5"
                borderRadius="$2"
                alignItems="center"
                backgroundColor="$backgroundSoft"
              >
                <Text
                  fontSize="$1"
                  fontWeight="700"
                  color="$color"
                  fontFamily="$body"
                >
                  {String(value)}
                </Text>
              </YStack>
            )}
            <Text
              flex={1}
              fontSize="$2"
              color={included || !isBoolean ? "$color" : "$colorSecondary"}
              fontFamily="$body"
            >
              {label}
            </Text>
            {isBoolean ? (
              <Text
                flexShrink={0}
                fontSize="$1"
                fontWeight="700"
                color={included ? "$green10" : "$colorMuted"}
                fontFamily="$body"
              >
                {included ? `Included` : `Not included`}
              </Text>
            ) : null}
          </XStack>
        );
      })}
    </XStack>
  );
}

function SectionTabs({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  const options: { key: Tab; label: string }[] = [
    { key: `plan`, label: `Plan` },
    { key: `promos`, label: `Promos` },
  ];
  return (
    <XStack
      backgroundColor="$backgroundSoft"
      borderRadius="$4"
      padding="$1"
      gap="$1"
    >
      {options.map((opt) => {
        const active = tab === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={{ flex: 1 }}
            accessibilityRole={`tab`}
            accessibilityState={{ selected: active }}
          >
            <YStack
              alignItems="center"
              justifyContent="center"
              paddingVertical="$2"
              borderRadius="$3"
              backgroundColor={active ? `$primary` : `transparent`}
            >
              <Text
                fontSize="$4"
                fontWeight={active ? `700` : `400`}
                fontFamily="$heading"
                color={active ? `$white` : `$colorSecondary`}
              >
                {opt.label}
              </Text>
            </YStack>
          </TouchableOpacity>
        );
      })}
    </XStack>
  );
}

function BillingPeriodToggle({
  yearly,
  onChange,
}: {
  yearly: boolean;
  onChange: (y: boolean) => void;
}) {
  const options = [
    { key: false, label: `Monthly` },
    { key: true, label: `Yearly` },
  ];
  return (
    <XStack alignItems="center" justifyContent="center" gap="$4">
      {options.map((opt) => {
        const active = yearly === opt.key;
        return (
          <TouchableOpacity
            key={opt.label}
            onPress={() => onChange(opt.key)}
            accessibilityRole={`radio`}
            accessibilityState={{ selected: active }}
          >
            <YStack
              alignItems="center"
              gap="$1"
              paddingVertical="$1"
              paddingHorizontal="$2"
            >
              <Text
                fontSize="$3"
                fontWeight={active ? `700` : `400`}
                fontFamily="$body"
                color={active ? `$primary` : `$colorSecondary`}
              >
                {opt.label}
              </Text>
              <YStack
                height={2}
                width={32}
                borderRadius={1}
                backgroundColor={active ? `$primary` : `transparent`}
              />
            </YStack>
          </TouchableOpacity>
        );
      })}
    </XStack>
  );
}

function StatusBanner() {
  const { data, evaluation } = useEntitlements();
  const periodEnd = data?.["current_period_end"] as string | undefined;

  const { title, tone } = useMemo(() => {
    switch (evaluation.state) {
      case "trialing":
        return {
          title:
            periodEnd != null
              ? `Trial ends ${new Date(periodEnd).toLocaleDateString()}`
              : `Trial active`,
          tone: "$warning" as const,
        };
      case "active":
        return { title: `Subscription active`, tone: "$primary" as const };
      case "grace":
        return {
          title: `Payment overdue — renew soon to keep features`,
          tone: "$warning" as const,
        };
      case "expired":
        return {
          title: `Subscription expired — select a plan below`,
          tone: "$error" as const,
        };
      case "stale-blocked":
        return {
          title: `Reconnect to verify your subscription`,
          tone: "$error" as const,
        };
      case "no-plan":
        return {
          title: `No plan — pay-per-order rates apply`,
          tone: "$colorSecondary" as const,
        };
      default:
        return { title: evaluation.reason, tone: "$colorSecondary" as const };
    }
  }, [evaluation, periodEnd]);

  return (
    <Card padding="$3" bordered>
      <XStack gap="$2" alignItems="center">
        <Crown size={18} />
        <Text
          fontSize="$4"
          fontWeight="600"
          fontFamily="$heading"
          color="$color"
        >
          {`Status: ${String(data?.["subscription_status"] ?? evaluation.state)}`}
        </Text>
      </XStack>
      <Text fontSize="$3" color={tone} fontFamily="$body">
        {title}
      </Text>
      {evaluation.mustReconnect ? (
        <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
          {`Open this screen online to refresh your subscription`}
        </Text>
      ) : null}
    </Card>
  );
}

function PlanCard({
  plan,
  isCurrent,
  isPopular,
  yearly,
  updating,
  onSelect,
}: {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  isPopular: boolean;
  yearly: boolean;
  updating: boolean;
  onSelect: () => void;
}) {
  const monthlyMinor = plan.monthly_fee_minor || 0;
  const yearlyMinor = plan.yearly_fee_minor || 0;
  const hasYearly = yearlyMinor > 0;
  const isFree = monthlyMinor === 0 && yearlyMinor === 0;
  const price = isFree
    ? "Free"
    : yearly && hasYearly
      ? `${formatMoney(yearlyMinor, plan.currency)}/yr`
      : `${formatMoney(monthlyMinor, plan.currency)}/mo`;
  const secondaryPrice = isFree
    ? "No monthly or yearly charge"
    : yearly && hasYearly
      ? `Monthly: ${formatMoney(monthlyMinor, plan.currency)}/mo`
      : hasYearly
        ? `Yearly: ${formatMoney(yearlyMinor, plan.currency)}/yr`
        : "Yearly billing is not available for this plan";
  return (
    <Card
      bordered
      padding="$4"
      gap="$2"
      borderWidth={isCurrent || isPopular ? 2 : 1}
      borderColor={isCurrent ? `$primary` : isPopular ? `$warning` : undefined}
    >
      <XStack justifyContent="space-between" alignItems="center">
        <Text
          fontSize="$6"
          fontWeight="700"
          fontFamily="$heading"
          color="$color"
        >
          {plan.name}
        </Text>
        {isCurrent ? (
          <Text
            fontSize="$2"
            fontWeight="700"
            color="$primary"
            fontFamily="$body"
          >
            {`Current`}
          </Text>
        ) : isPopular ? (
          <Text
            fontSize="$2"
            fontWeight="700"
            color="$warning"
            fontFamily="$body"
          >
            {`Most popular`}
          </Text>
        ) : null}
      </XStack>
      <Text fontSize="$8" fontWeight="800" fontFamily="$heading" color="$color">
        {price}
      </Text>
      <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
        {secondaryPrice}
      </Text>
      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
        {`${plan.commission_rate_percent}% commission per order${plan.trial_days > 0 ? ` • ${plan.trial_days}d free trial` : ""}`}
      </Text>
      <Separator />
      <FeatureMatrix features={plan.features ?? {}} />
      {isCurrent ? null : (
        <Button loading={updating} disabled={updating} onPress={onSelect}>
          {updating ? `Updating…` : `Select ${plan.name}`}
        </Button>
      )}
    </Card>
  );
}

function PlanTab({
  onboarding = false,
  onDone,
}: {
  onboarding?: boolean;
  onDone?: () => void;
}) {
  const plansQuery = useSubscriptionPlansQuery();
  const subQuery = useMySubscriptionQuery();
  const checkout = useCheckoutSubscriptionMutation();
  const online = useIsEffectivelyOnline();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);

  const currentPlanId =
    (subQuery.data?.configuration.subscription_plan_id as string | null) ??
    null;
  // Single column, one card per row, ordered free → paid.
  const plans = useMemo(() => {
    const list = [...(plansQuery.data ?? subQuery.data?.available_plans ?? [])];
    list.sort((a, b) => a.monthly_fee_minor - b.monthly_fee_minor);
    return list;
  }, [plansQuery.data, subQuery.data]);
  const currentPlan = plans.find((plan) => plan.id === currentPlanId) ?? null;
  const popularId = useMemo(() => {
    const paid = plans.filter((p) => p.monthly_fee_minor > 0);
    if (paid.length === 0) return null;
    return paid.reduce((best, p) =>
      p.monthly_fee_minor > best.monthly_fee_minor ? p : best,
    ).id;
  }, [plans]);

  const isLoading = plansQuery.isLoading || subQuery.isLoading;
  const isError = plansQuery.isError || subQuery.isError;

  if (!online && plans.length === 0) {
    return (
      <YStack gap="$2" alignItems="center" padding="$4">
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
          {`You're offline. Plan and billing details need a connection — your current plan keeps working.`}
        </Text>
      </YStack>
    );
  }

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (isError) {
    return (
      <YStack gap="$3" alignItems="center" padding="$4">
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
          {`Couldn't load plans. Check your connection.`}
        </Text>
        <Button
          variant="outline"
          onPress={() => {
            void plansQuery.refetch();
            void subQuery.refetch();
          }}
        >
          {`Retry`}
        </Button>
      </YStack>
    );
  }

  const confirmSelect = (plan: SubscriptionPlan) => {
    setSelecting(plan.id);
    checkout.mutate(
      {
        plan_id: plan.id,
        cycle: yearly ? "year" : "month",
        // Paid plans create a bill; the free plan activates immediately.
        // Paying from Billing is a separate action, so a double tap can never
        // start two MoMo charges.
        start_trial: false,
        defer_payment: true,
      },
      {
        onSuccess: (response) => {
          setSelecting(null);
          if (response.status === "active") {
            toast.success(`${plan.name} is now your plan`);
          } else {
            toast.success("Bill created. Pay it from Billing when due.");
          }
          void subQuery.refetch();
          void plansQuery.refetch();
        },
        onError: (e) => {
          setSelecting(null);
          toast.error(e instanceof Error ? e.message : String(e));
        },
      },
    );
  };

  return (
    <>
      <FlatList
        data={plans}
        extraData={`${yearly}-${selecting}-${checkout.isPending}`}
        keyExtractor={(p) => p.id}
        numColumns={1}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={plansQuery.isRefetching || subQuery.isRefetching}
            onRefresh={() => {
              void plansQuery.refetch();
              void subQuery.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <YStack gap="$3">
            {onboarding ? null : <BillingCard />}
            <BillingPeriodToggle yearly={yearly} onChange={setYearly} />
          </YStack>
        }
        ListEmptyComponent={
          onboarding ? (
            <YStack gap="$3" alignItems="center" padding="$4">
              <Text
                fontSize="$3"
                color="$colorSecondary"
                textAlign="center"
                fontFamily="$body"
              >
                {`Plans couldn't load. Check your connection and retry.`}
              </Text>
              <Button
                variant="outline"
                onPress={() => {
                  void plansQuery.refetch();
                  void subQuery.refetch();
                }}
              >
                {`Retry`}
              </Button>
            </YStack>
          ) : (
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              {`No plans available right now.`}
            </Text>
          )
        }
        ListFooterComponent={
          onboarding ? (
            <YStack gap="$2" paddingTop="$2">
              {currentPlan ? (
                <Button onPress={() => onDone?.()}>
                  {`Continue with ${currentPlan.name}`}
                </Button>
              ) : (
                <Text
                  fontSize="$3"
                  color="$colorSecondary"
                  textAlign="center"
                  fontFamily="$body"
                >
                  {`Select a plan to finish setting up your business.`}
                </Text>
              )}
              <Text
                fontSize="$2"
                color="$colorMuted"
                textAlign="center"
                fontFamily="$body"
              >
                {`You can change plans later from Wallet → Plans.`}
              </Text>
            </YStack>
          ) : null
        }
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            isCurrent={currentPlanId === item.id}
            isPopular={popularId === item.id && currentPlanId !== item.id}
            yearly={yearly}
            updating={checkout.isPending && selecting === item.id}
            onSelect={() => confirmSelect(item)}
          />
        )}
      />
    </>
  );
}

function PromoRow({
  promo,
  onDelete,
  deleting,
}: {
  promo: Promo;
  onDelete?: () => void;
  deleting: boolean;
}) {
  const discount =
    promo.discount_percent != null
      ? `${promo.discount_percent}% off`
      : promo.discount_minor != null
        ? `${formatMoney(promo.discount_minor, `GHS`)} off`
        : `Discount`;
  const uses =
    promo.max_uses != null
      ? `Used ${promo.used_count}/${promo.max_uses}`
      : `Used ${promo.used_count} times`;

  return (
    <Card bordered padding="$3" gap="$1">
      <XStack justifyContent="space-between" alignItems="center">
        <Text
          fontSize="$5"
          fontWeight="600"
          fontFamily="$heading"
          color="$color"
        >
          {promo.code}
        </Text>
        <Text
          fontSize="$2"
          color={promo.is_active ? "$primary" : "$colorSecondary"}
          fontFamily="$body"
        >
          {promo.is_active ? `Active` : `Inactive`}
        </Text>
      </XStack>
      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
        {`${discount} • ${uses}`}
      </Text>
      {promo.expires_at ? (
        <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
          {`Expires ${new Date(promo.expires_at).toLocaleDateString()}`}
        </Text>
      ) : null}
      {onDelete ? (
        <Button
          variant="outline"
          loading={deleting}
          disabled={deleting}
          onPress={onDelete}
        >
          {deleting ? `Removing…` : `Remove`}
        </Button>
      ) : null}
    </Card>
  );
}

function PromosTab() {
  const canUsePromos = useHasFeature("seller.promo");
  const canManagePromos = useHasCapability("promos_manage");
  const promosQuery = useBusinessPromosQuery();
  const createPromo = useCreatePromoMutation();
  const deletePromo = useDeletePromoMutation();
  const [code, setCode] = useState(``);
  const [percent, setPercent] = useState(``);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!canUsePromos) {
    return (
      <YStack gap="$2" padding="$4">
        <Text
          fontSize="$4"
          fontWeight="600"
          fontFamily="$heading"
          color="$color"
        >
          {`Promo campaigns need a plan with promos`}
        </Text>
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
          {`Choose a plan to run promo campaigns and offer discount codes to your customers.`}
        </Text>
      </YStack>
    );
  }

  const submit = () => {
    const trimmedCode = code.trim().toUpperCase();
    const pct = Number(percent);
    if (!trimmedCode) {
      toast.error(`Enter a promo code`);
      return;
    }
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      toast.error(`Discount must be between 1 and 100%`);
      return;
    }
    createPromo.mutate(
      { code: trimmedCode, discount_percent: pct },
      {
        onSuccess: () => {
          setCode(``);
          setPercent(``);
          toast.success(`Promo ${trimmedCode} created`);
        },
        onError: (e) => {
          const msg = e instanceof Error ? e.message : String(e);
          toast.error(msg);
        },
      },
    );
  };

  const confirmDelete = (promo: Promo) => {
    Alert.alert(
      `Remove ${promo.code}?`,
      `Customers won't be able to use this code anymore.`,
      [
        { text: `Cancel`, style: `cancel` },
        {
          text: `Remove`,
          style: `destructive`,
          onPress: () => {
            setDeletingId(promo.id);
            deletePromo.mutate(promo.id, {
              onSuccess: () => {
                setDeletingId(null);
                toast.success(`Promo removed`);
              },
              onError: (e) => {
                setDeletingId(null);
                const msg = e instanceof Error ? e.message : String(e);
                toast.error(msg);
              },
            });
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={promosQuery.isRefetching}
          onRefresh={() => void promosQuery.refetch()}
        />
      }
    >
      <Card bordered padding="$3" gap="$2">
        <XStack gap="$2" alignItems="center">
          <TicketPercent size={18} />
          <Text
            fontSize="$4"
            fontWeight="600"
            fontFamily="$heading"
            color="$color"
          >
            {`New promo code`}
          </Text>
        </XStack>
        {canManagePromos ? (
          <>
            <FormInput
              label={`Code`}
              value={code}
              onChangeText={setCode}
              autoCapitalize={`characters`}
              placeholder={`FESTIVE10`}
            />
            <FormInput
              label={`Discount %`}
              value={percent}
              onChangeText={setPercent}
              keyboardType={`numeric`}
              placeholder={`10`}
            />
            <Button
              loading={createPromo.isPending}
              disabled={createPromo.isPending}
              onPress={submit}
            >
              {createPromo.isPending ? `Creating…` : `Create promo`}
            </Button>
          </>
        ) : (
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            {`Only business managers can create promo codes.`}
          </Text>
        )}
      </Card>
      {promosQuery.isLoading ? (
        <YStack alignItems="center" padding="$4">
          <Spinner size="large" />
        </YStack>
      ) : (
        <FlatList
          data={promosQuery.data ?? []}
          keyExtractor={(p) => p.id}
          numColumns={1}
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 12 }}
          ListEmptyComponent={
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              {`No promo codes yet. Create one above.`}
            </Text>
          }
          renderItem={({ item }) => (
            <PromoRow
              promo={item}
              deleting={deletePromo.isPending && deletingId === item.id}
              onDelete={canManagePromos ? () => confirmDelete(item) : undefined}
            />
          )}
        />
      )}
    </ScrollView>
  );
}

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const role = useRoleStore((s) => s.role);
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === "1";
  const [tab, setTab] = useState<Tab>(`plan`);

  const finishOnboarding = async () => {
    if (activeBusiness?.id) {
      try {
        await referenceSyncService.sync({
          businessId: activeBusiness.id,
          keys: ["subscription:entitlements"],
          force: true,
        });
      } catch {
        // The plan is already saved server-side; a later reconnect will sync
        // the entitlement proof. Never trap the user on this screen.
      }
    }
    router.replace(
      role === "fleet_manager"
        ? "/(fleet)/(drawer)/dashboard"
        : "/(seller)/(drawer)/dashboard",
    );
  };

  // Riders do not have business subscriptions. Guard deep links so they never
  // land on the seller/fleet plan picker.
  if (role === "rider") {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        paddingTop={Math.max(insets.top + 8, 16)}
        width="100%"
        maxWidth={600}
        alignSelf="center"
        paddingHorizontal="$4"
        gap="$4"
      >
        <XStack gap="$2" alignItems="center">
          <BackButton />
          <Text
            fontSize="$7"
            fontWeight="bold"
            fontFamily="$heading"
            color="$color"
          >
            Wallet
          </Text>
        </XStack>
        <Card padding="$5" bordered>
          <YStack gap="$3" alignItems="center">
            <Crown size={32} color="$colorMuted" />
            <Text
              fontSize="$5"
              fontWeight="700"
              textAlign="center"
              color="$color"
            >
              Subscriptions are for businesses
            </Text>
            <Text fontSize="$3" color="$colorSecondary" textAlign="center">
              As a rider you are paid per delivery, so there is no plan or
              subscription to manage here.
            </Text>
            <Button
              variant="primary"
              onPress={() => router.replace("/(shared)/wallet")}
            >
              Back to Wallet
            </Button>
          </YStack>
        </Card>
      </YStack>
    );
  }

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={Math.max(insets.top + 8, 16)}
      width="100%"
      maxWidth={600}
      alignSelf="center"
    >
      {isOnboarding ? (
        <YStack paddingHorizontal="$4" paddingBottom="$1" gap="$1">
          <XStack gap="$2" alignItems="center">
            <YStack
              width={30}
              height={30}
              borderRadius={15}
              alignItems="center"
              justifyContent="center"
              backgroundColor="$primaryLight"
            >
              <Crown size={16} color="$primary" />
            </YStack>
            <Text
              fontSize="$7"
              fontWeight="bold"
              fontFamily="$heading"
              color="$color"
            >
              {`Choose a plan`}
            </Text>
          </XStack>
          <Text
            fontSize="$3"
            color="$colorSecondary"
            fontFamily="$body"
          >
            {`Finish setting up ${activeBusiness?.name ?? "your business"}. Start on Free and upgrade whenever you're ready.`}
          </Text>
        </YStack>
      ) : (
        <XStack padding="$4" gap="$2" alignItems="center">
          <BackButton />
          <Text
            fontSize="$7"
            fontWeight="bold"
            fontFamily="$heading"
            color="$color"
          >
            {`Subscription & Plan`}
          </Text>
        </XStack>
      )}
      <YStack paddingHorizontal="$4" gap="$3" flex={1}>
        {isOnboarding ? null : <StatusBanner />}
        {isOnboarding ? null : (
          <SectionTabs tab={tab} onChange={setTab} />
        )}
        {isOnboarding ? null : <Separator />}
        {tab === `plan` ? (
          <PlanTab onboarding={isOnboarding} onDone={finishOnboarding} />
        ) : (
          <PromosTab />
        )}
      </YStack>
    </YStack>
  );
}
