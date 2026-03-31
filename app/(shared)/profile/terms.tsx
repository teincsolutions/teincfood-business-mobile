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
import { ArrowLeft, FileText } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Terms of Service Screen
 */
export default function TermsOfService() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const lastUpdated = 'March 1, 2026';

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By accessing and using TeincFoodBusiness ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by these terms, please do not use this service.

These Terms of Service ("Terms") govern your access to and use of our mobile application, website, and services. By using our Service, you agree to these Terms and our Privacy Policy.`,
    },
    {
      title: '2. Description of Service',
      content: `TeincFoodBusiness provides an online platform that connects food sellers with customers for the purpose of ordering and delivering food items. Our services include:

• Order management and processing
• Payment processing
• Delivery coordination
• Customer support
• Analytics and reporting for sellers`,
    },
    {
      title: '3. User Accounts',
      content: `To use certain features of the Service, you must register for an account. You agree to:

• Provide accurate, current, and complete information during registration
• Maintain and update your information to keep it accurate and current
• Maintain the security of your password and account
• Accept responsibility for all activities under your account
• Notify us immediately of any unauthorized use of your account`,
    },
    {
      title: '4. Seller Obligations',
      content: `If you are a food seller using our platform, you agree to:

• Comply with all applicable food safety regulations and laws
• Maintain necessary licenses and permits for food handling
• Provide accurate descriptions and images of food items
• Honor prices and availability as listed
• Prepare food in a hygienic environment
• Meet delivery time estimates when possible`,
    },
    {
      title: '5. Customer Obligations',
      content: `As a customer, you agree to:

• Provide accurate delivery information
• Pay for orders placed through the Service
• Be available to receive deliveries or provide safe drop-off instructions
• Treat delivery personnel with respect
• Report any issues with orders in a timely manner`,
    },
    {
      title: '6. Payments and Fees',
      content: `Payment terms include:

• All prices are listed in Ghana Cedis (GHS) unless otherwise stated
• Payment is required at the time of order placement
• We accept mobile money, card payments, and cash on delivery
• Service fees and delivery charges are clearly displayed before order confirmation
• Refunds are processed according to our refund policy`,
    },
    {
      title: '7. Prohibited Activities',
      content: `You agree not to:

• Use the Service for any illegal purpose
• Violate any laws in your jurisdiction
• Infringe upon the rights of others
• Interfere with or disrupt the Service
• Attempt to gain unauthorized access to any part of the Service
• Use the Service to transmit harmful content`,
    },
    {
      title: '8. Limitation of Liability',
      content: `TeincFoodBusiness shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from:

• Your use or inability to use the Service
• Any unauthorized access to or use of our servers
• Any interruption or cessation of transmission to or from the Service
• Any bugs, viruses, or other harmful code that may be transmitted through the Service`,
    },
    {
      title: '9. Changes to Terms',
      content: `We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "Last Updated" date.

Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.`,
    },
    {
      title: '10. Contact Information',
      content: `If you have any questions about these Terms, please contact us:

Email: legal@teincfoods.com
Phone: +233 XX XXX XXXX
Address: Accra, Ghana`,
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
          <Text fontSize="$6" fontWeight="bold">Terms of Service</Text>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Header Info */}
          <Card padding="$4" bordered>
            <XStack gap="$3" alignItems="center">
              <FileText size={24} color="$primary" />
              <YStack flex={1}>
                <Text fontWeight="bold">Terms of Service</Text>
                <Text color="$colorMuted" fontSize="$3">
                  Last Updated: {lastUpdated}
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Introduction */}
          <Card padding="$4" bordered>
            <Text fontSize="$3" color="$colorMuted" lineHeight="$1">
              Welcome to TeincFoodBusiness. These Terms of Service govern your use of our
              platform and services. Please read these terms carefully before using our Service.
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