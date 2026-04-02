// @ts-nocheck
import { forwardRef } from "react";
import { Button as TamaguiButton, styled, Spinner, GetProps } from "tamagui";

/**
 * Base styled button extending Tamagui Button.
 * Applies our brand font and default interactions.
 */
const StyledButton = styled(TamaguiButton, {
  fontFamily: "$body",
  fontWeight: "bold",
  borderRadius: "$3",
  justifyContent: "center",
  alignItems: "center",
  height: 48, // Mockups use very tall/prominent buttons
  width: "auto",
  maxW: 420, // Limit max width for large screens
  self: "center",
  pressStyle: {
    opacity: 0.8,
  },

  // Responsive base height
  $md: { height: 48 },
  $lg: { height: 56 },

  variants: {
    variant: {
      primary: {
        backgroundColor: "$primary",
        color: "$white",
        borderWidth: 0,
        pressStyle: {
          backgroundColor: "$primaryDark",
        },
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$colorSecondary",
        color: "$color",
        pressStyle: {
          backgroundColor: "$backgroundSoft",
        },
      },
      ghost: {
        backgroundColor: "transparent",
        borderWidth: 0,
        color: "$color",
        pressStyle: {
          backgroundColor: "$backgroundSoft",
        },
      },
      social: {
        backgroundColor: "$backgroundSoft",
        borderWidth: 0,
        color: "$color",
        height: "$14", // Slightly shorter for social buttons
        width: "$14", // Base width for social buttons
        borderRadius: "$full",
        pressStyle: {
          backgroundColor: "$gray200",
        },
        $md: { width: "$16" }, // Slightly wider on medium screens
        $lg: { width: "$18" }, // Even wider on large screens
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
      },
    },
  } as const,

  defaultVariants: {
    variant: "primary",
  },
});

export type ButtonProps = GetProps<typeof StyledButton> & {
  loading?: boolean;
};

/**
 * TeincFoods Core Button Component
 */
export const Button = forwardRef<TamaguiButton, ButtonProps>(
  ({ children, loading, variant, disabled, icon, ...props }, ref) => {
    return (
      <StyledButton
        ref={ref}
        variant={variant}
        disabled={disabled || loading}
        icon={
          loading ? (
            <Spinner color={variant === "primary" ? "$white" : "$color"} />
          ) : (
            icon
          )
        }
        {...props}
      >
        {children}
      </StyledButton>
    );
  },
);
