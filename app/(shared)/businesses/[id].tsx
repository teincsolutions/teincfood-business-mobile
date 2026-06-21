// @ts-nocheck
import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
  Avatar,
  Progress,
  ScrollView,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, FormInput, BackButton } from "@/components/ui";
import { FormTextArea } from "@/components/ui/FormTextArea";
import { useBusinessStore } from "@/stores/business.store";
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  DollarSign,
  Pencil,
  Save,
  X,
  Camera,
  FileText,
  Check,
  AlertCircle,
  CheckCircle,
} from "@tamagui/lucide-icons";

type DocStatus = "not_uploaded" | "pending" | "verified" | "rejected";

interface BusinessDoc {
  id: string;
  name: string;
  description: string;
  status: DocStatus;
  uploadedAt?: string;
  required: boolean;
  rejectionReason?: string;
  uri?: string;
}

const INITIAL_OPERATIONAL_DOCS: BusinessDoc[] = [
  {
    id: "business_reg",
    name: "Business Registration Certificate",
    description: "Official certificate of incorporation / registration",
    status: "not_uploaded",
    required: true,
  },
  {
    id: "food_handler",
    name: "Food Handler's Certificate",
    description: "Valid food handling / hygiene certificate",
    status: "not_uploaded",
    required: true,
  },
  {
    id: "tax_tin",
    name: "Tax Registration / TIN",
    description: "Tax identification number certificate",
    status: "not_uploaded",
    required: true,
  },
  {
    id: "premises_license",
    name: "Premises / Operating License",
    description: "Local authority operating permit",
    status: "not_uploaded",
    required: false,
  },
];

const DOC_STATUS_COLOR: Record<DocStatus, string> = {
  not_uploaded: "#95a5a6",
  pending: "#f39c12",
  verified: "$success",
  rejected: "#e74c3c",
};

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    getBusinessById,
    setDefaultBusiness,
    getDefaultBusiness,
    updateBusiness,
  } = useBusinessStore();

  const business = getBusinessById(id);
  const isDefault = getDefaultBusiness()?.id === id;
  const isActive = business?.status === "active";

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [logoUri, setLogoUri] = useState<string | undefined>(business?.logoUrl);
  const [editForm, setEditForm] = useState({
    name: business?.name ?? "",
    type: business?.type ?? "",
    description: business?.description ?? "",
    address: business?.address?.street ?? "",
    city: business?.address?.city ?? "",
    phone: business?.phone ?? "",
    email: business?.email ?? "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Operational docs state
  const [docs, setDocs] = useState<BusinessDoc[]>(INITIAL_OPERATIONAL_DOCS);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  if (!business) {
    return (
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap="$4"
        padding="$6"
      >
        <Building size={48} color="$colorMuted" />
        <Text
          fontSize="$5"
          fontWeight="600"
          fontFamily="$heading"
          textAlign="center"
        >
          Business not found
        </Text>
        <Button onPress={() => router.back()}>
          <Text fontFamily="$body">Go Back</Text>
        </Button>
      </YStack>
    );
  }

  // ── Edit helpers ────────────────────────────────────────────────────────────

  const updateField = (key: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
    setEditErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateEdit = () => {
    const errs: Record<string, string> = {};
    if (!editForm.name.trim()) errs.name = "Business name is required";
    if (!editForm.city.trim()) errs.city = "City is required";
    return errs;
  };

  const handleChangeLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Photo library access is required to change the logo.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const errs = validateEdit();
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }
    setIsSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 800)); // replace with real API call
      updateBusiness(id, {
        name: editForm.name.trim(),
        type: editForm.type as any,
        description: editForm.description.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || undefined,
        ...(logoUri ? { logoUrl: logoUri } : {}),
        address: {
          ...(business.address ?? {}),
          street: editForm.address.trim(),
          city: editForm.city.trim(),
          fullAddress: `${editForm.address.trim()}, ${editForm.city.trim()}`,
        },
      });
      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("idle");
        setIsEditing(false);
      }, 1800);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: business.name ?? "",
      type: business.type ?? "",
      description: business.description ?? "",
      address: business.address?.street ?? "",
      city: business.address?.city ?? "",
      phone: business.phone ?? "",
      email: business.email ?? "",
    });
    setLogoUri(business.logoUrl);
    setEditErrors({});
    setIsEditing(false);
  };

  // ── Operational docs helpers ─────────────────────────────────────────────────

  const pickDoc = async (docId: string, useCamera: boolean) => {
    const permFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        useCamera
          ? "Camera access is required."
          : "Photo library access is required.",
      );
      return;
    }
    const launchFn = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const result = await launchFn({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingDocId(docId);
    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              uri: result.assets[0].uri,
              status: "pending",
              uploadedAt: new Date().toISOString().split("T")[0],
              rejectionReason: undefined,
            }
          : d,
      ),
    );
    setUploadingDocId(null);
  };

  const uploadedRequired = docs.filter(
    (d) => d.required && d.status !== "not_uploaded",
  ).length;
  const totalRequired = docs.filter((d) => d.required).length;
  const docProgress =
    totalRequired > 0 ? (uploadedRequired / totalRequired) * 100 : 0;

  const getDocStatusIcon = (status: DocStatus) => {
    switch (status) {
      case "verified":
        return <Check size={16} color="$success" />;
      case "pending":
        return <Clock size={16} color="#f39c12" />;
      case "rejected":
        return <AlertCircle size={16} color="#e74c3c" />;
      default:
        return <FileText size={16} color="#95a5a6" />;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <ScrollView
      flex={1}
      showsVerticalScrollIndicator={false}
      backgroundColor="$background"
      paddingBottom={Math.max(insets.bottom + 20, 24)}
    >
      <YStack padding="$4" paddingTop={Math.max(insets.top + 8, 16)} gap="$4">
        {/* Back button */}
        <BackButton />

        {/* Edit/Save header */}
        <XStack justifyContent="flex-end" alignItems="center">
          {isEditing ? (
            <XStack gap="$2">
              <Button
                size="$3"
                variant="outline"
                icon={<X size={16} />}
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                size="$3"
                variant="primary"
                icon={({ color, size }) => <Save size={size} color={color} />}
                onPress={handleSave}
                loading={isSaving}
              >
                Save
              </Button>
            </XStack>
          ) : (
            <Button
              size="$3"
              variant="outline"
              icon={<Pencil size={16} />}
              onPress={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
        </XStack>

        {/* Save status banner */}
        {saveStatus !== "idle" && (
          <XStack
            backgroundColor={saveStatus === "success" ? "$green2" : "$red2"}
            paddingHorizontal="$4"
            paddingVertical="$3"
            borderRadius="$3"
            gap="$2"
            alignItems="center"
          >
            {saveStatus === "success" ? (
              <CheckCircle size={16} color="$green10" />
            ) : (
              <AlertCircle size={16} color="$red10" />
            )}
            <Text
              color={saveStatus === "success" ? "$green10" : "$red10"}
              fontSize="$3"
              fontFamily="$body"
            >
              {saveStatus === "success"
                ? "Business profile saved."
                : "Failed to save. Please try again."}
            </Text>
          </XStack>
        )}

        {/* Logo + header */}
        <XStack gap="$4" alignItems="center">
          <YStack>
            <Avatar circular size="$14">
              <Avatar.Image src={logoUri} />
              <Avatar.Fallback
                alignItems="center"
                justifyContent="center"
                backgroundColor="$primary"
              >
                <Building size={32} color="white" />
              </Avatar.Fallback>
            </Avatar>
            {isEditing && (
              <Button
                size="$2"
                variant="outline"
                icon={<Camera size={14} />}
                onPress={handleChangeLogo}
                marginTop="$2"
              >
                Logo
              </Button>
            )}
          </YStack>

          <YStack flex={1} gap="$1">
            {isEditing ? (
              <FormInput
                label=""
                placeholder="Business name"
                value={editForm.name}
                onChangeText={(v) => updateField("name", v)}
                error={editErrors.name}
                fontSize="$6"
              />
            ) : (
              <Text
                fontSize="$7"
                fontWeight="bold"
                fontFamily="$heading"
                color="$color"
              >
                {business.name}
              </Text>
            )}
            <XStack gap="$2" alignItems="center">
              <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
                {business.code}
              </Text>
              {business.type && !isEditing && (
                <>
                  <Text fontSize="$3" color="$colorMuted">
                    ·
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorMuted"
                    fontFamily="$body"
                    textTransform="capitalize"
                  >
                    {business.type.replace("_", " ")}
                  </Text>
                </>
              )}
            </XStack>

            <XStack
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius="$10"
              backgroundColor={isActive ? "$successMuted" : "$backgroundSoft"}
              borderWidth={1}
              borderColor={isActive ? "$success" : "$borderColor"}
              alignSelf="flex-start"
              marginTop="$1"
            >
              <Text
                fontSize="$2"
                color={isActive ? "$success" : "$colorMuted"}
                fontFamily="$body"
                fontWeight="600"
              >
                {isActive ? "ACTIVE" : "INACTIVE"}
              </Text>
            </XStack>
          </YStack>
        </XStack>

        {/* Stats row */}
        {!isEditing && (
          <XStack gap="$3">
            <Card flex={1} padding="$3" bordered>
              <YStack gap="$1" alignItems="center">
                <XStack gap="$1" alignItems="center">
                  <Star size={14} color="$star" />
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading">
                    {business.rating?.toFixed(1) ?? "5.0"}
                  </Text>
                </XStack>
                <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                  Rating
                </Text>
              </YStack>
            </Card>
            <Card flex={1} padding="$3" bordered>
              <YStack gap="$1" alignItems="center">
                <XStack gap="$1" alignItems="center">
                  <Clock size={14} color="$colorMuted" />
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading">
                    {business.todayOrders ?? 0}
                  </Text>
                </XStack>
                <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                  Today's Orders
                </Text>
              </YStack>
            </Card>
            <Card flex={1} padding="$3" bordered>
              <YStack gap="$1" alignItems="center">
                <XStack gap="$1" alignItems="center">
                  <DollarSign size={14} color="$colorMuted" />
                  <Text fontSize="$4" fontWeight="700" fontFamily="$heading">
                    {business.todayRevenue ?? 0}
                  </Text>
                </XStack>
                <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                  Revenue
                </Text>
              </YStack>
            </Card>
          </XStack>
        )}

        {/* Business Details / Edit Form */}
        <Card bordered padding="$4">
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
              Business Details
            </Text>
            <Separator />

            {isEditing ? (
              <>
                <FormTextArea
                  label="Description"
                  placeholder="Tell customers about your business"
                  value={editForm.description}
                  onChangeText={(v) => updateField("description", v)}
                  numberOfLines={3}
                />
                <FormInput
                  label="Street Address"
                  placeholder="123 Main Street"
                  value={editForm.address}
                  onChangeText={(v) => updateField("address", v)}
                  icon={<MapPin size={18} color="$colorMuted" />}
                />
                <FormInput
                  label="City"
                  placeholder="Accra"
                  value={editForm.city}
                  onChangeText={(v) => updateField("city", v)}
                  icon={<MapPin size={18} color="$colorMuted" />}
                  error={editErrors.city}
                  required
                />
                <FormInput
                  label="Phone Number"
                  placeholder="+233 24 000 0000"
                  value={editForm.phone}
                  onChangeText={(v) => updateField("phone", v)}
                  icon={<Phone size={18} color="$colorMuted" />}
                  keyboardType="phone-pad"
                />
                <FormInput
                  label="Email (Optional)"
                  placeholder="business@example.com"
                  value={editForm.email}
                  onChangeText={(v) => updateField("email", v)}
                  icon={<Mail size={18} color="$colorMuted" />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </>
            ) : (
              <>
                {business.description ? (
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    {business.description}
                  </Text>
                ) : null}
                <XStack gap="$3" alignItems="flex-start">
                  <MapPin size={18} color="$colorMuted" />
                  <YStack flex={1} gap="$1">
                    <Text
                      fontSize="$3"
                      fontWeight="500"
                      fontFamily="$body"
                      color="$color"
                    >
                      Address
                    </Text>
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      {business.address?.fullAddress ||
                        business.address?.city ||
                        "No address"}
                    </Text>
                  </YStack>
                </XStack>
                {business.phone && (
                  <XStack gap="$3" alignItems="center">
                    <Phone size={18} color="$colorMuted" />
                    <YStack flex={1}>
                      <Text
                        fontSize="$3"
                        fontWeight="500"
                        fontFamily="$body"
                        color="$color"
                      >
                        Phone
                      </Text>
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
                        {business.phone}
                      </Text>
                    </YStack>
                  </XStack>
                )}
                {business.email && (
                  <XStack gap="$3" alignItems="center">
                    <Mail size={18} color="$colorMuted" />
                    <YStack flex={1}>
                      <Text
                        fontSize="$3"
                        fontWeight="500"
                        fontFamily="$body"
                        color="$color"
                      >
                        Email
                      </Text>
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
                        {business.email}
                      </Text>
                    </YStack>
                  </XStack>
                )}
                {isDefault && (
                  <XStack gap="$3" alignItems="center">
                    <Building size={18} color="$info" />
                    <Text
                      fontSize="$3"
                      color="$info"
                      fontFamily="$body"
                      fontWeight="500"
                    >
                      This is your default business
                    </Text>
                  </XStack>
                )}
              </>
            )}
          </YStack>
        </Card>

        {/* Operational Documents */}
        <Card bordered padding="$4">
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                Business Documents
              </Text>
              <Text
                fontSize="$3"
                color="$primary"
                fontWeight="700"
                fontFamily="$body"
              >
                {uploadedRequired}/{totalRequired}
              </Text>
            </XStack>
            <Progress value={docProgress} backgroundColor="$gray5">
              <Progress.Indicator
                animation="bouncy"
                backgroundColor="$primary"
              />
            </Progress>
            <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
              Upload required documents to activate your business listing
            </Text>
            <Separator />

            {docs.map((doc, index) => (
              <YStack key={doc.id}>
                <YStack gap="$2" paddingVertical="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack gap="$3" alignItems="center" flex={1}>
                      <YStack
                        width={36}
                        height={36}
                        borderRadius="$4"
                        backgroundColor="$gray3"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <FileText size={18} color="$colorMuted" />
                      </YStack>
                      <YStack flex={1}>
                        <XStack gap="$1" alignItems="center">
                          <Text
                            fontWeight="bold"
                            fontSize="$3"
                            fontFamily="$body"
                          >
                            {doc.name}
                          </Text>
                          {doc.required && (
                            <Text fontSize="$2" color="$red10">
                              *
                            </Text>
                          )}
                        </XStack>
                        <Text
                          fontSize="$2"
                          color="$colorMuted"
                          fontFamily="$body"
                        >
                          {doc.description}
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack gap="$1" alignItems="center">
                      {getDocStatusIcon(doc.status)}
                      <YStack
                        backgroundColor={DOC_STATUS_COLOR[doc.status]}
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                      >
                        <Text
                          color="white"
                          fontSize="$1"
                          textTransform="capitalize"
                          fontFamily="$body"
                        >
                          {doc.status === "not_uploaded"
                            ? "Not uploaded"
                            : doc.status}
                        </Text>
                      </YStack>
                    </XStack>
                  </XStack>

                  {doc.uploadedAt && (
                    <Text
                      fontSize="$2"
                      color="$colorMuted"
                      paddingLeft="$11"
                      fontFamily="$body"
                    >
                      Uploaded: {doc.uploadedAt}
                    </Text>
                  )}

                  {doc.status === "rejected" && doc.rejectionReason && (
                    <YStack
                      backgroundColor="$red2"
                      padding="$2"
                      borderRadius="$2"
                      marginLeft="$11"
                    >
                      <Text fontSize="$2" color="$red10" fontFamily="$body">
                        Reason: {doc.rejectionReason}
                      </Text>
                    </YStack>
                  )}

                  {(doc.status === "not_uploaded" ||
                    doc.status === "rejected") && (
                    <XStack gap="$2" paddingLeft="$11" marginTop="$1">
                      <Button
                        size="$2"
                        variant="outline"
                        icon={<Camera size={14} />}
                        onPress={() => pickDoc(doc.id, true)}
                        disabled={uploadingDocId === doc.id}
                      >
                        Camera
                      </Button>
                      <Button
                        size="$2"
                        variant="outline"
                        icon={<FileText size={14} />}
                        onPress={() => pickDoc(doc.id, false)}
                        disabled={uploadingDocId === doc.id}
                      >
                        Gallery
                      </Button>
                    </XStack>
                  )}
                </YStack>
                {index < docs.length - 1 && <Separator />}
              </YStack>
            ))}
          </YStack>
        </Card>

        {/* Actions */}
        {!isEditing && !isDefault && isActive && (
          <Button
            size="$5"
            variant="outline"
            onPress={() => setDefaultBusiness(id)}
          >
            <Text fontFamily="$body">Set as Default Business</Text>
          </Button>
        )}
      </YStack>
    </ScrollView>
  );
}
