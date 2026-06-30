// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
  Avatar,
  ScrollView,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, BackButton, FormInput, FormTextArea } from "@/components/ui";
import { useBusinessStore } from "@/stores/business.store";
import * as businessService from "@/services/business.service";
import { uploadImage } from "@/services/upload.service";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@/utils/error";
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
  AlertCircle,
  CheckCircle,
} from "@tamagui/lucide-icons";



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

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [logoUri, setLogoUri] = useState<string | undefined>(
    business?.logo_url,
  );
  const [editForm, setEditForm] = useState({
    name: business?.name ?? "",
    description: business?.description ?? "",
    address: business?.address?.full_address?.split(",")[0]?.trim() ?? "",
    city: business?.address?.city ?? "",
    phone: business?.phone ?? "",
    email: business?.email ?? "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // ── Detail fetch ──
  const [fetchedBusiness, setFetchedBusiness] = useState<any>(null);
  const [, setIsFetchingDetail] = useState(true);

  const effectiveBusiness = useMemo(() => {
    if (!fetchedBusiness) return business;
    return { ...business, ...fetchedBusiness };
  }, [business, fetchedBusiness]);

  const displayBusinessNumber =
    business?.business_number || fetchedBusiness?.business_number || "";
  const displayRating = effectiveBusiness?.rating ?? 0;

  useEffect(() => {
    (async () => {
      try {
        const res = await businessService.fetchBusinessById(id);
        setFetchedBusiness(res.data);
      } catch {
        // fall back to store
      } finally {
        setIsFetchingDetail(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (fetchedBusiness && !isEditing) {
      setEditForm({
        name: effectiveBusiness.name ?? "",
        description: effectiveBusiness.description ?? "",
        address: effectiveBusiness.address?.street ?? "",
        city: effectiveBusiness.address?.city ?? "",
        phone: effectiveBusiness.phone ?? "",
        email: effectiveBusiness.email ?? "",
      });
      if (!logoUri && effectiveBusiness.logo_url) {
        setLogoUri(effectiveBusiness.logo_url);
      }
    }
  }, [fetchedBusiness]);

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
        <Button onPress={() => router.back()}>Go Back</Button>
      </YStack>
    );
  }

  // ── Edit helpers ──

  const updateField = (key: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
    setEditErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateEdit = () => {
    const errs: Record<string, string> = {};
    if (!editForm.name.trim()) errs.name = "Business name is required";
    return errs;
  };

  const uploadLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error("Photo library access is required to change the logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;

    try {
      const { download_url } = await uploadImage(uri, "businesses", {
        business_id: id,
      });
      setLogoUri(download_url);
    } catch (e: any) {
      toast.error(extractApiErrorMessage(e));
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
      await businessService.updateBusiness(id, {
        business: {
          name: editForm.name.trim(),
          description: editForm.description.trim() || undefined,
          phone: editForm.phone.trim() || undefined,
          email: editForm.email.trim() || undefined,
          logo_url:
            logoUri !== business?.logo_url ? logoUri || undefined : undefined,
          latitude: business?.latitude,
          longitude: business?.longitude,
        },
      });

      updateBusiness(id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || undefined,
        ...(logoUri ? { logo_url: logoUri } : {}),
        address: {
          ...(business?.address ?? {}),
          street: editForm.address.trim(),
          city: editForm.city.trim(),
          full_address: `${editForm.address.trim()}, ${editForm.city.trim()}`,
        },
      });

      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("idle");
        setIsEditing(false);
      }, 1800);
    } catch (e: any) {
      toast.error(extractApiErrorMessage(e));
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    const eb = effectiveBusiness || business;
    setEditForm({
      name: eb.name ?? "",
      description: eb.description ?? "",
      address: eb.address?.street ?? "",
      city: eb.address?.city ?? "",
      phone: eb.phone ?? "",
      email: eb.email ?? "",
    });
    setLogoUri(eb.logo_url);
    setEditErrors({});
    setIsEditing(false);
  };



  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Fixed header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={Math.max(insets.top + 8, 16)}
        paddingBottom="$3"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <BackButton />
          <Text
            fontSize="$6"
            fontWeight="700"
            fontFamily="$heading"
            color="$color"
            numberOfLines={1}
          >
            {business.name}
          </Text>
        </XStack>
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        paddingBottom={Math.max(insets.bottom + 20, 24)}
      >
        <YStack padding="$4" gap="$4">
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

          {/* Logo + name + status */}
          <XStack gap="$4" alignItems="center">
            <YStack alignItems="center">
              <Avatar circular size="$20">
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
                  size="$3"
                  variant="outline"
                  icon={<Camera size={14} />}
                  onPress={uploadLogo}
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
              {displayBusinessNumber ? (
                <XStack gap="$2" alignItems="center">
                  <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
                    {displayBusinessNumber}
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
              ) : null}
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
                      {displayRating.toFixed(1)}
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
                      {0}
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
                      {0}
                    </Text>
                  </XStack>
                  <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                    Revenue
                  </Text>
                </YStack>
              </Card>
            </XStack>
          )}

          {/* Business Details */}
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
                    label="Email"
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
                  {effectiveBusiness.description ? (
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      {effectiveBusiness.description}
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
                        {effectiveBusiness.address?.full_address ||
                          effectiveBusiness.address?.city ||
                          "No address"}
                      </Text>
                    </YStack>
                  </XStack>
                  {effectiveBusiness.phone && (
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
                          {effectiveBusiness.phone}
                        </Text>
                      </YStack>
                    </XStack>
                  )}
                  {effectiveBusiness.email && (
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
                          {effectiveBusiness.email}
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

          {/* KYC Documents link */}
          {!isEditing && (
            <Button size="$5" variant="outline" onPress={() => router.push(`/(shared)/kyc?type=business&id=${id}`)}>
              KYC Documents
            </Button>
          )}

          {/* Set default */}
          {!isEditing && !isDefault && isActive && (
            <Button size="$5" variant="outline" onPress={() => setDefaultBusiness(id)}>
              Set as Default Business
            </Button>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
