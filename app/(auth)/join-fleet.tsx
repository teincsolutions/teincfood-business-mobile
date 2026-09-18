// @ts-nocheck
import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform } from "react-native";
import { YStack, Text, ScrollView, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2 } from "@tamagui/lucide-icons";
import { BackButton, Button, FormInput } from "@/components/ui";
import {
  useRiderProfileQuery,
  extractApiErrorMessage,
} from "@teincfood/core";
import {
  useCreateRiderProfileMutation,
  useSubmitJoinRequestMutation,
} from "@/hooks/useRiderProfile";
import { toast } from "sonner-native";

/**
 * Join a Fleet — rider signup step after complete-profile.
 * Step 1: create rider profile (required by POST /riders/join).
 * Step 2: enter the fleet's business number -> join request for review.
 */
export default function JoinFleetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: profileData, isLoading: profileLoading } =
    useRiderProfileQuery();
  const profile = profileData ?? null;
  const createProfile = useCreateRiderProfileMutation();
  const joinRequest = useSubmitJoinRequestMutation();

  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [requested, setRequested] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const goHome = () => router.replace("/(rider)/");

  const handleCreateProfile = () => {
    const newErrors: Record<string, string> = {};
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    if (!licenseNumber.trim())
      newErrors.licenseNumber = "License number is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    createProfile.mutate(
      { phone: phone.trim(), license_number: licenseNumber.trim() },
      {
        onSuccess: () => toast.success("Rider profile created"),
        onError: (error: unknown) => {
          console.debug("[JoinFleet] create profile error", error);
          toast.error(extractApiErrorMessage(error as Error));
        },
      },
    );
  };

  const handleSubmitRequest = () => {
    if (!businessNumber.trim()) {
      setErrors({ businessNumber: "Fleet business number is required" });
      return;
    }
    setErrors({});
    joinRequest.mutate(businessNumber.trim().toUpperCase(), {
      onSuccess: () => setRequested(true),
      onError: (error: unknown) => {
        console.debug("[JoinFleet] join request error", error);
        const err = error as {
          data?: { error?: { code?: string; message?: string } };
        };
        const code = err?.data?.error?.code;
        if (code === "BUSINESS_NOT_FOUND") {
          setErrors({
            businessNumber:
              "No fleet found with this number. Check with your fleet manager.",
          });
        } else if (code === "ALREADY_REQUESTED") {
          setRequested(true);
        } else {
          toast.error(extractApiErrorMessage(error as Error));
        }
      },
    });
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
        <ScrollView
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          width="100%"
          maxW="$media.sm"
          paddingHorizontal="$8"
        >
          <YStack mb="$7" gap="$3">
            <Text
              fontSize={30}
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              Work for a Fleet?
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
              lineHeight={22}
            >
              Enter your fleet&apos;s business number to request to join. Your
              fleet manager will review and approve it.
            </Text>
          </YStack>

          {requested ? (
            <YStack gap="$4">
              <Card padding="$5" bordered backgroundColor="$backgroundSoft">
                <YStack gap="$3" alignItems="center">
                  <CheckCircle2 size={40} color="$success" />
                  <Text
                    fontSize="$5"
                    fontWeight="700"
                    fontFamily="$heading"
                    textAlign="center"
                  >
                    Request Sent
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                    textAlign="center"
                  >
                    Your fleet manager has been notified. You&apos;ll see the
                    fleet in My Businesses once approved.
                  </Text>
                </YStack>
              </Card>
              <Button variant="primary" width="100%" onPress={goHome}>
                CONTINUE
              </Button>
            </YStack>
          ) : (
            <YStack gap="$4">
              {!profile && !profileLoading ? (
                <YStack gap="$4">
                  <FormInput
                    label="Phone Number"
                    placeholder="+233 24 000 0000"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(v) => {
                      setPhone(v);
                      setErrors((p) => {
                        const n = { ...p };
                        delete n.phone;
                        return n;
                      });
                    }}
                    error={errors.phone}
                    required
                  />
                  <FormInput
                    label="License Number"
                    placeholder="Driver's license number"
                    autoCapitalize="characters"
                    value={licenseNumber}
                    onChangeText={(v) => {
                      setLicenseNumber(v);
                      setErrors((p) => {
                        const n = { ...p };
                        delete n.licenseNumber;
                        return n;
                      });
                    }}
                    error={errors.licenseNumber}
                    required
                  />
                  <Button
                    variant="secondary"
                    width="100%"
                    loading={createProfile.isPending}
                    onPress={handleCreateProfile}
                  >
                    CREATE RIDER PROFILE
                  </Button>
                </YStack>
              ) : null}

              {profile ? (
                <YStack gap="$4">
                  <FormInput
                    label="Fleet Business Number"
                    placeholder="e.g. ABC-1234"
                    autoCapitalize="characters"
                    value={businessNumber}
                    onChangeText={(v) => {
                      setBusinessNumber(v);
                      setErrors((p) => {
                        const n = { ...p };
                        delete n.businessNumber;
                        return n;
                      });
                    }}
                    error={errors.businessNumber}
                    required
                  />
                  <Button
                    variant="primary"
                    width="100%"
                    loading={joinRequest.isPending}
                    onPress={handleSubmitRequest}
                  >
                    SEND JOIN REQUEST
                  </Button>
                </YStack>
              ) : null}

              <Button variant="outline" width="100%" onPress={goHome}>
                SKIP FOR NOW
              </Button>
            </YStack>
          )}
        </ScrollView>
      </YStack>
    </KeyboardAvoidingView>
  );
}
