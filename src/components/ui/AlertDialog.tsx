// @ts-nocheck
import { AlertDialog, Button, XStack, YStack, Text } from 'tamagui';
import { LucideIcon } from '@tamagui/lucide-icons';

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
}

export function AppAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  icon: Icon,
  isDestructive = false,
}: AppAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
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
            'quick',
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
                backgroundColor={isDestructive ? 'rgba(255,59,48,0.1)' : 'rgba(255,118,34,0.1)'} 
                padding="$4" 
                borderRadius="$full" 
                marginBottom="$2"
              >
                <Icon size={32} color={isDestructive ? '$red' : '$primary'} />
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

          <XStack gap="$3" marginTop="$4">
            <AlertDialog.Cancel asChild>
              <Button 
                flex={1} 
                height={50} 
                variant="outline" 
                borderColor="$borderColor"
                fontFamily="$body"
                fontWeight="700"
              >
                {cancelText}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button 
                flex={1} 
                height={50} 
                backgroundColor={isDestructive ? '$red' : '$primary'}
                onPress={onConfirm}
                fontFamily="$body"
                fontWeight="700"
              >
                <Text color="white">{confirmText}</Text>
              </Button>
            </AlertDialog.Action>
          </XStack>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  );
}
