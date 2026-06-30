// @ts-nocheck
import { useState } from 'react';
import { Platform } from 'react-native';
import { XStack, Text, useTheme } from 'tamagui';
import { Calendar } from '@tamagui/lucide-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TamaguiDateInputProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
}

export function TamaguiDateInput({ value, onChange, placeholder }: TamaguiDateInputProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const displayText = value ? value.toISOString().split('T')[0] : '';

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

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
        onPress={() => setShowPicker(true)}
        pressStyle={{ opacity: 0.8 }}
      >
        <Calendar size={18} color="$colorMuted" />
        <Text fontFamily="$body" fontSize="$3" color={value ? '$color' : '$colorMuted'} flex={1}>
          {displayText || placeholder || 'Select date'}
        </Text>
      </XStack>

      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </>
  );
}
