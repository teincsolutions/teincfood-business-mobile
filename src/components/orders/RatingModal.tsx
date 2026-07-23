// @ts-nocheck
import { useState } from "react";
import { Sheet, YStack, XStack, Text, TextArea, useMedia } from "tamagui";
import { Star } from "@tamagui/lucide-icons";
import { Button } from "@/components/ui";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  orderId: string;
}

export function RatingModal({ open, onOpenChange, orderId }: RatingModalProps) {
  const media = useMedia();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    // Mock submitting rating
    setSubmitted(true);
    setTimeout(() => {
      onOpenChange(false);
      // Reset for next time
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setFeedback("");
      }, 500);
    }, 1500);
  };

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPointsMode="percent"
      snapPoints={[60]}
      position={0}
      dismissOnSnapToBottom
      zIndex={100_000}
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
        {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}
      >
        {submitted ? (
          <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
            <Star size={64} color="$primary" fill="$primary" />
            <Text
              fontSize="$6"
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
            >
              Thank You!
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
              textAlign="center"
            >
              Your feedback helps us improve TeincFood Business.
            </Text>
          </YStack>
        ) : (
          <YStack flex={1} gap="$6">
            <YStack gap="$2" alignItems="center">
              <Text
                fontSize="$6"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
              >
                Rate Your Order
              </Text>
              <Text
                fontSize="$4"
                color="$colorSecondary"
                fontFamily="$body"
                textAlign="center"
              >
                How was the food and delivery?
              </Text>
            </YStack>

            <XStack justifyContent="center" gap="$3" marginTop="$4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  circular
                  variant="ghost"
                  size="$5"
                  onPress={() => setRating(star)}
                  icon={
                    <Star
                      size={32}
                      color={rating >= star ? "$starOrange" : "$gray200"}
                      fill={rating >= star ? "#FF9633" : "transparent"}
                    />
                  }
                />
              ))}
            </XStack>

            <TextArea
              placeholder="Leave a comment (optional)"
              value={feedback}
              onChangeText={setFeedback}
              height={100}
              color="$color"
              backgroundColor="$backgroundStrong"
              borderWidth={1}
              borderColor="$borderColor"
              placeholderTextColor="$colorSecondary"
              padding="$3"
              marginTop="$2"
            />

            <Button
              variant="primary"
              height={56}
              marginTop="$2"
              opacity={rating === 0 ? 0.5 : 1}
              onPress={rating > 0 ? handleSubmit : undefined}
            >
              Submit Review
            </Button>
          </YStack>
        )}
      </Sheet.Frame>
    </Sheet>
  );
}
