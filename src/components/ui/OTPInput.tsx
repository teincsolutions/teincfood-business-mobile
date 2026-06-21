// @ts-nocheck
import { CodeField, Cursor, useBlurOnFulfill } from 'react-native-confirmation-code-field';
import { XStack, YStack, Text } from 'tamagui';

interface OTPInputProps {
  length?: number;
  value?: string;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
}

export function OTPInput({
  length = 4,
  value = '',
  onChange,
  onComplete,
}: OTPInputProps) {
  const ref = useBlurOnFulfill({ value, cellCount: length });

  const renderCell = ({ index, symbol, isFocused }: any) => {
    return (
      <YStack
        key={index}
        width={64}
        height={64}
        borderRadius="$4"
        backgroundColor="$backgroundSoft"
        borderWidth={1}
        borderColor={isFocused ? '$primary' : '$borderColor'}
        justifyContent="center"
        alignItems="center"
        marginRight={index < length - 1 ? "$2" : 0}
      >
        <Text
          fontSize={24}
          fontWeight="700"
          color="$color"
        >
          {symbol || (isFocused ? <Cursor /> : null)}
        </Text>
      </YStack>
    );
  };

  return (
    <XStack width="100%" justifyContent="center" marginTop="$5" marginBottom="$2">
      <CodeField
        ref={ref}
        value={value}
        onChangeText={(text) => {
          onChange?.(text);
          if (text.length === length) {
            onComplete?.(text);
          }
        }}
        cellCount={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        renderCell={renderCell}
      />
    </XStack>
  );
}
