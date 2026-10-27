// @ts-nocheck
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { ResponsiveScreen } from "./ResponsiveScreen";

interface FormScreenProps {
  children: ReactNode;
  /** Extra content-container styles (padding, alignment, etc.). */
  contentContainerStyle?: Record<string, unknown>;
  /** Vertically center short forms on large screens. */
  centered?: boolean;
}

/**
 * Standard form shell.
 *
 * - Content is capped at the shared 600pt form width.
 * - Safe-area + keyboard handling is applied once, so screens don't repeat it.
 * - On phones the cap is wider than the viewport, so it behaves full-width.
 */
export function FormScreen({
  children,
  contentContainerStyle,
  centered = false,
}: FormScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ResponsiveScreen
        preset="form"
        contentContainerStyle={[
          {
            paddingTop: Math.max(insets.top + 16, 24),
            paddingBottom: Math.max(insets.bottom + 24, 32),
            justifyContent: centered ? "center" : "flex-start",
          },
          contentContainerStyle,
        ]}
      >
        {children}
      </ResponsiveScreen>
    </KeyboardAvoidingView>
  );
}
