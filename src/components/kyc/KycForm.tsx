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
  previewUri?: string;
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
  onSubmitDoc: (docId: string, docPayload: Record<string, any>) => Promise<void>;
}

export function KycForm({ title, subtitle, docConfigs, documents, onDocumentsChange, onSubmitDoc }: KycFormProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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

    const asset = result.assets[0];
    setUploadingId(docId);
    setUploadProgress(0);
    updateDoc(docId, { status: 'uploading', previewUri: asset.uri });

    try {
      // Simulate progress for better UX
      const progressTimer = setInterval(() => setUploadProgress((p) => Math.min(p + 15, 85)), 400);
      const { key } = await uploadImage(asset.uri, 'kyc');
      clearInterval(progressTimer);
      setUploadProgress(100);

      updateDoc(docId, {
        uri: key,
        status: 'uploading',
        previewUri: asset.uri,
        uploadedAt: new Date().toISOString().split('T')[0],
        rejectionReason: undefined,
      });
    } catch (e) {
      updateDoc(docId, { status: 'not_uploaded', previewUri: undefined });
      toast.error(extractApiErrorMessage(e));
    } finally {
      setUploadingId(null);
      setUploadProgress(0);
    }
  }, [updateDoc]);

  const handleSubmitDoc = useCallback(async (docId: string) => {
    const doc = documents[docId];
    if (!doc || !doc.uri) return;

    const payload: Record<string, any> = {
      url: doc.uri,
      issued_date: doc.uploadedAt || new Date().toISOString().split('T')[0],
      expiration_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    };
    if (doc.idNumber) payload.id_number = doc.idNumber;
    if (doc.idType) payload.id_type = doc.idType;
    if (!doc.idNumber && !doc.idType) payload.document_id = doc.uri;

    try {
      await onSubmitDoc(docId, payload);
      updateDoc(docId, { status: 'pending' });
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    }
  }, [documents, onSubmitDoc, updateDoc]);

  const totalRequired = docConfigs.filter((d) => d.required).length;
  const uploadedRequired = docConfigs.filter((d) => d.required && documents[d.id]?.status !== 'not_uploaded').length;
  const progress = totalRequired > 0 ? (uploadedRequired / totalRequired) * 100 : 0;

  return (
    <YStack gap="$4">
      <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">{title}</Text>
      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">{subtitle}</Text>

      {/* Progress */}
      <Card padding="$4" bordered>
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$4" fontWeight="bold">Progress</Text>
            <Text fontSize="$4" fontWeight="800" color="$primary">{uploadedRequired}/{totalRequired}</Text>
          </XStack>
          <Progress value={progress} backgroundColor="$gray5">
            <Progress.Indicator animation="bouncy" backgroundColor="$primary" />
          </Progress>
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
                  previewUri={doc.previewUri}
                  rejectionReason={doc.rejectionReason}
                  uploading={uploadingId === config.id}
                  uploadProgress={uploadProgress}
                  idType={doc.idType}
                  idNumber={doc.idNumber}
                  onIdTypeChange={(val) => updateDoc(config.id, { idType: val })}
                  onIdNumberChange={(val) => updateDoc(config.id, { idNumber: val })}
                  onUpload={handleUpload}
                  onSubmitDoc={handleSubmitDoc}
                  onRemove={() => updateDoc(config.id, { status: 'not_uploaded', uri: undefined, previewUri: undefined })}
                />
                {index < docConfigs.length - 1 && <Separator />}
              </YStack>
            );
          })}
        </YStack>
      </Card>
    </YStack>
  );
}
