// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
  TextArea,
} from 'tamagui';
import { Input } from '@/components/ui';
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  Send,
  Book,
  Video,
  FileText,
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Help & Support Screen
 */
export default function HelpSupport() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const faqItems = [
    {
      question: 'How do I update my menu?',
      answer: 'Go to Menu section and tap on any item to edit or add new items using the + button.',
    },
    {
      question: 'How do I manage orders?',
      answer: 'Orders appear in the Orders tab. You can accept, reject, or mark orders as ready.',
    },
    {
      question: 'When do I receive payouts?',
      answer: 'Payouts are processed based on your selected schedule in Payment Settings.',
    },
    {
      question: 'How do I change my business hours?',
      answer: 'Go to Settings > Operating Hours to update your business schedule.',
    },
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: () => Alert.alert('Live Chat', 'Connecting to support...'),
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: '+233 XX XXX XXXX',
      action: () => Linking.openURL('tel:+233XXXXXXXX'),
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@teincfoods.com',
      action: () => Linking.openURL('mailto:support@teincfoods.com'),
    },
  ];

  const resources = [
    { icon: Book, title: 'Seller Guide', description: 'Learn how to use the platform' },
    { icon: Video, title: 'Video Tutorials', description: 'Watch step-by-step guides' },
    { icon: FileText, title: 'Terms of Service', description: 'Read our terms and conditions' },
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsSending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Your message has been sent. We\'ll get back to you soon!', [
        { text: 'OK', onPress: () => { setSubject(''); setMessage(''); } },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

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
          <Text fontSize="$6" fontWeight="bold">Help & Support</Text>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Quick Help */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <XStack gap="$3" alignItems="center">
              <HelpCircle size={24} color="$blue10" />
              <YStack flex={1}>
                <Text fontWeight="bold" color="$blue10">
                  Need Help?
                </Text>
                <Text fontSize="$3" color="$colorMuted">
                  Browse FAQs or contact our support team
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Support Options */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Contact Support
              </Text>
              <Separator />

              {supportOptions.map((option, index) => (
                <YStack key={index}>
                  <Button
                    unstyled
                    flexDirection="row"
                    alignItems="center"
                    gap="$3"
                    padding="$3"
                    pressStyle={{ backgroundColor: "$gray3" }}
                    onPress={option.action}
                  >
                    <YStack
                      width={44}
                      height={44}
                      backgroundColor="$primaryLight"
                      borderRadius="$3"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <option.icon size={22} color="$primary" />
                    </YStack>
                    <YStack flex={1} alignItems="flex-start">
                      <Text fontWeight="bold">{option.title}</Text>
                      <Text color="$colorMuted" fontSize="$2">{option.description}</Text>
                    </YStack>
                    <ChevronRight size={16} color="$colorMuted" />
                  </Button>
                  {index < supportOptions.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* FAQs */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Frequently Asked Questions
              </Text>
              <Separator />

              {faqItems.map((faq, index) => (
                <YStack key={index} gap="$2">
                  <Text fontWeight="bold">{faq.question}</Text>
                  <Text fontSize="$3" color="$colorMuted">
                    {faq.answer}
                  </Text>
                  {index < faqItems.length - 1 && <Separator marginTop="$2" />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Resources */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Resources
              </Text>
              <Separator />

              {resources.map((resource, index) => (
                <YStack key={index}>
                  <Button
                    unstyled
                    flexDirection="row"
                    alignItems="center"
                    gap="$3"
                    padding="$3"
                    pressStyle={{ backgroundColor: "$gray3" }}
                    onPress={() => Alert.alert(resource.title, 'Opening...')}
                  >
                    <resource.icon size={20} color="$colorMuted" />
                    <YStack flex={1} alignItems="flex-start">
                      <Text fontWeight="bold">{resource.title}</Text>
                      <Text color="$colorMuted" fontSize="$2">{resource.description}</Text>
                    </YStack>
                    <ChevronRight size={16} color="$colorMuted" />
                  </Button>
                  {index < resources.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Contact Form */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Send us a Message
              </Text>
              <Separator />

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Subject
                </Text>
                <Input
                  placeholder="What do you need help with?"
                  value={subject}
                  onChangeText={setSubject}
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" color="$colorMuted">
                  Message
                </Text>
                <TextArea
                  placeholder="Describe your issue or question..."
                  value={message}
                  onChangeText={setMessage}
                  numberOfLines={5}
                  backgroundColor="$backgroundSoft"
                  borderWidth={0}
                  borderRadius="$3"
                  fontFamily="$body"
                  fontSize="$4"
                  color="$color"
                  paddingHorizontal="$4"
                  placeholderTextColor="$colorPlaceholder"
                />
              </YStack>

              <Button
                backgroundColor="$primary"
                onPress={handleSubmit}
                disabled={isSending}
                icon={<Send size={18} color="$background" />}
              >
                <Text color="$background" fontWeight="bold">
                  {isSending ? 'Sending...' : 'Send Message'}
                </Text>
              </Button>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}