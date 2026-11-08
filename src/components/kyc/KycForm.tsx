// @ts-nocheck
import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { YStack, XStack, Text, Card, Progress, Separator } from "tamagui";
import { toast } from "sonner-native";
import { Button } from "@/components/ui";
import { uploadImage } from "@/services/upload.service";
import { extractApiErrorMessage } from "@teincfood/core";
import { KycCard, type KycDocConfig, type DocStatus } from "./KycCard";

export interface KycDocumentState {
  status: DocStatus;
  uploadedAt?: string;
  previewUri?: string;
  rejectionReason?: string;
  uri?: string;
  fileName?: string;
  idType?: string;
  idNumber?: string;
  issuedDate?: Date;
  expirationDate?: Date;
}

export interface KycFormProps {
  title: string;
  subtitle: string;
  docConfigs: KycDocConfig[];
  documents: Record<string, KycDocumentState>;
  onDocumentsChange: (docs: Record<string, KycDocumentState>) => void;
  onSubmitDoc: (
    docId: string,
    docPayload: Record<string, any>,
  ) => Promise<void>;
  uploadContext?: Record<string, string>;
  globalFeedback?: string[];
}

export function KycForm({
  title,
  subtitle,
  docConfigs,
  documents,
  onDocumentsChange,
  onSubmitDoc,
  uploadContext,
  globalFeedback,
}: KycFormProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const updateDoc = useCallback(
    (docId: string, updates: Partial<KycDocumentState>) => {
      onDocumentsChange({
        ...documents,
        [docId]: { ...documents[docId], ...updates },
      });
    },
    [documents, onDocumentsChange],
  );

  const pickAsset = useCallback(
    async (
      source: "camera" | "gallery" | "document",
    ): Promise<{ uri: string; name: string } | null> => {
      if (source === "camera" || source === "gallery") {
        const permFn =
          source === "camera"
            ? ImagePicker.requestCameraPermissionsAsync
            : ImagePicker.requestMediaLibraryPermissionsAsync;
        const { status } = await permFn();
        if (status !== "granted") {
          toast.error(
            source === "camera"
              ? "Camera access is required."
              : "Photo library access is required.",
          );
          return null;
        }
        const result = await (
          source === "camera"
            ? ImagePicker.launchCameraAsync
            : ImagePicker.launchImageLibraryAsync
        )({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.85,
        });
        if (result.canceled || !result.assets?.[0]) return null;
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          name: asset.uri.split("/").pop() || "photo.jpg",
        };
      }

      // Document picker (PDF, etc.)
      const docResult = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (docResult.canceled || !docResult.assets?.[0]) return null;
      return {
        uri: docResult.assets[0].uri,
        name: docResult.assets[0].name || "document.pdf",
      };
    },
    [],
  );

  const handleSubmitDoc = useCallback(
    async (docId: string, overrides?: Partial<KycDocumentState>) => {
      const doc = { ...(documents[docId] || {}), ...(overrides || {}) } as
        | KycDocumentState
        | undefined;
      const config = docConfigs.find((c) => c.id === docId);
      if (!doc) return;
      // National ID (and any fileOptional doc) may be submitted with no
      // attachment — the ID number is what matters. All other docs require
      // an uploaded file (S3 key in doc.uri).
      if (!doc.uri && !config?.fileOptional) return;

      const fmt = (d: Date | undefined) =>
        d ? d.toISOString().split("T")[0] : "";
      const payload: Record<string, any> = {};
      if (doc.uri) payload.url = doc.uri;
      const issued = fmt(doc.issuedDate);
      const expires = fmt(doc.expirationDate);
      // Never fake dates: only send what staff actually entered. Admin
      // review judges completeness.
      if (issued) payload.issued_date = issued;
      if (expires) payload.expiration_date = expires;
      if (doc.idNumber) payload.id_number = doc.idNumber;
      if (doc.idType) payload.id_type = doc.idType;
      if (doc.uri && !doc.idNumber && !doc.idType) payload.document_id = doc.uri;

      try {
        await onSubmitDoc(docId, payload);
        // Preserve the freshly uploaded key when auto-submitting right after
        // an upload. `updateDoc` closes over the previous render's documents,
        // so without the overrides the new URI can be dropped.
        updateDoc(docId, { ...(overrides || {}), status: "pending" });
      } catch (e) {
        toast.error(extractApiErrorMessage(e));
      }
    },
    [documents, docConfigs, onSubmitDoc, updateDoc],
  );

  const handleUpload = useCallback(
    async (docId: string, source: "camera" | "gallery" | "document") => {
      const asset = await pickAsset(source);
      if (!asset) return;

      setUploadingId(docId);
      setUploadProgress(0);
      updateDoc(docId, { status: "uploading", previewUri: asset.uri, fileName: asset.name });

      try {
        const ctx = { entity_type: 'unknown', entity_id: 'unknown', document_type: docId, ...(uploadContext || {}) };
        const { key } = await uploadImage(asset.uri, 'kyc', ctx, (p) => setUploadProgress(p));

        updateDoc(docId, {
          uri: key,
          status: "uploading",
          previewUri: asset.uri,
          uploadedAt: new Date().toISOString().split("T")[0],
          rejectionReason: undefined,
        });
        setUploadProgress(100);

        // Profile photo — auto-submit immediately after upload. Pass the
        // just-uploaded key explicitly: this render's `documents` still has
        // the pre-upload state, so calling handleSubmitDoc() bare used to
        // return early and the photo was never submitted.
        const config = docConfigs.find((c) => c.id === docId);
        if (config?.isProfilePhoto) {
          await handleSubmitDoc(docId, {
            uri: key,
            previewUri: asset.uri,
            fileName: asset.name,
            uploadedAt: new Date().toISOString().split("T")[0],
          });
        }
      } catch (e) {
        updateDoc(docId, { status: "not_uploaded", previewUri: undefined });
        toast.error(extractApiErrorMessage(e));
      } finally {
        setUploadingId(null);
        setUploadProgress(0);
      }
    },
    [pickAsset, updateDoc, uploadContext, docConfigs, handleSubmitDoc],
  );

  const totalRequired = docConfigs.filter((d) => d.required).length;
  const uploadedRequired = docConfigs.filter(
    (d) => d.required && documents[d.id]?.status !== "not_uploaded",
  ).length;
  const progress =
    totalRequired > 0 ? (uploadedRequired / totalRequired) * 100 : 0;

  return (
    <YStack gap="$4">
      <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
        {title}
      </Text>
      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
        {subtitle}
      </Text>

      {/* Admin feedback on rejection */}
      {globalFeedback && globalFeedback.length > 0 && (
        <Card padding="$4" bordered backgroundColor="$red2">
          <YStack gap="$2">
            <Text fontSize="$4" fontWeight="700" color="$red10">
              Changes requested
            </Text>
            {globalFeedback.map((msg, i) => (
              <Text key={i} fontSize="$3" color="$red10" fontFamily="$body">
                • {msg}
              </Text>
            ))}
          </YStack>
        </Card>
      )}

      {/* Progress */}
      <Card padding="$4" bordered>
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$4" fontWeight="bold">
              Progress
            </Text>
            <Text fontSize="$4" fontWeight="800" color="$primary">
              {uploadedRequired}/{totalRequired}
            </Text>
          </XStack>
          <Progress value={progress} backgroundColor="$gray5">
            <Progress.Indicator animation="bouncy" backgroundColor="$primary" />
          </Progress>
        </YStack>
      </Card>

      {/* Document cards */}
      <Card padding="$4" bordered>
        <YStack gap="$1">
          <Text
            fontSize="$4"
            fontWeight="600"
            fontFamily="$heading"
            marginBottom="$2"
          >
            Documents
          </Text>
          <Separator />
          {docConfigs.map((config, index) => {
            const doc = documents[config.id] || {
              status: "not_uploaded" as DocStatus,
            };
            return (
              <YStack key={config.id}>
                <KycCard
                  config={config}
                  status={doc.status}
                  uploadedAt={doc.uploadedAt}
                  uri={doc.uri}
                  previewUri={doc.previewUri}
                  fileName={doc.fileName}
                  rejectionReason={doc.rejectionReason}
                  uploading={uploadingId === config.id}
                  uploadProgress={uploadProgress}
                  idType={doc.idType}
                  idNumber={doc.idNumber}
                  issuedDate={doc.issuedDate}
                  expirationDate={doc.expirationDate}
                  onIdTypeChange={(val) =>
                    updateDoc(config.id, { idType: val })
                  }
                  onIdNumberChange={(val) =>
                    updateDoc(config.id, { idNumber: val })
                  }
                  onIssuedDateChange={(val: Date) =>
                    updateDoc(config.id, { issuedDate: val })
                  }
                  onExpirationDateChange={(val: Date) =>
                    updateDoc(config.id, { expirationDate: val })
                  }
                  onUpload={handleUpload}
                  onSubmitDoc={handleSubmitDoc}
                  onRemove={() =>
                    updateDoc(config.id, {
                      status: "not_uploaded",
                      uri: undefined,
                      previewUri: undefined,
                    })
                  }
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
