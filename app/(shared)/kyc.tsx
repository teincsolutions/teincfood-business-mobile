// @ts-nocheck
import { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { YStack, XStack, Text } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { BackButton } from "@/components/ui";
import { KycForm, type KycDocumentState, type KycDocConfig } from "@/components/kyc/KycForm";
import { toast } from "sonner-native";
import { useAuthStore } from "@/stores/auth.store";
import { useUserKycQuery, useBusinessKycQuery, useSubmitUserKycMutation, useSubmitBusinessKycMutation } from "@/hooks/useKyc";

const DOCS_BY_TYPE: Record<string, KycDocConfig[]> = {
  business: [
    { id: "national_id", name: "National ID", description: "Owner's government-issued ID", required: true, hasIdType: true, hasIdNumber: true, hasDates: true },
    { id: "business_license", name: "Business License", description: "Valid business operating license", required: true, hasIdNumber: true, hasDates: true },
    { id: "business_cert", name: "Business Certificate", description: "Certificate of incorporation or business registration", required: true, hasIdNumber: true, hasDates: true },
  ],
  rider: [
    { id: "profile_photo", name: "Profile Photo", description: "Clear photo of your face", required: true, isProfilePhoto: true },
    { id: "national_id", name: "National ID", description: "Government-issued ID", required: true, hasIdType: true, hasIdNumber: true, hasDates: true },
    { id: "drivers_license", name: "Driver's License", description: "Valid driving license", required: true, hasIdNumber: true, hasDates: true },
  ],
};

function buildInitialDocs(configs: KycDocConfig[]): Record<string, KycDocumentState> {
  const docs: Record<string, KycDocumentState> = {};
  for (const c of configs) {
    docs[c.id] = { status: "not_uploaded", uri: undefined };
  }
  return docs;
}

export default function KycScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type, id, role } = useLocalSearchParams<{ type: string; id?: string; role?: string }>();

  const docType = type === "business" ? "business" : (role as string) || "rider";
  const configs = DOCS_BY_TYPE[docType] || DOCS_BY_TYPE.rider;
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const uploadContext = type === "business" && id ? { entity_type: "business", entity_id: id } : { entity_type: "user", entity_id: userId || "unknown" };

  // Fetch existing KYC data
  const { data: userKyc, isLoading: userLoading } = useUserKycQuery(type !== "business");
  const { data: bizKyc, isLoading: bizLoading } = useBusinessKycQuery(type === "business" ? id : undefined);
  const kycData = type === "business" ? bizKyc : userKyc;
  const loading = type === "business" ? bizLoading : userLoading;

  const [documents, setDocuments] = useState<Record<string, KycDocumentState>>(() => buildInitialDocs(configs));

  // Sync fetched KYC data into form state
  useEffect(() => {
    if (!kycData) return;
    const existing = kycData.kyc_documents || {};
    if (Object.keys(existing).length === 0) return;
    const merged = { ...buildInitialDocs(configs) };
    for (const [docId, docData] of Object.entries(existing)) {
      const d = docData as Record<string, any>;
      if (configs.find((c) => c.id === docId)) {
        merged[docId] = {
          status: "pending",
          uri: d.url || d.document_id || d.key,
          idType: d.id_type,
          idNumber: d.id_number,
          issuedDate: d.issued_date ? new Date(d.issued_date) : undefined,
          expirationDate: d.expiration_date ? new Date(d.expiration_date) : undefined,
        };
      }
    }
    setDocuments(merged);
  }, [kycData]);

  const submitUserMutation = useSubmitUserKycMutation();
  const submitBizMutation = useSubmitBusinessKycMutation();

  const handleSubmitDoc = async (docId: string, payload: Record<string, any>) => {
    const singleDoc = { [docId]: payload };
    if (type === "business" && id) {
      await submitBizMutation.mutateAsync({ businessId: id, documents: singleDoc, partial: true });
    } else {
      await submitUserMutation.mutateAsync({ documents: singleDoc, userType: docType, partial: true });
    }
    queryClient.invalidateQueries({ queryKey: type === "business" ? ['kyc', 'business', id] : ['kyc', 'user', userId] });
    toast.success(`${docId.replace(/_/g, " ")} submitted for review`);
  };

  const title = type === "business" ? "Business KYC" : "KYC Verification";
  const subtitle = type === "business"
    ? "Upload business documents for verification"
    : "Upload your identity documents for verification";

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack paddingHorizontal="$4" paddingTop={Math.max(insets.top + 8, 16)} paddingBottom="$3" alignItems="center" gap="$3" backgroundColor="$background" borderBottomWidth={1} borderBottomColor="$borderColor">
        <BackButton />
        <Text fontSize="$6" fontWeight="700" fontFamily="$heading" numberOfLines={1}>{title}</Text>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={Math.max(insets.bottom + 20, 24)}>
          {loading ? (
            <YStack alignItems="center" padding="$8"><Text color="$colorMuted">Loading KYC data...</Text></YStack>
          ) : (
          <KycForm
            title={title}
            subtitle={subtitle}
            docConfigs={configs}
            documents={documents}
            onDocumentsChange={setDocuments}
            onSubmitDoc={handleSubmitDoc}
            uploadContext={uploadContext}
          />
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
