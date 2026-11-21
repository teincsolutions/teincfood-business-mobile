// @ts-nocheck
import { forwardRef, useState } from "react";
import {
  Input as TamaguiInput,
  YStack,
  XStack,
  Text,
  styled,
  GetProps,
} from "tamagui";
import { Eye, EyeOff } from "@tamagui/lucide-icons";
import { Pressable } from "react-native";

const BaseInput = styled(TamaguiInput, {
  backgroundColor: "$backgroundSoft",
  // Keep the border box constant. Changing 0 -> 1 on focus shifts layout on
  // Android keyboards and causes duplicated/garbled input on some devices.
  borderWidth: 1,
  borderColor: "$borderColor",
  borderRadius: "$3",
  fontFamily: "$body",
  fontSize: "$4",
  color: "$color",
  height: 60, // Match prominent button heights
  paddingHorizontal: "$4",
  placeholderTextColor: "$colorPlaceholder",

  focusStyle: {
    borderColor: "$primary",
    backgroundColor: "$background", // slightly separate from soft background when active
  },

  // Responsive height
  $md: { height: 64 },
  $lg: { height: 70 },
});

export type InputProps = GetProps<typeof BaseInput> & {
  label?: string;
  error?: string;
  isPassword?: boolean;
};

/**
 * Teinc Food Business Core Input Component
 */
export const Input = forwardRef<TamaguiInput, InputProps>(
  ({ label, error, isPassword, ...props }, ref) => {
    const [secure, setSecure] = useState(isPassword);

    return (
      <YStack w="100%" gap="$2">
        {label && (
          <Text
            fontSize="$3"
            fontWeight="600"
            color="$colorSecondary"
            fontFamily="$body"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            {label}
          </Text>
        )}

        <XStack w="100%" items="center">
          <BaseInput
            ref={ref}
            flex={1}
            secureTextEntry={secure}
            paddingRight={isPassword ? "$10" : "$4"}
            {...(error ? { borderColor: "$error", borderWidth: 1 } : {})}
            {...props}
          />

          {isPassword && (
            <XStack
              position="absolute"
              right="$2"
              top={8}
              width={44}
              height={44}
              items="center"
              jc="center"
              zIndex={20}
            >
              <Pressable
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => setSecure(!secure)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={secure ? "Show password" : "Hide password"}
              >
                {secure ? (
                  <EyeOff size={20} color="$colorSecondary" />
                ) : (
                  <Eye size={20} color="$colorSecondary" />
                )}
              </Pressable>
            </XStack>
          )}
        </XStack>

        {error && (
          <Text fontSize="$2" color="$error" fontFamily="$body">
            {error}
          </Text>
        )}
      </YStack>
    );
  },
);
