import { useEffect, useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAppTheme } from "@/providers/ThemeProvider";

type AppleSignInButtonProps = {
  /** Defaults to SIGN_IN; pass SIGN_UP on registration screens. */
  type?: AppleAuthentication.AppleAuthenticationButtonType;
  onPress: () => void;
};

/**
 * Official Sign in with Apple button.
 *
 * Uses Apple's supplied artwork (expo-apple-authentication) per App Store
 * Review Guideline 4 and the Apple Human Interface Guidelines — never a
 * recreated logo. Renders nothing on platforms where Sign in with Apple is
 * unavailable (e.g. Android). Full-width to match the sibling social
 * buttons stacked with it.
 */
export function AppleSignInButton({
  type = AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN,
  onPress,
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
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={type}
      buttonStyle={
        resolvedTheme === "dark"
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={8}
      style={{ width: "100%", height: 48 }}
      onPress={onPress}
    />
  );
}
