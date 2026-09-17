// @ts-nocheck
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { TouchableOpacity, Dimensions } from "react-native";
import * as Clipboard from "expo-clipboard";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
  Avatar,
  ScrollView,
  Spinner,
  Image,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, BackButton, FormInput, FormTextArea, Input } from "@/components/ui";
import { useBusinessStore } from "@/stores/business.store";
import * as businessService from "@/services/business.service";
import { uploadImage } from "@/services/upload.service";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@teincfood/core";
import { placesService, type PlaceSuggestion } from "@/services/places.service";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
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
  Search,
  Navigation,
} from "@tamagui/lucide-icons";



export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const {
    getBusinessById,
    setDefaultBusiness,
    getDefaultBusiness,
    updateBusiness,
  } = useBusinessStore();

  const { data: biz } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      const res = await businessService.fetchBusinessById(id);
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const business = biz || getBusinessById(id);
  const isDefault = getDefaultBusiness()?.id === id;
  const isActive = business?.status === "active";

  const { data: membershipRes } = useQuery({
    queryKey: ["membership", id],
    queryFn: async () => {
      const res = await businessService.fetchMyBusinessMembership(id);
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const canEditProfile =
    (membershipRes as { capabilities?: string[]; source?: string } | undefined)?.capabilities?.includes(
      "business_profile_manage",
    ) ??
    (membershipRes as { source?: string } | undefined)?.source === "owner";

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [logoUri, setLogoUri] = useState<string | undefined>(business?.logo_url);
  const [coverUri, setCoverUri] = useState<string | undefined>(business?.cover_image_url);
  const [editForm, setEditForm] = useState({
    name: business?.name ?? "",
    description: business?.description ?? "",
    address: business?.address?.street ?? "",
    city: business?.address?.city ?? "",
    phone: business?.phone ?? "",
    email: business?.email ?? "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [placeQuery, setPlaceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { isLocating, getCurrentLocation } = useCurrentLocation();

  if (!business) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" padding="$6">
        <Building size={48} color="$colorMuted" />
        <Text fontSize="$5" fontWeight="600" fontFamily="$heading" textAlign="center">Business not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </YStack>
    );
  }

  const updateField = (key: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }));
    setEditErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateEdit = () => {
    const errs: Record<string, string> = {};
    if (!editForm.name.trim()) errs.name = "Business name is required";
    if (!editForm.address.trim() && !selectedPlace) errs.address = "Address is required";
    return errs;
  };

  const uploadLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error("Photo library access is required to change the logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const { download_url } = await uploadImage(result.assets[0].uri, "businesses", { business_id: id });
      setLogoUri(download_url);
    } catch (e: any) {
      toast.error(extractApiErrorMessage(e));
    }
  };

  const uploadCover = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      toast.error("Photo library access is required to change the cover image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [16, 9], quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      const { download_url } = await uploadImage(result.assets[0].uri, "businesses", { business_id: id });
      setCoverUri(download_url);
    } catch (e: any) {
      toast.error(extractApiErrorMessage(e));
    }
  };

  const saveMutation = useMutation({
    mutationFn: () => businessService.updateBusiness(id, {
      business: {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
        logo_url: logoUri !== business?.logo_url ? logoUri || undefined : undefined,
        cover_image_url: coverUri !== business?.cover_image_url ? coverUri || undefined : undefined,
        latitude: selectedPlace?.latitude || business?.latitude,
        longitude: selectedPlace?.longitude || business?.longitude,
        address_street: editForm.address.trim() || undefined,
        address_city: editForm.city.trim() || undefined,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', id] });
      updateBusiness(id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || undefined,
        logo_url: logoUri || undefined,
        cover_image_url: coverUri || undefined,
        address: { street: editForm.address.trim(), city: editForm.city.trim() },
      });
      setSaveStatus("success");
      setTimeout(() => { setSaveStatus("idle"); setIsEditing(false); }, 1800);
    },
    onError: (e: any) => {
      toast.error(extractApiErrorMessage(e));
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2500);
    },
  });

  const handleSave = () => {
    const errs = validateEdit();
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
    setIsSaving(true);
    saveMutation.mutate(undefined, { onSettled: () => setIsSaving(false) });
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: business.name ?? "",
      description: business.description ?? "",
      address: business.address?.street ?? "",
      city: business.address?.city ?? "",
      phone: business.phone ?? "",
      email: business.email ?? "",
    });
    setLogoUri(business.logo_url);
    setCoverUri(business.cover_image_url);
    setPlaceQuery(""); setSuggestions([]); setSelectedPlace(null);
    setEditErrors({}); setIsEditing(false);
  };

  const handlePlaceSearch = (text: string) => {
    setPlaceQuery(text); setSelectedPlace(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length < 3) { setSuggestions([]); return; }
    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await placesService.searchPlaces(text);
        setSuggestions(results);
      } catch { setSuggestions([]); }
      finally { setSearching(false); }
    }, 400);
  };

  const handleSelectPlace = async (suggestion: PlaceSuggestion) => {
    setSuggestions([]); setPlaceQuery(suggestion.description); setLoadingDetails(true);
    try {
      const details = await placesService.getPlaceDetails(suggestion.placeId);
      if (details) {
        setSelectedPlace(details);
        setEditForm((prev) => ({ ...prev, address: details.street || details.formattedAddress, city: details.city || "" }));
        setEditErrors((prev) => ({ ...prev, address: "", city: "" }));
      }
    } catch {
      toast.error("Could not get address details. Try using current location.");
    } finally { setLoadingDetails(false); }
  };

  const handleUseCurrentLocation = async () => {
    const place = await getCurrentLocation();
    if (place) {
      setSelectedPlace(place); setPlaceQuery(place.formattedAddress); setSuggestions([]);
      setEditForm((prev) => ({ ...prev, address: place.street || place.formattedAddress, city: place.city || "" }));
      setEditErrors((prev) => ({ ...prev, address: "", city: "" }));
    }
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
        ) : canEditProfile ? (
          <Button
            size="$3"
            variant="outline"
            icon={<Pencil size={16} />}
            onPress={() => setIsEditing(true)}
          >
            Edit
          </Button>
        ) : null}
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

          {/* Cover banner */}
          {coverUri ? (
            <YStack gap="$2">
              <YStack height={160} borderRadius="$3" overflow="hidden" backgroundColor="$backgroundSoft">
                <Image
                  source={{ uri: coverUri }}
                  width="100%"
                  height={160}
                  objectFit="cover"
                />
              </YStack>
              {isEditing && (
                <Button
                  size="$3"
                  variant="outline"
                  icon={<Camera size={14} />}
                  onPress={uploadCover}
                >
                  Change Cover Image
                </Button>
              )}
            </YStack>
          ) : isEditing ? (
            <Button
              size="$3"
              variant="outline"
              icon={<Camera size={14} />}
              onPress={uploadCover}
            >
              Add Cover Image
            </Button>
          ) : null}

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
              {business.business_number ? (
                <XStack gap="$2" alignItems="center">
                  <TouchableOpacity onPress={() => { Clipboard.setStringAsync(business.business_number); toast.success("Copied to clipboard"); }}>
                    <Text fontSize="$3" color="$colorMuted" fontFamily="$body">
                      {business.business_number}
                    </Text>
                  </TouchableOpacity>
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
                      {business.rating?.toFixed(1) || "0.0"}
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
                  {/* Address search */}
                  <YStack gap="$2">
                    <Text fontSize="$4" fontWeight="500" fontFamily="$heading" color="$color">
                      Business Address
                    </Text>
                    <XStack gap="$2" alignItems="center">
                      <YStack flex={1} position="relative">
                        <Input
                          placeholder="Search for an address..."
                          value={placeQuery}
                          onChangeText={handlePlaceSearch}
                          paddingStart="$10"
                          borderColor={editErrors.address ? "$error" : "$borderColor"}
                        />
                        <YStack position="absolute" left="$3" top="$3.5">
                          <Search size={20} color="$colorMuted" />
                        </YStack>
                        {searching && (
                          <YStack position="absolute" right="$3" top="$3.5">
                            <Spinner size="small" />
                          </YStack>
                        )}
                      </YStack>
                    </XStack>

                    <Button
                      variant="outline"
                      icon={<Navigation size={16} />}
                      onPress={handleUseCurrentLocation}
                      disabled={isLocating}
                      opacity={isLocating ? 0.7 : 1}
                    >
                      {isLocating ? "Getting location..." : "Use Current Location"}
                    </Button>

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <Card bordered padding="$1" backgroundColor="$background" elevation="$6">
                        <ScrollView maxHeight={200} keyboardShouldPersistTaps="handled">
                          {suggestions.map((item) => (
                            <TouchableOpacity
                              key={item.placeId}
                              onPress={() => handleSelectPlace(item)}
                              style={{ paddingHorizontal: 12, paddingVertical: 10 }}
                            >
                              <XStack gap="$2" alignItems="center">
                                <MapPin size={16} color="$colorMuted" />
                                <YStack flex={1}>
                                  <Text fontSize="$3" fontWeight="500" fontFamily="$body" color="$color">
                                    {item.mainText || item.description}
                                  </Text>
                                  {item.secondaryText && (
                                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                                      {item.secondaryText}
                                    </Text>
                                  )}
                                </YStack>
                              </XStack>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </Card>
                    )}

                    {/* Loading details */}
                    {loadingDetails && (
                      <XStack gap="$2" alignItems="center" padding="$2">
                        <Spinner size="small" />
                        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                          Getting address details...
                        </Text>
                      </XStack>
                    )}

                    {/* Selected place confirmation */}
                    {selectedPlace && !loadingDetails && (
                      <Card padding="$3" bordered borderColor="$primary" backgroundColor="$primaryLight">
                        <XStack gap="$2" alignItems="flex-start">
                          <CheckCircle size={16} color="$primary" style={{ marginTop: 2 }} />
                          <YStack flex={1} gap="$1">
                            <Text fontSize="$3" fontWeight="600" fontFamily="$body" color="$primary">
                              Address Selected
                            </Text>
                            <Text fontSize="$3" color="$color" fontFamily="$body">
                              {selectedPlace.formattedAddress}
                            </Text>
                          </YStack>
                        </XStack>
                      </Card>
                    )}

                  </YStack>

                  <FormInput
                    label="Street / Landmark"
                    placeholder="e.g. 123 Independence Ave, near the roundabout"
                    value={editForm.address}
                    onChangeText={(v) => updateField("address", v)}
                    icon={<MapPin size={18} color="$colorMuted" />}
                    error={editErrors.address}
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
                        {[business.address?.street, business.address?.city]
                          .filter(Boolean)
                          .join(", ") || "No address"}
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

          {/* Map */}
          {!isEditing && (
            (() => {
              const lat = Number(business.latitude);
              const lng = Number(business.longitude);
              if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
              return (
                <Card bordered padding="$4" key={id}>
                  <YStack gap="$2">
                    <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                      Location
                    </Text>
                    <YStack height={180} borderRadius="$3" overflow="hidden">
                      <MapView
                        style={{ flex: 1, width: Dimensions.get('window').width - 48 }}
                        provider={PROVIDER_GOOGLE}
                        initialRegion={{
                          latitude: lat,
                          longitude: lng,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                      >
                        <Marker
                          coordinate={{ latitude: lat, longitude: lng }}
                          title={business.name}
                        />
                      </MapView>
                    </YStack>
                  </YStack>
                </Card>
              );
            })()
          )}

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
