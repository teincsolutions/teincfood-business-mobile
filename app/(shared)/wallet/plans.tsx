// @ts-nocheck
import { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { YStack, XStack, Text, Card, Spinner, Separator } from "tamagui";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton, Button } from "@/components/ui";
import { useBusinessStore } from "@/stores/business.store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as subService from "@/services/subscription.service";
import { REFERENCE_KEYS } from "@/reference/hooks";
import { referenceSyncService } from "@/reference/service";

export default function PlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const qc = useQueryClient();
  const [selecting, setSelecting] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => subService.listSubscriptionPlans(),
    enabled: !!businessId,
  });

  const subQuery = useQuery({
    queryKey: ["my-subscription", businessId],
    queryFn: () => subService.fetchMySubscription(businessId!),
    enabled: !!businessId,
  });

  const update = useMutation({
    mutationFn: (planId: string) => subService.updateMySubscription(businessId!, { subscription_plan_id: planId, provider: "paystack" }),
    onSuccess: async () => {
      await subQuery.refetch();
      // Bust offline cache
      if (businessId) {
        await referenceSyncService.sync({ businessId, keys: ["subscription:entitlements"], force: true });
        qc.invalidateQueries({ queryKey: REFERENCE_KEYS.data("subscription:entitlements") });
      }
      Alert.alert("Plan updated", "Your subscription has been updated.");
      router.back();
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert("Failed", msg);
    },
  });

  if (plansQuery.isLoading || subQuery.isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  const currentPlanId = (subQuery.data?.configuration.subscription_plan_id as string | null) ?? null;
  const plans = plansQuery.data ?? subQuery.data?.available_plans ?? [];

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top + 8, 16)}>
      <XStack padding="$4" gap="$2" alignItems="center">
        <BackButton />
        <Text fontSize="$7" fontWeight="bold">Choose Plan</Text>
      </XStack>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text fontSize="$3" color="$colorSecondary">Online always has commission, offline has subscription — one plan covers both. Trial 30d same as Starter (3 menus, 1 member, 1 terminal).</Text>
        {plans.map((p) => {
          const isCurrent = currentPlanId === p.id;
          return (
            <Card key={p.id} bordered padding="$3" gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="600">{p.name}</Text>
                {isCurrent ? <Text fontSize="$2" color="$primary">Current</Text> : null}
              </XStack>
              <Text fontSize="$3" color="$colorSecondary">Commission {p.commission_rate_percent}% • GHS {(p.monthly_fee_minor/100).toFixed(2)}/mo • Trial {p.trial_days}d</Text>
              <Text fontSize="$2" color="$colorSecondary">Limits: {JSON.stringify(p.features)}</Text>
              <Button
                disabled={isCurrent || update.isPending}
                onPress={() => {
                  setSelecting(p.id);
                  update.mutate(p.id);
                }}
              >
                {isCurrent ? "Current plan" : update.isPending && selecting===p.id ? "Updating…" : "Select"}
              </Button>
            </Card>
          );
        })}
        {plans.length===0 ? <Text color="$colorSecondary">No plans available.</Text> : null}
      </ScrollView>
    </YStack>
  );
}
