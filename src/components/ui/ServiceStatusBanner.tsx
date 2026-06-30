// @ts-nocheck
import { TouchableOpacity } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { AlertTriangle, Clock, ShieldCheck, ShieldOff, FileText } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth.store';
import { useBusinessStore } from '@/stores/business.store';

interface Props {
  kyc_status?: string;
  hasCompletedKyc?: boolean;
}

/**
 * ServiceStatusBanner
 * Displays a contextual banner based on the user's KYC status and account status.
 * Uses kyc_status from the backend (pending | submitted | approved | rejected).
 * Also handles account status via user.kyc_documents presence.
 */
export function ServiceStatusBanner({ kyc_status, hasCompletedKyc }: Props) {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const effectiveStatus = kyc_status || 'pending';

  // Hide if KYC is approved and user has completed KYC
  if (effectiveStatus === 'approved' && hasCompletedKyc) return null;

  // Determine banner content based on KYC status
  const isPending = effectiveStatus === 'pending' || effectiveStatus === 'not_uploaded' || effectiveStatus === 'rejected';
  const isSubmitted = effectiveStatus === 'submitted';

  // Show KYC button for all roles — riders go directly to KYC, business users go to their active business KYC
  const kycRoute = role === 'rider'
    ? '/(shared)/kyc?type=user&role=rider'
    : activeBusinessId
      ? `/(shared)/kyc?type=business&id=${activeBusinessId}`
      : '/(shared)/businesses';

  return (
    <YStack backgroundColor="$yellow2" borderWidth={1} borderColor="$yellow7" borderRadius="$4" padding="$3" gap="$2">
      <XStack gap="$2" alignItems="center">
        <Clock size={18} color="$primary" />
        <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$yellow11" flex={1}>
          {isPending ? 'Verification Required' : 'Verification Submitted'}
        </Text>
      </XStack>
      <Text fontSize="$3" fontFamily="$body" color="$yellow11">
        {isPending
          ? 'Upload your documents to verify your identity and activate your account.'
          : 'Your documents have been submitted for review. This typically takes 24–48 hours.'}
      </Text>
      {kycRoute && isPending && (
        <TouchableOpacity onPress={() => router.push(kycRoute)}>
          <XStack gap="$1" alignItems="center">
            <FileText size={14} color="$primary" />
            <Text fontSize="$3" fontWeight="700" fontFamily="$body" color="$yellow11" textDecorationLine="underline">
              Upload Documents
            </Text>
          </XStack>
        </TouchableOpacity>
      )}
    </YStack>
  );
}
