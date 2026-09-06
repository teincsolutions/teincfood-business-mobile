// @ts-nocheck

import { useState, useEffect, useCallback } from "react";
import { ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { YStack, XStack, Text, Card, Separator, Spinner } from "tamagui";
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
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { fetchOperatingHours, upsertOperatingHours } from "@/services/business.service";
import { toast } from "sonner-native";
import { extractApiErrorMessage } from "@teincfood/core";
import type { OperatingHoursEntry } from "@teincfood/core";

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

type PickerTarget = { dayIndex: number; field: "openTime" | "closeTime" } | null;
type SaveStatus = "idle" | "success" | "error";

const DAYS = [
  { index: 0, label: "Monday" },
  { index: 1, label: "Tuesday" },
  { index: 2, label: "Wednesday" },
  { index: 3, label: "Thursday" },
  { index: 4, label: "Friday" },
  { index: 5, label: "Saturday" },
  { index: 6, label: "Sunday" },
];

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

const defaultSchedule: Record<number, DaySchedule> = {
  0: { isOpen: false, openTime: "", closeTime: "" },
  1: { isOpen: false, openTime: "", closeTime: "" },
  2: { isOpen: false, openTime: "", closeTime: "" },
  3: { isOpen: false, openTime: "", closeTime: "" },
  4: { isOpen: false, openTime: "", closeTime: "" },
  5: { isOpen: false, openTime: "", closeTime: "" },
  6: { isOpen: false, openTime: "", closeTime: "" },
};

export default function OperatingHoursSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeBusiness, activeBusinessId } = useActiveBusiness();
  const [loadingHours, setLoadingHours] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [schedule, setSchedule] = useState<Record<number, DaySchedule>>(defaultSchedule);

  useEffect(() => {
    if (!activeBusinessId) {
      setLoadingHours(false);
      return;
    }
    fetchOperatingHours(activeBusinessId)
      .then((res) => {
        const entries = res?.data;
        if (Array.isArray(entries)) {
          const merged = { ...defaultSchedule };
          for (const entry of entries) {
            if (entry.day_of_week !== undefined) {
              merged[entry.day_of_week] = {
                isOpen: !entry.is_closed,
                openTime: entry.open_time ? entry.open_time.slice(0, 5) : "",
                closeTime: entry.close_time ? entry.close_time.slice(0, 5) : "",
              };
            }
          }
          setSchedule(merged);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingHours(false));
  }, [activeBusinessId]);

  const toggleDay = (dayIndex: number) => {
    setSchedule((prev) => {
      const wasOpen = prev[dayIndex].isOpen;
      return {
        ...prev,
        [dayIndex]: {
          ...prev[dayIndex],
          isOpen: !wasOpen,
          openTime: wasOpen ? "" : prev[dayIndex].openTime || "09:00",
          closeTime: wasOpen ? "" : prev[dayIndex].closeTime || "17:00",
        },
      };
    });
  };

  const handleTimeConfirm = (date: Date) => {
    if (!pickerTarget) return;
    setSchedule((prev) => ({
      ...prev,
      [pickerTarget.dayIndex]: {
        ...prev[pickerTarget.dayIndex],
        [pickerTarget.field]: dateToTime(date),
      },
    }));
    setPickerTarget(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");
    try {
      if (!activeBusinessId) {
        toast.error("No business selected. Please select a business first.");
        return;
      }
      const invalidDay = Object.entries(schedule).find(
        ([, s]) => s.isOpen && (!s.openTime || !s.closeTime),
      );
      if (invalidDay) {
        const dayIndex = parseInt(invalidDay[0], 10);
        const dayLabel = DAYS[dayIndex]?.label || "Unknown";
        toast.error(`${dayLabel} is open but has no time set. Please tap the time to set it.`);
        setIsSaving(false);
        return;
      }

      const hours: OperatingHoursEntry[] = Object.entries(schedule).map(([dayIndexStr, s]) => {
        const dayIndex = parseInt(dayIndexStr, 10);
        return {
          day_of_week: dayIndex,
          open_time: s.isOpen && s.openTime ? `${s.openTime}:00` : null,
          close_time: s.isOpen && s.closeTime ? `${s.closeTime}:00` : null,
          is_closed: !s.isOpen,
        };
      });
      await upsertOperatingHours(activeBusinessId, hours);
      setSaveStatus("success");
      toast.success("Operating hours saved successfully!");
      setTimeout(() => router.back(), 1500);
    } catch (e) {
      setSaveStatus("error");
      toast.error(extractApiErrorMessage(e));
    } finally {
      setIsSaving(false);
    }
  };

  const pickerDate = pickerTarget
    ? timeToDate(schedule[pickerTarget.dayIndex][pickerTarget.field])
    : new Date();

  return (
    <YStack flex={1} backgroundColor="$background">
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
          paddingHorizontal="$4"
          onPress={handleSave}
          loading={isSaving}
          icon={<Save size={18} color="white" />}
        >
          Save
        </Button>
      </XStack>

      {saveStatus === "success" && (
        <XStack backgroundColor="$green2" padding="$3" gap="$2" alignItems="center" borderBottomWidth={1} borderBottomColor="$green6">
          <CheckCircle size={16} color="$green10" />
          <Text color="$green10" fontSize="$3" fontWeight="600">Operating hours saved successfully!</Text>
        </XStack>
      )}
      {saveStatus === "error" && (
        <XStack backgroundColor="$red2" padding="$3" gap="$2" alignItems="center" borderBottomWidth={1} borderBottomColor="$red6">
          <AlertCircle size={16} color="$red10" />
          <Text color="$red10" fontSize="$3" fontWeight="600">Failed to save operating hours. Please try again.</Text>
        </XStack>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {loadingHours ? (
          <YStack padding="$8" alignItems="center" gap="$3">
            <Spinner size="large" />
            <Text color="$colorMuted">Loading hours...</Text>
          </YStack>
        ) : (
          <YStack padding="$4" gap="$4" paddingBottom={Math.max(insets.bottom + 8, 20)}>
            <Card padding="$4" bordered backgroundColor="$blue2">
              <XStack gap="$3" alignItems="center">
                <Clock size={24} color="$blue10" />
                <YStack flex={1}>
                  <Text fontWeight="bold" color="$blue10">Set Your Business Hours</Text>
                  <Text fontSize="$3" color="$colorMuted">Tap a time to edit when your store opens or closes</Text>
                </YStack>
              </XStack>
            </Card>

            <Card padding="$4" bordered>
              <YStack gap="$4">
                <Text fontWeight="bold" fontSize="$5">Weekly Schedule</Text>
                <Separator />

                {DAYS.map((day, index) => {
                  const isOpen = schedule[day.index]?.isOpen ?? false;
                  return (
                    <YStack key={day.index} gap="$3" opacity={isOpen ? 1 : 0.6}>
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text fontWeight="bold" fontSize="$4">{day.label}</Text>
                        <Pressable onPress={() => toggleDay(day.index)} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
                          <XStack alignItems="center" gap="$2" paddingHorizontal="$3" paddingVertical="$2" borderRadius="$10" borderWidth={1.5} backgroundColor={isOpen ? "$green3" : "$red3"} borderColor={isOpen ? "$success" : "$error"}>
                            {isOpen ? <CheckCircle size={14} color="$green10" /> : <X size={14} color="$red10" />}
                            <Text fontSize="$2" fontWeight="700" color={isOpen ? "$green10" : "$red10"}>{isOpen ? "Open" : "Closed"}</Text>
                          </XStack>
                        </Pressable>
                      </XStack>

                      {isOpen && (
                        <XStack gap="$3" paddingLeft="$2">
                          <YStack flex={1} gap="$1">
                            <Text fontSize="$2" color="$colorMuted">Opens</Text>
                            <Pressable onPress={() => setPickerTarget({ dayIndex: day.index, field: "openTime" })}>
                              <XStack padding="$3" borderWidth={1} borderColor={pickerTarget?.dayIndex === day.index && pickerTarget?.field === "openTime" ? "$primary" : "$borderColor"} borderRadius="$3" backgroundColor="$backgroundSoft" alignItems="center" gap="$2">
                                <Clock size={14} color="$colorMuted" />
                                <Text fontWeight="500">{schedule[day.index].openTime || "---"}</Text>
                              </XStack>
                            </Pressable>
                          </YStack>
                          <YStack flex={1} gap="$1">
                            <Text fontSize="$2" color="$colorMuted">Closes</Text>
                            <Pressable onPress={() => setPickerTarget({ dayIndex: day.index, field: "closeTime" })}>
                              <XStack padding="$3" borderWidth={1} borderColor={pickerTarget?.dayIndex === day.index && pickerTarget?.field === "closeTime" ? "$primary" : "$borderColor"} borderRadius="$3" backgroundColor="$backgroundSoft" alignItems="center" gap="$2">
                                <Clock size={14} color="$colorMuted" />
                                <Text fontWeight="500">{schedule[day.index].closeTime || "---"}</Text>
                              </XStack>
                            </Pressable>
                          </YStack>
                        </XStack>
                      )}

                      {index < DAYS.length - 1 && <Separator marginTop="$1" />}
                    </YStack>
                  );
                })}
              </YStack>
            </Card>

            <Button variant="primary" width="100%" onPress={handleSave} loading={isSaving}>
              Save Changes
            </Button>
          </YStack>
        )}
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
