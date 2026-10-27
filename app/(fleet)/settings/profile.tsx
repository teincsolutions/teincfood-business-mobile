// @ts-nocheck
import { useEffect, useState } from "react";
import { YStack, XStack, Text, Card, Separator, Avatar } from "tamagui";
import { Building, Phone } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { BackButton, Button, FormInput } from "@/components/ui";
import { FormActions, FormScreen } from "@/components/layout";
import { useBusinessStore } from "@/stores/business.store";
import * as businessService from "@/services/business.service";
import { extractApiErrorMessage } from "@teincfood/core";
import { toast } from "sonner-native";

/**
 * Fleet profile — edits the real delivery-provider business record
 * (name, description, email, phone) instead of a device-local mock.
 */
export default function FleetProfileScreen() {
  const router = useRouter();
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const updateBusiness = useBusinessStore((s) => s.updateBusiness);
  const setActiveBusiness = useBusinessStore((s) => s.setActiveBusiness);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    companyName: activeBusiness?.name || "",
    description: activeBusiness?.description || "",
    contactEmail: activeBusiness?.email || "",
    contactPhone: activeBusiness?.phone || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!activeBusiness) return;
    setForm({
      companyName: activeBusiness.name || "",
      description: activeBusiness.description || "",
      contactEmail: activeBusiness.email || "",
      contactPhone: activeBusiness.phone || "",
    });
  }, [activeBusiness?.id]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.companyName.trim()) {
      next.companyName = "Company name is required";
    }
    if (!form.contactEmail.trim()) {
      next.contactEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) {
      next.contactEmail = "Enter a valid email address";
    }
    if (!form.contactPhone.trim()) {
      next.contactPhone = "Phone number is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!activeBusiness?.id) {
      toast.error("No active business selected");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        business: {
          name: form.companyName.trim(),
          description: form.description.trim(),
          email: form.contactEmail.trim(),
          phone: form.contactPhone.trim(),
        },
      };
      const res = await businessService.updateBusiness(activeBusiness.id, payload);
      const data = res?.data;
      const patch = {
        name: data?.name ?? payload.business.name,
        description: data?.description ?? payload.business.description,
        email: data?.email ?? payload.business.email,
        phone: data?.phone ?? payload.business.phone,
      };
      updateBusiness(activeBusiness.id, patch as any);
      setActiveBusiness({ ...activeBusiness, ...patch } as any);
      toast.success("Fleet profile updated");
      router.back();
    } catch (error: any) {
      console.debug("[FleetProfile] save error", error);
      toast.error(extractApiErrorMessage(error as Error));
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = form.companyName || activeBusiness?.name || "Fleet Company";
  const businessNumber = activeBusiness?.business_number || activeBusiness?.code || "";
  const logoUrl = activeBusiness?.logo_url;

  return (
    <FormScreen>
      <YStack gap="$4">
        {/* Header */}
        <XStack alignItems="center" gap="$3">
          <BackButton />
          <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
            Fleet Profile
          </Text>
        </XStack>

        {/* Avatar / company badge */}
        <Card padding="$4" bordered>
          <XStack gap="$3" alignItems="center">
            <Avatar circular size="$7">
              <Avatar.Image src={logoUrl} />
              <Avatar.Fallback backgroundColor="$primary">
                <Text color="white" fontWeight="bold" fontSize="$6">
                  {displayName.charAt(0) || "F"}
                </Text>
              </Avatar.Fallback>
            </Avatar>
            <YStack flex={1} gap="$1">
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                {displayName}
              </Text>
              {businessNumber ? (
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  {businessNumber}
                </Text>
              ) : null}
            </YStack>
          </XStack>
        </Card>

        {/* Company Info */}
        <Card padding="$4" bordered>
          <YStack gap="$4">
            <XStack gap="$2" alignItems="center">
              <Building size={20} color="$colorMuted" />
              <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                Company Information
              </Text>
            </XStack>
            <Separator />

            <FormInput
              label="Company Name"
              placeholder="e.g. Speedy Deliveries Ltd"
              value={form.companyName}
              onChangeText={(v) => updateField("companyName", v)}
              error={errors.companyName}
              required
            />

            <FormInput
              label="Description"
              placeholder="Brief description of your fleet (optional)"
              value={form.description}
              onChangeText={(v) => updateField("description", v)}
              error={errors.description}
            />
          </YStack>
        </Card>

        {/* Contact Info */}
        <Card padding="$4" bordered>
          <YStack gap="$4">
            <XStack gap="$2" alignItems="center">
              <Phone size={20} color="$colorMuted" />
              <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                Contact Details
              </Text>
            </XStack>
            <Separator />

            <FormInput
              label="Email Address"
              placeholder="fleet@example.com"
              value={form.contactEmail}
              onChangeText={(v) => updateField("contactEmail", v)}
              error={errors.contactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              required
            />

            <FormInput
              label="Phone Number"
              placeholder="+233 24 000 0000"
              value={form.contactPhone}
              onChangeText={(v) => updateField("contactPhone", v)}
              error={errors.contactPhone}
              keyboardType="phone-pad"
              required
            />
          </YStack>
        </Card>

        <FormActions marginTop="$2">
          <Button
            variant="primary"
            size="$5"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
          >
            Save Changes
          </Button>
        </FormActions>
      </YStack>
    </FormScreen>
  );
}
