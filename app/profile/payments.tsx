// @ts-nocheck
import { useState } from "react";
import { useRouter } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Separator } from "tamagui";
import {
  CreditCard,
  Plus,
  Trash2,
  Star,
  Smartphone,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, BackButton } from "@/components/ui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import {
  usePaymentMethodsQuery,
  useRemovePaymentMethodMutation,
  useSetDefaultPaymentMethodMutation,
} from "@/services/payment.service";

export default function PaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: paymentMethodsData = [] } = usePaymentMethodsQuery();
  const { mutate: removePaymentMethod } = useRemovePaymentMethodMutation();
  const { mutate: setDefaultPaymentMethod } =
    useSetDefaultPaymentMethodMutation();
  const paymentMethods = paymentMethodsData;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetPm, setTargetPm] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [dialogType, setDialogType] = useState<"delete" | "setDefault">(
    "setDefault",
  );

  const handleDeletePress = (id: string, label: string) => {
    setTargetPm({ id, label });
    setDialogType("delete");
    setDialogOpen(true);
  };

  const handleSetDefaultPress = (id: string, label: string) => {
    setTargetPm({ id, label });
    setDialogType("setDefault");
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!targetPm) return;

    if (dialogType === "delete") {
      removePaymentMethod(targetPm.id);
    } else {
      setDefaultPaymentMethod(targetPm.id);
    }
    setDialogOpen(false);
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={Math.max(insets.top, 50)}
    >
      {/* Header */}
      <XStack
        alignItems="center"
        paddingHorizontal="$5"
        paddingBottom="$4"
        gap="$3"
      >
        <BackButton />
        <Text
          fontSize="$6"
          fontWeight="800"
          fontFamily="$heading"
          color="$color"
        >
          Payment Methods
        </Text>
      </XStack>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <YStack padding="$5" paddingBottom="$10" gap="$4">
          <Button
            variant="outline"
            height={56}
            icon={<Plus size={20} color="$primary" />}
            onPress={() => router.push("/profile/add-payment")}
            borderStyle="dashed"
            borderWidth={2}
          >
            <Text
              fontSize="$4"
              fontWeight="700"
              color="$primary"
              fontFamily="$body"
            >
              Add Payment Method
            </Text>
          </Button>

          <YStack gap="$4" marginTop="$4">
            {paymentMethods.length === 0 ? (
              <YStack alignItems="center" marginTop="$10" gap="$2">
                <CreditCard size={48} color="$gray200" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  No payment methods added yet
                </Text>
              </YStack>
            ) : (
              paymentMethods.map((pm) => (
                <TouchableOpacity
                  key={pm.id}
                  activeOpacity={0.7}
                  onPress={() =>
                    !pm.isDefault &&
                    handleSetDefaultPress(
                      pm.id,
                      pm.type === "mobile_money"
                        ? "Mobile Money"
                        : `Card •••• ${pm.last4}`,
                    )
                  }
                >
                  <XStack
                    backgroundColor="$backgroundStrong"
                    padding="$4"
                    borderRadius="$5"
                    borderWidth={pm.isDefault ? 2 : 1}
                    borderColor={pm.isDefault ? "$primary" : "$borderColor"}
                    alignItems="center"
                    gap="$4"
                    elevation={2}
                    shadowColor="$shadowColor"
                    shadowOpacity={0.03}
                    shadowRadius={10}
                    position="relative"
                  >
                    {/* Brand Icon */}
                    <YStack
                      width={52}
                      height={38}
                      borderRadius="$3"
                      backgroundColor={
                        pm.type === "mobile_money" ? "#FFCC00" : "$background"
                      }
                      justifyContent="center"
                      alignItems="center"
                      shadowColor="$shadowColor"
                      shadowOpacity={0.1}
                      shadowRadius={2}
                      borderWidth={pm.type === "mobile_money" ? 0 : 1}
                      borderColor="$borderColor"
                    >
                      {pm.type === "mobile_money" ? (
                        <Smartphone size={18} color="#000" />
                      ) : (
                        <Text
                          color="$color"
                          fontWeight="900"
                          fontStyle="italic"
                          fontSize="$2"
                          fontFamily="$heading"
                        >
                          {pm.type.toUpperCase()}
                        </Text>
                      )}
                    </YStack>

                    <YStack flex={1} gap="$0.5">
                      <XStack alignItems="center" gap="$2" flexWrap="wrap">
                        <Text
                          fontSize="$4"
                          fontWeight="800"
                          fontFamily="$heading"
                          color="$color"
                        >
                          {pm.type === "mobile_money"
                            ? pm.cardHolderName || "Mobile Money"
                            : `•••• •••• •••• ${pm.last4}`}
                        </Text>
                        {pm.isDefault && (
                          <YStack
                            backgroundColor="$primary"
                            paddingHorizontal="$2"
                            paddingVertical="$1"
                            borderRadius="$full"
                          >
                            <Text
                              fontSize="$1"
                              fontWeight="800"
                              color="white"
                              fontFamily="$body"
                              textTransform="uppercase"
                            >
                              Default
                            </Text>
                          </YStack>
                        )}
                      </XStack>
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
                        {pm.type === "mobile_money"
                          ? `Verified MoMo Account`
                          : `Expires ${pm.expiryDate || "N/A"}`}
                      </Text>
                    </YStack>

                    {/* Compact Remove Button */}
                    <Button
                      position="absolute"
                      top="$4"
                      right="$4"
                      size="$2"
                      variant="ghost"
                      circular
                      padding={0}
                      icon={<Trash2 size={16} color="$red" />}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeletePress(
                          pm.id,
                          pm.type === "mobile_money"
                            ? "Mobile Money"
                            : `Card •••• ${pm.last4}`,
                        );
                      }}
                    />
                  </XStack>
                </TouchableOpacity>
              ))
            )}
          </YStack>
        </YStack>
      </ScrollView>

      {/* Dialog */}
      <AppAlertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={
          dialogType === "delete" ? "Remove Payment" : "Set Default Payment"
        }
        description={
          dialogType === "delete"
            ? `Are you sure you want to remove "${targetPm?.label}"?`
            : `Do you want to set "${targetPm?.label}" as your primary payment method?`
        }
        confirmText={dialogType === "delete" ? "REMOVE" : "SET DEFAULT"}
        isDestructive={dialogType === "delete"}
        icon={dialogType === "delete" ? Trash2 : Star}
        onConfirm={handleConfirm}
      />
    </YStack>
  );
}
