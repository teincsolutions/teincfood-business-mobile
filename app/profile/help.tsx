// @ts-nocheck
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text, Separator, Input as TInput } from 'tamagui';
import { Accordion } from '@tamagui/accordion';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ChevronDown, ChevronUp, MessageCircle, HelpCircle } from '@tamagui/lucide-icons';
import { BackButton, Button } from '@/components/ui';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQ[] = [
  {
    id: '1',
    category: 'Account',
    question: 'How do I change my profile information?',
    answer: 'You can change your profile information by navigating to the Profile tab and clicking the pencil icon on your avatar. There you can update your name, phone number, and bio.'
  },
  {
    id: '2',
    category: 'Orders',
    question: 'How can I track my order?',
    answer: 'Once an order is placed, you can see its status in the "Orders" tab. For active orders, you can click on the order to see real-time tracking on the map.'
  },
  {
    id: '3',
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer: 'We currently accept digital payments via connected wallets and saved cards. You can manage these in Profile > Payment Methods.'
  },
  {
    id: '4',
    category: 'Delivery',
    question: 'What is the average delivery time?',
    answer: 'Delivery times vary based on the restaurant preparation time and your distance. Typically, orders are delivered within 30-45 minutes.'
  },
  {
    id: '5',
    category: 'Orders',
    question: 'Can I cancel my order?',
    answer: 'Orders can only be cancelled before the restaurant accepts them. Once preparation has started, cancellation may not be possible.'
  },
];

const CATEGORIES = ['All', 'Account', 'Orders', 'Payments', 'Delivery'];

export default function HelpCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string>('');

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
      
      {/* Header */}
      <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Help Center
        </Text>
      </XStack>

      <YStack paddingHorizontal="$5" gap="$4">
        {/* Search Bar */}
        <XStack alignItems="center" backgroundColor="$backgroundSoft" borderRadius="$4" paddingHorizontal="$4" height={54}>
          <Search size={20} color="$colorSecondary" />
          <TInput 
            flex={1} 
            placeholder="Search FAQs..." 
            value={searchQuery}
            onChangeText={setSearchQuery}
            backgroundColor="transparent"
            borderWidth={0}
            height={54}
            paddingHorizontal="$2"
            fontFamily="$body"
          />
        </XStack>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
          <XStack gap="$2" paddingRight="$8">
            {CATEGORIES.map(cat => (
              <Button 
                key={cat}
                size="$3"
                width="auto"
                minWidth={0}
                flexShrink={0}
                paddingHorizontal="$4"
                height={44}
                borderRadius="$full"
                backgroundColor={activeCategory === cat ? '$primary' : '$backgroundSoft'}
                onPress={() => setActiveCategory(cat)}
              >
                <Text color={activeCategory === cat ? 'white' : '$color'} fontWeight="600">{cat}</Text>
              </Button>
            ))}
          </XStack>
        </ScrollView>
      </YStack>

      <ScrollView bounces showsVerticalScrollIndicator={false} style={{ marginTop: 20 }}>
          <YStack padding="$5" gap="$3" paddingBottom="$20">
            <Accordion
              type="single"
              value={expandedId}
              onValueChange={(value) => setExpandedId(value)}
              collapsible
              width="100%"
              gap="$3"
              overflow="hidden"
            >
              {filteredFAQs.map((faq) => {
                const isExpanded = expandedId === faq.id;
                return (
                  <Accordion.Item
                    key={faq.id}
                    value={faq.id}
                    backgroundColor="$backgroundStrong"
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor={isExpanded ? '$primary' : '$borderColor'}
                    overflow="hidden"
                  >
                    <Accordion.Header>
                      <Accordion.Trigger
                        flexDirection="row"
                        justifyContent="space-between"
                        alignItems="center"
                        padding="$4"
                        backgroundColor="$backgroundStrong"
                      >
                        <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color" flex={1}>
                          {faq.question}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={20} color="$primary" />
                        ) : (
                          <ChevronDown size={20} color="$colorSecondary" />
                        )}
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.HeightAnimator animation="medium">
                      <Accordion.Content
                        paddingHorizontal="$4"
                        paddingBottom="$4"
                        backgroundColor="$backgroundStrong"
                      >
                        <Separator marginBottom="$3" borderColor="$borderColor" />
                        <Text fontSize="$3" color="$colorSecondary" lineHeight={22} fontFamily="$body">
                          {faq.answer}
                        </Text>
                      </Accordion.Content>
                    </Accordion.HeightAnimator>
                  </Accordion.Item>
                );
              })}
            </Accordion>

            {filteredFAQs.length === 0 && (
              <YStack alignItems="center" padding="$10" gap="$3">
                 <HelpCircle size={48} color="$colorSecondary" />
                 <Text color="$colorSecondary" textAlign="center">No results found for "{searchQuery}"</Text>
              </YStack>
            )}

            {/* Support CTA */}
            <YStack 
              marginTop="$6" 
              padding="$5" 
              backgroundColor="rgba(255,145,0,0.05)" 
              borderRadius="$5" 
              alignItems="center" 
              gap="$3"
              borderWidth={1}
              borderStyle="dashed"
              borderColor="$primary"
            >
               <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color">Still need help?</Text>
               <Text fontSize="$3" color="$colorSecondary" textAlign="center" fontFamily="$body">
                 Our support team is available 24/7 to assist you with any issues.
               </Text>
               <Button 
                 variant="primary" 
                 marginTop="$2" 
                 width="100%" 
                 height={56}
                 onPress={() => router.push('/(communication)/chat/support-1')}
                 icon={<MessageCircle size={20} color="white" />}
               >
                 CONTACT SUPPORT
               </Button>
            </YStack>
          </YStack>
      </ScrollView>

    </YStack>
  );
}
