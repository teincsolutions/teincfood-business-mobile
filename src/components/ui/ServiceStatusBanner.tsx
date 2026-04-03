// @ts-nocheck
import { TouchableOpacity } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { AlertTriangle, Clock, ShieldCheck, ShieldOff, FileText } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import type { ServiceStatus } from '@/models/user.model';

interface BannerConfig {
  bg: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
  icon: React.ReactNode;
  title: string;
  message: string;
  /** Optional CTA label — shown only when not suspended/banned */
  ctaLabel?: string;
  ctaRoute?: string;
}

const CONFIGS: Record<ServiceStatus, BannerConfig> = {
  pending_verification: {
    bg: '$yellow2',
    borderColor: '$yellow7',
    iconColor: '$primary',
    textColor: '$yellow11',
    icon: <Clock size={18} color="$primary" />,
    title: 'Verification Pending',
    message: 'Your account is awaiting verification. Some features may be limited until approved.',
    ctaLabel: 'Upload Documents',
    ctaRoute: '/(shared)/profile/documents',
  },
  verified: {
    bg: '$green2',
    borderColor: '$green7',
    iconColor: '$success',
    textColor: '$green10',
    icon: <ShieldCheck size={18} color="$success" />,
    title: 'Account Verified',
    message: 'Your account has been verified. You have full access.',
  },
  suspended: {
    bg: '$orange2',
    borderColor: '$orange7',
    iconColor: '$warning',
    textColor: '$orange11',
    icon: <AlertTriangle size={18} color="$warning" />,
    title: 'Account Temporarily Suspended',
    message: 'Your account has been temporarily suspended. Please contact support to resolve this.',
    ctaLabel: 'Contact Support',
    ctaRoute: '/(shared)/profile/help',
  },
  banned: {
    bg: '$red2',
    borderColor: '$red7',
    iconColor: '$error',
    textColor: '$red10',
    icon: <ShieldOff size={18} color="$error" />,
    title: 'Account Banned',
    message: 'Your account has been permanently suspended. Contact support if you believe this is a mistake.',
    ctaLabel: 'Contact Support',
    ctaRoute: '/(shared)/profile/help',
  },
};

interface Props {
  status?: ServiceStatus;
  hasCompletedKyc?: boolean;
}

/**
 * ServiceStatusBanner
 * Displays a contextual banner based on the user's account service status.
 * - pending_verification: amber — prompts to upload documents
 * - verified: green — (hidden after 1 render; can be dismissed)
 * - suspended: orange — contact support CTA
 * - banned: red — contact support CTA
 */
export function ServiceStatusBanner({ status, hasCompletedKyc }: Props) {
  const router = useRouter();

  // Treat missing status as pending_verification for new accounts
  const effectiveStatus: ServiceStatus = status ?? 'pending_verification';

  // Don't show verified banner if user is already verified and has completed KYC — no noise
  if (effectiveStatus === 'verified' && hasCompletedKyc) return null;

  const config = CONFIGS[effectiveStatus];

  return (
    <YStack
      backgroundColor={config.bg}
      borderWidth={1}
      borderColor={config.borderColor}
      borderRadius="$4"
      padding="$3"
      gap="$2"
    >
      <XStack gap="$2" alignItems="center">
        {config.icon}
        <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color={config.textColor} flex={1}>
          {config.title}
        </Text>
      </XStack>
      <Text fontSize="$3" fontFamily="$body" color={config.textColor}>
        {config.message}
      </Text>
      {config.ctaLabel && config.ctaRoute && (
        <TouchableOpacity onPress={() => router.push(config.ctaRoute as any)}>
          <XStack gap="$1" alignItems="center">
            {effectiveStatus === 'pending_verification' && <FileText size={14} color={config.iconColor} />}
            <Text fontSize="$3" fontWeight="700" fontFamily="$body" color={config.textColor} textDecorationLine="underline">
              {config.ctaLabel}
            </Text>
          </XStack>
        </TouchableOpacity>
      )}
    </YStack>
  );
}
