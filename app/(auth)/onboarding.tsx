// @ts-nocheck
import { useState, useRef } from "react";
import {
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { YStack, XStack, Text, Image } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Input } from "@/components/ui";
import * as Location from "expo-location";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { useAuthStore } from "@/stores/auth.store";
import { useLocationStore } from "@/stores/location.store";
import { useSetUserLocationMutation } from "@/services/location.service";

const SLIDES = [
  {
    key: "1",
    title: "Discover nearby meals",
    subtitle:
      "Find top-rated dishes and restaurants around your area in seconds.",
    image: require("../../assets/images/onboarding2.png"),
  },
  {
    key: "2",
    title: "Track every order live",
    subtitle:
      "Follow your rider in real time and know exactly when your food arrives.",
    image: require("../../assets/images/onboarding5.png"),
  },
  {
    key: "3",
    title: "Fast and easy delivery",
    subtitle:
      "Track your order live and get it delivered quickly to your doorstep.",
    image: require("../../assets/images/onboarding4.png"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = Math.max(1, Math.floor(windowWidth));
  const insets = useSafeAreaInsets();
  const { requireLocation } = useLocalSearchParams<{
    requireLocation?: string;
  }>();
  const locationOnlyMode = requireLocation === "1";
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [stage, setStage] = useState<"slides" | "location">(
    locationOnlyMode ? "location" : "slides",
  );
  const [city, setCity] = useState("Accra");
  const [area, setArea] = useState("");
  const persistedLocation = useLocationStore((state) => state.currentLocation);
  const [countryCode, setCountryCode] = useState(
    persistedLocation?.countryCode || "GH",
  );
  const [locationError, setLocationError] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
  const { mutateAsync: setUserLocation } = useSetUserLocationMutation();
  const user = useAuthStore((state) => state.user);

  const handlePageChange = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageWidth = event.nativeEvent.layoutMeasurement.width || slideWidth;
    const currentIndex = Math.min(
      SLIDES.length - 1,
      Math.max(0, Math.round(offsetX / pageWidth)),
    );
    if (currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
    }
  };

  const handleNext = () => {
    if (activeIndex >= SLIDES.length - 1) {
      setStage("location");
    } else {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollTo({
        x: nextIndex * slideWidth,
        animated: true,
      });
    }
  };

  const applyLocation = async () => {
    if (!area.trim()) {
      setLocationError(
        "Enter your area so we can personalize nearby restaurants.",
      );
      return false;
    }
    if (!countryCode.trim()) {
      setLocationError("Country is required to validate phone login format.");
      return false;
    }

    setLocationError("");
    const fullAddress = `${area.trim()}, ${city.trim()}`;
    try {
      await setUserLocation({
        latitude: 5.6037,
        longitude: -0.187,
        city: city.trim(),
        area: area.trim(),
        countryCode: countryCode.trim().toUpperCase(),
      });
      return true;
    } catch {
      setLocationError("Unable to save location. Please try again.");
      return false;
    }
  };

  const handleContinueWithLogin = async () => {
    if (!(await applyLocation())) return;
    completeOnboarding();
    if (user) {
      router.replace("/(buyer)/");
      return;
    }
    router.replace("/(auth)/login");
  };

  const handleSkipLogin = async () => {
    if (!(await applyLocation())) return;
    completeOnboarding();
    router.replace("/(buyer)/(home)");
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsLocating(true);
      setLocationError("");

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location Permission Needed",
          "Please allow location access so we can show nearby restaurants and delivery options.",
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const [place] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      const nextCity =
        place?.city || place?.subregion || place?.region || "Current City";
      const nextArea =
        place?.district ||
        place?.street ||
        place?.name ||
        place?.subregion ||
        "Current Area";
      const nextCountryCode = place?.isoCountryCode || countryCode || "GH";

      setCity(nextCity);
      setArea(nextArea);
      setCountryCode(nextCountryCode.toUpperCase());
    } catch {
      Alert.alert(
        "Could Not Detect Location",
        "Please enter your city and area manually.",
      );
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <YStack flex={1} bg="$background">
      {stage === "slides" ? (
        <>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            bounces={false}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScrollEndDrag={handlePageChange}
            onMomentumScrollEnd={handlePageChange}
            style={{ flex: 1, width: windowWidth }}
            contentContainerStyle={{ width: windowWidth * SLIDES.length }}
          >
            {SLIDES.map((slide) => (
              <YStack
                key={slide.key}
                width={windowWidth}
                flex={1}
                alignItems="center"
              >
                <YStack
                  width={windowWidth}
                  height={windowWidth * 1.1}
                  alignItems="center"
                  justifyContent="center"
                  backgroundColor="$backgroundStrong"
                  overflow="hidden"
                >
                  <Image
                    source={slide.image}
                    width="100%"
                    height="100%"
                    objectFit="cover"
                  />
                </YStack>

                <YStack
                  width="100%"
                  paddingHorizontal="$6"
                  paddingTop="$6"
                  ai="center"
                  gap="$3"
                >
                  <Text
                    fontSize="$8"
                    fontWeight="800"
                    fontFamily="$heading"
                    color="$color"
                    ta="center"
                  >
                    {slide.title}
                  </Text>
                  <Text
                    fontSize="$5"
                    color="$colorSecondary"
                    fontFamily="$body"
                    ta="center"
                    mt="$1"
                    lineHeight={24}
                  >
                    {slide.subtitle}
                  </Text>
                </YStack>
              </YStack>
            ))}
          </ScrollView>

          <YStack
            px="$5"
            paddingBottom={Math.max(insets.bottom + 14, 22)}
            gap="$4"
          >
            <XStack jc="center" gap="$2">
              {SLIDES.map((_, index) => (
                <YStack
                  key={index}
                  h={8}
                  w={activeIndex === index ? 24 : 8}
                  bg={activeIndex === index ? "$primary" : "$colorDisabled"}
                  br={4}
                  animation="bouncy"
                />
              ))}
            </XStack>

            <Button variant="primary" onPress={handleNext}>
              {activeIndex === SLIDES.length - 1 ? "SET MY LOCATION" : "NEXT"}
            </Button>

            <Button
              variant="ghost"
              height={36}
              backgroundColor="transparent"
              onPress={() => setStage("location")}
            >
              <Text fontFamily="$body" color="$colorSecondary" fontWeight="600">
                Skip
              </Text>
            </Button>
          </YStack>
        </>
      ) : (
        <YStack
          flex={1}
          px="$5"
          paddingTop={Math.max(insets.top + 12, 28)}
          paddingBottom={Math.max(insets.bottom + 20, 28)}
          gap="$6"
        >
          <YStack gap="$2">
            <Text
              fontSize="$9"
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              Set Your Location
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              Location is required so we can show food and restaurants near you.
            </Text>
          </YStack>

          <YStack gap="$4">
            <Input
              label="Country Code"
              placeholder="GH"
              autoCapitalize="characters"
              value={countryCode}
              onChangeText={(value) => setCountryCode(value.slice(0, 2))}
            />
            <Input
              label="City"
              placeholder="Accra"
              value={city}
              onChangeText={setCity}
            />
            <Input
              label="Area / Neighborhood"
              placeholder="East Legon"
              value={area}
              onChangeText={setArea}
              error={locationError}
            />
          </YStack>

          <Button
            variant="outline"
            loading={isLocating}
            onPress={handleUseCurrentLocation}
          >
            USE CURRENT LOCATION
          </Button>

          <YStack mt="auto" gap="$3">
            {!user && (
              <Button onPress={handleSkipLogin}>SKIP LOGIN FOR NOW</Button>
            )}
            <Button
              variant={user ? "primary" : "outline"}
              onPress={handleContinueWithLogin}
            >
              {user ? "CONTINUE" : "CONTINUE TO LOGIN"}
            </Button>
          </YStack>
        </YStack>
      )}
    </YStack>
  );
}
