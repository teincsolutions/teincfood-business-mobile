// @ts-nocheck
import { useEffect, useState } from 'react';
import { BlurView } from 'expo-blur';
import { YStack, XStack, Text, Image, AnimatePresence } from 'tamagui';
import { Fingerprint, Lock } from '@tamagui/lucide-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { Button } from '@/components/ui';
import { tokens } from '@/theme/tokens';

interface BiometricLockOverlayProps {
  onUnlock: () => void;
}

export function BiometricLockOverlay({ onUnlock }: BiometricLockOverlayProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock TeincFoods',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onUnlock();
      } else if (result.error !== 'user_cancel') {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    // Small delay to let the app settle before prompting
    const timer = setTimeout(() => {
      handleAuthenticate();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <YStack 
      position="absolute" 
      top={0} 
      left={0} 
      right={0} 
      bottom={0} 
      zIndex={99999}
      backgroundColor="rgba(0,0,0,0.5)"
    >
      <BlurView intensity={80} tint="dark" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <YStack 
          width="85%" 
          backgroundColor="$background" 
          borderRadius="$8" 
          padding="$8" 
          alignItems="center" 
          gap="$6"
          shadowColor="#000"
          shadowOpacity={0.2}
          shadowRadius={20}
        >
          {/* Logo / Branding */}
          <YStack alignItems="center" gap="$2">
            <YStack 
              backgroundColor="$primary" 
              width={70} 
              height={70} 
              borderRadius="$full" 
              justifyContent="center" 
              alignItems="center"
              marginBottom="$2"
            >
              <Lock size={32} color="white" />
            </YStack>
            <Text fontSize="$8" fontWeight="800" fontFamily="$heading" color="$color">
              Teinc<Text color="$primary">Foods</Text>
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" textAlign="center">
              Identity Verification Required
            </Text>
          </YStack>

          {/* Icon / Status */}
          <YStack 
            width={100} 
            height={100} 
            borderRadius="$full" 
            backgroundColor="$backgroundSoft" 
            justifyContent="center" 
            alignItems="center"
            borderWidth={2}
            borderColor={error ? '$red' : '$gray100'}
          >
            <Fingerprint size={48} color={error ? tokens.color.red : tokens.color.orange} />
          </YStack>

          {error && (
            <Text color="$red" fontSize="$3" fontWeight="600" textAlign="center">
              {error}
            </Text>
          )}

          <Button 
            variant="primary" 
            width="100%" 
            height={56} 
            onPress={handleAuthenticate}
            loading={isAuthenticating}
          >
            {isAuthenticating ? 'VERIFYING...' : 'UNLOCK NOW'}
          </Button>

          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
            Protecting your payments and personal information.
          </Text>
        </YStack>
      </BlurView>
    </YStack>
  );
}
