// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button as TamaguiButton,
  Switch,
  Separator,
} from 'tamagui';
import { ArrowLeft, Save, Clock } from '@tamagui/lucide-icons';
import { Button } from '@/components/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

/**
 * Operating Hours Settings Screen
 */
export default function OperatingHoursSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);

  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({
    monday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
    tuesday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
    wednesday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
    thursday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
    friday: { isOpen: true, openTime: '08:00', closeTime: '23:00' },
    saturday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
    sunday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
  });

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00',
  ];

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen },
    }));
  };

  const updateTime = (day: string, field: 'openTime' | 'closeTime', value: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Operating hours updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update operating hours');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <TamaguiButton
            width={40}
            height={40}
            circular
            backgroundColor="$backgroundSoft"
            onPress={() => router.back()}
            icon={<ArrowLeft size={20} color="$color" />}
          />
          <Text fontSize="$6" fontWeight="bold">Operating Hours</Text>
        </XStack>
        <TamaguiButton
          height={44}
          paddingHorizontal="$4"
          backgroundColor="$primary"
          borderRadius="$3"
          onPress={handleSave}
          disabled={isSaving}
          icon={<Save size={18} color="white" />}
        >
          <Text color="white" fontWeight="bold">
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TamaguiButton>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4">
          {/* Info Card */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <XStack gap="$3" alignItems="center">
              <Clock size={24} color="$blue10" />
              <YStack flex={1}>
                <Text fontWeight="bold" color="$blue10">
                  Set Your Business Hours
                </Text>
                <Text fontSize="$3" color="$colorMuted">
                  Configure when your store accepts orders each day
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Schedule */}
          <Card padding="$4" bordered>
            <YStack gap="$4">
              <Text fontWeight="bold" fontSize="$5">
                Weekly Schedule
              </Text>
              <Separator />

              {days.map((day, index) => (
                <YStack key={day.key} gap="$3">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold">{day.label}</Text>
                    <Switch
                      checked={schedule[day.key].isOpen}
                      onCheckedChange={() => toggleDay(day.key)}
                      backgroundColor={schedule[day.key].isOpen ? '$green10' : '$gray8'}
                    >
                      <Switch.Thumb backgroundColor="$background" />
                    </Switch>
                  </XStack>

                  {schedule[day.key].isOpen && (
                    <XStack gap="$3" paddingLeft="$2">
                      <YStack flex={1} gap="$1">
                        <Text fontSize="$2" color="$colorMuted">Opens</Text>
                        <XStack
                          padding="$2"
                          borderWidth={1}
                          borderColor="$borderColor"
                          borderRadius="$2"
                          backgroundColor="$gray1"
                        >
                          <Text>{schedule[day.key].openTime}</Text>
                        </XStack>
                      </YStack>
                      <YStack flex={1} gap="$1">
                        <Text fontSize="$2" color="$colorMuted">Closes</Text>
                        <XStack
                          padding="$2"
                          borderWidth={1}
                          borderColor="$borderColor"
                          borderRadius="$2"
                          backgroundColor="$gray1"
                        >
                          <Text>{schedule[day.key].closeTime}</Text>
                        </XStack>
                      </YStack>
                    </XStack>
                  )}

                  {!schedule[day.key].isOpen && (
                    <Text fontSize="$3" color="$red10" paddingLeft="$2">
                      Closed
                    </Text>
                  )}

                  {index < days.length - 1 && <Separator />}
                </YStack>
              ))}
            </YStack>
          </Card>

          {/* Save Button */}
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text color="white" fontWeight="bold">
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}