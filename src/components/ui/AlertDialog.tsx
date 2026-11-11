// @ts-nocheck
import { AlertDialog, Button, YStack } from "tamagui";
import { useWindowDimensions } from "react-native";
import { LucideIcon } from "@tamagui/lucide-icons";

interface AppAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  icon?: LucideIcon;
  isDestructive?: boolean;
  /** Shows a spinner + disables the dialog's own confirm button while pending. */
  confirmLoading?: boolean;
  /** Keeps the dialog open after confirm (caller closes it, e.g. after async work). */
  keepOpenOnConfirm?: boolean;
}

export function AppAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  icon: Icon,
  isDestructive = false,
  confirmLoading = false,
  keepOpenOnConfirm = false,
}: AppAlertDialogProps) {
  // Two side-by-side buttons get too narrow on phones, which truncates
  // "Keep Account" / "Delete Account". Stack them on narrow screens so every
  // label stays readable.
  const { width } = useWindowDimensions();
  const stackActions = width < 480;

  const handleConfirm = () => {
    onConfirm();
    if (!keepOpenOnConfirm) {
      onOpenChange(false);
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          zIndex={1000}
          style={{ zIndex: 1000 }}
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(15, 23, 42, 0.35)"
        />
        <AlertDialog.Content
          key="content"
          animation={[
            "quick",
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          x={0}
          scale={1}
          opacity={1}
          y={0}
          width="85%"
          maxWidth={400}
          backgroundColor="$background"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$5"
          padding="$5"
          gap="$4"
        >
          <YStack gap="$2" alignItems="center" textAlign="center">
            {Icon && (
              <YStack
                backgroundColor={
                  isDestructive ? "rgba(255,59,48,0.1)" : "rgba(255,118,34,0.1)"
                }
                padding="$4"
                borderRadius="$full"
                marginBottom="$2"
              >
                <Icon size={32} color={isDestructive ? "$red" : "$primary"} />
              </YStack>
            )}
            <AlertDialog.Title
              fontSize="$6"
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
              textAlign="center"
            >
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
              textAlign="center"
              lineHeight={22}
            >
              {description}
            </AlertDialog.Description>
          </YStack>

          <YStack
            gap="$2"
            marginTop="$4"
            flexDirection={stackActions ? "column" : "row"}
          >
            <AlertDialog.Cancel asChild>
              <Button
                flex={stackActions ? undefined : 1}
                width={stackActions ? "100%" : "auto"}
                height={50}
                variant="outline"
                borderColor="$borderColor"
                fontFamily="$body"
                fontWeight="700"
                paddingHorizontal="$3"
                onPress={onCancel}
              >
                {cancelText}
              </Button>
            </AlertDialog.Cancel>
            <Button
              flex={stackActions ? undefined : 1}
              width={stackActions ? "100%" : "auto"}
              height={50}
              color="$white"
              backgroundColor={isDestructive ? "$red" : "$primary"}
              onPress={handleConfirm}
              loading={confirmLoading}
              disabled={confirmLoading}
              fontFamily="$body"
              fontWeight="700"
              paddingHorizontal="$3"
            >
              {confirmText}
            </Button>
          </YStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  );
}
