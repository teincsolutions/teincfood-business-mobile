// @ts-nocheck
import { forwardRef, useState, useEffect } from 'react';
import { Input as TamaguiInput, YStack, XStack, Text, styled, GetProps, Label } from 'tamagui';
import { Eye, EyeOff } from '@tamagui/lucide-icons';
import { Pressable } from 'react-native';

const BaseInput = styled(TamaguiInput, {
  backgroundColor: '$backgroundSoft',
  borderWidth: 0,
  borderRadius: '$3',
  fontFamily: '$body',
  fontSize: '$4',
  color: '$color',
  height: 60,
  paddingHorizontal: '$4',
  placeholderTextColor: '$colorPlaceholder',
  
  focusStyle: {
    borderWidth: 1,
    borderColor: '$primary',
    backgroundColor: '$background',
  },
});

export type FormInputProps = {
  label?: string;
  error?: string;
  isPassword?: boolean;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  secureTextEntry?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  blurOnSubmit?: boolean;
};

/**
 * TeincFoods Form Input Component with Tamagui Form validation
 */
export const FormInput = forwardRef<TamaguiInput, FormInputProps>(
  ({ 
    label, 
    error, 
    isPassword, 
    placeholder,
    value,
    onChangeText,
    keyboardType,
    autoCapitalize,
    autoCorrect,
    secureTextEntry,
    disabled,
    required,
    name,
    onSubmitEditing,
    returnKeyType,
    blurOnSubmit,
    ...props 
  }, ref) => {
    const [secure, setSecure] = useState(isPassword);
    const [isFocused, setIsFocused] = useState(false);
    const [localError, setLocalError] = useState(error);

    useEffect(() => {
      setLocalError(error);
    }, [error]);

    return (
      <YStack w="100%" gap="$2">
        {label && (
          <Label
            style={{ fontSize: 14, fontWeight: '400' }}
            color={localError ? '$error' : '$color.gray600'}
            fontFamily="$body"
            htmlFor={name || label.toLowerCase().replace(/\s+/g, '-')}
          >
            {label}
            {required && <Text color="$error"> *</Text>}
          </Label>
        )}
        
        <XStack w="100%" ai="center">
          <BaseInput
            ref={ref}
            id={name || label?.toLowerCase().replace(/\s+/g, '-')}
            flex={1}
            secureTextEntry={secure}
            paddingRight={isPassword ? '$10' : '$4'}
            placeholder={placeholder}
            value={value}
            onChangeText={(text: string) => {
              onChangeText?.(text);
              setLocalError(undefined);
            }}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            disabled={disabled}
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType}
            blurOnSubmit={blurOnSubmit}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            borderColor={localError ? '$error' : isFocused ? '$primary' : '$borderColor'}
            borderWidth={localError ? 1 : isFocused ? 1 : 0}
            backgroundColor={isFocused ? '$background' : '$backgroundSoft'}
            {...props}
          />

          {isPassword && (
            <XStack
              position="absolute"
              right="$2"
              top={8}
              width={44}
              height={44}
              ai="center"
              jc="center"
              zIndex={20}
            >
              <Pressable
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setSecure(!secure)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={secure ? 'Show password' : 'Hide password'}
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

        {localError && (
          <Text fontSize="$2" color="$error" fontFamily="$body">
            {localError}
          </Text>
        )}
      </YStack>
    );
  }
);

FormInput.displayName = 'FormInput';