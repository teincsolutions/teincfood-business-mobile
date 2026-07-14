// @ts-nocheck
import { forwardRef, useState, useEffect } from "react";
import {
  TextArea as TamaguiTextArea,
  YStack,
  XStack,
  Text,
  styled,
  GetProps,
  Label,
} from "tamagui";

const BaseTextArea = styled(TamaguiTextArea, {
  backgroundColor: "$backgroundSoft",
  borderWidth: 0,
  borderRadius: "$3",
  fontFamily: "$body",
  fontSize: "$4",
  color: "$color",
  minHeight: 120,
  paddingHorizontal: "$4",
  paddingTop: "$4",
  placeholderTextColor: "$colorPlaceholder",

  focusStyle: {
    borderWidth: 1,
    borderColor: "$primary",
    backgroundColor: "$background",
  },
});

export type FormTextAreaProps = {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  numberOfLines?: number;
  maxLength?: number;
  textAlignVertical?: "auto" | "top" | "bottom" | "center";
};

/**
 * TeincFood Business Form TextArea Component with Tamagui Form validation
 */
export const FormTextArea = forwardRef<TamaguiTextArea, FormTextAreaProps>(
  (
    {
      label,
      error,
      placeholder,
      value,
      onChangeText,
      autoCapitalize,
      autoCorrect,
      disabled,
      required,
      name,
      numberOfLines,
      maxLength,
      textAlignVertical,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [localError, setLocalError] = useState(error);

    useEffect(() => {
      setLocalError(error);
    }, [error]);

    return (
      <YStack w="100%" gap="$2">
        {label && (
          <Label
            style={{ fontSize: 14, fontWeight: "400" }}
            color={localError ? "$error" : "$color.gray600"}
            fontFamily="$body"
            htmlFor={name || label.toLowerCase().replace(/\s+/g, "-")}
          >
            {label}
            {required && <Text color="$error"> *</Text>}
          </Label>
        )}

        <XStack w="100%" items="center">
          <BaseTextArea
            ref={ref}
            id={name || label?.toLowerCase().replace(/\s+/g, "-")}
            flex={1}
            placeholder={placeholder}
            value={value}
            onChangeText={(text: string) => {
              onChangeText?.(text);
              setLocalError(undefined);
            }}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            disabled={disabled}
            numberOfLines={numberOfLines}
            maxLength={maxLength}
            textAlignVertical={textAlignVertical || "top"}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            borderColor={
              localError ? "$error" : isFocused ? "$primary" : "$borderColor"
            }
            borderWidth={localError ? 1 : isFocused ? 1 : 0}
            backgroundColor={isFocused ? "$background" : "$backgroundSoft"}
            {...props}
          />
        </XStack>

        {localError && (
          <Text fontSize="$2" color="$error" fontFamily="$body">
            {localError}
          </Text>
        )}
      </YStack>
    );
  },
);

FormTextArea.displayName = "FormTextArea";
