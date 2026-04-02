// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { YStack, XStack, Text, Card, Button, Separator, Progress } from 'tamagui';
import { FileText, Check, Clock, AlertCircle, Camera, Image as ImageIcon } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';

type DocStatus = 'not_uploaded' | 'pending' | 'verified' | 'rejected';

interface DocItem {
  id: string;
  name: string;
  description: string;
  status: DocStatus;
  uploadedAt?: string;
  required: boolean;
  rejectionReason?: string;
  uri?: string;
}

const DOCS_BY_ROLE: Record<string, Omit<DocItem, 'status' | 'uri'>[]> = {
  seller: [
    { id: 'national_id', name: 'National ID / Passport', description: 'Government-issued identification', required: true },
    { id: 'profile_photo', name: 'Profile Photo', description: 'Clear photo of your face', required: true },
    { id: 'business_cert', name: 'Business Registration Certificate', description: 'Official certificate of business registration', required: true },
  ],
  rider: [
    { id: 'national_id', name: 'National ID / Passport', description: 'Government-issued identification', required: true },
    { id: 'profile_photo', name: 'Profile Photo', description: 'Clear photo of your face', required: true },
    { id: 'drivers_license', name: "Driver's License", description: 'Valid driving license', required: true },
    { id: 'vehicle_insurance', name: 'Vehicle Insurance', description: 'Current vehicle insurance certificate', required: true },
    { id: 'vehicle_registration', name: 'Vehicle Registration', description: 'Vehicle registration certificate', required: true },
  ],
  fleet_manager: [
    { id: 'national_id', name: 'National ID / Passport', description: 'Government-issued identification', required: true },
    { id: 'profile_photo', name: 'Profile Photo', description: 'Clear photo of your face', required: true },
    { id: 'business_cert', name: 'Business Registration Certificate', description: 'Official certificate of business registration', required: true },
  ],
};

const buildInitialDocs = (role: string): DocItem[] =>
  (DOCS_BY_ROLE[role] ?? DOCS_BY_ROLE.rider).map((d) => ({ ...d, status: 'not_uploaded' }));

const STATUS_COLOR: Record<DocStatus, string> = {
  not_uploaded: '#95a5a6',
  pending: '#f39c12',
  verified: '#27ae60',
  rejected: '#e74c3c',
};

/**
 * KYC Documents Screen — role-aware, shared across Seller / Rider / Fleet Manager
 */
export default function Documents() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const completeKyc = useAuthStore((state) => state.completeKyc);

  const role = user?.role ?? 'rider';
  const isNewUser = !user?.hasCompletedKyc;

  const [documents, setDocuments] = useState<DocItem[]>(() => buildInitialDocs(role));
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const getStatusIcon = (status: DocStatus) => {
    switch (status) {
      case 'verified': return <Check size={16} color="#27ae60" />;
      case 'pending': return <Clock size={16} color="#f39c12" />;
      case 'rejected': return <AlertCircle size={16} color="#e74c3c" />;
      default: return <FileText size={16} color="#95a5a6" />;
    }
  };

  const pickImage = async (docId: string, useCamera: boolean) => {
    const permissionFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await permissionFn();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        useCamera
          ? 'Camera access is required to take a photo.'
          : 'Photo library access is required to upload a document.',
      );
      return;
    }

    const launchFn = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await launchFn({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setUploadingId(docId);

    // Optimistically mark as pending (replace with real upload call)
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId
          ? {
              ...doc,
              uri,
              status: 'pending',
              uploadedAt: new Date().toISOString().split('T')[0],
              rejectionReason: undefined,
            }
          : doc,
      ),
    );
    setUploadingId(null);
  };

  const uploadedRequiredCount = documents.filter(
    (d) => d.required && d.status !== 'not_uploaded',
  ).length;
  const totalRequired = documents.filter((d) => d.required).length;
  const verifiedCount = documents.filter((d) => d.status === 'verified').length;
  const allRequiredUploaded = uploadedRequiredCount === totalRequired;
  const progress = totalRequired > 0 ? (uploadedRequiredCount / totalRequired) * 100 : 0;

  const handleSkip = () => {
    // Navigate to dashboard without marking KYC complete
    if (role === 'seller') {
      router.replace('/(seller)/');
    } else if (role === 'fleet_manager') {
      router.replace('/(fleet)/');
    } else {
      router.replace('/(rider)/(drawer)/home');
    }
  };

  const handleContinue = () => {
    completeKyc();
    if (role === 'seller') {
      router.replace('/(seller)/');
    } else if (role === 'fleet_manager') {
      router.replace('/(fleet)/');
    } else {
      router.replace('/(rider)/(drawer)/home');
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          KYC Verification
        </Text>
        <YStack width={40} />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 24}>
          {isNewUser && (
            <Card padding="$4" bordered backgroundColor="$blue2">
              <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                Verify your identity
              </Text>
              <Text fontSize="$3" color="$colorMuted" marginTop="$1">
                Upload the required documents below to activate your account. You can skip this for now and come back later — verification takes 24–48 hours.
              </Text>
            </Card>
          )}

          {/* Progress */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$4" fontWeight="bold">Upload Progress</Text>
                <Text fontSize="$4" fontWeight="800" color="$primary">
                  {uploadedRequiredCount}/{totalRequired} required
                </Text>
              </XStack>
              <Progress value={progress} backgroundColor="$gray5">
                <Progress.Indicator animation="bouncy" backgroundColor="$primary" />
              </Progress>
              <Text fontSize="$3" color="$colorMuted">
                {verifiedCount > 0
                  ? `${verifiedCount} document${verifiedCount > 1 ? 's' : ''} verified`
                  : 'No documents verified yet'}
              </Text>
            </YStack>
          </Card>

          {/* Documents */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Your Documents</Text>
              <Separator />
              {documents.map((doc, index) => (
                <YStack key={doc.id}>
                  <YStack gap="$2" paddingVertical="$2">
                    <XStack justifyContent="space-between" alignItems="center">
                      <XStack gap="$3" alignItems="center" flex={1}>
                        <YStack
                          width={40}
                          height={40}
                          borderRadius="$4"
                          backgroundColor="$gray3"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <FileText size={20} color="$colorMuted" />
                        </YStack>
                        <YStack flex={1}>
                          <XStack gap="$1" alignItems="center" flexWrap="wrap">
                            <Text fontWeight="bold" fontFamily="$body">{doc.name}</Text>
                            {doc.required && (
                              <Text fontSize="$2" color="$red10">*</Text>
                            )}
                          </XStack>
                          <Text fontSize="$2" color="$colorMuted" fontFamily="$body">{doc.description}</Text>
                        </YStack>
                      </XStack>
                      <XStack gap="$1" alignItems="center">
                        {getStatusIcon(doc.status)}
                        <YStack
                          backgroundColor={STATUS_COLOR[doc.status]}
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                        >
                          <Text color="white" fontSize="$1" textTransform="capitalize" fontFamily="$body">
                            {doc.status === 'not_uploaded' ? 'Not uploaded' : doc.status}
                          </Text>
                        </YStack>
                      </XStack>
                    </XStack>

                    {doc.uploadedAt && (
                      <Text fontSize="$2" color="$colorMuted" paddingLeft="$12" fontFamily="$body">
                        Uploaded: {doc.uploadedAt}
                      </Text>
                    )}

                    {doc.status === 'rejected' && doc.rejectionReason && (
                      <YStack
                        backgroundColor="$red2"
                        padding="$2"
                        borderRadius="$2"
                        marginLeft="$12"
                      >
                        <Text fontSize="$2" color="$red10" fontFamily="$body">
                          Reason: {doc.rejectionReason}
                        </Text>
                      </YStack>
                    )}

                    {(doc.status === 'not_uploaded' || doc.status === 'rejected') && (
                      <XStack gap="$2" paddingLeft="$12" marginTop="$1">
                        <Button
                          size="$2"
                          variant="outlined"
                          icon={<Camera size={14} />}
                          onPress={() => pickImage(doc.id, true)}
                          disabled={uploadingId === doc.id}
                        >
                          Camera
                        </Button>
                        <Button
                          size="$2"
                          variant="outlined"
                          icon={<ImageIcon size={14} />}
                          onPress={() => pickImage(doc.id, false)}
                          disabled={uploadingId === doc.id}
                        >
                          Gallery
                        </Button>
                      </XStack>
                    )}
                  </YStack>
                  {index < documents.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Tips */}
          <Card padding="$4" bordered backgroundColor="$yellow2">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">📋 Document Tips</Text>
              <Separator />
              <YStack gap="$2">
                <Text fontSize="$3" fontFamily="$body">• Ensure all documents are clear and readable</Text>
                <Text fontSize="$3" fontFamily="$body">• Documents must not be expired</Text>
                <Text fontSize="$3" fontFamily="$body">• Photos should show all four corners of the document</Text>
                <Text fontSize="$3" fontFamily="$body">• Verification typically takes 24–48 hours</Text>
              </YStack>
            </YStack>
          </Card>

          {/* Help */}
          <Button variant="outlined" onPress={() => router.push('/(shared)/profile/help')}>
            Need Help with Documents?
          </Button>

          {/* Action buttons */}
          {isNewUser ? (
            <YStack gap="$3">
              <Button
                variant="primary"
                onPress={handleContinue}
                disabled={!allRequiredUploaded}
                opacity={!allRequiredUploaded ? 0.5 : 1}
              >
                {allRequiredUploaded
                  ? 'Submit & Continue'
                  : `Upload ${totalRequired - uploadedRequiredCount} more required document${totalRequired - uploadedRequiredCount !== 1 ? 's' : ''} to continue`}
              </Button>
              <Button variant="outlined" onPress={handleSkip}>
                Skip for now, I'll do this later
              </Button>
            </YStack>
          ) : (
            allRequiredUploaded && (
              <Button variant="primary" onPress={handleContinue}>
                Done
              </Button>
            )
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}