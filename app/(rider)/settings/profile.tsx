// @ts-nocheck
import { useEffect, useState } from "react";
import { YStack, XStack, Text, Card } from "tamagui";
import { UserRound } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { BackButton, Button, FormInput } from "@/components/ui";
import { FormActions, FormScreen } from "@/components/layout";
import {
  useRiderProfileQuery,
  extractApiErrorMessage,
} from "@teincfood/core";
import {
  useCreateRiderProfileMutation,
  useUpdateRiderProfileMutation,
} from "@/hooks/useRiderProfile";
import { toast } from "sonner-native";

/**
 * Rider Profile — create (POST /riders/profile) or edit (PATCH).
 * Fixes the dead "Create Profile" link from rider home.
 */
export default function RiderProfileScreen() {
  const router = useRouter();

  const { data: profileData, isLoading } = useRiderProfileQuery();
  const profile = profileData ?? null;
  const createProfile = useCreateRiderProfileMutation();
  const updateProfile = useUpdateRiderProfileMutation();

  const [phone, setPhone] = useState(profile?.phone || "");
  const [licenseNumber, setLicenseNumber] = useState(
    profile?.license_number || "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Profile can arrive after first render; keep the inputs in sync.
  useEffect(() => {
    if (!profile) return;
    setPhone(profile.phone || "");
    setLicenseNumber(profile.license_number || "");
  }, [profile?.id]);

  const saving = createProfile.isPending || updateProfile.isPending;

  const handleSave = () => {
    const newErrors: Record<string, string> = {};
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\+?[0-9\s\-()]{6,20}$/.test(phone.trim())) {
      newErrors.phone = "Enter a valid phone number";
    }
    if (!licenseNumber.trim())
      newErrors.licenseNumber = "License number is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const payload = {
      phone: phone.trim(),
      license_number: licenseNumber.trim(),
    };

    const mutation = profile ? updateProfile : createProfile;
    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success(
          profile ? "Rider profile updated" : "Rider profile created",
        );
        router.back();
      },
      onError: (error: unknown) => {
        console.debug("[RiderProfile] save error", error);
        const apiError = error as {
          data?: { error?: { details?: Record<string, string[]> } };
        };
        const details = apiError?.data?.error?.details;
        if (details && typeof details === "object") {
          const mapped: Record<string, string> = {};
          for (const [field, msgs] of Object.entries(details)) {
            const arr = Array.isArray(msgs) ? msgs : [msgs];
            mapped[field === "license_number" ? "licenseNumber" : field] =
              arr[0];
          }
          setErrors(mapped);
        } else {
          toast.error(extractApiErrorMessage(error as Error));
        }
      },
    });
  };

  return (
    <FormScreen>
      <YStack gap="$4">
        <XStack
          paddingBottom="$1"
          alignItems="center"
          gap="$3"
        >
          <BackButton onPress={() => router.back()} />
          <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
            Rider Profile
          </Text>
        </XStack>

        <YStack gap="$4">
            {profile ? (
              <Card padding="$4" bordered backgroundColor="$backgroundSoft">
                <XStack gap="$3" alignItems="center">
                  <YStack
                    width={48}
                    height={48}
                    borderRadius={24}
                    backgroundColor="$primary"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <UserRound size={24} color="white" />
                  </YStack>
                  <YStack gap="$1">
                    <Text fontSize="$5" fontWeight="700" fontFamily="$heading">
                      {`Rider ${profile.rider_number}`}
                    </Text>
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      {`KYC: ${profile.kyc_status ?? "pending"}`}
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            ) : (
              <Card padding="$4" bordered backgroundColor="$orangeMuted">
                <Text fontSize="$3" fontFamily="$body" color="$color">
                  Create your rider profile to start accepting deliveries. Your
                  rider number is assigned automatically.
                </Text>
              </Card>
            )}

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

            <FormActions marginTop="$2">
              <Button
                variant="primary"
                loading={saving}
                disabled={isLoading}
                onPress={handleSave}
              >
                {profile ? "SAVE CHANGES" : "CREATE PROFILE"}
              </Button>
            </FormActions>
        </YStack>
      </YStack>
    </FormScreen>
  );
}
