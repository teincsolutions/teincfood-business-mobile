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
import { YStack, XStack, Text, Image, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Input } from "@/components/ui";
import { Store, Truck, ChevronRight } from "@tamagui/lucide-icons";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { useAuthStore } from "@/stores/auth.store";

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
  const [stage, setStage] = useState<"slides" | "role">("slides");
  const [selectedRole, setSelectedRole] = useState<"seller" | "rider" | null>(null);

  const completeOnboarding = useOnboardingStore((state) => state.completeOnboarding);
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
      setStage("role");
    } else {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      scrollRef.current?.scrollTo({
        x: nextIndex * slideWidth,
        animated: true,
      });
    }
  };

  const handleContinueWithLogin = () => {
    completeOnboarding();
    if (user) {
      // Redirect based on user role
      if (user.role === "seller") {
        router.replace("/(seller)/");
      } else if (user.role === "rider") {
        router.replace("/(rider)/");
      } else {
        router.replace("/(auth)/login");
      }
      return;
    }
    router.replace("/(auth)/login");
  };

  const handleSkipLogin = () => {
    completeOnboarding();
    router.replace("/(auth)/login");
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
              {activeIndex === SLIDES.length - 1 ? "GET STARTED" : "NEXT"}
            </Button>

            <Button
              variant="ghost"
              height={36}
              backgroundColor="transparent"
              onPress={() => setStage("role")}
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
              Choose Your Role
            </Text>
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              Select how you want to use TeincFoodBusiness
            </Text>
          </YStack>

          <YStack gap="$4">
            {/* Seller Card */}
            <Card
              bordered
              padding="$5"
              pressStyle={{ scale: 0.98, opacity: 0.9 }}
              onPress={() => setSelectedRole("seller")}
              backgroundColor={selectedRole === "seller" ? "$primaryLight" : "$background"}
              borderColor={selectedRole === "seller" ? "$primary" : "$borderColor"}
            >
              <XStack gap="$4" alignItems="center">
                <YStack
                  width={60}
                  height={60}
                  backgroundColor={selectedRole === "seller" ? "$primary" : "$gray5"}
                  borderRadius="$4"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Store size={28} color={selectedRole === "seller" ? "white" : "$colorMuted"} />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Text fontSize="$6" fontWeight="bold">I'm a Seller</Text>
                  <Text fontSize="$3" color="$colorMuted">
                    Restaurant or business owner managing orders and menu
                  </Text>
                </YStack>
                <ChevronRight size={20} color="$colorMuted" />
              </XStack>
            </Card>

            {/* Rider Card */}
            <Card
              bordered
              padding="$5"
              pressStyle={{ scale: 0.98, opacity: 0.9 }}
              onPress={() => setSelectedRole("rider")}
              backgroundColor={selectedRole === "rider" ? "$primaryLight" : "$background"}
              borderColor={selectedRole === "rider" ? "$primary" : "$borderColor"}
            >
              <XStack gap="$4" alignItems="center">
                <YStack
                  width={60}
                  height={60}
                  backgroundColor={selectedRole === "rider" ? "$primary" : "$gray5"}
                  borderRadius="$4"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Truck size={28} color={selectedRole === "rider" ? "white" : "$colorMuted"} />
                </YStack>
                <YStack flex={1} gap="$1">
                  <Text fontSize="$6" fontWeight="bold">I'm a Rider</Text>
                  <Text fontSize="$3" color="$colorMuted">
                    Delivery agent picking up and delivering orders
                  </Text>
                </YStack>
                <ChevronRight size={20} color="$colorMuted" />
              </XStack>
            </Card>
          </YStack>

          <YStack mt="auto" gap="$3">
            {!user && (
              <Button onPress={handleSkipLogin}>SKIP LOGIN FOR NOW</Button>
            )}
            <Button
              variant="primary"
              onPress={handleContinueWithLogin}
              disabled={!selectedRole}
              opacity={selectedRole ? 1 : 0.5}
            >
              {user ? "CONTINUE" : "CONTINUE TO LOGIN"}
            </Button>
          </YStack>
        </YStack>
      )}
    </YStack>
  );
}