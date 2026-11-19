// @ts-nocheck
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Input as TamaguiInput,
  Image,
  useTheme,
  ScrollView,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronDown } from "@tamagui/lucide-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { BackButton, Button, FormInput, AppleSignInButton } from "@/components/ui";
import { FormActions } from "@/components/layout";
import { CountryPickerSheet } from "@/components/CountryPickerSheet";
import { validateEmail, validatePassword, extractApiErrorCode } from "@teincfood/core";
import {
  getDialCodeFromCountry,
  getCountryOption,
  normalizePhoneForCountry,
} from "@teincfood/core";
import { authService, useSignupMutation } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";
import { useRoleStore } from "@/stores/role.store";
import { useLocationStore } from "@/stores/location.store";
import { useOnboardingStore } from "@/stores/onboarding.store";
import {
  getInitialCountryIso,
  persistedCountryIso,
} from "@/utils/country-detection";

type SignupMethod = "phone" | "email";

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const storedRole = useRoleStore((s) => s.role);
  const hasLocation = useLocationStore((s) => s.hasLocation());
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);
  const setAuth = useAuthStore((s) => s.setAuth);
  const selectedRole = (() => {
    const r = storedRole || role;
    return r === "seller" || r === "rider" || r === "fleet_manager"
      ? r
      : "seller";
  })();
  const signupMutation = useSignupMutation();

  const [method, setMethod] = useState<SignupMethod>("phone");

  // Phone method
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Email method
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCountryIso, setSelectedCountryIso] = useState(() =>
    getInitialCountryIso(currentLocation),
  );
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);

  const phoneDialCode = getDialCodeFromCountry(selectedCountryIso) || "+233";
  const selectedCountry = getCountryOption(selectedCountryIso);

  useEffect(() => {
    const persisted = persistedCountryIso(currentLocation);
    if (persisted) setSelectedCountryIso(persisted);
  }, [currentLocation?.countryCode, currentLocation?.countrySource]);

  const clearError = (field: string) => {
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Phone OTP flow: send code → verify → create user → complete profile
  const handleSendCode = async () => {
    setError("");
    setPhoneError("");

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      setPhoneError("Enter a valid phone number");
      return;
    }

    const normalized = normalizePhoneForCountry(digits, selectedCountryIso);
    if (!normalized) {
      setPhoneError("Could not format phone number");
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendOTP(normalized, "register");
      router.push({
        pathname: "/(auth)/verification",
        params: {
          contactInfo: normalized,
          type: "register",
          role: selectedRole,
        },
      });
    } catch (err: any) {
      setError(err?.message || "Failed to send code. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Email signup: register → verify email → auth → dashboard
  const handleEmailSignup = async () => {
    setError("");
    setFormErrors({});

    let hasError = false;
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
      hasError = true;
    }

    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      newErrors.email = emailResult.errors[0];
      hasError = true;
    }

    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) {
      newErrors.password = passwordResult.errors[0];
      hasError = true;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      hasError = true;
    }

    if (hasError) {
      setFormErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      await signupMutation.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      router.replace({
        pathname: "/(auth)/verification",
        params: {
          contactInfo: email.trim().toLowerCase(),
          type: "email_verification",
          role: selectedRole,
        },
      });
    } catch (err: any) {
      const details = err?.response?.data?.error?.details;
      if (details && typeof details === "object") {
        const mapped: Record<string, string> = { full_name: "fullName" };
        for (const [field, msgs] of Object.entries(details)) {
          const f = mapped[field] || field;
          const arr = Array.isArray(msgs) ? msgs : [msgs];
          newErrors[f] = arr[0];
        }
        setFormErrors(newErrors);
      } else {
        setError(err?.message || "Failed to create account. Try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const goPostAuth = () => {
    router.replace("/(auth)/splash");
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
      if (provider === "google") response = await authService.loginWithGoogle();
      else if (provider === "apple")
        response = await authService.loginWithApple();
      else if (provider === "facebook")
        response = await authService.loginWithFacebook();
      else throw new Error(`Unknown provider: ${provider}`);

      setAuth({ ...response.user, role: selectedRole }, response.access_token, response.refresh_token);
      goPostAuth();
    } catch (err: any) {
      if (extractApiErrorCode(err) === "ACCOUNT_DELETED") {
        setError("This account has been deleted.");
      } else {
        setError(`Failed to sign in with ${provider}`);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <YStack
        paddingTop={Math.max(insets.top, 24)}
        paddingBottom={Math.max(insets.bottom + 20, 24)}
        flex={1}
        bg="$background"
        items="center"
      >
        <YStack mb="$4" paddingHorizontal="$8" width="100%" maxWidth={600} alignSelf="center">
          {router.canDismiss() && <BackButton />}
        </YStack>

        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          width="100%"
          maxWidth={600}
          paddingHorizontal={"$8"}
        >
          <YStack mb="$7" gap="$3">
            <Text
              fontSize={30}
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              Create Account
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
              lineHeight={22}
            >
              {method === "phone"
                ? "Verify your phone to create an account instantly."
                : "Sign up with email and password."}
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
                setFormErrors({});
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
                setFormErrors({});
              }}
            >
              EMAIL SIGNUP
            </Button>
          </XStack>

          {method === "phone" ? (
            <YStack gap="$4">
              <YStack gap="$2">
                <XStack gap="$2" ai="center">
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
                  <Text color="$error"> *</Text>
                </XStack>
                <XStack gap="$2" items="center">
                  <YStack
                    width={88}
                    height={60}
                    borderRadius="$3"
                    backgroundColor="$backgroundSoft"
                    borderWidth={1}
                    borderColor={phoneError ? "$error" : "$borderColor"}
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
                    placeholderTextColor={theme.colorPlaceholder?.val as string}
                    value={phone}
                    onChangeText={(v) => {
                      setPhone(v);
                      setPhoneError("");
                    }}
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
                {phoneError ? (
                  <Text fontSize="$2" color="$error" fontFamily="$body">
                    {phoneError}
                  </Text>
                ) : null}
              </YStack>
              {error ? (
                <Text fontSize="$2" color="$error" fontFamily="$body">
                  {error}
                </Text>
              ) : null}
            </YStack>
          ) : (
            <YStack gap="$4">
              <FormInput
                label="Full Name"
                placeholder="John Doe"
                value={fullName}
                onChangeText={(v) => {
                  setFullName(v);
                  clearError("fullName");
                }}
                error={formErrors.fullName}
                required
              />
              <FormInput
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  clearError("email");
                }}
                error={formErrors.email}
                required
              />
              <FormInput
                label="Password"
                placeholder="Create password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  clearError("password");
                }}
                isPassword
                error={formErrors.password}
                required
              />
              <FormInput
                label="Confirm Password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  clearError("confirmPassword");
                }}
                isPassword
                error={formErrors.confirmPassword}
                required
              />
              {error ? (
                <Text fontSize="$2" color="$error" fontFamily="$body">
                  {error}
                </Text>
              ) : null}
            </YStack>
          )}

          <YStack mt="$7" gap="$4">
            <FormActions marginTop="$0">
              <Button
                variant="primary"
                loading={isLoading}
                onPress={method === "phone" ? handleSendCode : handleEmailSignup}
              >
                {method === "phone" ? "SEND CODE" : "CREATE ACCOUNT"}
              </Button>
            </FormActions>

            <Text ta="center" color="$colorSecondary" fontFamily="$body">
              Or continue with
            </Text>

            <FormActions marginTop="$0">
              <AppleSignInButton
                type={
                  AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                }
                onPress={() => handleOIDCLogin("apple")}
              />
              <Button
                variant="outline"
                height={48}
                icon={
                  <Image
                    source={require("assets/icons/facebook.png")}
                    style={{ width: 24, height: 24 }}
                  />
                }
                onPress={() => handleOIDCLogin("facebook")}
              >
                Continue with Facebook
              </Button>
              <Button
                variant="outline"
                height={48}
                icon={
                  <Image
                    source={require("assets/icons/google.png")}
                    style={{ width: 24, height: 24 }}
                  />
                }
                onPress={() => handleOIDCLogin("google")}
              >
                Continue with Google
              </Button>
            </FormActions>

            <Text ta="center" color="$colorSecondary" fontFamily="$body">
              Already have an account?
            </Text>
            <FormActions marginTop="$0">
              <Button
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: "/(auth)/login",
                    params: { role: selectedRole },
                  })
                }
              >
                LOG IN
              </Button>
            </FormActions>
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
                Signing up as{" "}
                {selectedRole === "seller"
                  ? "Seller"
                  : selectedRole === "rider"
                    ? "Rider"
                    : "Fleet Manager"}{" "}
                · Switch Role
              </Text>
            </Button>
          </YStack>
        </ScrollView>

        <CountryPickerSheet
          open={countrySheetOpen}
          onOpenChange={setCountrySheetOpen}
          value={selectedCountryIso}
          title="Select Country Code"
          description="Choose a country for your phone number."
          onSelect={setSelectedCountryIso}
        />
      </YStack>
    </KeyboardAvoidingView>
  );
}
