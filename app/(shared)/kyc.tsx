// @ts-nocheck
import { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { YStack, XStack, Text } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { BackButton } from "@/components/ui";
import * as walletService from "@/services/wallet.service";
import {
  KycForm,
  type KycDocumentState,
  type KycDocConfig,
} from "@/components/kyc/KycForm";
import { toast } from "sonner-native";
import { useAuthStore } from "@/stores/auth.store";
import { useBusinessStore } from "@/stores/business.store";
import { useRoleStore } from "@/stores/role.store";
import { getItem, setItem } from "@/utils/storage";
import {
  useUserKycQuery,
  useRiderKycQuery,
  useBusinessKycQuery,
  useSubmitUserKycMutation,
  useSubmitRiderKycMutation,
  useSubmitBusinessKycMutation,
  useKycRequirementsQuery,
} from "@/hooks/useKyc";

const TAX_CERTIFICATE_DOC: KycDocConfig = {
  id: "tax_certificate",
  name: "Tax Certificate",
  description:
    "Optional. Upload your tax registration certificate and enter the TIN / tax number.",
  required: false,
  hasIdNumber: true,
  idNumberPlaceholder: "TIN / Tax number",
  hasDates: true,
};

const SELLER_DOCS: KycDocConfig[] = [
  {
    id: "national_id",
    name: "National ID",
    description: "Owner's government-issued ID",
    required: true,
    hasIdType: true,
    hasIdNumber: true,
    hasDates: true,
  },
  {
    id: "business_cert",
    name: "Registration Certificate",
    description: "Business registration certificate or certificate of incorporation",
    required: true,
    hasIdNumber: true,
    hasDates: true,
  },
  TAX_CERTIFICATE_DOC,
];

const FLEET_DOCS: KycDocConfig[] = [
  {
    id: "business_license",
    name: "Business License",
    description: "Valid operating licence for the delivery/fleet business",
    required: true,
    hasIdNumber: true,
    hasDates: true,
  },
  TAX_CERTIFICATE_DOC,
];

const DOCS_BY_TYPE: Record<string, KycDocConfig[]> = {
  business: SELLER_DOCS,
  seller: SELLER_DOCS,
  fleet_manager: FLEET_DOCS,
  rider: [
    {
      id: "profile_photo",
      name: "Profile Photo",
      description: "Clear photo of your face",
      required: true,
      isProfilePhoto: true,
    },
    {
      id: "national_id",
      name: "National ID",
      description:
        "Enter your Ghana Card or passport number below. Do not photograph your Ghana Card — attachment is optional.",
      required: true,
      hasIdType: true,
      hasIdNumber: true,
      hasDates: false,
      fileOptional: true,
      idTypeOptions: [
        { value: "ghana_card", label: "Ghana Card" },
        { value: "passport", label: "Passport" },
      ],
    },
    {
      id: "driver_license",
      name: "Driver's License",
      description: "Valid driving license",
      required: true,
      hasIdNumber: true,
      hasDates: true,
    },
  ],
};

// Unsaved per-requirement drafts, keyed by owner + flow. Survives app restarts;
// cleared per document on successful submit.
type KycDraftDoc = {
  uri?: string;
  fileName?: string;
  previewUri?: string;
  idType?: string;
  idNumber?: string;
  issuedDate?: string;
  expirationDate?: string;
  uploadedAt?: string;
  notAvailable?: boolean;
};

function draftKeyFor(owner: string, flow: string) {
  return `kyc-draft:${owner}:${flow}`;
}

function parseFeedback(notes: unknown): {
  perDoc: Record<string, string>;
  global: string[];
} {
  if (!notes || typeof notes !== "string")
    return { perDoc: {}, global: [] };
  try {
    const parsed = JSON.parse(notes);
    if (Array.isArray(parsed)) {
      const perDoc: Record<string, string> = {};
      const global: string[] = [];
      for (const item of parsed) {
        const message =
          item && typeof item.message === "string" ? item.message.trim() : "";
        if (!message) continue;
        if (item.doc) perDoc[String(item.doc)] = message;
        else global.push(message);
      }
      return { perDoc, global };
    }
  } catch {
    // Plain-text legacy notes
  }
  return { perDoc: {}, global: [notes] };
}

function buildInitialDocs(
  configs: KycDocConfig[],
): Record<string, KycDocumentState> {
  const docs: Record<string, KycDocumentState> = {};
  for (const c of configs) {
    docs[c.id] = { status: "not_uploaded", uri: undefined };
  }
  return docs;
}

export default function KycScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type, id, role } = useLocalSearchParams<{
    type: string;
    id?: string;
    role?: string;
  }>();

  const requestedType = (type as string) || "";
  const roleValue = useRoleStore((s) => s.role);
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const activeBusinessId = activeBusiness?.id;
  const isFleet =
    roleValue === "fleet_manager" ||
    activeBusiness?.type === "delivery_provider";
  const docType =
    requestedType === "business"
      ? isFleet
        ? "fleet_manager"
        : "seller"
      : (role as string) || (isFleet ? "fleet_manager" : "seller");
  // Sellers and fleet managers own a business, so their KYC is business KYC.
  const isBusiness =
    requestedType === "business" ||
    docType === "seller" ||
    docType === "fleet_manager";
  const businessId = isBusiness ? id || activeBusinessId : undefined;
  const isRider = !isBusiness && docType === "rider";
  const requirementsQuery = useKycRequirementsQuery(docType);
  // Backend requirements are authoritative. Local defaults are only a
  // fallback for a failed/offline request, never an override of an empty
  // admin configuration.
  const configs =
    requirementsQuery.data ??
    DOCS_BY_TYPE[docType] ??
    DOCS_BY_TYPE.business;
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const uploadContext =
    isBusiness && businessId
      ? { entity_type: "business", entity_id: businessId }
      : { entity_type: "user", entity_id: userId || "unknown" };

  // Fetch existing KYC data. Riders submit to the rider profile (the record
  // admins review); businesses/sellers use the business endpoint.
  const { data: userKyc, isLoading: userLoading } = useUserKycQuery(
    !isBusiness && !isRider,
  );
  const { data: riderKyc, isLoading: riderLoading } = useRiderKycQuery(
    isRider,
  );
  const { data: bizKyc, isLoading: bizLoading } = useBusinessKycQuery(
    isBusiness ? businessId : undefined,
  );
  const kycData = isBusiness ? bizKyc : isRider ? riderKyc : userKyc;
  const loading = isBusiness ? bizLoading : isRider ? riderLoading : userLoading;

  const [documents, setDocuments] = useState<Record<string, KycDocumentState>>(
    () => buildInitialDocs(configs),
  );

  // If requirements arrive after the first render, keep any unsaved work and
  // add/remove cards to match the backend configuration.
  useEffect(() => {
    if (!requirementsQuery.data) return;
    setDocuments((prev) => {
      const next = buildInitialDocs(configs);
      for (const [docId, doc] of Object.entries(prev)) {
        if (next[docId]) next[docId] = doc;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirementsQuery.data]);

  const ownerKey =
    isBusiness && businessId
      ? `biz:${businessId}`
      : `user:${userId || "unknown"}`;
  const draftKey = draftKeyFor(ownerKey, docType);

  const readDraft = (): Record<string, KycDraftDoc> =>
    getItem<Record<string, KycDraftDoc>>(draftKey) ?? {};

  const writeDraft = (docs: Record<string, KycDocumentState>) => {
    const draft: Record<string, KycDraftDoc> = {};
    for (const [docId, d] of Object.entries(docs)) {
      // Server is the source of truth once submitted — only keep drafts for
      // docs that still need action (unsaved work or rejected resubmits).
      if (d.status !== "verified" && d.status !== "pending") {
        draft[docId] = {
          uri: d.uri,
          fileName: d.fileName,
          previewUri: d.previewUri,
          idType: d.idType,
          idNumber: d.idNumber,
          issuedDate: d.issuedDate?.toISOString(),
          expirationDate: d.expirationDate?.toISOString(),
          uploadedAt: d.uploadedAt,
          notAvailable: d.notAvailable,
        };
      }
    }
    setItem(draftKey, draft);
  };

  const persistDocuments = (docs: Record<string, KycDocumentState>) => {
    setDocuments(docs);
    writeDraft(docs);
  };

  const clearDocDraft = (docId: string) => {
    const draft = readDraft();
    if (draft[docId]) {
      delete draft[docId];
      setItem(draftKey, draft);
    }
  };

  // Sync fetched KYC data into form state, overlaying unsaved drafts and
  // admin feedback (per-document rejection reasons).
  const [feedback, setFeedback] = useState<{ perDoc: Record<string, string>; global: string[] }>({
    perDoc: {},
    global: [],
  });
  useEffect(() => {
    if (!kycData) return;
    const existing = kycData.kyc_documents || {};
    const parsed = parseFeedback(
      (kycData as Record<string, any>).notes ?? (kycData as Record<string, any>).kyc_notes,
    );
    setFeedback(parsed);
    if (Object.keys(existing).length === 0) return;
    const overallStatus = kycData.kyc_status || "pending";
    const docStatus =
      overallStatus === "approved"
        ? "verified"
        : overallStatus === "rejected"
          ? "rejected"
          : "pending";
    const draft = readDraft();
    const merged = { ...buildInitialDocs(configs) };
    for (const [docId, docData] of Object.entries(existing)) {
      const d = docData as Record<string, any>;
      if (configs.find((c) => c.id === docId)) {
        merged[docId] = {
          status: docStatus,
          uri: d.url || d.document_id || d.key,
          previewUri: d.signed_url,
          idType: d.id_type,
          idNumber: d.id_number,
          issuedDate: d.issued_date ? new Date(d.issued_date) : undefined,
          expirationDate: d.expiration_date
            ? new Date(d.expiration_date)
            : undefined,
          rejectionReason: parsed.perDoc[docId],
          notAvailable:
            d.not_available === true || d.unavailable === true,
        };
      }
    }
    // Overlay unsaved drafts onto docs that still need action (never over
    // server-confirmed pending/verified docs). Status is left untouched —
    // a draft never marks a doc submitted.
    for (const [docId, d] of Object.entries(draft)) {
      const current = merged[docId];
      if (!current || current.status === "pending" || current.status === "verified")
        continue;
      merged[docId] = {
        ...current,
        uri: d.uri ?? current.uri,
        fileName: d.fileName ?? current.fileName,
        previewUri: d.previewUri ?? current.previewUri,
        idType: d.idType ?? current.idType,
        idNumber: d.idNumber ?? current.idNumber,
        issuedDate: d.issuedDate ? new Date(d.issuedDate) : current.issuedDate,
        expirationDate: d.expirationDate
          ? new Date(d.expirationDate)
          : current.expirationDate,
        uploadedAt: d.uploadedAt ?? current.uploadedAt,
        notAvailable: d.notAvailable ?? current.notAvailable,
      };
    }
    setDocuments(merged);
  }, [kycData, configs]);

  const submitUserMutation = useSubmitUserKycMutation();
  const submitRiderMutation = useSubmitRiderKycMutation();
  const submitBizMutation = useSubmitBusinessKycMutation();
  const completeKyc = useAuthStore((s) => s.completeKyc);

  // Fresh users (no server records yet): restore drafts onto the blank form
  // so unsaved work survives app restarts.
  useEffect(() => {
    if (loading || kycData) return;
    const draft = readDraft();
    if (Object.keys(draft).length === 0) return;
    setDocuments((prev) => {
      const next = { ...prev };
      for (const [docId, d] of Object.entries(draft)) {
        if (!next[docId]) continue;
        next[docId] = {
          ...next[docId],
          uri: d.uri ?? next[docId].uri,
          fileName: d.fileName ?? next[docId].fileName,
          previewUri: d.previewUri ?? next[docId].previewUri,
          idType: d.idType ?? next[docId].idType,
          idNumber: d.idNumber ?? next[docId].idNumber,
          issuedDate: d.issuedDate ? new Date(d.issuedDate) : next[docId].issuedDate,
          expirationDate: d.expirationDate
            ? new Date(d.expirationDate)
            : next[docId].expirationDate,
          uploadedAt: d.uploadedAt ?? next[docId].uploadedAt,
          notAvailable: d.notAvailable ?? next[docId].notAvailable,
        };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handleSubmitDoc = async (
    docId: string,
    payload: Record<string, any>,
  ) => {
    const singleDoc = { [docId]: payload };
    if (isBusiness && businessId) {
      await submitBizMutation.mutateAsync({
        businessId,
        documents: singleDoc,
        partial: true,
        userType: docType,
      });
      // Keep the tax-wallet release flow in sync when the optional tax
      // certificate document is submitted as part of KYC.
      if (docId === "tax_certificate" && payload.url) {
        await walletService.requestTaxCertificate({
          businessId,
          certificateUrl: payload.url,
          notes: "Tax certificate submitted from business KYC",
        });
      }
    } else if (isRider) {
      await submitRiderMutation.mutateAsync({
        documents: singleDoc,
        partial: true,
      });
    } else {
      await submitUserMutation.mutateAsync({
        documents: singleDoc,
        userType: docType,
        partial: true,
      });
    }
    queryClient.invalidateQueries({
      queryKey: isBusiness
        ? ["kyc", "business", businessId]
        : isRider
          ? ["kyc", "rider", userId]
          : ["kyc", "user", userId],
    });
    // Submitted docs live on the server now — drop their drafts, and refresh
    // profile/banner state so home reflects the new kyc_status immediately.
    clearDocDraft(docId);
    if (!isBusiness) {
      completeKyc();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
    toast.success(`${docId.replace(/_/g, " ")} submitted for review`);
  };

  const title = isBusiness ? "Business KYC" : "KYC Verification";
  const subtitle = isBusiness
    ? "Upload business documents for verification"
    : "Upload your identity documents for verification";

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingHorizontal="$4"
        paddingTop={Math.max(insets.top + 8, 16)}
        paddingBottom="$3"
        alignItems="center"
        gap="$3"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <BackButton />
        <Text
          fontSize="$6"
          fontWeight="700"
          fontFamily="$heading"
          numberOfLines={1}
        >
          {title}
        </Text>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack
          padding="$4"
          gap="$4"
          paddingBottom={Math.max(insets.bottom + 20, 24)}
        >
          {loading ? (
            <YStack alignItems="center" padding="$8">
              <Text color="$colorMuted">Loading KYC data...</Text>
            </YStack>
          ) : (
            <>
              <KycForm
                title={title}
                subtitle={subtitle}
                docConfigs={configs}
                documents={documents}
                onDocumentsChange={persistDocuments}
                onSubmitDoc={handleSubmitDoc}
                uploadContext={uploadContext}
                globalFeedback={
                  kycData?.kyc_status === "rejected" ? feedback.global : []
                }
              />

            </>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
