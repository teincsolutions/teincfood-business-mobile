import { useEffect, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { YStack } from "tamagui";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAppTheme } from "@/providers/ThemeProvider";

type AppleSignInButtonProps = {
  /** Defaults to SIGN_IN; pass SIGN_UP on registration screens. */
  type?: AppleAuthentication.AppleAuthenticationButtonType;
  onPress: () => void;
  /** Defaults to filling the parent (use inside a stretch row next to siblings). */
  style?: StyleProp<ViewStyle>;
};

/**
 * Official Sign in with Apple button.
 *
 * Uses Apple's supplied artwork (expo-apple-authentication) per App Store
 * Review Guideline 4 and the Apple Human Interface Guidelines — never a
 * recreated logo. Renders nothing on platforms where Sign in with Apple is
 * unavailable (e.g. Android). Designed to sit in a row with the other
 * social buttons: it flex-fills the remaining width and stretches to the
 * row height (no fixed sizes), with a minimum width that keeps Apple's
 * artwork legible.
 */
export function AppleSignInButton({
  type = AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN,
  onPress,
  style,
}: AppleSignInButtonProps) {
  const { resolvedTheme } = useAppTheme();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    AppleAuthentication.isAvailableAsync()
      .then((ok) => {
        if (mounted) setAvailable(ok);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!available) return null;

  return (
    <YStack flex={1}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={type}
        buttonStyle={
          resolvedTheme === "dark"
            ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
            : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
        }
        cornerRadius={8}
        style={[{ width: "100%", height: "100%" }, style]}
        onPress={onPress}
      />
    </YStack>
  );
}
