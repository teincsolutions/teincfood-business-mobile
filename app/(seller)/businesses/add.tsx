// @ts-nocheck
import { useState, useRef } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, FlatList, TouchableOpacity } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Form,
  Label,
  Spinner,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useNavigation } from "expo-router";
import { FormInput, Button, BackButton, Input } from "@/components/ui";
import { useBusinessStore } from "@/stores/business.store";
import { useRoleStore } from "@/stores/role.store";
import { Building, MapPin, Phone, Mail, Navigation, Check, Search } from "@tamagui/lucide-icons";
import { placesService, type PlaceSuggestion, type PlaceDetails } from "@/services/places.service";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

export default function AddBusinessScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { addBusiness } = useBusinessStore();
  const role = useRoleStore((s) => s.role);
  const businessType = role === 'fleet_manager' ? 'delivery_provider' : 'merchant';
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [placeQuery, setPlaceQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { isLocating, getCurrentLocation } = useCurrentLocation();

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleSearch = (text: string) => {
    setPlaceQuery(text);
    setSelectedPlace(null);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await placesService.searchPlaces(text);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelectPlace = async (suggestion: PlaceSuggestion) => {
    setSuggestions([]);
    setPlaceQuery(suggestion.description);
    setLoadingDetails(true);

    try {
      const details = await placesService.getPlaceDetails(suggestion.placeId);
      if (details) {
        setSelectedPlace(details);
        setErrors((prev) => ({ ...prev, address: "", city: "" }));
      }
    } catch {
      setSelectedPlace({
        placeId: suggestion.placeId,
        formattedAddress: suggestion.description,
        street: suggestion.mainText || suggestion.description,
        city: "",
        region: "",
        postalCode: "",
        country: "",
        latitude: 0,
        longitude: 0,
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    const place = await getCurrentLocation();
    if (place) {
      setSelectedPlace(place);
      setPlaceQuery(place.formattedAddress);
      setSuggestions([]);
      setErrors((prev) => ({ ...prev, address: "", city: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Business name is required";
    if (!selectedPlace) newErrors.address = "Please select an address";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddBusiness = async () => {
    if (!validateForm() || !selectedPlace) return;

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const prefix = form.name.substring(0, 3).toUpperCase();
      const cityCode = (selectedPlace.city || "ACC").substring(0, 3).toUpperCase();
      const seq = Math.floor(Math.random() * 900) + 100;
      const businessCode = `${prefix}-${cityCode}-${seq}`;

      const newBusiness = {
        id: `business_${Date.now()}`,
        code: businessCode,
        type: businessType,
        ownerId: "user_001",
        name: form.name.trim(),
        address: {
          street: selectedPlace.street || selectedPlace.formattedAddress,
          city: selectedPlace.city || "",
          region: selectedPlace.region || "",
          country: selectedPlace.country || "Ghana",
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          fullAddress: selectedPlace.formattedAddress,
        },
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        status: "active" as const,
        isDefault: false,
        rating: 5.0,
        reviewCount: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addBusiness(newBusiness as any);
      router.replace(`/(seller)/businesses/${newBusiness.id}`);
    } catch (err: any) {
      setErrors({
        form: err?.message || "Failed to add business. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 20, 24),
        }}
      >
        <YStack
          padding="$4"
          paddingTop={Math.max(insets.top + 8, 16)}
          gap="$4"
          $gtSm={{ padding: "$6", maxWidth: 600 }}
          alignSelf="center"
          width="100%"
        >
          <XStack gap="$2" alignItems="center">
            <BackButton />
            <YStack gap="$1" flex={1}>
              <Text
                fontSize="$8"
                fontWeight="bold"
                fontFamily="$heading"
                color="$color"
                $gtSm={{ fontSize: "$10" }}
              >
                Add Business
              </Text>
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                Add a new business location to your account
              </Text>
            </YStack>
          </XStack>

          <Form onSubmit={handleAddBusiness} gap="$4">
            <FormInput
              label="Business Name"
              placeholder={businessType === 'delivery_provider' ? 'My Delivery Company' : 'My Restaurant'}
              value={form.name}
              onChangeText={(value) => updateField("name", value)}
              icon={<Building size={20} color="$colorMuted" />}
              error={errors.name}
              required
            />

            {/* Place Search */}
            <YStack gap="$2">
              <Label
                fontSize="$4"
                fontWeight="500"
                fontFamily="$body"
                color="$color"
              >
                Business Address *
              </Label>
              <XStack gap="$2" alignItems="center">
                <YStack flex={1} position="relative">
                  <Input
                    placeholder="Search for an address or area..."
                    value={placeQuery}
                    onChangeText={handleSearch}
                    paddingStart="$10"
                    borderColor={errors.address ? "$error" : "$borderColor"}
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
                icon={<MapPin size={16} />}
                onPress={handleUseCurrentLocation}
                disabled={isLocating}
                opacity={isLocating ? 0.7 : 1}
              >
                {isLocating ? "Getting location..." : "Use Current Location"}
              </Button>

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <Card
                  bordered
                  padding="$1"
                  backgroundColor="$background"
                  elevation="$6"
                >
                  <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.placeId}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <TouchableOpacity
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
              <Button
                variant="outline"
                icon={<MapPin size={16} />}
                onPress={handleUseCurrentLocation}
                disabled={isLocating}
                opacity={isLocating ? 0.7 : 1}
              >
                {isLocating ? "Getting location..." : "Use Current Location"}
              </Button>
                      </TouchableOpacity>
                    )}
                  />
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
                    <Check size={16} color="$primary" style={{ marginTop: 2 }} />
                    <YStack flex={1} gap="$1">
                      <Text fontSize="$3" fontWeight="600" fontFamily="$body" color="$primary">
                        Address Selected
                      </Text>
                      <Text fontSize="$3" color="$color" fontFamily="$body">
                        {selectedPlace.formattedAddress}
                      </Text>
                      {selectedPlace.latitude !== 0 && (
                        <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                          {selectedPlace.latitude.toFixed(4)}, {selectedPlace.longitude.toFixed(4)}
                        </Text>
                      )}
                    </YStack>
                  </XStack>
                </Card>
              )}

              {errors.address && (
                <Text fontSize="$2" color="$red10" fontFamily="$body">
                  {errors.address}
                </Text>
              )}
            </YStack>

            <FormInput
              label="Phone Number"
              placeholder="+233 24 000 0000"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(value) => updateField("phone", value)}
              icon={<Phone size={20} color="$colorMuted" />}
              required
            />

            <FormInput
              label="Email (Optional)"
              placeholder="business@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(value) => updateField("email", value)}
              icon={<Mail size={20} color="$colorMuted" />}
            />

            {errors.form ? (
              <Card padding="$3" backgroundColor="$red2" borderColor="$red6">
                <Text color="$red10" fontSize="$3" fontFamily="$body">
                  {errors.form}
                </Text>
              </Card>
            ) : null}

            <YStack gap="$3" mt="$4">
              <Button
                size="$5"
                onPress={handleAddBusiness}
                disabled={isLoading}
                opacity={isLoading ? 0.7 : 1}
              >
                {isLoading ? "Adding Business..." : "Add Business"}
              </Button>

              <Button
                variant="outline"
                size="$5"
                onPress={() =>
                  navigation.canGoBack()
                    ? router.back()
                    : router.replace("/(seller)/businesses")
                }
                disabled={isLoading}
              >
                Cancel
              </Button>
            </YStack>
          </Form>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
