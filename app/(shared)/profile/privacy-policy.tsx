// @ts-nocheck
import { ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Card, Separator } from 'tamagui';
import { Shield, Eye, Lock, Database, Share2, Bell, Settings, Mail } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui';

/**
 * Privacy Policy Screen
 */
export default function PrivacyPolicy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Privacy Policy
        </Text>
        <YStack width={50} />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Last Updated */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <XStack gap="$3" alignItems="center">
              <Shield size={24} color="$primary" />
              <YStack flex={1}>
                <Text fontSize="$5" fontWeight="bold">Privacy Policy</Text>
                <Text fontSize="$3" color="$colorMuted">
                  Last updated: March 31, 2026
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Introduction */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Introduction</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                At TeincFoodBusiness, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and services.
              </Text>
            </YStack>
          </Card>

          {/* Information We Collect */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Database size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">Information We Collect</Text>
              </XStack>
              <Separator />
              <YStack gap="$2">
                <Text fontWeight="bold">Personal Information</Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Name, email address, and phone number
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Delivery address and location data
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Payment information (processed securely by third-party providers)
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Profile photo and identification documents
                </Text>
              </YStack>
              <YStack gap="$2" marginTop="$2">
                <Text fontWeight="bold">Usage Information</Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Device information (model, operating system, unique identifiers)
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Log data (IP address, access times, app features used)
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Location information (with your permission)
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* How We Use Your Information */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Settings size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">How We Use Your Information</Text>
              </XStack>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                We use the information we collect to:
              </Text>
              <YStack gap="$2">
                <Text color="$colorMuted" lineHeight="$1">
                  • Process and fulfill your orders
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Provide customer support and respond to inquiries
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Send you order updates and delivery notifications
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Improve our services and develop new features
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Detect and prevent fraud or unauthorized access
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Comply with legal obligations
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* Information Sharing */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Share2 size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">Information Sharing</Text>
              </XStack>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                We may share your information with:
              </Text>
              <YStack gap="$2">
                <Text color="$colorMuted" lineHeight="$1">
                  • Restaurants and vendors to fulfill your orders
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Delivery riders to complete deliveries
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Payment processors to handle transactions
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Service providers who assist our operations
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Law enforcement when required by law
                </Text>
              </YStack>
              <Text color="$colorMuted" marginTop="$2">
                We do not sell your personal information to third parties.
              </Text>
            </YStack>
          </Card>

          {/* Location Data */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Location Data</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                We collect location data to:
              </Text>
              <YStack gap="$2">
                <Text color="$colorMuted" lineHeight="$1">
                  • Show nearby restaurants and delivery options
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Track your order delivery in real-time
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Optimize delivery routes for riders
                </Text>
              </YStack>
              <Text color="$colorMuted" marginTop="$2">
                You can control location permissions through your device settings. Note that disabling location services may limit some features.
              </Text>
            </YStack>
          </Card>

          {/* Data Security */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Lock size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">Data Security</Text>
              </XStack>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                We implement appropriate security measures to protect your information, including:
              </Text>
              <YStack gap="$2">
                <Text color="$colorMuted" lineHeight="$1">
                  • Encryption of data in transit and at rest
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Secure authentication and access controls
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Regular security audits and updates
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Employee training on data protection
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* Your Rights */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Eye size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">Your Rights</Text>
              </XStack>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                You have the right to:
              </Text>
              <YStack gap="$2">
                <Text color="$colorMuted" lineHeight="$1">
                  • Access and receive a copy of your data
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Correct inaccurate or incomplete information
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Request deletion of your personal data
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Opt-out of marketing communications
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Withdraw consent for data processing
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* Notifications */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Bell size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">Communications</Text>
              </XStack>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                We may send you:
              </Text>
              <YStack gap="$2">
                <Text color="$colorMuted" lineHeight="$1">
                  • Order confirmations and delivery updates
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Account-related notifications
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Promotional offers (with your consent)
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Service announcements
                </Text>
              </YStack>
              <Text color="$colorMuted" marginTop="$2">
                You can manage notification preferences in your account settings.
              </Text>
            </YStack>
          </Card>

          {/* Children's Privacy */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Children's Privacy</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately.
              </Text>
            </YStack>
          </Card>

          {/* Changes to Policy */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Changes to This Policy</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
              </Text>
            </YStack>
          </Card>

          {/* Contact Information */}
          <Card padding="$4" bordered backgroundColor="$gray2">
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Mail size={20} color="$primary" />
                <Text fontSize="$5" fontWeight="bold">Contact Us</Text>
              </XStack>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                If you have questions or concerns about this Privacy Policy, please contact us:
              </Text>
              <YStack gap="$1">
                <Text fontWeight="bold">Email: privacy@teincfoods.com</Text>
                <Text fontWeight="bold">Phone: +233 XX XXX XXXX</Text>
                <Text fontWeight="bold">Address: Accra, Ghana</Text>
              </YStack>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}