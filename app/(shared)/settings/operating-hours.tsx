// @ts-nocheck

import { useState } from "react";
import { ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { YStack, XStack, Text, Card, Separator } from "tamagui";
import {
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
} from "@tamagui/lucide-icons";
import { BackButton, Button } from "@/components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useBusinessStore } from "@/stores/business.store";
import { upsertOperatingHours } from "@/services/business.service";

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

type PickerTarget = { day: string; field: "openTime" | "closeTime" } | null;
type SaveStatus = "idle" | "success" | "error";

function timeToDate(time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function dateToTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export default function OperatingHoursSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>({
    monday: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
    tuesday: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
    wednesday: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
    thursday: { isOpen: true, openTime: "08:00", closeTime: "22:00" },
    friday: { isOpen: true, openTime: "08:00", closeTime: "23:00" },
    saturday: { isOpen: false, openTime: "09:00", closeTime: "23:00" },
    sunday: { isOpen: false, openTime: "10:00", closeTime: "21:00" },
  });

  const days = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ];

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen },
    }));
  };

  const handleTimeConfirm = (date: Date) => {
    if (!pickerTarget) return;
    setSchedule((prev) => ({
      ...prev,
      [pickerTarget.day]: {
        ...prev[pickerTarget.day],
        [pickerTarget.field]: dateToTime(date),
      },
    }));
    setPickerTarget(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      const activeBusiness = useBusinessStore.getState().getDefaultBusiness();
      if (!activeBusiness) {
        Alert.alert("Error", "No business selected. Please select a business first.");
        return;
      }
      const hours = Object.fromEntries(
        Object.entries(schedule).map(([day, s]) => [
          day,
          s.isOpen ? { open: s.openTime, close: s.closeTime } : null,
        ])
      );
      await upsertOperatingHours(activeBusiness.id, hours);
      setSaveStatus("success");
      setTimeout(() => router.back(), 2500);
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const pickerDate = pickerTarget
    ? timeToDate(schedule[pickerTarget.day][pickerTarget.field])
    : new Date();

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 8, 24)}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <BackButton />
          <Text fontSize="$6" fontWeight="bold">
            Operating Hours
          </Text>
        </XStack>
        <Button
          variant="primary"
          height="$10"
          $lg={{ height: "$10" }}
          paddingHorizontal="$4"
          onPress={handleSave}
          loading={isSaving}
          icon={<Save size={18} color="white" />}
        >
          Save
        </Button>
      </XStack>

      {/* Status Banner */}
      {saveStatus === "success" && (
        <XStack
          backgroundColor="$green2"
          padding="$3"
          gap="$2"
          alignItems="center"
          borderBottomWidth={1}
          borderBottomColor="$green6"
        >
          <CheckCircle size={16} color="$green10" />
          <Text color="$green10" fontSize="$3" fontWeight="600">
            Operating hours saved successfully!
          </Text>
        </XStack>
      )}
      {saveStatus === "error" && (
        <XStack
          backgroundColor="$red2"
          padding="$3"
          gap="$2"
          alignItems="center"
          borderBottomWidth={1}
          borderBottomColor="$red6"
        >
          <AlertCircle size={16} color="$red10" />
          <Text color="$red10" fontSize="$3" fontWeight="600">
            Failed to save operating hours. Please try again.
          </Text>
        </XStack>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack
          padding="$4"
          gap="$4"
          paddingBottom={Math.max(insets.bottom + 8, 20)}
        >
          {/* Info Card */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <XStack gap="$3" alignItems="center">
              <Clock size={24} color="$blue10" />
              <YStack flex={1}>
                <Text fontWeight="bold" color="$blue10">
                  Set Your Business Hours
                </Text>
                <Text fontSize="$3" color="$colorMuted">
                  Tap a time to edit when your store opens or closes
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

              {days.map((day, index) => {
                const isOpen = schedule[day.key].isOpen;
                return (
                  <YStack key={day.key} gap="$3" opacity={isOpen ? 1 : 0.6}>
                    {/* Day header: name + "Closed" badge + labeled switch */}
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontWeight="bold" fontSize="$4">
                        {day.label}
                      </Text>
                      <Pressable
                        onPress={() => toggleDay(day.key)}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.75 : 1,
                        })}
                      >
                        <XStack
                          alignItems="center"
                          gap="$2"
                          paddingHorizontal="$3"
                          paddingVertical="$2"
                          borderRadius="$10"
                          borderWidth={1.5}
                          backgroundColor={isOpen ? "$green3" : "$red3"}
                          borderColor={isOpen ? "$success" : "$error"}
                        >
                          {isOpen ? (
                            <CheckCircle size={14} color="$green10" />
                          ) : (
                            <X size={14} color="$red10" />
                          )}
                          <Text
                            fontSize="$2"
                            fontWeight="700"
                            color={isOpen ? "$green10" : "$red10"}
                          >
                            {isOpen ? "Open" : "Closed"}
                          </Text>
                        </XStack>
                      </Pressable>
                    </XStack>

                    {/* Time pickers — only shown when day is open */}
                    {isOpen && (
                      <XStack gap="$3" paddingLeft="$2">
                        <YStack flex={1} gap="$1">
                          <Text fontSize="$2" color="$colorMuted">
                            Opens
                          </Text>
                          <Pressable
                            onPress={() =>
                              setPickerTarget({
                                day: day.key,
                                field: "openTime",
                              })
                            }
                          >
                            <XStack
                              padding="$3"
                              borderWidth={1}
                              borderColor={
                                pickerTarget?.day === day.key &&
                                pickerTarget?.field === "openTime"
                                  ? "$primary"
                                  : "$borderColor"
                              }
                              borderRadius="$3"
                              backgroundColor="$backgroundSoft"
                              alignItems="center"
                              gap="$2"
                            >
                              <Clock size={14} color="$colorMuted" />
                              <Text fontWeight="500">
                                {schedule[day.key].openTime}
                              </Text>
                            </XStack>
                          </Pressable>
                        </YStack>
                        <YStack flex={1} gap="$1">
                          <Text fontSize="$2" color="$colorMuted">
                            Closes
                          </Text>
                          <Pressable
                            onPress={() =>
                              setPickerTarget({
                                day: day.key,
                                field: "closeTime",
                              })
                            }
                          >
                            <XStack
                              padding="$3"
                              borderWidth={1}
                              borderColor={
                                pickerTarget?.day === day.key &&
                                pickerTarget?.field === "closeTime"
                                  ? "$primary"
                                  : "$borderColor"
                              }
                              borderRadius="$3"
                              backgroundColor="$backgroundSoft"
                              alignItems="center"
                              gap="$2"
                            >
                              <Clock size={14} color="$colorMuted" />
                              <Text fontWeight="500">
                                {schedule[day.key].closeTime}
                              </Text>
                            </XStack>
                          </Pressable>
                        </YStack>
                      </XStack>
                    )}

                    {index < days.length - 1 && <Separator marginTop="$1" />}
                  </YStack>
                );
              })}
            </YStack>
          </Card>

          {/* Footer Save */}
          <Button
            variant="primary"
            width="100%"
            onPress={handleSave}
            loading={isSaving}
          >
            Save Changes
          </Button>
        </YStack>
      </ScrollView>

      <DateTimePickerModal
        isVisible={pickerTarget !== null}
        mode="time"
        date={pickerDate}
        is24Hour
        onConfirm={handleTimeConfirm}
        onCancel={() => setPickerTarget(null)}
      />
    </YStack>
  );
}
