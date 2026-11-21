// @ts-nocheck
import { useState, useEffect } from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import {
  YStack,
  XStack,
  Text,
  Card,
  Switch,
  Slider,
  Input,
  styled,
  useMedia,
} from "tamagui";
import {
  Save,
  MapPin,
  Truck,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import {
  extractApiErrorMessage,
  useReferenceData,
  setDeliverySettingsLocal,
} from "@teincfood/core";
import { invalidateRiderDeliveryZones } from "@/hooks/useRiderDeliveryZones";

type FormErrors = {
  deliveryFee?: string;
  minimumOrder?: string;
  freeDeliveryMinimum?: string;
};

type SaveStatus = "idle" | "success" | "error";

interface DeliverySettingsPayload {
  delivery_enabled: boolean;
  max_delivery_radius_km: number;
  base_delivery_fee_minor: number;
  min_order_minor: number;
  free_delivery_threshold_minor: number;
}

const AmountInput = styled(Input, {
  flex: 1,
  height: 48,
  borderWidth: 0,
  backgroundColor: "transparent",
  fontFamily: "$body",
  fontSize: "$4",
  color: "$color",
  paddingHorizontal: "$2",
  placeholderTextColor: "$colorPlaceholder",
  focusStyle: { borderWidth: 0 },
});

const toMinor = (ghs: string) => Math.round(parseFloat(ghs || '0') * 100);
const fromMinor = (minor: number) => (minor / 100).toFixed(2);

export default function DeliverySettings() {
  const router = useRouter();
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { activeBusiness, activeBusinessId } = useActiveBusiness();
  const currency =
    (activeBusiness as unknown as { currency?: string })?.currency ?? 'GHS';
  const canEdit = useHasCapability("business_profile_manage");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errors, setErrors] = useState<FormErrors>({});

  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryRadius, setDeliveryRadius] = useState(5);
  const [deliveryFee, setDeliveryFee] = useState("");
  const [minimumOrder, setMinimumOrder] = useState("");
  const [freeDeliveryMinimum, setFreeDeliveryMinimum] = useState("");

  // SQLite-first: serve cached settings instantly; the reference worker keeps
  // them fresh in the background.
  const { data: cachedSettings } = useReferenceData<{
    data: DeliverySettingsPayload;
  }>("delivery-settings");
  const settings = cachedSettings?.payload?.data ?? null;

  useEffect(() => {
    if (settings) {
      setDeliveryEnabled(settings.delivery_enabled ?? false);
      setDeliveryRadius(settings.max_delivery_radius_km ?? 5);
      setDeliveryFee(settings.base_delivery_fee_minor != null ? fromMinor(settings.base_delivery_fee_minor) : "");
      setMinimumOrder(settings.min_order_minor != null ? fromMinor(settings.min_order_minor) : "");
      setFreeDeliveryMinimum(settings.free_delivery_threshold_minor != null ? fromMinor(settings.free_delivery_threshold_minor) : "");
    }
  }, [settings]);

  const clearError = (field: keyof FormErrors) =>
    setErrors((e) => ({ ...e, [field]: undefined }));

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (deliveryEnabled) {
      if (deliveryFee.trim() === "" || isNaN(parseFloat(deliveryFee)) || parseFloat(deliveryFee) < 0)
        next.deliveryFee = "Enter a valid delivery fee (0 or more)";
      if (minimumOrder.trim() === "" || isNaN(parseFloat(minimumOrder)) || parseFloat(minimumOrder) < 0)
        next.minimumOrder = "Enter a valid minimum order amount";
      if (freeDeliveryMinimum.trim() === "" || isNaN(parseFloat(freeDeliveryMinimum)) || parseFloat(freeDeliveryMinimum) < 0)
        next.freeDeliveryMinimum = "Enter a valid amount (0 to disable)";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeBusinessId) throw new Error("No business selected");
      // Local-first: the SQLite commit is the save. The outbox worker pushes
      // it to the backend when connectivity is available.
      await setDeliverySettingsLocal(activeBusinessId, {
        delivery_enabled: deliveryEnabled,
        max_delivery_radius_km: deliveryRadius,
        base_delivery_fee_minor: toMinor(deliveryFee),
        min_order_minor: toMinor(minimumOrder),
        free_delivery_threshold_minor: toMinor(freeDeliveryMinimum),
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reference"] });
      void invalidateRiderDeliveryZones(queryClient);
      setSaveStatus("success");
      toast.success("Delivery settings saved");
      setTimeout(() => router.back(), 1500);
    },
    onError: (e) => {
      setSaveStatus("error");
      toast.error(extractApiErrorMessage(e));
    },
  });

  const handleSave = () => {
    if (!validate()) return;
    setSaveStatus("idle");
    saveMutation.mutate();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <YStack
        flex={1}
        paddingTop={Math.max(insets.top + 12, 24)}
        backgroundColor="$background"
      >
        {/* Header */}
        <XStack
          padding="$4"
          justifyContent="space-between"
          alignItems="center"
          backgroundColor="$background"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <XStack gap="$3" alignItems="center">
           <BackButton />
            <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
              Delivery Settings
            </Text>
          </XStack>
          <Button
            variant="primary"
            width={"auto"}
            height={44}
            loading={saveMutation.isPending}
            disabled={!canEdit}
            icon={<Save size="$4" color="white" />}
            onPress={handleSave}
          >
            Save
          </Button>
        </XStack>
        {!canEdit && (
          <XStack backgroundColor="$yellow2" padding="$3" gap="$2" alignItems="center" borderBottomWidth={1} borderBottomColor="$yellow6">
            <Text color="$yellow10" fontSize="$3" fontWeight="600">Only business managers can change delivery settings.</Text>
          </XStack>
        )}

          {/* Status banner */}
          {saveStatus !== "idle" && (
            <XStack
              backgroundColor={saveStatus === "success" ? "$green2" : "$red2"}
              padding="$3"
              gap="$2"
              alignItems="center"
            >
              {saveStatus === "success" ? (
                <CheckCircle size={16} color="$green10" />
              ) : (
                <AlertCircle size={16} color="$red10" />
              )}
              <Text
                fontSize="$3"
                color={saveStatus === "success" ? "$green10" : "$red10"}
                fontWeight="600"
              >
                {saveStatus === "success"
                  ? "Delivery settings saved!"
                  : "Failed to save. Please try again."}
              </Text>
            </XStack>
          )}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <YStack width="100%" maxWidth={600} alignSelf="center" padding="$4" gap="$4" paddingBottom={insets.bottom + 80}>
            {/* Delivery Toggle */}
            <Card padding="$4" bordered>
              <XStack justifyContent="space-between" alignItems="center">
                <YStack flex={1}>
                  <Text fontWeight="bold">Enable Delivery</Text>
                  <Text color="$colorMuted" fontSize="$3">
                    Allow customers to order for delivery
                  </Text>
                </YStack>
                <Switch
                  checked={deliveryEnabled}
                  onCheckedChange={setDeliveryEnabled}
                  backgroundColor={deliveryEnabled ? "$green10" : "$gray800"}
                >
                  <Switch.Thumb backgroundColor="$background" />
                </Switch>
              </XStack>
            </Card>

            {deliveryEnabled && (
              <>
                {/* Delivery Radius */}
                <Card padding="$4" bordered>
                  <YStack gap="$4">
                    <XStack gap="$3" alignItems="center">
                      <MapPin size={20} color="$primary" />
                      <YStack flex={1}>
                        <Text fontWeight="bold">Delivery Radius</Text>
                        <Text color="$colorMuted" fontSize="$3">
                          Maximum distance for delivery (km)
                        </Text>
                      </YStack>
                      <Text fontWeight="bold" fontSize="$5">
                        {deliveryRadius} km
                      </Text>
                    </XStack>
                    <Slider
                      value={[deliveryRadius]}
                      onValueChange={(values) => setDeliveryRadius(values[0])}
                      min={1}
                      max={20}
                      step={1}
                      size="$12"
                    >
                      <Slider.Track backgroundColor="$color.gray50">
                        <Slider.TrackActive backgroundColor="$primary" />
                      </Slider.Track>
                      <Slider.Thumb
                        circular
                        size="$5"
                        backgroundColor="$primary"
                        index={0}
                      />
                    </Slider>
                  </YStack>
                </Card>

                {/* Delivery Fee */}
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <XStack gap="$3" alignItems="center">
                      <Truck size={20} color="$primary" />
                      <YStack flex={1}>
                        <Text fontWeight="bold">Delivery Fee</Text>
                        <Text color="$colorMuted" fontSize="$3">
                          Charge per delivery
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack
                      backgroundColor="$backgroundSoft"
                      borderRadius="$3"
                      borderWidth={errors.deliveryFee ? 1 : 0}
                      borderColor={
                        errors.deliveryFee ? "$red10" : "$borderColor"
                      }
                      alignItems="center"
                      paddingHorizontal="$3"
                      height={48}
                    >
                      <Text
                        color="$colorSecondary"
                        fontWeight="600"
                        fontSize="$3"
                      >
                        {currency}
                      </Text>
                      <AmountInput
                        placeholder="0.00"
                        value={deliveryFee}
                        onChangeText={(t) => {
                          setDeliveryFee(t);
                          clearError("deliveryFee");
                        }}
                        keyboardType="decimal-pad"
                      />
                    </XStack>
                    {errors.deliveryFee && (
                      <Text fontSize="$2" color="$red10">
                        {errors.deliveryFee}
                      </Text>
                    )}
                  </YStack>
                </Card>

                {/* Minimum Order */}
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <XStack gap="$3" alignItems="center">
                      <DollarSign size={20} color="$primary" />
                      <YStack flex={1}>
                        <Text fontWeight="bold">Minimum Order</Text>
                        <Text color="$colorMuted" fontSize="$3">
                          Minimum order amount for delivery
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack
                      backgroundColor="$backgroundSoft"
                      borderRadius="$3"
                      borderWidth={errors.minimumOrder ? 1 : 0}
                      borderColor={
                        errors.minimumOrder ? "$red10" : "$borderColor"
                      }
                      alignItems="center"
                      paddingHorizontal="$3"
                      height={48}
                    >
                      <Text
                        color="$colorSecondary"
                        fontWeight="600"
                        fontSize="$3"
                      >
                        {currency}
                      </Text>
                      <AmountInput
                        placeholder="0.00"
                        value={minimumOrder}
                        onChangeText={(t) => {
                          setMinimumOrder(t);
                          clearError("minimumOrder");
                        }}
                        keyboardType="decimal-pad"
                      />
                    </XStack>
                    {errors.minimumOrder && (
                      <Text fontSize="$2" color="$red10">
                        {errors.minimumOrder}
                      </Text>
                    )}
                  </YStack>
                </Card>

                {/* Free Delivery Minimum */}
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <XStack gap="$3" alignItems="center">
                      <DollarSign size={20} color="$green10" />
                      <YStack flex={1}>
                        <Text fontWeight="bold">Free Delivery Minimum</Text>
                        <Text color="$colorMuted" fontSize="$3">
                          Order amount for free delivery (0 to disable)
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack
                      backgroundColor="$backgroundSoft"
                      borderRadius="$3"
                      borderWidth={errors.freeDeliveryMinimum ? 1 : 0}
                      borderColor={
                        errors.freeDeliveryMinimum ? "$red10" : "$borderColor"
                      }
                      alignItems="center"
                      paddingHorizontal="$3"
                      height={48}
                    >
                      <Text
                        color="$colorSecondary"
                        fontWeight="600"
                        fontSize="$3"
                      >
                        {currency}
                      </Text>
                      <AmountInput
                        placeholder="0.00"
                        value={freeDeliveryMinimum}
                        onChangeText={(t) => {
                          setFreeDeliveryMinimum(t);
                          clearError("freeDeliveryMinimum");
                        }}
                        keyboardType="decimal-pad"
                      />
                    </XStack>
                    {errors.freeDeliveryMinimum && (
                      <Text fontSize="$2" color="$red10">
                        {errors.freeDeliveryMinimum}
                      </Text>
                    )}
                  </YStack>
                </Card>

              </>
            )}

            {/* Footer Save */}
            <Button variant="primary" width="100%" loading={saveMutation.isPending} onPress={handleSave}>
              Save Changes
            </Button>
          </YStack>
        </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}
