// @ts-nocheck
import { useState, useRef } from "react";
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { YStack, XStack, Text, Image } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";
import { useOnboardingStore } from "@/stores/onboarding.store";

const SLIDES = [
  {
    key: "1",
    title: "Manage Your Business",
    subtitle:
      "Take orders, track deliveries, and grow your food business with powerful tools.",
    image: require("../../assets/images/onboarding2.png"),
  },
  {
    key: "2",
    title: "Real-Time Order Management",
    subtitle:
      "Accept or reject orders instantly and keep your customers happy with fast service.",
    image: require("../../assets/images/onboarding5.png"),
  },
  {
    key: "3",
    title: "Earn Money Delivering",
    subtitle:
      "Join as a rider and earn by delivering food orders to customers in your area.",
    image: require("../../assets/images/onboarding4.png"),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const slideWidth = Math.max(1, Math.floor(windowWidth));
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const completeOnboarding = useOnboardingStore(
    (state) => state.completeOnboarding,
  );

  const handleNext = () => {
    if (activeIndex >= SLIDES.length - 1) {
      completeOnboarding();
      router.push("/(auth)/role");
    } else {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollTo({
        x: nextIndex * slideWidth,
        animated: true,
      });
    }
  };

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

  return (
    <YStack flex={1} bg="$background">
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
                items="center"
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

          <Button variant="primary" width="100%" onPress={handleNext}>
            {activeIndex === SLIDES.length - 1 ? "GET STARTED" : "NEXT"}
          </Button>

          <Button
            variant="ghost"
            width="100%"
            backgroundColor="transparent"
            onPress={() => {
              completeOnboarding();
              router.push("/(auth)/role");
            }}
          >
            <Text fontFamily="$body" color="$colorSecondary" fontWeight="600">
              Skip
            </Text>
          </Button>
        </YStack>
      </>
    </YStack>
  );
}
