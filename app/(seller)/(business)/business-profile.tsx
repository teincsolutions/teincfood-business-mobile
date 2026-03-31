// @ts-nocheck
import { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  TextArea,
  Separator,
  Avatar,
  Form,
} from 'tamagui';
import { ArrowLeft, Camera, Save, Building, CheckCircle, AlertCircle } from '@tamagui/lucide-icons';
import { Button, FormInput } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FormErrors = {
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  logoPermission?: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[\d\s\-()]{7,15}$/;

export default function BusinessProfileSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [businessName, setBusinessName] = useState(user?.businessName || '');
  const [businessDescription, setBusinessDescription] = useState(user?.businessDescription || '');
  const [businessAddress, setBusinessAddress] = useState(user?.businessAddress || '');
  const [businessPhone, setBusinessPhone] = useState(user?.phone || '');
  const [businessEmail, setBusinessEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [logoUri, setLogoUri] = useState<string | undefined>(user?.businessLogoUrl);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Auto-dismiss the success/error banner after 3s
  useEffect(() => {
    if (saveStatus === 'idle') return;
    const timer = setTimeout(() => {
      setSaveStatus('idle');
      if (saveStatus === 'success') router.back();
    }, 2500);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!businessName.trim()) {
      next.businessName = 'Business name is required';
    }
    if (businessEmail.trim() && !EMAIL_REGEX.test(businessEmail.trim())) {
      next.businessEmail = 'Enter a valid email address';
    }
    if (businessPhone.trim() && !PHONE_REGEX.test(businessPhone.trim())) {
      next.businessPhone = 'Enter a valid phone number';
    }
    return next;
  };

  const handleChangeLogo = async () => {
    setErrors((prev) => ({ ...prev, logoPermission: undefined }));
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErrors((prev) => ({
        ...prev,
        logoPermission: 'Photo library access is required to change your logo',
      }));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateUser({
        businessName: businessName.trim(),
        businessDescription: businessDescription.trim(),
        businessAddress: businessAddress.trim(),
        phone: businessPhone.trim(),
        email: businessEmail.trim(),
        ...(logoUri ? { businessLogoUrl: logoUri } : {}),
      });
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 8, 24)}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <Button
            variant="outline"
            width={44}
            height={44}
            borderRadius={22}
            onPress={() => router.dismiss()}
            icon={<ArrowLeft size={20} />}
          />
          <Text fontSize="$6" fontWeight="bold">Business Profile</Text>
        </XStack>
        <Form onSubmit={handleSubmit}>
          <Form.Trigger asChild>
            <Button
              variant="primary"
              width="auto"
              height={40}
              paddingHorizontal="$4"
              loading={isSaving}
              icon={<Save size={18} color="white" />}
            >
              Save
            </Button>
          </Form.Trigger>
        </Form>
      </XStack>

      {/* Inline feedback banner */}
      {saveStatus !== 'idle' && (
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          gap="$2"
          alignItems="center"
          backgroundColor={saveStatus === 'success' ? '$green2' : '$red2'}
          borderBottomWidth={1}
          borderBottomColor={saveStatus === 'success' ? '$green6' : '$red6'}
        >
          {saveStatus === 'success'
            ? <CheckCircle size={16} color="$green10" />
            : <AlertCircle size={16} color="$red10" />}
          <Text
            fontSize="$3"
            color={saveStatus === 'success' ? '$green10' : '$red10'}
            fontFamily="$body"
          >
            {saveStatus === 'success'
              ? 'Business profile updated successfully'
              : 'Failed to save changes. Please try again.'}
          </Text>
        </XStack>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <Form onSubmit={handleSubmit}>
          <YStack padding="$4" gap="$4">
            {/* Business Logo */}
            <Card padding="$4" bordered alignItems="center">
              <YStack alignItems="center" gap="$3">
                <Avatar circular size="$16">
                  <Avatar.Image src={logoUri} />
                  <Avatar.Fallback
                    size="$16"
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor="$primary"
                  >
                    <Building size="$10" color="$background" />
                  </Avatar.Fallback>
                </Avatar>
                <Button
                  variant="outline"
                  width="auto"
                  height={40}
                  paddingHorizontal="$4"
                  icon={<Camera size={18} />}
                  onPress={handleChangeLogo}
                >
                  Change Logo
                </Button>
                {errors.logoPermission && (
                  <XStack gap="$1" alignItems="center">
                    <AlertCircle size={14} color="$error" />
                    <Text fontSize="$2" color="$error" fontFamily="$body">
                      {errors.logoPermission}
                    </Text>
                  </XStack>
                )}
              </YStack>
            </Card>

            {/* Business Information */}
            <Card padding="$4" bordered>
              <YStack gap="$4">
                <Text fontWeight="bold" fontSize="$5">Business Information</Text>
                <Separator />

                <FormInput
                  label="Business Name"
                  placeholder="Enter your business name"
                  value={businessName}
                  onChangeText={(t) => {
                    setBusinessName(t);
                    if (errors.businessName) setErrors((p) => ({ ...p, businessName: undefined }));
                  }}
                  error={errors.businessName}
                  required
                  returnKeyType="next"
                />

                <YStack gap="$2">
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color="$colorSecondary"
                    fontFamily="$body"
                    textTransform="uppercase"
                    letterSpacing={0.5}
                  >
                    Description
                  </Text>
                  <TextArea
                    placeholder="Describe your business..."
                    value={businessDescription}
                    onChangeText={setBusinessDescription}
                    numberOfLines={4}
                    backgroundColor="$backgroundSoft"
                    borderWidth={0}
                    borderRadius="$3"
                    fontFamily="$body"
                    fontSize="$4"
                    color="$color"
                    paddingHorizontal="$4"
                    placeholderTextColor="$colorPlaceholder"
                    focusStyle={{
                      borderWidth: 1,
                      borderColor: '$primary',
                      backgroundColor: '$background',
                    }}
                  />
                </YStack>

                <FormInput
                  label="Business Address"
                  placeholder="Enter your business address"
                  value={businessAddress}
                  onChangeText={setBusinessAddress}
                  returnKeyType="next"
                />
              </YStack>
            </Card>

            {/* Contact Information */}
            <Card padding="$4" bordered>
              <YStack gap="$4">
                <Text fontWeight="bold" fontSize="$5">Contact Information</Text>
                <Separator />

                <FormInput
                  label="Phone Number"
                  placeholder="+233 XX XXX XXXX"
                  value={businessPhone}
                  onChangeText={(t) => {
                    setBusinessPhone(t);
                    if (errors.businessPhone) setErrors((p) => ({ ...p, businessPhone: undefined }));
                  }}
                  error={errors.businessPhone}
                  keyboardType="phone-pad"
                  returnKeyType="next"
                />

                <FormInput
                  label="Email Address"
                  placeholder="business@example.com"
                  value={businessEmail}
                  onChangeText={(t) => {
                    setBusinessEmail(t);
                    if (errors.businessEmail) setErrors((p) => ({ ...p, businessEmail: undefined }));
                  }}
                  error={errors.businessEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="done"
                />
              </YStack>
            </Card>

            {/* Footer submit */}
            <Form.Trigger asChild>
              <Button variant="primary" loading={isSaving}>
                Save Changes
              </Button>
            </Form.Trigger>
          </YStack>
        </Form>
      </ScrollView>
    </YStack>
  );
}