// @ts-nocheck
import { useState } from "react";
import { Sheet, YStack, XStack, Text, ScrollView } from "tamagui";
import { Filter, X } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui";

interface FilterSheetProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  onApply: (filters: Record<string, string>) => void;
}

export function FilterSheet({ open, onOpenChange, onApply }: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const [activeSort, setActiveSort] = useState("popular");
  const [activePrice, setActivePrice] = useState("all");
  const [activeDiet, setActiveDiet] = useState<string[]>([]);

  const handleApply = () => {
    onApply({
      sort: activeSort,
      price: activePrice,
      diet: activeDiet.join(","),
    });
    onOpenChange(false);
  };

  const clearAll = () => {
    setActiveSort("popular");
    setActivePrice("all");
    setActiveDiet([]);
  };

  const toggleDiet = (diet: string) => {
    if (activeDiet.includes(diet)) {
      setActiveDiet((prev) => prev.filter((d) => d !== diet));
    } else {
      setActiveDiet((prev) => [...prev, diet]);
    }
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode="percent"
      snapPoints={[82]}
      position={0}
      dismissOnSnapToBottom
      dismissOnOverlayPress
      zIndex={100_000}
      animation="bouncy"
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(15, 23, 42, 0.28)"
      />
      <Sheet.Frame
        backgroundColor="$background"
        borderTopLeftRadius="$8"
        borderTopRightRadius="$8"
      >
        <Sheet.Handle backgroundColor="$gray200" marginTop="$2" />
        <YStack
          flex={1}
          paddingHorizontal="$5"
          paddingTop="$3"
          paddingBottom={Math.max(insets.bottom, 16)}
          backgroundColor="$background"
        >
          {/* Header */}
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$4"
          >
            <XStack alignItems="center" gap="$2">
              <Filter size={24} color="$color" />
              <Text
                fontSize="$6"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
              >
                Filters
              </Text>
            </XStack>
            <Button
              width={40}
              height={40}
              circular
              variant="ghost"
              backgroundColor="transparent"
              padding={0}
              onPress={() => onOpenChange(false)}
              icon={<X size={22} color="$color" />}
            />
          </XStack>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            <YStack gap="$6">
              {/* Sort By */}
              <YStack gap="$3">
                <Text
                  fontSize="$5"
                  fontWeight="700"
                  fontFamily="$heading"
                  color="$color"
                >
                  Sort By
                </Text>
                <XStack flexWrap="wrap" gap="$3">
                  {["popular", "rating", "delivery_time", "newest"].map(
                    (sort) => (
                      <Button
                        key={sort}
                        variant={activeSort === sort ? "primary" : "outline"}
                        width="auto"
                        minWidth={140}
                        flexShrink={0}
                        paddingHorizontal="$4"
                        onPress={() => setActiveSort(sort)}
                        height={40}
                      >
                        {sort === "popular"
                          ? "Popular"
                          : sort === "rating"
                            ? "Top Rated"
                            : sort === "delivery_time"
                              ? "Delivery Time"
                              : "Newest"}
                      </Button>
                    ),
                  )}
                </XStack>
              </YStack>

              {/* Price Range */}
              <YStack gap="$3">
                <Text
                  fontSize="$5"
                  fontWeight="700"
                  fontFamily="$heading"
                  color="$color"
                >
                  Price Range
                </Text>
                <XStack gap="$3">
                  {["all", "$", "$$", "$$$"].map((price) => (
                    <Button
                      key={price}
                      variant={activePrice === price ? "primary" : "outline"}
                      flex={1}
                      height={40}
                      onPress={() => setActivePrice(price)}
                    >
                      {price === "all" ? "All" : price}
                    </Button>
                  ))}
                </XStack>
              </YStack>

              {/* Dietary Needs */}
              <YStack gap="$3">
                <Text
                  fontSize="$5"
                  fontWeight="700"
                  fontFamily="$heading"
                  color="$color"
                >
                  Dietary
                </Text>
                <XStack flexWrap="wrap" gap="$3">
                  {["Vegetarian", "Vegan", "Halal", "Gluten Free"].map(
                    (diet) => (
                      <Button
                        key={diet}
                        variant={
                          activeDiet.includes(diet) ? "primary" : "outline"
                        }
                        width="auto"
                        minWidth={140}
                        flexShrink={0}
                        paddingHorizontal="$4"
                        height={40}
                        onPress={() => toggleDiet(diet)}
                      >
                        {diet}
                      </Button>
                    ),
                  )}
                </XStack>
              </YStack>
            </YStack>
          </ScrollView>

          {/* Footer Actions */}
          <XStack
            gap="$3"
            marginTop="$4"
            paddingTop="$4"
            borderTopWidth={1}
            borderColor="$gray100"
          >
            <Button variant="outline" flex={1} height={56} onPress={clearAll}>
              Clear All
            </Button>
            <Button
              variant="primary"
              flex={1}
              height={56}
              onPress={handleApply}
            >
              Apply Filters
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
