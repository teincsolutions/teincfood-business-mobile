// @ts-nocheck
import { Sheet, YStack, XStack, Text } from "tamagui";
import { WebView } from "react-native-webview";
import { Printer, X } from "@tamagui/lucide-icons";
import { Button } from "@/components/ui/Button";
import type { SellerOrder } from "@teincfood/core";
import {
  usePrintReceiptMutation,
  useReceiptPreviewHtml,
} from "@/hooks/useReceiptPreview";

interface ReceiptPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SellerOrder | null;
}

/** 80mm thermal paper width at 96dpi (~302px). */
const RECEIPT_WIDTH = 304;

export function ReceiptPreviewSheet({
  open,
  onOpenChange,
  order,
}: ReceiptPreviewSheetProps) {
  const printMutation = usePrintReceiptMutation();
  const html = useReceiptPreviewHtml(order);
  const subtitle = order
    ? `80mm thermal receipt for order ${order.order_number}`
    : "80mm thermal receipt";

  const handlePrint = () => {
    if (order) {
      printMutation.mutate(order);
    }
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[92]}
      dismissOnSnapToBottom
      zIndex={200_000}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0,0,0,0.5)"
      />
      <Sheet.Frame backgroundColor="$background" padding="$4" gap="$3">
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />

        <XStack justifyContent="space-between" alignItems="center">
          <YStack flex={1} gap="$1">
            <Text fontSize="$6" fontWeight="bold">
              Receipt Preview
            </Text>
            <Text fontSize="$3" color="$colorMuted">
              {subtitle}
            </Text>
          </YStack>
          <Button
            variant="ghost"
            height={40}
            width={40}
            padding={0}
            icon={<X size={18} />}
            onPress={() => onOpenChange(false)}
          />
        </XStack>

        <YStack flex={1} alignItems="center" justifyContent="center">
          <YStack
            width={RECEIPT_WIDTH}
            flex={1}
            maxHeight="100%"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius="$2"
            backgroundColor="white"
            overflow="hidden"
          >
            {html ? (
              <WebView
                source={{ html }}
                style={{ flex: 1, width: "100%", backgroundColor: "#ffffff" }}
                originWhitelist={["*"]}
              />
            ) : (
              <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
                <Text fontSize="$4" color="$colorMuted" textAlign="center">
                  {`Receipt unavailable for order ${order?.order_number ?? ""}`}
                </Text>
              </YStack>
            )}
          </YStack>
        </YStack>

        <Button
          variant="primary"
          height={48}
          icon={<Printer size={16} />}
          loading={printMutation.isPending}
          onPress={handlePrint}
        >
          Print Receipt
        </Button>
      </Sheet.Frame>
    </Sheet>
  );
}
