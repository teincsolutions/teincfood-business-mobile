// @ts-nocheck
import React from "react";
import { styled, XStack, Text } from "tamagui";

/**
 * Badge Component
 * A small status indicator component for displaying counts, labels, or status information
 */
export interface BadgeProps {
  children: React.ReactNode;
  backgroundColor?: string;
  size?: "$1" | "$2" | "$3" | "$4";
  variant?: "solid" | "outline";
}

const BadgeContainer = styled(XStack, {
  name: "Badge",
  borderRadius: "$12",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: "$2",
  paddingVertical: "$1",

  variants: {
    size: {
      $1: {
        paddingHorizontal: "$1",
        paddingVertical: "$0.5",
        minWidth: 16,
        height: 16,
      },
      $2: {
        paddingHorizontal: "$1.5",
        paddingVertical: "$0.5",
        minWidth: 20,
        height: 20,
      },
      $3: {
        paddingHorizontal: "$2",
        paddingVertical: "$1",
        minWidth: 24,
        height: 24,
      },
      $4: {
        paddingHorizontal: "$2.5",
        paddingVertical: "$1.5",
        minWidth: 28,
        height: 28,
      },
    },
  } as const,

  defaultVariants: {
    size: "$2",
  },
});

export function Badge({
  children,
  backgroundColor = "$blue10",
  size = "$2",
  variant = "solid",
}: BadgeProps) {
  return (
    <BadgeContainer background={backgroundColor} size={size}>
      {children}
    </BadgeContainer>
  );
}

export default Badge;
