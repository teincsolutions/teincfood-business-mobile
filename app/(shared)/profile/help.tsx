// @ts-nocheck
import { useState } from "react";
import { ScrollView, TouchableOpacity, Linking } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
  Input,
  Accordion,
  Square,
} from "tamagui";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  Search,
  Book,
  Video,
  FileQuestion,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui";

/**
 * Help & Support Screen
 */
export default function HelpSupport() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  // FAQ data
  const faqs = [
    {
      question: "How do I track my order?",
      answer:
        "You can track your order in real-time by going to \"My Orders\" and selecting the active order. You'll see live updates on the delivery status and the rider's location on the map.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "We accept Mobile Money (MTN, Vodafone, AirtelTigo), Visa/Mastercard, and cash on delivery. All online payments are processed securely through our payment partners.",
    },
    {
      question: "How do I become a rider?",
      answer:
        "To become a rider, download the app, sign up as a rider, complete your profile with required documents (ID, driver's license, vehicle registration), and wait for verification. Once verified, you can start accepting deliveries.",
    },
    {
      question: "How do I cancel an order?",
      answer:
        'You can cancel an order within 5 minutes of placing it without any charges. Go to "My Orders", select the order, and tap "Cancel Order". After 5 minutes, cancellation may incur a fee.',
    },
    {
      question: "What if my order is late or incorrect?",
      answer:
        "If your order is significantly late or incorrect, please contact us immediately through the app. You can report the issue from the order details page, and our support team will assist you.",
    },
    {
      question: "How do I update my delivery address?",
      answer:
        "You can update your delivery address before placing an order by going to Profile > Addresses. During checkout, you can also add a new address or select from your saved addresses.",
    },
    {
      question: "Is there a minimum order amount?",
      answer:
        "Minimum order amounts vary by restaurant. The minimum, if any, will be displayed on the restaurant's page before you start adding items to your cart.",
    },
    {
      question: "How do I contact customer support?",
      answer:
        "You can contact us through: 1) In-app chat support (fastest), 2) Email: support@teincfoods.com, 3) Phone: +233 XX XXX XXXX (Mon-Sun, 8am-10pm).",
    },
  ];

  // Support options
  const supportOptions = [
    {
      icon: MessageCircle,
      label: "Live Chat",
      description: "Chat with our support team",
      action: () => {},
      available: true,
    },
    {
      icon: Phone,
      label: "Call Us",
      description: "+233 XX XXX XXXX",
      action: () => Linking.openURL("tel:+233XXXXXXXX"),
      available: true,
    },
    {
      icon: Mail,
      label: "Email Support",
      description: "support@teincfoods.com",
      action: () => Linking.openURL("mailto:support@teincfoods.com"),
      available: true,
    },
  ];

  // Quick help links
  const quickHelpLinks = [
    {
      icon: Book,
      label: "User Guide",
      description: "Learn how to use the app",
    },
    {
      icon: Video,
      label: "Video Tutorials",
      description: "Watch helpful videos",
    },
    {
      icon: FileQuestion,
      label: "Report an Issue",
      description: "Let us know about problems",
    },
  ];

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
          Help & Support
        </Text>
        <YStack width={50} />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Search */}
          <Card padding="$4" bordered>
            <XStack gap="$3" alignItems="center">
              <Search size={20} color="$colorMuted" />
              <Input
                flex={1}
                placeholder="Search for help..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                borderWidth={0}
                backgroundColor="transparent"
              />
            </XStack>
          </Card>

          {/* Contact Support */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                Contact Support
              </Text>
              <Separator />
              {supportOptions.map((option, index) => (
                <TouchableOpacity key={index} onPress={option.action}>
                  <XStack
                    padding="$3"
                    borderRadius="$4"
                    backgroundColor="$background"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <XStack gap="$3" alignItems="center">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius="$10"
                        backgroundColor="$primary"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <option.icon size={20} color="white" />
                      </YStack>
                      <YStack>
                        <Text fontWeight="bold">{option.label}</Text>
                        <Text fontSize="$2" color="$colorMuted">
                          {option.description}
                        </Text>
                      </YStack>
                    </XStack>
                    <ChevronRight size={20} color="$colorMuted" />
                  </XStack>
                </TouchableOpacity>
              ))}
            </YStack>
          </Card>

          {/* Quick Help */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                Quick Help
              </Text>
              <Separator />
              {quickHelpLinks.map((link, index) => (
                <TouchableOpacity key={index}>
                  <XStack
                    padding="$3"
                    borderRadius="$4"
                    backgroundColor="$gray2"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <XStack gap="$3" alignItems="center">
                      <link.icon size={20} color="$colorMuted" />
                      <YStack>
                        <Text fontWeight="bold">{link.label}</Text>
                        <Text fontSize="$2" color="$colorMuted">
                          {link.description}
                        </Text>
                      </YStack>
                    </XStack>
                    <ChevronRight size={20} color="$colorMuted" />
                  </XStack>
                </TouchableOpacity>
              ))}
            </YStack>
          </Card>

          {/* FAQs */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <HelpCircle size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">
                  Frequently Asked Questions
                </Text>
              </XStack>
              <Separator />
              <Accordion type="multiple">
                {faqs.map((faq, index) => (
                  <Accordion.Item value={`faq-${index}`} key={index}>
                    <Accordion.Trigger
                      flexDirection="row"
                      justifyContent="space-between"
                      padding="$3"
                    >
                      {({ open }) => (
                        <>
                          <Text flex={1} fontWeight="bold" textAlign="left">
                            {faq.question}
                          </Text>
                          <Square
                            animation="quick"
                            rotate={open ? "180deg" : "0deg"}
                          >
                            <ChevronDown size={20} color="$colorMuted" />
                          </Square>
                        </>
                      )}
                    </Accordion.Trigger>
                    <Accordion.Content padding="$3">
                      <Text color="$colorMuted" lineHeight="$1">
                        {faq.answer}
                      </Text>
                    </Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion>
            </YStack>
          </Card>

          {/* Operating Hours */}
          <Card padding="$4" bordered backgroundColor="$yellow2">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                🕐 Support Hours
              </Text>
              <Separator />
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Monday - Friday</Text>
                <Text fontWeight="bold">8:00 AM - 10:00 PM</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Saturday - Sunday</Text>
                <Text fontWeight="bold">9:00 AM - 9:00 PM</Text>
              </XStack>
              <Text fontSize="$2" color="$colorMuted">
                * Live chat available 24/7 for urgent issues
              </Text>
            </YStack>
          </Card>

          {/* App Info */}
          <Card padding="$4" bordered backgroundColor="$gray2">
            <YStack gap="$2" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">
                TeincFoodBusiness
              </Text>
              <Text color="$colorMuted">Version 1.0.0</Text>
              <Text color="$colorMuted" fontSize="$2">
                © 2026 TeincFoods. All rights reserved.
              </Text>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
