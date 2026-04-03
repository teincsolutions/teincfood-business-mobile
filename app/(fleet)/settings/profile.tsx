// @ts-nocheck
import { useState } from "react";
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Card, Separator, Avatar } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Building, Phone, Mail, Hash, FileText } from "@tamagui/lucide-icons";
import { BackButton, Button, FormInput } from "@/components/ui";
import { useFleetStore } from "@/stores/fleet.store";

export default function FleetProfileScreen() {
  const insets = useSafeAreaInsets();
  const { fleet, updateFleet } = useFleetStore();
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    companyName: fleet?.companyName || "",
    contactPersonName: fleet?.contactPersonName || "",
    contactEmail: fleet?.contactEmail || "",
    contactPhone: fleet?.contactPhone || "",
    licenseNumber: fleet?.licenseNumber || "",
    description: fleet?.description || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!form.contactPersonName.trim()) {
      next.contactPersonName = "Contact person name is required";
    }
    if (!form.contactEmail.trim()) {
      next.contactEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      next.contactEmail = "Enter a valid email address";
    }
    if (!form.contactPhone.trim()) {
      next.contactPhone = "Phone number is required";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setIsSaving(true);
    setTimeout(() => {
      updateFleet({
        companyName: form.companyName.trim(),
        contactPersonName: form.contactPersonName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        licenseNumber: form.licenseNumber.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setIsSaving(false);
    }, 800);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 24) }}
    >
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <XStack alignItems="center" gap="$3" paddingTop={Math.max(insets.top, 12)}>
          <BackButton />
          <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
            Fleet Profile
          </Text>
        </XStack>

        {/* Avatar / company badge */}
        <Card padding="$4" bordered>
          <XStack gap="$3" alignItems="center">
            <Avatar circular size="$7">
              <Avatar.Image src={fleet?.logoUrl} />
              <Avatar.Fallback backgroundColor="$primary">
                <Text color="white" fontWeight="bold" fontSize="$6">
                  {form.companyName?.charAt(0) || "F"}
                </Text>
              </Avatar.Fallback>
            </Avatar>
            <YStack flex={1} gap="$1">
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                {form.companyName || "Fleet Company"}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {fleet?.code || "FLEET-XX-000"}
              </Text>
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
              label="Contact Person"
              placeholder="Full name of contact person"
              value={form.contactPersonName}
              onChangeText={(v) => updateField("contactPersonName", v)}
              error={errors.contactPersonName}
              required
            />

            <FormInput
              label="License Number"
              placeholder="Business license number (optional)"
              value={form.licenseNumber}
              onChangeText={(v) => updateField("licenseNumber", v)}
              error={errors.licenseNumber}
              autoCapitalize="characters"
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
              placeholder="+233 XX XXX XXXX"
              value={form.contactPhone}
              onChangeText={(v) => updateField("contactPhone", v)}
              error={errors.contactPhone}
              keyboardType="phone-pad"
              required
            />
          </YStack>
        </Card>

        <Button
          variant="primary"
          width="100%"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
        >
          Save Changes
        </Button>
      </YStack>
    </ScrollView>
  );
}
