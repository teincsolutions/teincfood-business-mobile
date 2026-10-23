// @ts-nocheck

import { useMemo, useState } from "react";
import { ScrollView, ActivityIndicator, Linking } from "react-native";
import { useRouter } from "expo-router";
import { YStack, XStack, Text, Card, Button, Separator, Input } from "tamagui";
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui";
import { useContent } from "@/hooks/useContent";
import type { PageSection } from "@/types/content.types";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

/**
 * The help centre: search, categories and an FAQ list, all from the copy the
 * backend publishes for this app's audience (seller / fleet / rider).
 */
export default function HelpCenterScreen({
  chatRoute = "/(communication)/chat/support",
}: {
  chatRoute?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string>("");

  const { data: page, isLoading } = useContent("help", "en");

  const faqs: FAQ[] = useMemo(() => {
    return (page?.sections ?? [])
      .filter((s) => s.type === "faq")
      .map((s, i) => ({
        id: String(i + 1),
        question: s.heading,
        answer: s.body,
        category: s.category ?? "General",
      }));
  }, [page]);

  const support = useMemo(() => {
    const section = page?.sections?.find((s) => s.type === "support");
    if (!section) return null;
    return {
      heading: section.heading,
      email: section.email,
      phone: section.phone,
      hours: section.hours,
      chat: section.chat === true || section.chat === "true",
    };
  }, [page]);

  const extraSections: PageSection[] = useMemo(
    () =>
      (page?.sections ?? []).filter(
        (s) => s.type !== "faq" && s.type !== "support"
      ),
    [page]
  );

  const categories = useMemo(() => {
    const cats = Array.from(new Set(faqs.map((f) => f.category)));
    return ["All", ...cats];
  }, [faqs]);

  const filteredFAQs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return faqs.filter((faq) => {
      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query);
      const matchesCategory =
        activeCategory === "All" || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [faqs, searchQuery, activeCategory]);

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingHorizontal="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          {page?.title ?? "Help & Support"}
        </Text>
        <YStack width={50} />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Search */}
          <Card padding="$3" bordered>
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

          {/* Categories */}
          {categories.length > 1 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$2" paddingRight="$6">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    size="$3"
                    width="auto"
                    minWidth={0}
                    flexShrink={0}
                    paddingHorizontal="$4"
                    height={40}
                    borderRadius="$full"
                    backgroundColor={
                      activeCategory === cat ? "$primary" : "$backgroundSoft"
                    }
                    onPress={() => setActiveCategory(cat)}
                  >
                    <Text
                      color={activeCategory === cat ? "white" : "$color"}
                      fontWeight="600"
                      fontSize="$3"
                    >
                      {cat}
                    </Text>
                  </Button>
                ))}
              </XStack>
            </ScrollView>
          ) : null}

          {isLoading ? (
            <YStack alignItems="center" justifyContent="center" padding="$10">
              <ActivityIndicator size="large" />
            </YStack>
          ) : null}

          {/* FAQs */}
          {!isLoading && faqs.length > 0 ? (
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <XStack gap="$2" alignItems="center">
                  <HelpCircle size={20} color="$colorMuted" />
                  <Text fontSize="$5" fontWeight="bold">
                    Frequently Asked Questions
                  </Text>
                </XStack>
                <Separator />
                {filteredFAQs.map((faq) => {
                  const isExpanded = expandedId === faq.id;
                  return (
                    <YStack
                      key={faq.id}
                      gap="$2"
                      paddingBottom="$3"
                      borderBottomWidth={1}
                      borderBottomColor="$borderColor"
                    >
                      <XStack
                        gap="$3"
                        alignItems="center"
                        onPress={() => setExpandedId(isExpanded ? "" : faq.id)}
                      >
                        <YStack flex={1} gap="$1">
                          <Text fontWeight="bold" fontSize="$4">
                            {faq.question}
                          </Text>
                          <Text color="$colorMuted" fontSize="$2">
                            {faq.category}
                          </Text>
                        </YStack>
                        {isExpanded ? (
                          <ChevronUp size={20} color="$primary" />
                        ) : (
                          <ChevronDown size={20} color="$colorMuted" />
                        )}
                      </XStack>
                      {isExpanded ? (
                        <Text color="$colorMuted" lineHeight="$1" fontSize="$3">
                          {faq.answer}
                        </Text>
                      ) : null}
                    </YStack>
                  );
                })}
                {filteredFAQs.length === 0 ? (
                  <Text color="$colorMuted" fontSize="$3" textAlign="center">
                    No answers match your search.
                  </Text>
                ) : null}
              </YStack>
            </Card>
          ) : null}

          {!isLoading && faqs.length === 0 ? (
            <Card padding="$4" bordered backgroundColor="$blue2">
              <Text color="$colorMuted">
                The help centre is not available right now. Please check your
                connection or try again later.
              </Text>
            </Card>
          ) : null}

          {/* Support contacts */}
          {support ? (
            <Card padding="$4" bordered backgroundColor="$blue2">
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="bold">
                  {support.heading ?? "Contact Support"}
                </Text>
                <Separator />
                {support.hours ? (
                  <Text color="$colorMuted" fontSize="$3">
                    {support.hours}
                  </Text>
                ) : null}
                {support.email ? (
                  <XStack gap="$3" alignItems="center">
                    <Mail size={18} color="$primary" />
                    <Text
                      color="$primary"
                      fontWeight="bold"
                      fontSize="$3"
                      onPress={() =>
                        Linking.openURL(`mailto:${support.email}`)
                      }
                    >
                      {support.email}
                    </Text>
                  </XStack>
                ) : null}
                {support.phone ? (
                  <XStack gap="$3" alignItems="center">
                    <Phone size={18} color="$primary" />
                    <Text
                      color="$primary"
                      fontWeight="bold"
                      fontSize="$3"
                      onPress={() =>
                        Linking.openURL(
                          `tel:${support.phone!.replace(/[^+\d]/g, "")}`
                        )
                      }
                    >
                      {support.phone}
                    </Text>
                  </XStack>
                ) : null}
                {support.chat !== false ? (
                  <Button
                    backgroundColor="$primary"
                    onPress={() => router.push(chatRoute as any)}
                    icon={<MessageCircle size={18} color="$background" />}
                  >
                    <Text color="$background" fontWeight="bold">
                      Live chat
                    </Text>
                  </Button>
                ) : null}
              </YStack>
            </Card>
          ) : null}

          {/* Everything else the CMS published for this audience */}
          {extraSections.map((section, i) => (
            <Card key={i} padding="$4" bordered>
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="bold">
                  {section.heading}
                </Text>
                <Separator />
                <Text color="$colorMuted" lineHeight="$1" fontSize="$3">
                  {section.body}
                </Text>
              </YStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
