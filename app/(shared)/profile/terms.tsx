// @ts-nocheck
import { ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Card, Separator } from 'tamagui';
import { FileText, Scale, Shield, AlertTriangle } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui';

/**
 * Terms of Service Screen
 */
export default function TermsOfService() {
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
          Terms of Service
        </Text>
        <YStack width={50} />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Last Updated */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <XStack gap="$3" alignItems="center">
              <FileText size={24} color="$primary" />
              <YStack flex={1}>
                <Text fontSize="$5" fontWeight="bold">Terms of Service</Text>
                <Text fontSize="$3" color="$colorMuted">
                  Last updated: March 31, 2026
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Introduction */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">1. Introduction</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                Welcome to TeincFoodBusiness ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of our mobile application and services. By accessing or using our platform, you agree to be bound by these Terms.
              </Text>
            </YStack>
          </Card>

          {/* Definitions */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">2. Definitions</Text>
              <Separator />
              <YStack gap="$2">
                <Text color="$colorMuted" lineHeight="$1">
                  • "Platform" refers to the TeincFoodBusiness mobile application and related services.
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • "User" refers to any individual who accesses or uses our Platform.
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • "Rider" refers to delivery personnel who fulfill orders through our Platform.
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • "Seller" refers to restaurants or food vendors who list their products on our Platform.
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • "Customer" refers to individuals who place orders through our Platform.
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* Account Registration */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">3. Account Registration</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                To use certain features of our Platform, you must register for an account. You agree to:
              </Text>
              <YStack gap="$2">
                <Text color="$colorMuted" lineHeight="$1">
                  • Provide accurate, current, and complete information
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Maintain and update your information as needed
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Keep your password secure and confidential
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Accept responsibility for all activities under your account
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* User Conduct */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">4. User Conduct</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                You agree not to:
              </Text>
              <YStack gap="$2">
                <Text color="$colorMuted" lineHeight="$1">
                  • Use the Platform for any unlawful purpose
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Harass, abuse, or harm other users
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Impersonate any person or entity
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Interfere with the proper functioning of the Platform
                </Text>
                <Text color="$colorMuted" lineHeight="$1">
                  • Attempt to gain unauthorized access to any part of the Platform
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* Payments */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">5. Payments and Fees</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                By making a purchase through our Platform, you agree to pay all charges associated with your order. We use secure third-party payment processors to handle transactions. All prices are displayed in Ghana Cedis (GHS) unless otherwise stated.
              </Text>
            </YStack>
          </Card>

          {/* Delivery */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">6. Delivery Services</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                Delivery times are estimates and may vary based on various factors including weather, traffic, and restaurant preparation times. We are not liable for delays beyond our reasonable control. Risk of loss transfers to you upon delivery.
              </Text>
            </YStack>
          </Card>

          {/* Intellectual Property */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">7. Intellectual Property</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                All content on our Platform, including text, graphics, logos, and software, is the property of TeincFoodBusiness or its licensors and is protected by intellectual property laws. You may not use, reproduce, or distribute any content without our permission.
              </Text>
            </YStack>
          </Card>

          {/* Limitation of Liability */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <AlertTriangle size={20} color="$orange10" />
                <Text fontSize="$5" fontWeight="bold">8. Limitation of Liability</Text>
              </XStack>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, TEINCFOOD BUSINESS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
              </Text>
            </YStack>
          </Card>

          {/* Termination */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">9. Termination</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                We may terminate or suspend your account and access to the Platform at our sole discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to us, other users, or third parties.
              </Text>
            </YStack>
          </Card>

          {/* Changes to Terms */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">10. Changes to Terms</Text>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the new Terms on the Platform and updating the "Last updated" date. Your continued use of the Platform after such changes constitutes your acceptance of the new Terms.
              </Text>
            </YStack>
          </Card>

          {/* Contact Information */}
          <Card padding="$4" bordered backgroundColor="$gray2">
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Scale size={20} color="$primary" />
                <Text fontSize="$5" fontWeight="bold">Contact Us</Text>
              </XStack>
              <Separator />
              <Text color="$colorMuted" lineHeight="$1">
                If you have any questions about these Terms, please contact us at:
              </Text>
              <YStack gap="$1">
                <Text fontWeight="bold">Email: legal@teincfoods.com</Text>
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