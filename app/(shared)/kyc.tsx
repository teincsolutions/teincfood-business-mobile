// @ts-nocheck
import { useState } from "react";
import { ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { YStack, XStack, Text } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui";
import { KycForm, type KycDocumentState, type KycDocConfig } from "@/components/kyc/KycForm";
import { useAuthStore } from "@/stores/auth.store";
import * as businessService from "@/services/business.service";
import { api } from "@/services/api";

const DOCS_BY_TYPE: Record<string, KycDocConfig[]> = {
  business: [
    { id: "national_id", name: "National ID", description: "Government-issued ID (Ghana Card, Passport, Driver's License)", required: true, hasIdType: true, hasIdNumber: true, hasDates: true },
    { id: "business_license", name: "Business License", description: "Valid business operating license", required: true, hasIdNumber: true, hasDates: true },
    { id: "business_cert", name: "Business Certificate", description: "Certificate of incorporation or business registration", required: true, hasIdNumber: true, hasDates: true },
  ],
  seller: [
    { id: "profile_photo", name: "Profile Photo", description: "Clear photo of your face", required: true, isProfilePhoto: true },
    { id: "national_id", name: "National ID", description: "Government-issued ID", required: true, hasIdType: true, hasIdNumber: true, hasDates: true },
    { id: "business_cert", name: "Business Certificate", description: "Certificate of incorporation or business registration", required: true, hasIdNumber: true, hasDates: true },
  ],
  rider: [
    { id: "profile_photo", name: "Profile Photo", description: "Clear photo of your face", required: true, isProfilePhoto: true },
    { id: "national_id", name: "National ID", description: "Government-issued ID", required: true, hasIdType: true, hasIdNumber: true, hasDates: true },
    { id: "drivers_license", name: "Driver's License", description: "Valid driving license", required: true, hasIdNumber: true, hasDates: true },
    { id: "vehicle_insurance", name: "Vehicle Insurance", description: "Current vehicle insurance certificate", required: true, hasIdNumber: true, hasDates: true },
    { id: "vehicle_registration", name: "Vehicle Registration", description: "Vehicle registration certificate", required: true, hasIdNumber: true, hasDates: true },
  ],
  fleet_manager: [
    { id: "profile_photo", name: "Profile Photo", description: "Clear photo of your face", required: true, isProfilePhoto: true },
    { id: "national_id", name: "National ID", description: "Government-issued ID", required: true, hasIdType: true, hasIdNumber: true, hasDates: true },
    { id: "business_cert", name: "Business Certificate", description: "Certificate of incorporation or business registration", required: true, hasIdNumber: true, hasDates: true },
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
  const uploadContext = type === "business" && id ? { entity_type: "business", entity_id: id } : { entity_type: "user", entity_id: userId || "unknown" };
  const [documents, setDocuments] = useState<Record<string, KycDocumentState>>(() => buildInitialDocs(configs));

  const title = type === "business" ? "Business KYC" : "KYC Verification";
  const subtitle = type === "business"
    ? "Upload business documents for verification"
    : "Upload your identity documents for verification";

  const handleSubmitDoc = async (docId: string, payload: Record<string, any>) => {
    const singleDoc = { [docId]: payload };
    if (type === "business" && id) {
      await businessService.submitBusinessKyc(id, { documents: singleDoc, user_type: "business_owner", partial: "true" });
    } else {
      await api.post("/users/me/kyc", { documents: singleDoc, user_type: docType, partial: "true" });
    }
    toast.success(`${docId.replace(/_/g, " ")} submitted for review`);
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack paddingHorizontal="$4" paddingTop={Math.max(insets.top + 8, 16)} paddingBottom="$3" alignItems="center" gap="$3" backgroundColor="$background" borderBottomWidth={1} borderBottomColor="$borderColor">
        <BackButton />
        <Text fontSize="$6" fontWeight="700" fontFamily="$heading" numberOfLines={1}>{title}</Text>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={Math.max(insets.bottom + 20, 24)}>
          <KycForm
            title={title}
            subtitle={subtitle}
            docConfigs={configs}
            documents={documents}
            onDocumentsChange={setDocuments}
            onSubmitDoc={handleSubmitDoc}
            uploadContext={uploadContext}
          />
        </YStack>
      </ScrollView>
    </YStack>
  );
}
