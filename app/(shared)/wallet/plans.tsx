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
import { YStack, XStack, Text, Card, Spinner, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Crown, TicketPercent } from "@tamagui/lucide-icons";
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
  useUpdateSubscriptionMutation,
  useBillingQuery,
  useCheckoutSubscriptionMutation,
  useBusinessPromosQuery,
  useCreatePromoMutation,
  useDeletePromoMutation,
} from "@/hooks/useSubscription";
import { BillingCard } from "@/components/subscription/BillingCard";
import { MomoChargeSheet } from "@/components/subscription/MomoChargeSheet";
import { useEntitlements, useHasFeature } from "@/hooks/useEntitlements";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { useBusinessStore } from "@/stores/business.store";
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
    <YStack gap="$1">
      {entries.map(([key, value]) => {
        const label = FEATURE_LABELS[key] ?? key;
        const display =
          typeof value === "boolean"
            ? value
              ? `✓ ${label}`
              : `— ${label}`
            : `${label}: ${String(value)}`;
        return (
          <Text
            key={key}
            fontSize="$2"
            color="$colorSecondary"
            fontFamily="$body"
          >
            {display}
          </Text>
        );
      })}
    </YStack>
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
  const price =
    yearly && plan.yearly_fee_minor > 0
      ? `${formatMoney(plan.yearly_fee_minor, plan.currency)}/yr`
      : `${formatMoney(plan.monthly_fee_minor, plan.currency)}/mo`;
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
      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
        {`${plan.commission_rate_percent}% commission per order • ${plan.trial_days}d free trial`}
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

function PlanTab() {
  const plansQuery = useSubscriptionPlansQuery();
  const subQuery = useMySubscriptionQuery();
  const billingQuery = useBillingQuery();
  const update = useUpdateSubscriptionMutation();
  const checkout = useCheckoutSubscriptionMutation();
  const online = useIsEffectivelyOnline();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [yearly, setYearly] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlan | null>(null);

  const currentPlanId =
    (subQuery.data?.configuration.subscription_plan_id as string | null) ??
    null;
  // Single column, one card per row, ordered free → paid.
  const plans = useMemo(() => {
    const list = [...(plansQuery.data ?? subQuery.data?.available_plans ?? [])];
    list.sort((a, b) => a.monthly_fee_minor - b.monthly_fee_minor);
    return list;
  }, [plansQuery.data, subQuery.data]);
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
    const monthly = plan.monthly_fee_minor || 0;
    const yearlyPrice = plan.yearly_fee_minor || 0;
    const price = yearly && yearlyPrice > 0 ? yearlyPrice : monthly;
    const config = billingQuery.data?.configuration;
    const status = config?.subscription_status;

    if (price <= 0) {
      setSelecting(plan.id);
      update.mutate(plan.id, {
        onSuccess: () => {
          setSelecting(null);
          toast.success(`Plan updated to ${plan.name}`);
        },
        onError: (e) => {
          setSelecting(null);
          toast.error(e instanceof Error ? e.message : String(e));
        },
      });
      return;
    }

    // First-time users get the plan's trial without any payment setup. Mirror
    // the backend's first-time rule (status none + no current period) rather
    // than requiring a saved MoMo profile before the trial can start.
    const firstTimeTrial = status === "none" && !config?.current_period_end;
    if (firstTimeTrial) {
      setSelecting(plan.id);
      checkout.mutate(
        {
          plan_id: plan.id,
          cycle: yearly ? "year" : "month",
          start_trial: true,
        },
        {
          onSuccess: (response) => {
            setSelecting(null);
            if (response.charge) {
              // Stale plan state: the backend decided a charge is required.
              setPendingPlan(plan);
              toast.info("Enter your mobile-money number to continue.");
              return;
            }
            toast.success(`Trial started on ${plan.name}`);
            void billingQuery.refetch();
            void subQuery.refetch();
          },
          onError: (e) => {
            setSelecting(null);
            toast.error(e instanceof Error ? e.message : String(e));
          },
        },
      );
      return;
    }

    // Paid plan (new or change): the sheet collects the MoMo number; checkout
    // saves it to the billing profile and starts the charge.
    setPendingPlan(plan);
  };

  return (
    <>
      <FlatList
        data={plans}
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
            <BillingCard />
            <BillingPeriodToggle yearly={yearly} onChange={setYearly} />
          </YStack>
        }
        ListEmptyComponent={
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            {`No plans available right now.`}
          </Text>
        }
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            isCurrent={currentPlanId === item.id}
            isPopular={popularId === item.id && currentPlanId !== item.id}
            yearly={yearly}
            updating={
              (update.isPending || checkout.isPending) && selecting === item.id
            }
            onSelect={() => confirmSelect(item)}
          />
        )}
      />
      <MomoChargeSheet
        open={!!pendingPlan}
        title={
          pendingPlan ? `Switch to ${pendingPlan.name}` : "Subscription payment"
        }
        subtitle={
          pendingPlan
            ? `${formatMoney(
                yearly && pendingPlan.yearly_fee_minor > 0
                  ? pendingPlan.yearly_fee_minor
                  : pendingPlan.monthly_fee_minor,
                pendingPlan.currency,
              )} ${yearly ? "per year" : "per month"}`
            : undefined
        }
        baseMinor={
          pendingPlan
            ? yearly && pendingPlan.yearly_fee_minor > 0
              ? pendingPlan.yearly_fee_minor
              : pendingPlan.monthly_fee_minor
            : 0
        }
        feeMinor={
          pendingPlan
            ? Math.ceil(
                ((yearly && pendingPlan.yearly_fee_minor > 0
                  ? pendingPlan.yearly_fee_minor
                  : pendingPlan.monthly_fee_minor) *
                  (billingQuery.data?.configuration.momo_fee_basis_points ??
                    195)) /
                  10000,
              )
            : 0
        }
        currency={pendingPlan?.currency ?? "GHS"}
        defaultPhone={billingQuery.data?.billing_profile.momo_phone}
        defaultProvider={billingQuery.data?.billing_profile.momo_provider}
        onStart={async (nextPhone, nextProvider) => {
          if (!pendingPlan) return { charge: null, done: true };
          const response = await checkout.mutateAsync({
            plan_id: pendingPlan.id,
            cycle: yearly ? "year" : "month",
            start_trial: false,
            phone: nextPhone,
            provider: nextProvider,
          });
          return { charge: response.charge ?? null, done: !response.charge };
        }}
        onSuccess={() => {
          setPendingPlan(null);
          void billingQuery.refetch();
          void subQuery.refetch();
          void plansQuery.refetch();
          if (businessId) {
            void referenceSyncService
              .sync({
                businessId,
                keys: ["subscription:entitlements"],
                force: true,
              })
              .catch(() => undefined);
          }
          toast.success("Subscription payment confirmed");
        }}
        onClose={() => setPendingPlan(null)}
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
          {`Your current plan doesn't include promo campaigns. Switch plans to unlock discount codes for your customers.`}
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
  const [tab, setTab] = useState<Tab>(`plan`);

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={Math.max(insets.top + 8, 16)}
      width="100%"
      maxWidth={600}
      alignSelf="center"
    >
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
      <YStack paddingHorizontal="$4" gap="$3" flex={1}>
        <StatusBanner />
        <SectionTabs tab={tab} onChange={setTab} />
        <Separator />
        {tab === `plan` ? <PlanTab /> : <PromosTab />}
      </YStack>
    </YStack>
  );
}
