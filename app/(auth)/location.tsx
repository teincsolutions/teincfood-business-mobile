// @ts-nocheck
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  useTheme,
  Sheet,
  Separator,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, ChevronDown, Check, Navigation } from "@tamagui/lucide-icons";
import { Button, BackButton } from "@/components/ui";
import {
  PHONE_COUNTRIES,
  getCountryOption,
  getDialCodeFromCountry,
} from "@/utils/phone";
import { useSetUserLocationMutation } from "@/services/location.service";
import { useLocationStore, AppLocation } from "@/stores/location.store";
import { useAuthStore } from "@/stores/auth.store";

export default function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const setCurrentLocation = useLocationStore((state) => state.setCurrentLocation);
  const setLocationMutation = useSetUserLocationMutation();

  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [selectedCountryIso, setSelectedCountryIso] = useState("GH");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedCountry = getCountryOption(selectedCountryIso);
  const phoneDialCode = getDialCodeFromCountry(selectedCountryIso) || "+233";

  const handleContinue = async () => {
    if (!selectedCountryIso) {
      setError("Please select your country");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Create a basic location with the selected country
      const location: AppLocation = {
        latitude: 0, // Will be updated with actual coordinates if available
        longitude: 0,
        city: "Unknown",
        area: "Unknown",
        fullAddress: selectedCountry?.name || "Unknown",
        countryCode: selectedCountryIso.toUpperCase(),
      };

      // Best-effort save to backend — country selection isn't critical
      try {
        await setLocationMutation.mutateAsync({
          latitude: location.latitude,
          longitude: location.longitude,
          city: location.city,
          area: location.area,
          countryCode: location.countryCode,
        });
      } catch {
        // Backend may not expose this endpoint yet; continue anyway
      }

      // Save to local store
      setCurrentLocation(location);

      // If already authenticated, go to role home; otherwise go to login
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'rider') {
        router.replace('/(rider)/');
      } else if (currentUser?.role === 'fleet_manager') {
        router.replace('/(fleet)/');
      } else if (currentUser) {
        router.replace('/(seller)/');
      } else {
        router.replace('/(auth)/login');
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <YStack flex={1} bg="$background">
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom + 20, 24),
          }}
        >
          <YStack mb="$4">
            <BackButton />
          </YStack>

          <YStack mb="$6" items={'center'} gap="$3">
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
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
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
            <Button
              variant="primary"
              loading={isLoading}
              onPress={handleContinue}
            >
              CONTINUE
            </Button>
            <Button
              variant="ghost"
              height={40}
              onPress={() => router.back()}
            >
              <Text fontSize="$3" color="$primary" fontWeight="600" fontFamily="$body">
                Back to Login
              </Text>
            </Button>
          </YStack>
        </ScrollView>
      </YStack>

      <Sheet
        modal
        open={countrySheetOpen}
        onOpenChange={setCountrySheetOpen}
        snapPoints={[75]}
        dismissOnSnapToBottom
        zIndex={100_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.6)"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$8"
          borderTopRightRadius="$8"
        >
          <Sheet.Handle backgroundColor="$gray200" marginTop="$2" />
          <YStack px="$5" pt="$3" pb="$4">
            <Text
              fontSize="$6"
              fontWeight="800"
              color="$color"
              fontFamily="$heading"
            >
              Select Your Country
            </Text>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" mt="$1">
              Choose your country for location-based services.
            </Text>
          </YStack>
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack px="$5" pb="$6">
              {PHONE_COUNTRIES.map((country, index) => (
                <YStack key={country.iso}>
                  <XStack
                    items="center"
                    jc="space-between"
                    py="$4"
                    onPress={() => {
                      setSelectedCountryIso(country.iso);
                      setCountrySheetOpen(false);
                    }}
                  >
                    <YStack>
                      <Text
                        fontSize="$4"
                        fontWeight="700"
                        color="$color"
                        fontFamily="$body"
                      >
                        {country.name}
                      </Text>
                      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                        {country.iso}
                      </Text>
                    </YStack>
                    <XStack items="center" gap="$2">
                      <Text fontSize="$4" color="$color" fontFamily="$body">
                        {country.dialCode}
                      </Text>
                      {selectedCountryIso === country.iso ? (
                        <Check size={16} color="$primary" />
                      ) : null}
                    </XStack>
                  </XStack>
                  {index < PHONE_COUNTRIES.length - 1 ? (
                    <Separator borderColor="$borderColor" />
                  ) : null}
                </YStack>
              ))}
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>
    </KeyboardAvoidingView>
  );
}