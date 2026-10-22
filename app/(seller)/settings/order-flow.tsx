// @ts-nocheck
import { useEffect, useState } from "react";
import { ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import {
  YStack,
  XStack,
  Text,
  Card,
  Switch,
  Separator,
  Button as TamaguiButton,
  useMedia,
} from "tamagui";
import {
  ArrowLeft,
  ListOrdered,
  CheckCircle2,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  openSyncDatabase,
  getReferenceData,
  setBusinessProfileLocal,
} from "@teincfood/core";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { useConnectivityStore } from "@/stores/connectivity.store";
import * as businessService from "@/services/business.service";

/**
 * Terminal order flow (mobile parity with the desktop settings pane).
 *
 * "Full steps" keeps accept → preparing → ready → completed for orders taken
 * on a terminal / in this app. "Complete immediately" marks the sale completed
 * the moment it is rung up.
 *
 * Buyer-placed online orders always keep the full pipeline.
 */
export default function OrderFlowSettings() {
  const router = useRouter();
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const { activeBusiness, activeBusinessId } = useActiveBusiness();
  const queryClient = useQueryClient();
  const canEdit = useHasCapability("business_profile_manage");

  const [direct, setDirect] = useState(
    (activeBusiness as unknown as { pos_order_flow?: string })?.pos_order_flow ===
      "direct",
  );

  const isOnline = useConnectivityStore((s) => s.isOnline);
  const cloudReachable = useConnectivityStore((s) => s.isCloudReachable);
  const online = isOnline && cloudReachable !== "unreachable";

  // The cached business profile is the offline source of truth.
  useEffect(() => {
    let cancelled = false;
    if (!activeBusinessId) return;
    void (async () => {
      try {
        const db = await openSyncDatabase();
        const rec = await getReferenceData(db, activeBusinessId, "business:profile");
        const mode = rec?.payload?.data?.pos_order_flow;
        if (!cancelled && mode) setDirect(mode === "direct");
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [activeBusinessId]);

  const saveMutation = useMutation({
    mutationFn: async (mode: "staged" | "direct") => {
      // Local-first: core reads the flow from the cached profile, so the
      // setting must land in SQLite even when the device is offline.
      if (activeBusinessId) {
        try {
          const db = await openSyncDatabase();
          const rec = await getReferenceData(db, activeBusinessId, "business:profile");
          const profile = {
            ...(rec?.payload?.data ?? {}),
            pos_order_flow: mode,
          };
          await setBusinessProfileLocal(activeBusinessId, profile);
        } catch {}
      }
      if (online) {
        try {
          await businessService.updateBusiness(activeBusinessId!, {
            business: { pos_order_flow: mode },
          });
        } catch {
          // Local commit stands; the next reference sync converges it.
        }
      }
    },
    onSuccess: (_data, mode) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      Alert.alert(
        "Order flow updated",
        `${
          mode === "direct"
            ? "Terminal orders will now be completed immediately."
            : "Terminal orders will follow the full steps."
        }${online ? "" : "\n\nSaved on this device only — connect to apply it everywhere."}`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    },
    onError: () => Alert.alert("Error", "Failed to update the order flow"),
  });

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      {...(media.md || media.lg
        ? { maxWidth: 600, alignSelf: "center", width: "100%" }
        : {})}
    >
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 8, 24)}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <TamaguiButton
            width={40}
            height={40}
            circular
            backgroundColor="$backgroundSoft"
            onPress={() => router.back()}
            icon={<ArrowLeft size={20} color="$color" />}
          />
          <Text fontSize="$6" fontWeight="bold">
            Order Flow
          </Text>
        </XStack>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$4">
          {!canEdit ? (
            <Card padding="$4" bordered backgroundColor="$yellow2">
              <Text fontSize="$3" color="$yellow10">
                Only business managers can change the order flow.
              </Text>
            </Card>
          ) : null}

          <Card padding="$4" bordered>
            <XStack justifyContent="space-between" alignItems="center" gap="$3">
              <YStack flex={1}>
                <Text fontSize="$4" fontWeight="700" fontFamily="$body">
                  Complete terminal orders immediately
                </Text>
                <Text color="$colorSecondary" fontSize="$3" fontFamily="$body">
                  {direct
                    ? "Cash sales are completed as soon as they are rung up — no accept / preparing / ready steps."
                    : "Orders follow the full steps: accept → preparing → ready → completed."}
                </Text>
              </YStack>
              <Switch
                size="$5"
                checked={direct}
                disabled={!canEdit || saveMutation.isPending}
                onCheckedChange={(next) => {
                  if (!canEdit || saveMutation.isPending) return;
                  setDirect(next);
                  saveMutation.mutate(next ? "direct" : "staged");
                }}
                backgroundColor={direct ? "$color.green" : "$color.gray600"}
              >
                <Switch.Thumb animation="quick" backgroundColor="$white" />
              </Switch>
            </XStack>
          </Card>

          <Card padding="$4" bordered gap="$3">
            <XStack gap="$3" alignItems="flex-start">
              <YStack
                width={32}
                height={32}
                borderRadius={16}
                backgroundColor="$backgroundSoft"
                alignItems="center"
                justifyContent="center"
              >
                <ListOrdered size={16} color="$color" />
              </YStack>
              <YStack flex={1}>
                <Text fontSize="$3" fontWeight="700" fontFamily="$body">
                  Full steps
                </Text>
                <Text color="$colorSecondary" fontSize="$2" fontFamily="$body">
                  Accepted → Preparing → Ready → Completed. Best when the kitchen
                  works tickets from the POS board.
                </Text>
              </YStack>
            </XStack>
            <Separator />
            <XStack gap="$3" alignItems="flex-start">
              <YStack
                width={32}
                height={32}
                borderRadius={16}
                backgroundColor="$backgroundSoft"
                alignItems="center"
                justifyContent="center"
              >
                <CheckCircle2 size={16} color="$color" />
              </YStack>
              <YStack flex={1}>
                <Text fontSize="$3" fontWeight="700" fontFamily="$body">
                  Complete immediately
                </Text>
                <Text color="$colorSecondary" fontSize="$2" fontFamily="$body">
                  The sale is completed the moment it is taken and only shows in
                  order history. Best for quick counter service.
                </Text>
              </YStack>
            </XStack>
          </Card>

          <Text color="$colorSecondary" fontSize="$2" fontFamily="$body">
            This setting applies to orders taken on a terminal or in the business
            app. Orders placed online by buyers always keep the full steps.
          </Text>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
