// @ts-nocheck
import { Button, styled, Text, XStack } from "tamagui";

const PillButton = styled(Button, {
  height: 48,
  borderRadius: "$5",
  paddingHorizontal: "$4",
  borderWidth: 0,
  flexDirection: "row",
  alignItems: "center",

  variants: {
    active: {
      true: {
        backgroundColor: "$primary",
      },
      false: {
        backgroundColor: "$backgroundStrong",
        pressStyle: {
          backgroundColor: "$backgroundSoft",
        },
      },
    },
  } as const,

  defaultVariants: {
    active: false,
  },
});

interface CategoryPillProps {
  label: string;
  isActive: boolean;
  icon?: React.ReactNode;
  onPress: () => Promise<void> | void;
}

export function CategoryPill({
  label,
  isActive,
  icon,
  onPress,
}: CategoryPillProps) {
  return (
    <PillButton active={isActive} onPress={onPress}>
      <XStack gap="$2" alignItems="center">
        {icon && icon}
        <Text
          fontFamily="$body"
          fontWeight={isActive ? "700" : "500"}
          color={isActive ? "$white" : "$colorSecondary"}
        >
          {label}
        </Text>
      </XStack>
    </PillButton>
  );
}
