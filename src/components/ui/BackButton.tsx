// @ts-nocheck
import { ArrowLeft } from "@tamagui/lucide-icons";
import { useNavigation, useRouter } from "expo-router";
import { Button, styled } from "tamagui";

interface BackButtonProps {
  onPress?: () => void;
}

/**
 * Reusable Circular Back Button used across navigation headers
 */
export function BackButton({ onPress }: BackButtonProps) {
  const router = useRouter();
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    if (navigation.canGoBack()) {
      router.back();
    }
  };

  return (
    <Button
      width={40}
      height={40}
      circular
      backgroundColor="$backgroundSoft"
      onPress={handlePress}
      icon={<ArrowLeft size={20} color="$color" />}
    />
  );
}
