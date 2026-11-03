// @ts-nocheck
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Input, Sheet, Spinner, Separator } from "tamagui";
import { Check, MapPin, Search } from "@tamagui/lucide-icons";
import { toast } from "sonner-native";
import { usePlaceDetails, usePlacesSearch } from "@teincfood/core";
import { Button } from "@/components/ui";
import type { PlaceDetails } from "@/services/places.service";

export function DeliveryAddressSheet({
  open,
  onOpenChange,
  onSelect,
  initialAddress,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (place: PlaceDetails) => void;
  initialAddress?: string | null;
}) {
  const { query, setQuery, suggestions, isLoading, clearAll } =
    usePlacesSearch(350);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const { details, isLoading: detailsLoading } =
    usePlaceDetails(selectedPlaceId);

  useEffect(() => {
    if (details) setSelectedPlace(details);
  }, [details]);

  useEffect(() => {
    if (open) {
      if (initialAddress) setQuery(initialAddress);
      return;
    }
    setSelectedPlaceId(null);
    setSelectedPlace(null);
    clearAll();
  }, [open, initialAddress, clearAll, setQuery]);

  const handleConfirm = () => {
    if (!selectedPlace) {
      toast.error("Choose a delivery address");
      return;
    }
    onSelect(selectedPlace);
    onOpenChange(false);
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
      zIndex={200_000}
      animation="bouncy"
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0,0,0,0.6)"
      />
      <Sheet.Handle backgroundColor="$gray200" />
      <Sheet.Frame
        padding="$5"
        backgroundColor="$background"
        borderTopLeftRadius="$8"
        borderTopRightRadius="$8"
      >
        <YStack flex={1} gap="$4">
          <YStack gap="$1">
            <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
              Delivery Address
            </Text>
            <Text fontSize="$3" color="$colorSecondary">
              Search for the address where this order should be delivered.
            </Text>
          </YStack>

          <XStack
            alignItems="center"
            gap="$2"
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
            paddingHorizontal="$3"
            height={46}
          >
            <Search size={16} color="$colorMuted" />
            <Input
              flex={1}
              borderWidth={0}
              backgroundColor="transparent"
              placeholder="Search address, landmark or area"
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setSelectedPlaceId(null);
                setSelectedPlace(null);
              }}
            />
            {isLoading || detailsLoading ? (
              <Spinner size="small" color="$primary" />
            ) : null}
          </XStack>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {suggestions.length > 0 && !selectedPlace ? (
              <YStack
                borderWidth={1}
                borderColor="$borderColor"
                borderRadius="$3"
                overflow="hidden"
              >
                {suggestions.slice(0, 8).map((suggestion, index) => (
                  <YStack key={suggestion.placeId}>
                    <YStack
                      padding="$3"
                      pressStyle={{ backgroundColor: "$backgroundSoft" }}
                      onPress={() => {
                        setSelectedPlaceId(suggestion.placeId);
                        setQuery(
                          suggestion.description || suggestion.mainText || "",
                        );
                      }}
                    >
                      <Text fontSize="$3" fontWeight="600">
                        {suggestion.mainText || suggestion.description}
                      </Text>
                      {suggestion.secondaryText ? (
                        <Text fontSize="$2" color="$colorSecondary">
                          {suggestion.secondaryText}
                        </Text>
                      ) : null}
                    </YStack>
                    {index < Math.min(suggestions.length, 8) - 1 ? (
                      <Separator />
                    ) : null}
                  </YStack>
                ))}
              </YStack>
            ) : null}

            {selectedPlace ? (
              <XStack
                gap="$2"
                alignItems="flex-start"
                backgroundColor="$backgroundOrange"
                borderRadius="$3"
                padding="$3"
                marginTop="$3"
              >
                <MapPin size={17} color="$primary" />
                <YStack flex={1}>
                  <Text fontSize="$3" fontWeight="700" color="$primary">
                    Selected address
                  </Text>
                  <Text fontSize="$3">{selectedPlace.formattedAddress}</Text>
                </YStack>
                <Check size={17} color="$success" />
              </XStack>
            ) : null}
          </ScrollView>

          <XStack gap="$3">
            <Button
              flex={1}
              variant="outline"
              height={48}
              onPress={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              variant="primary"
              height={48}
              disabled={!selectedPlace || detailsLoading}
              onPress={handleConfirm}
            >
              Use Address
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
