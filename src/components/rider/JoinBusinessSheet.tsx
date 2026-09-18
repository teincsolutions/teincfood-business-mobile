// @ts-nocheck
import { useState } from "react";
import { YStack, XStack, Text, Card, Sheet } from "tamagui";
import { QrCode, Keyboard, CheckCircle2 } from "@tamagui/lucide-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button, FormInput } from "@/components/ui";
import { useSubmitJoinRequestMutation } from "@/hooks/useRiderProfile";
import { extractBusinessNumber } from "@/utils/business-qr";
import { extractApiErrorMessage } from "@teincfood/core";
import { toast } from "sonner-native";

type Tab = "scan" | "manual";

/**
 * Join a business as a rider — QR scan first, manual entry second.
 * Only the business number is used: scanned URLs are reduced to the number
 * before POST /riders/join {business_number}.
 */
export function JoinBusinessSheet({
  open,
  onOpenChange,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequested?: () => void;
}) {
  const [tab, setTab] = useState<Tab>("scan");
  const [manualNumber, setManualNumber] = useState("");
  const [manualError, setManualError] = useState("");
  const [scannedNumber, setScannedNumber] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const joinRequest = useSubmitJoinRequestMutation();

  const reset = () => {
    setManualNumber("");
    setManualError("");
    setScannedNumber(null);
    setRequested(false);
    setTab("scan");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const submitNumber = (businessNumber: string) => {
    joinRequest.mutate(businessNumber, {
      onSuccess: () => {
        setRequested(true);
        toast.success("Join request sent");
        if (onRequested) onRequested();
      },
      onError: (error: unknown) => {
        console.debug("[JoinBusinessSheet] join request error", error);
        const err = error as {
          data?: { error?: { code?: string; message?: string } };
        };
        const code = err?.data?.error?.code;
        if (code === "BUSINESS_NOT_FOUND") {
          setManualError("No business found with this number.");
        } else if (code === "ALREADY_REQUESTED") {
          setRequested(true);
        } else {
          toast.error(extractApiErrorMessage(error as Error));
        }
      },
    });
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scannedNumber || joinRequest.isPending) return;
    const businessNumber = extractBusinessNumber(data);
    if (!businessNumber) {
      toast.error("This QR code is not a business code.");
      return;
    }
    setScannedNumber(businessNumber);
  };

  const handleManualSubmit = () => {
    const businessNumber = extractBusinessNumber(manualNumber);
    if (!businessNumber) {
      setManualError("Enter a valid business number (e.g. ABC-1234).");
      return;
    }
    setManualError("");
    submitNumber(businessNumber);
  };

  const permissionGranted = permission?.granted;

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={handleClose}
      snapPointsMode="percent"
      snapPoints={[85]}
      position={0}
      dismissOnSnapToBottom
      zIndex={200_000}
      animation="bouncy"
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0,0,0,0.6)"
      />
      <Sheet.Handle backgroundColor="$gray200" />
      <Sheet.Frame
        padding="$5"
        backgroundColor="$background"
        borderTopLeftRadius="$8"
        borderTopRightRadius="$8"
      >
        <YStack flex={1} gap="$4">
          <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
            Join a Business
          </Text>

          <XStack gap="$2">
            <Button
              flex={1}
              width="auto"
              variant={tab === "scan" ? "primary" : "outline"}
              icon={<QrCode size={18} />}
              onPress={() => setTab("scan")}
            >
              SCAN QR
            </Button>
            <Button
              flex={1}
              width="auto"
              variant={tab === "manual" ? "primary" : "outline"}
              icon={<Keyboard size={18} />}
              onPress={() => setTab("manual")}
            >
              ENTER CODE
            </Button>
          </XStack>

          {requested ? (
            <Card padding="$5" bordered backgroundColor="$backgroundSoft">
              <YStack gap="$3" alignItems="center">
                <CheckCircle2 size={40} color="$success" />
                <Text
                  fontSize="$5"
                  fontWeight="700"
                  fontFamily="$heading"
                  textAlign="center"
                >
                  Request Sent
                </Text>
                <Text
                  fontSize="$3"
                  color="$colorSecondary"
                  fontFamily="$body"
                  textAlign="center"
                >
                  The business has been notified. You will see it in My
                  Businesses once approved.
                </Text>
                <Button
                  variant="primary"
                  width="100%"
                  onPress={() => handleClose(false)}
                >
                  DONE
                </Button>
              </YStack>
            </Card>
          ) : tab === "scan" ? (
            <YStack gap="$3" flex={1}>
              {!permissionGranted ? (
                <Card padding="$5" bordered>
                  <YStack gap="$3" alignItems="center">
                    <QrCode size={40} color="$colorMuted" />
                    <Text
                      fontSize="$4"
                      color="$colorSecondary"
                      fontFamily="$body"
                      textAlign="center"
                    >
                      Camera access is needed to scan the business QR code.
                    </Text>
                    <Button
                      variant="primary"
                      width="100%"
                      onPress={() => requestPermission()}
                    >
                      ALLOW CAMERA
                    </Button>
                  </YStack>
                </Card>
              ) : scannedNumber ? (
                <Card padding="$4" bordered>
                  <YStack gap="$3" alignItems="center">
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                      Business found
                    </Text>
                    <Text fontSize="$8" fontWeight="800" fontFamily="$heading">
                      {scannedNumber}
                    </Text>
                    <Button
                      variant="primary"
                      width="100%"
                      loading={joinRequest.isPending}
                      onPress={() => submitNumber(scannedNumber)}
                    >
                      SEND JOIN REQUEST
                    </Button>
                    <Button
                      variant="ghost"
                      width="100%"
                      onPress={() => setScannedNumber(null)}
                    >
                      SCAN AGAIN
                    </Button>
                  </YStack>
                </Card>
              ) : (
                <YStack
                  height={280}
                  borderRadius="$4"
                  overflow="hidden"
                  backgroundColor="$backgroundSoft"
                >
                  <CameraView
                    style={{ flex: 1 }}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={handleBarCodeScanned}
                  />
                </YStack>
              )}
              <Text
                fontSize="$2"
                color="$colorMuted"
                fontFamily="$body"
                textAlign="center"
              >
                Point the camera at the business QR code
              </Text>
            </YStack>
          ) : (
            <YStack gap="$4">
              <FormInput
                label="Business Number"
                placeholder="e.g. ABC-1234"
                autoCapitalize="characters"
                value={manualNumber}
                onChangeText={(v) => {
                  setManualNumber(v);
                  setManualError("");
                }}
                error={manualError}
                required
              />
              <Button
                variant="primary"
                width="100%"
                loading={joinRequest.isPending}
                onPress={handleManualSubmit}
              >
                SEND JOIN REQUEST
              </Button>
            </YStack>
          )}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
