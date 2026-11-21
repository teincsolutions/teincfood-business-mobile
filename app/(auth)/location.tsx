// @ts-nocheck
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { YStack, XStack, Text } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, ChevronDown, Navigation } from "@tamagui/lucide-icons";
import { Button, BackButton } from "@/components/ui";
import { FormActions } from "@/components/layout";
import { getCountryOption, getDialCodeFromCountry } from "@teincfood/core";
import {
  useLocationStore,
  AppLocation,
  CountrySource,
} from "@/stores/location.store";
import { useAuthStore } from "@/stores/auth.store";
import {
  getInitialCountrySelection,
  persistedCountryIso,
} from "@/utils/country-detection";
import { CountryPickerSheet } from "@/components/CountryPickerSheet";

export default function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setCurrentLocation = useLocationStore(
    (state) => state.setCurrentLocation,
  );
  const currentLocation = useLocationStore((state) => state.currentLocation);
  const locationHydrated = useLocationStore((state) => state.isHydrated);

  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [initialCountrySelection] = useState(() =>
    getInitialCountrySelection(currentLocation),
  );
  const [selectedCountryIso, setSelectedCountryIso] = useState(
    initialCountrySelection.iso,
  );
  const [countrySource, setCountrySource] = useState<CountrySource>(
    initialCountrySelection.source,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedCountry = getCountryOption(selectedCountryIso);
  const phoneDialCode = getDialCodeFromCountry(selectedCountryIso) || "+233";

  // Keep the screen in sync when a previously saved location finishes
  // hydrating after the first render.
  useEffect(() => {
    if (!locationHydrated) return;
    const persisted = persistedCountryIso(currentLocation);
    if (!persisted) return;
    setSelectedCountryIso(persisted);
    setCountrySource(currentLocation?.countrySource ?? "manual");
  }, [
    locationHydrated,
    currentLocation?.countryCode,
    currentLocation?.countrySource,
  ]);

  const handleContinue = async () => {
    if (!selectedCountryIso) {
      setError("Please select your country");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const location: AppLocation = {
        latitude: 0,
        longitude: 0,
        city: "Unknown",
        area: "Unknown",
        fullAddress: selectedCountry?.name || "Unknown",
        countryCode: selectedCountryIso.toUpperCase(),
        countrySource,
      };

      // Save to local store (user is unauthenticated during onboarding,
      // so location is persisted client-side only until post-auth sync)
      setCurrentLocation(location);

      // If already authenticated, go to role home; otherwise go to role selection
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === "rider") {
        router.replace("/(rider)/");
      } else if (currentUser?.role === "fleet_manager") {
        router.replace("/(fleet)/");
      } else if (currentUser) {
        router.replace("/(seller)/");
      } else {
        router.replace("/(auth)/role");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save location. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <YStack flex={1} bg="$background">
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            paddingHorizontal: 20,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom + 20, 24),
          }}
        >
          <YStack width="100%" maxWidth={600} flexGrow={1}>
          <YStack mb="$4">{router.canDismiss() && <BackButton />}</YStack>

          <YStack mb="$6" items={"center"} gap="$3">
            <YStack
              width={80}
              height={80}
              br="$6"
              alignItems="center"
              justifyContent="center"
              mb="$2"
            >
              <MapPin size={40} color="$primary" />
            </YStack>
            <Text
              fontSize={30}
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              Set Your Location
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
              lineHeight={22}
            >
              Select your country to continue with the sign-in process.
            </Text>
          </YStack>

          <YStack gap="$4">
            <YStack gap="$2">
              <Text
                fontSize="$3"
                fontWeight="600"
                color="$colorSecondary"
                fontFamily="$body"
                textTransform="uppercase"
                letterSpacing={0.5}
              >
                Country
              </Text>
              <XStack
                height={60}
                br="$3"
                bg="$backgroundSoft"
                borderWidth={1}
                borderColor="$borderColor"
                alignItems="center"
                justifyContent="space-between"
                px="$4"
                pressStyle={{ opacity: 0.85 }}
                onPress={() => setCountrySheetOpen(true)}
              >
                <XStack alignItems="center" gap="$3">
                  <Navigation size={20} color="$colorSecondary" />
                  <YStack>
                    <Text
                      fontSize="$4"
                      fontWeight="600"
                      color="$color"
                      fontFamily="$body"
                    >
                      {selectedCountry?.name || "Select Country"}
                    </Text>
                    <Text
                      fontSize="$2"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      {selectedCountryIso} ({phoneDialCode})
                    </Text>
                  </YStack>
                </XStack>
                <ChevronDown size={20} color="$colorSecondary" />
              </XStack>
            </YStack>

            {error ? (
              <Text fontSize="$2" color="$error" fontFamily="$body">
                {error}
              </Text>
            ) : null}
          </YStack>

          <YStack mt="auto" pt="$6" gap="$3">
            <FormActions marginTop="$0">
              <Button
                variant="primary"
                loading={isLoading}
                onPress={handleContinue}
              >
                CONTINUE
              </Button>
            </FormActions>
            <Button
              variant="ghost"
              height={40}
              onPress={() => router.replace("/(auth)/login")}
            >
              <Text
                fontSize="$3"
                color="$primary"
                fontWeight="600"
                fontFamily="$body"
              >
                Back to Login
              </Text>
            </Button>
          </YStack>
          </YStack>
        </ScrollView>
      </YStack>

      <CountryPickerSheet
        open={countrySheetOpen}
        onOpenChange={setCountrySheetOpen}
        value={selectedCountryIso}
        title="Select Your Country"
        description="Choose your country for location-based services."
        onSelect={(iso) => {
          setSelectedCountryIso(iso);
          setCountrySource("manual");
        }}
      />
    </KeyboardAvoidingView>
  );
}
