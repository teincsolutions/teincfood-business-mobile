// @ts-nocheck
import { useState } from 'react';
import { XStack, Text, useTheme } from 'tamagui';
import { Calendar } from '@tamagui/lucide-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface TamaguiDateInputProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TamaguiDateInput({ value, onChange, placeholder, disabled }: TamaguiDateInputProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const displayText = value ? value.toISOString().split('T')[0] : '';

  return (
    <>
      <XStack
        height={48}
        paddingHorizontal="$3"
        borderRadius="$3"
        backgroundColor="$backgroundSoft"
        borderWidth={1}
        borderColor="$borderColor"
        alignItems="center"
        gap="$2"
        onPress={() => !disabled && setShowPicker(true)}
        pressStyle={{ opacity: 0.8 }}
        opacity={disabled ? 0.5 : 1}
      >
        <Calendar size={18} color="$colorMuted" />
        <Text fontFamily="$body" fontSize="$3" color={value ? '$color' : '$colorMuted'} flex={1}>
          {displayText || placeholder || 'Select date'}
        </Text>
      </XStack>

      <DateTimePickerModal
        isVisible={showPicker && !disabled}
        mode="date"
        date={value || new Date()}
        onConfirm={(date: Date) => { setShowPicker(false); onChange(date); }}
        onCancel={() => setShowPicker(false)}
      />
    </>
  );
}
