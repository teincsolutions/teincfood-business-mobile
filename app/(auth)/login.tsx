// @ts-nocheck
import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Input as TamaguiInput,
  useTheme,
  Sheet,
  Separator,
  ScrollView,
  Image,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Facebook,
  Chrome,
  ChevronDown,
  Check,
} from "@tamagui/lucide-icons";
import { Button, FormInput, BackButton, AppleSignInButton } from "@/components/ui";
import { validateEmail, validatePassword, extractApiErrorCode } from "@teincfood/core";
import {
  PHONE_COUNTRIES,
  getCountryOption,
  getDialCodeFromCountry,
  isLikelyE164,
  normalizePhoneForCountry,
} from "@teincfood/core";
import {
  authService,
  useEmailPasswordLoginMutation,
} from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useOnboardingStore } from "@/stores/onboarding.store";
import { useLocationStore } from "@/stores/location.store";
import { useResponsive } from "@/utils/responsive";
import { useRoleStore } from "@/stores/role.store";

type LoginMethod = "phone" | "email";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const setAuth = useAuthStore((state) => state.setAuth);
  const hasLocation = useLocationStore((state) => state.hasLocation());
  const locationHydrated = useLocationStore((state) => state.isHydrated);
  const currentLocation = useLocationStore((state) => state.currentLocation);
  const hasSeenOnboarding = useOnboardingStore(
    (state) => state.hasSeenOnboarding,
  );
  const loginMutation = useEmailPasswordLoginMutation();
  const navigation = useNavigation();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const storedRole = useRoleStore((s) => s.role);
  const selectedRole = (() => {
    const r = storedRole || role;
    return r === "seller" || r === "rider" || r === "fleet_manager"
      ? r
      : "seller";
  })();
  const roleLabel =
    selectedRole === "seller"
      ? "Seller"
      : selectedRole === "rider"
        ? "Rider"
        : "Fleet Manager";

  const [method, setMethod] = useState<LoginMethod>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [selectedCountryIso, setSelectedCountryIso] = useState(
    currentLocation?.countryCode?.toUpperCase() || "GH",
  );
  const phoneDialCode = getDialCodeFromCountry(selectedCountryIso) || "+233";
  const selectedCountry = getCountryOption(selectedCountryIso);

  useEffect(() => {
    if (!currentLocation?.countryCode) return;
    setSelectedCountryIso(currentLocation.countryCode.toUpperCase());
  }, [currentLocation?.countryCode]);

  const goPostAuth = () => {
    // Go through splash so stores fully propagate and Stack.Protected
    // guards re-evaluate before navigating to role-grouped routes.
    router.replace("/(auth)/splash");
  };

  const handleSendCode = async () => {
    setError("");

    const countryCode = selectedCountryIso?.trim().toUpperCase();
    if (!countryCode) {
      setError("Please select a country code.");
      return;
    }

    const normalizedPhone = normalizePhoneForCountry(phone, countryCode);
    if (!normalizedPhone || !isLikelyE164(normalizedPhone)) {
      setError("Enter a valid phone number for your selected country.");
      return;
    }

    setIsSendingCode(true);
    try {
      await authService.requestOtp(normalizedPhone);
      router.push({
        pathname: "/(auth)/verification",
        params: {
          contactInfo: normalizedPhone,
          type: "login",
          role: selectedRole,
        },
      });
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleEmailLogin = async () => {
    setError("");

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.errors[0] || "Invalid email");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0] || "Invalid password");
      return;
    }

    try {
      const response = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });
      setAuth(
        {
          ...response.user,
          fullName: response.user.full_name,
          role: selectedRole,
        },
        response.access_token,
        response.refresh_token,
      );

      goPostAuth();
    } catch (err: any) {
      // Google/OIDC users who set a password later have an unverified email.
      // Resend the code and send them to verify instead of dead-ending.
      if (extractApiErrorCode(err) === "EMAIL_NOT_VERIFIED") {
        const normalizedEmail = email.trim().toLowerCase();
        try {
          await authService.resendEmailOtp(normalizedEmail);
        } catch (resendErr) {
          console.debug("[Login] resend verification code failed", resendErr);
        }
        router.push({
          pathname: "/(auth)/verification",
          params: {
            contactInfo: normalizedEmail,
            type: "email_verification",
            role: selectedRole,
          },
        });
        return;
      }
      setError(err?.message || "Failed to log in. Please try again.");
    }
  };

  const handleOIDCLogin = async (provider: string) => {
    try {
      if (!hasLocation || !currentLocation?.countryCode) {
        router.replace(
          hasSeenOnboarding
            ? "/(auth)/onboarding?requireLocation=1"
            : "/(auth)/onboarding",
        );
        return;
      }
      setError("");

      let response: Awaited<ReturnType<typeof authService.loginWithGoogle>>;
      if (provider === "google") {
        response = await authService.loginWithGoogle();
      } else if (provider === "apple") {
        response = await authService.loginWithApple();
      } else if (provider === "facebook") {
        response = await authService.loginWithFacebook();
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      setAuth(
        { ...response.user, role: selectedRole },
        response.access_token,
        response.refresh_token,
      );
      goPostAuth();
    } catch (err: any) {
      // Deleted accounts are rejected server-side with no session minted —
      // say so plainly instead of a generic failure.
      if (extractApiErrorCode(err) === "ACCOUNT_DELETED") {
        setError("This account has been deleted.");
      } else {
        setError(`Failed to sign in with ${provider}`);
      }
    }
  };

  const isPrimaryLoading =
    method === "phone" ? isSendingCode : loginMutation.isPending;

  const { isTablet } = useResponsive();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <YStack mb="$4" paddingHorizontal="$8" width="100%">
        {router.canDismiss() && <BackButton />}
      </YStack>

      <YStack flex={1} bg="$background" items="center">
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          width="100%"
          maxW={"$media.sm"}
          paddingHorizontal={"$8"}
          paddingTop={Math.max(insets.top, 24)}
          paddingBottom={Math.max(insets.bottom + 20, 24)}
        >
          <YStack mb="$6" gap="$3">
            <Text
              fontSize={30}
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              Log In
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
              lineHeight={22}
            >
              Use phone OTP or switch to email and password.
            </Text>
          </YStack>

          <XStack gap="$3" mb="$5">
            <Button
              flex={1}
              width="auto"
              variant={method === "phone" ? "primary" : "outline"}
              height={46}
              onPress={() => {
                setMethod("phone");
                setError("");
              }}
            >
              PHONE OTP
            </Button>
            <Button
              flex={1}
              width="auto"
              variant={method === "email" ? "primary" : "outline"}
              height={46}
              onPress={() => {
                setMethod("email");
                setError("");
              }}
            >
              EMAIL LOGIN
            </Button>
          </XStack>

          {method === "phone" ? (
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
                  Phone Number
                </Text>
                <XStack gap="$2" items="center">
                  <YStack
                    width={88}
                    height={60}
                    borderRadius="$3"
                    backgroundColor="$backgroundSoft"
                    borderWidth={1}
                    borderColor="$borderColor"
                    justifyContent="center"
                    alignItems="center"
                    pressStyle={{ opacity: 0.85 }}
                    onPress={() => setCountrySheetOpen(true)}
                  >
                    <XStack items="center" gap="$1">
                      <Text
                        fontSize="$5"
                        fontWeight="700"
                        color="$color"
                        fontFamily="$body"
                      >
                        {phoneDialCode}
                      </Text>
                      <ChevronDown size={14} color="$colorSecondary" />
                    </XStack>
                  </YStack>
                  <TamaguiInput
                    flex={1}
                    height={60}
                    borderWidth={0}
                    borderRadius="$3"
                    backgroundColor="$backgroundSoft"
                    color="$color"
                    fontFamily="$body"
                    fontSize="$4"
                    keyboardType="phone-pad"
                    placeholder="24 000 0000"
                    placeholderTextColor={theme.colorPlaceholder.val as string}
                    value={phone}
                    onChangeText={setPhone}
                    focusStyle={{
                      borderWidth: 1,
                      borderColor: "$primary",
                      backgroundColor: "$background",
                    }}
                  />
                </XStack>
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  {selectedCountry?.name || "Selected country"} (
                  {selectedCountryIso})
                </Text>
                {error ? (
                  <Text fontSize="$2" color="$error" fontFamily="$body">
                    {error}
                  </Text>
                ) : null}
              </YStack>
            </YStack>
          ) : (
            <YStack gap="$4">
              <FormInput
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                required
              />
              <FormInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                isPassword
                error={error}
                required
              />
              <XStack justifyContent="flex-end">
                <Button
                  variant="ghost"
                  height="auto"
                  paddingHorizontal="$0"
                  paddingVertical="$2"
                  onPress={() => router.push("/(auth)/forgot-password")}
                >
                  <Text
                    fontSize="$3"
                    color="$primary"
                    fontWeight="600"
                    fontFamily="$body"
                  >
                    Forgot Password?
                  </Text>
                </Button>
              </XStack>
            </YStack>
          )}

          <YStack mt="$7" mb="$4" gap="$4" items="center">
            <Button
              variant="primary"
              width="100%"
              loading={isPrimaryLoading}
              onPress={method === "phone" ? handleSendCode : handleEmailLogin}
            >
              {method === "phone" ? "SEND CODE" : "LOG IN"}
            </Button>

            <Text ta="center" color="$colorSecondary" fontFamily="$body">
              Or continue with
            </Text>

            <YStack gap="$3" width="100%">
              <AppleSignInButton onPress={() => handleOIDCLogin("apple")} />
              <Button
                variant="outline"
                width="100%"
                icon={<Facebook size={20} color="#1877F2" />}
                onPress={() => handleOIDCLogin("facebook")}
              >
                Continue with Facebook
              </Button>
              <Button
                variant="outline"
                width="100%"
                icon={
                  <Image
                    objectFit="contain"
                    height={20}
                    src={require("assets/icons/icons8-google-100.png")}
                  />
                }
                onPress={() => handleOIDCLogin("google")}
              >
                Continue with Google
              </Button>
            </YStack>
          </YStack>

          <YStack pt="$6" gap="$3" pb="$2">
            <Text ta="center" color="$colorSecondary" fontFamily="$body">
              New to Teinc Food Business?
            </Text>
            <Button
              variant="outline"
              width="100%"
              onPress={() =>
                router.push({
                  pathname: "/(auth)/signup",
                  params: { role: selectedRole },
                })
              }
            >
              CREATE ACCOUNT
            </Button>
            <Button
              variant="ghost"
              height={40}
              onPress={() => router.push({ pathname: "/(auth)/role" })}
            >
              <Text
                fontSize="$3"
                color="$primary"
                fontWeight="600"
                fontFamily="$body"
              >
                Logging in as {roleLabel} · Switch Role
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
              Select Country Code
            </Text>
            <Text
              fontSize="$3"
              color="$colorSecondary"
              fontFamily="$body"
              mt="$1"
            >
              Choose a country for OTP routing.
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
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
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
