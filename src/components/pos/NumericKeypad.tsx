// @ts-nocheck
import { useCallback } from "react";
import { XStack, YStack, Button, Text } from "tamagui";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  maxDecimals?: number;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "⌫"],
];

export function NumericKeypad({ value, onChange, maxDecimals = 2 }: NumericKeypadProps) {
  const handlePress = useCallback(
    (key: string) => {
      if (key === "⌫") {
        onChange(value.slice(0, -1));
        return;
      }
      if (key === ".") {
        if (value.includes(".")) return;
        if (value === "") {
          onChange("0.");
          return;
        }
        onChange(value + ".");
        return;
      }
      const parts = value.split(".");
      if (parts.length === 2 && parts[1].length >= maxDecimals) return;
      if (value === "0" && key !== ".") {
        onChange(key);
        return;
      }
      onChange(value + key);
    },
    [value, onChange, maxDecimals],
  );

  return (
    <YStack gap="$2">
      {KEYS.map((row, ri) => (
        <XStack key={ri} gap="$2" justifyContent="center">
          {row.map((key) => (
            <Button
              key={key}
              flex={1}
              height={56}
              backgroundColor={key === "⌫" ? "$backgroundSoft" : "$background"}
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$3"
              pressStyle={{ opacity: 0.7, backgroundColor: "$backgroundSoft" }}
              onPress={() => handlePress(key)}
              disabled={key === "." && value.includes(".")}
            >
              <Text
                fontSize="$6"
                fontWeight="600"
                fontFamily="$body"
                color={key === "⌫" ? "$colorSecondary" : "$color"}
              >
                {key}
              </Text>
            </Button>
          ))}
        </XStack>
      ))}
    </YStack>
  );
}
