// @ts-nocheck
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
} from 'tamagui';
import { ArrowLeft, Shield } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Privacy Policy Screen
 */
export default function PrivacyPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const lastUpdated = 'March 1, 2026';

  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect information you provide directly to us, such as when you create an account, place an order, or contact us for support.

Personal Information:
• Name, email address, phone number
• Delivery address
• Payment information
• Profile photo (optional)

Usage Information:
• Order history and preferences
• Device information and identifiers
• Log data and analytics
• Location data (with your permission)`,
    },
    {
      title: '2. How We Use Your Information',
      content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Send technical notices and support messages
• Respond to your comments and questions
• Personalize your experience
• Detect, investigate, and prevent fraudulent transactions
• Comply with legal obligations`,
    },
    {
      title: '3. Information Sharing',
      content: `We may share your information in the following circumstances:

With Sellers: When you place an order, we share necessary information with the seller to fulfill your order.

With Delivery Partners: To facilitate delivery, we share your delivery address and contact information.

With Service Providers: We work with third-party service providers who help us operate our platform.

For Legal Reasons: We may disclose information if required by law or to protect our rights.`,
    },
    {
      title: '4. Data Security',
      content: `We implement appropriate security measures to protect your personal information:

• Encryption of sensitive data in transit and at rest
• Secure payment processing
• Regular security assessments
• Access controls and authentication
• Employee training on data protection

However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`,
    },
    {
      title: '5. Your Privacy Rights',
      content: `You have the right to:

• Access your personal information
• Correct inaccurate or incomplete data
• Delete your account and data
• Opt-out of marketing communications
• Control location sharing
• Request data portability

To exercise these rights, contact us at privacy@teincfoods.com.`,
    },
    {
      title: '6. Data Retention',
      content: `We retain your information for as long as your account is active or as needed to provide services.

We may retain certain information after account deletion for:
• Legal compliance
• Fraud prevention
• Dispute resolution
• Enforcing our agreements

You can request deletion of your data at any time.`,
    },
    {
      title: '7. Children\'s Privacy',
      content: `Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.

If we learn we have collected personal information from a child under 13, we will delete that information immediately.`,
    },
    {
      title: '8. Cookies and Tracking',
      content: `We use cookies and similar technologies to:

• Remember your preferences
• Understand how you use our services
• Personalize content and advertisements
• Analyze trends and statistics

You can control cookies through your device settings.`,
    },
    {
      title: '9. Third-Party Services',
      content: `Our platform may contain links to third-party services. We are not responsible for the privacy practices of these services.

We encourage you to read the privacy policies of any third-party services you visit.`,
    },
    {
      title: '10. Changes to This Policy',
      content: `We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date.

Your continued use of our services after any changes constitutes acceptance of the updated policy.`,
    },
    {
      title: '11. Contact Us',
      content: `If you have any questions about this Privacy Policy, please contact us:

Email: privacy@teincfoods.com
Phone: +233 XX XXX XXXX
Address: Accra, Ghana

Data Protection Officer: dpo@teincfoods.com`,
    },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <Button
            size="$3"
            circular
            backgroundColor="$gray3"
            onPress={() => router.back()}
            icon={<ArrowLeft size={20} color="$color" />}
          />
          <Text fontSize="$6" fontWeight="bold">Privacy Policy</Text>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Header Info */}
          <Card padding="$4" bordered backgroundColor="$green2">
            <XStack gap="$3" alignItems="center">
              <Shield size={24} color="$green10" />
              <YStack flex={1}>
                <Text fontWeight="bold" color="$green10">Privacy Policy</Text>
                <Text color="$colorMuted" fontSize="$3">
                  Last Updated: {lastUpdated}
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Introduction */}
          <Card padding="$4" bordered>
            <Text fontSize="$3" color="$colorMuted" lineHeight="$1">
              At TeincFoodBusiness, we take your privacy seriously. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when 
              you use our mobile application and services.
            </Text>
          </Card>

          {/* Sections */}
          {sections.map((section, index) => (
            <Card key={index} padding="$4" bordered>
              <YStack gap="$3">
                <Text fontWeight="bold" fontSize="$5">
                  {section.title}
                </Text>
                <Separator />
                <Text fontSize="$3" lineHeight="$1" color="$color">
                  {section.content}
                </Text>
              </YStack>
            </Card>
          ))}

          {/* Footer */}
          <Card padding="$4" bordered backgroundColor="$gray1">
            <YStack alignItems="center" gap="$2">
              <Text fontWeight="bold">TeincFoodBusiness</Text>
              <Text fontSize="$2" color="$colorMuted">
                © 2026 TeincFoodBusiness. All rights reserved.
              </Text>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}