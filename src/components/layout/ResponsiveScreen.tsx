// @ts-nocheck
import type { ReactNode } from "react";
import { ScrollView, type StyleProp, type ViewStyle } from "react-native";
import { YStack } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsive } from "@/utils/responsive";

/**
 * Shared content widths used across the fleet and rider surfaces.
 * - wide:   lists and dashboards
 * - detail: a single record (rider, vehicle, delivery, business)
 * - form:   create/edit forms
 */
export const LAYOUT_WIDTHS = {
  wide: 960,
  detail: 720,
  form: 600,
} as const;

export type LayoutPreset = keyof typeof LAYOUT_WIDTHS;

/**
 * Two-pane is only useful when the drawer is permanent (tablet landscape)
 * and there is enough room for a list + detail side by side.
 */
export function useResponsiveLayout(preset: LayoutPreset = "wide") {
  const { isTablet, isLandscape, isLargeTablet } = useResponsive();

  return {
    contentWidth: LAYOUT_WIDTHS[preset],
    isTwoPane: isTablet && isLandscape && isLargeTablet,
  };
}

interface ResponsiveScreenProps {
  children: ReactNode;
  preset?: LayoutPreset;
  /** Wrap the content in a vertical ScrollView (default true). */
  scrollable?: boolean;
  /** Apply the standard horizontal padding (default true). */
  padded?: boolean;
  /** Add the status-bar inset (only needed when no drawer header is shown). */
  topInset?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Centers a screen at the recommended max width.
 *
 * On phones the max width is larger than the viewport, so this behaves like a
 * normal full-width screen. On iPad it stops content from stretching edge to
 * edge while keeping the app background full-bleed.
 */
export function ResponsiveScreen({
  children,
  preset = "wide",
  scrollable = true,
  padded = true,
  topInset = false,
  contentContainerStyle,
}: ResponsiveScreenProps) {
  const insets = useSafeAreaInsets();
  const { contentWidth } = useResponsiveLayout(preset);

  const inner = (
    <YStack
      width="100%"
      maxWidth={contentWidth}
      alignSelf="center"
      flex={scrollable ? undefined : 1}
      paddingHorizontal={padded ? "$4" : 0}
      paddingTop={topInset ? insets.top : 0}
      gap="$4"
    >
      {children}
    </YStack>
  );

  if (!scrollable) {
    return (
      <YStack flex={1} alignItems="center" backgroundColor="$background">
        {inner}
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          {
            flexGrow: 1,
            alignItems: "center",
            paddingBottom: Math.max(insets.bottom + 20, 24),
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {inner}
      </ScrollView>
    </YStack>
  );
}
