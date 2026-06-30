// @ts-nocheck
import { TouchableOpacity } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { FileText } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';

interface Props {
  kyc_status?: string;
  kycRoute?: string;
}

export function ServiceStatusBanner({ kyc_status, kycRoute }: Props) {
  const router = useRouter();
  const status = kyc_status || 'pending';

  if (status === 'approved') return null;

  const isPending = status === 'pending' || status === 'not_uploaded' || status === 'rejected';
  const isSubmitted = status === 'submitted';

  return (
    <YStack backgroundColor="$yellow2" borderWidth={1} borderColor="$yellow7" borderRadius="$4" padding="$3" gap="$2">
      <XStack gap="$2" alignItems="center">
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
