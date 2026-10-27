// @ts-nocheck
import type { ReactNode } from "react";
import { YStack } from "tamagui";

interface FormActionsProps {
  children: ReactNode;
  /** Action buttons are deliberately narrower than the 600pt form. */
  maxWidth?: number;
  marginTop?: string;
}

/**
 * Groups form actions (submit/cancel) without stretching them across a tablet.
 * On phones the cap is larger than the viewport, so buttons stay full-width.
 */
export function FormActions({
  children,
  maxWidth = 360,
  marginTop = "$4",
}: FormActionsProps) {
  return (
    <YStack
      width="100%"
      maxWidth={maxWidth}
      alignSelf="center"
      gap="$3"
      marginTop={marginTop}
    >
      {children}
    </YStack>
  );
}
