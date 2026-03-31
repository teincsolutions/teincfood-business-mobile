// @ts-nocheck
import { useNavigation, useRouter } from "expo-router";
import { Button, styled } from "tamagui";
import { ChevronLeft } from "@tamagui/lucide-icons";

const CircularButton = styled(Button, {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: "$background",
  padding: 0,
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "$borderColor",
  shadowColor: "$shadowColor",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.05,
  shadowRadius: 6,

  pressStyle: {
    backgroundColor: "$backgroundSoft",
  },
});

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
    <CircularButton
      onPress={handlePress}
      icon={<ChevronLeft size={24} color="$color" />}
    />
  );
}
