// @ts-nocheck
import { useEffect, useRef, type ReactNode } from "react";
import {
  findNodeHandle,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  type ScrollView,
} from "react-native";
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
  const scrollRef = useRef<ScrollView>(null);

  // KeyboardAvoidingView shrinks the viewport, but a ScrollView does not
  // automatically bring the focused field into view. Do that explicitly so
  // lower fields (phone/email on Add Business) stay above the keyboard.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const showSub = Keyboard.addListener(showEvent, () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const focused = TextInput.State.currentlyFocusedInput?.();
        const node = focused ? findNodeHandle(focused) : null;
        if (node == null) return;
        scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
          node,
          24,
          true,
        );
      }, 80);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      if (timer) clearTimeout(timer);
    });
    return () => {
      if (timer) clearTimeout(timer);
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ResponsiveScreen
        preset="form"
        scrollViewRef={scrollRef}
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
