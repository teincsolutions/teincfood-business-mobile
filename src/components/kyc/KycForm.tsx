// @ts-nocheck
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { YStack, XStack, Text, Card, Progress, Separator } from 'tamagui';
import { toast } from 'sonner-native';
import { Button } from '@/components/ui';
import { uploadImage } from '@/services/upload.service';
import { extractApiErrorMessage } from '@/utils/error';
import { KycCard, type KycDocConfig, type DocStatus } from './KycCard';

export interface KycDocumentState {
  status: DocStatus;
  uploadedAt?: string;
  rejectionReason?: string;
  uri?: string;
  idType?: string;
  idNumber?: string;
}

export interface KycFormProps {
  title: string;
  subtitle: string;
  docConfigs: KycDocConfig[];
  documents: Record<string, KycDocumentState>;
  onDocumentsChange: (docs: Record<string, KycDocumentState>) => void;
  onSubmit: (docs: Record<string, any>) => Promise<void>;
}

export function KycForm({ title, subtitle, docConfigs, documents, onDocumentsChange, onSubmit }: KycFormProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateDoc = useCallback((docId: string, updates: Partial<KycDocumentState>) => {
    onDocumentsChange({ ...documents, [docId]: { ...documents[docId], ...updates } });
  }, [documents, onDocumentsChange]);

  const handleUpload = useCallback(async (docId: string, useCamera: boolean) => {
    const permFn = useCamera ? ImagePicker.requestCameraPermissionsAsync : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== 'granted') {
      toast.error(useCamera ? 'Camera access is required.' : 'Photo library access is required.');
      return;
    }

    const result = await (useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync)({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setUploadingId(docId);

    try {
      const { key } = await uploadImage(uri, 'kyc');
      updateDoc(docId, { uri: key, status: 'pending', uploadedAt: new Date().toISOString().split('T')[0], rejectionReason: undefined });
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setUploadingId(null);
    }
  }, [updateDoc]);

  const totalRequired = docConfigs.filter((d) => d.required).length;
  const uploadedRequired = docConfigs.filter((d) => d.required && documents[d.id]?.status !== 'not_uploaded').length;
  const progress = totalRequired > 0 ? (uploadedRequired / totalRequired) * 100 : 0;
  const verifiedCount = docConfigs.filter((d) => documents[d.id]?.status === 'verified').length;
  const allRequiredUploaded = uploadedRequired === totalRequired;

  const handleSubmit = async () => {
    if (!allRequiredUploaded) return;
    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      for (const config of docConfigs) {
        const doc = documents[config.id];
        if (!doc || doc.status === 'not_uploaded') continue;
        const entry: Record<string, any> = {
          url: doc.uri,
          issued_date: doc.uploadedAt,
          expiration_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        };
        if (doc.idNumber) entry.id_number = doc.idNumber;
        if (doc.idType) entry.id_type = doc.idType;
        if (!doc.idNumber && !doc.idType) entry.document_id = doc.uri;
        payload[config.id] = entry;
      }
      await onSubmit(payload);
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <YStack gap="$4">
      <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">{title}</Text>
      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">{subtitle}</Text>

      {/* Progress */}
      <Card padding="$4" bordered>
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$4" fontWeight="bold">Progress</Text>
            <Text fontSize="$4" fontWeight="800" color="$primary">{uploadedRequired}/{totalRequired} required</Text>
          </XStack>
          <Progress value={progress} backgroundColor="$gray5">
            <Progress.Indicator animation="bouncy" backgroundColor="$primary" />
          </Progress>
          <Text fontSize="$3" color="$colorMuted">
            {verifiedCount > 0 ? `${verifiedCount} verified` : 'Upload documents to begin verification'}
          </Text>
        </YStack>
      </Card>

      {/* Document cards */}
      <Card padding="$4" bordered>
        <YStack gap="$1">
          <Text fontSize="$4" fontWeight="600" fontFamily="$heading" marginBottom="$2">Documents</Text>
          <Separator />
          {docConfigs.map((config, index) => {
            const doc = documents[config.id] || { status: 'not_uploaded' as DocStatus };
            return (
              <YStack key={config.id}>
                <KycCard
                  config={config}
                  status={doc.status}
                  uploadedAt={doc.uploadedAt}
                  rejectionReason={doc.rejectionReason}
                  uploading={uploadingId === config.id}
                  idType={doc.idType}
                  idNumber={doc.idNumber}
                  onIdTypeChange={(val) => updateDoc(config.id, { idType: val })}
                  onIdNumberChange={(val) => updateDoc(config.id, { idNumber: val })}
                  onUpload={handleUpload}
                  onRemove={() => updateDoc(config.id, { status: 'not_uploaded', uri: undefined })}
                />
                {index < docConfigs.length - 1 && <Separator />}
              </YStack>
            );
          })}
        </YStack>
      </Card>

      {/* Submit button */}
      <Button variant="primary" width="100%" onPress={handleSubmit} disabled={!allRequiredUploaded || submitting} loading={submitting}>
        {submitting ? 'Submitting...' : allRequiredUploaded ? 'Submit for Verification' : `Upload ${totalRequired - uploadedRequired} more document(s)`}
      </Button>
    </YStack>
  );
}
