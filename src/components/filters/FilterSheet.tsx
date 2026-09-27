// @ts-nocheck
import {
  YStack,
  XStack,
  Text,
  Button,
  Sheet,
  ScrollView,
} from "tamagui";
import { Check, X } from "@tamagui/lucide-icons";
import { Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DATE_PRESET_LABELS } from "@teincfood/core";
import { TamaguiDateInput } from "@/components/ui/TamaguiDateInput";

export interface FilterOption {
  key: string;
  label: string;
  color?: string;
}

export interface FilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** Multi-select statuses. */
  statusOptions: FilterOption[];
  activeStatus: string[];
  onToggleStatus: (key: string) => void;
  /** Single-select date preset. */
  datePreset: string;
  onDatePresetChange: (key: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  orderType: string;
  orderTypeOptions: FilterOption[];
  onOrderTypeChange: (key: string) => void;
  paymentStatus: string;
  paymentOptions: FilterOption[];
  onPaymentStatusChange: (key: string) => void;
  onClear: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <YStack gap="$1">
      <Text
        fontSize="$2"
        fontWeight="700"
        color="$colorMuted"
        textTransform="uppercase"
        letterSpacing={0.6}
        paddingHorizontal="$1"
        paddingBottom="$1"
      >
        {title}
      </Text>
      {children}
    </YStack>
  );
}

function SelectRow({
  label,
  selected,
  color,
  shape = "circle",
  onPress,
}: {
  label: string;
  selected: boolean;
  color?: string;
  shape?: "circle" | "square";
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <XStack
        minHeight={48}
        alignItems="center"
        gap="$3"
        paddingHorizontal="$1"
        pressStyle={{ opacity: 0.7 }}
      >
        <YStack
          width={22}
          height={22}
          borderRadius={shape === "square" ? 6 : 11}
          borderWidth={1.5}
          borderColor={selected ? "$primary" : "$borderColor"}
          backgroundColor={selected ? "$primary" : "transparent"}
          alignItems="center"
          justifyContent="center"
        >
          {selected ? <Check size={14} color="white" /> : null}
        </YStack>
        {color ? (
          <YStack width={8} height={8} borderRadius={4} backgroundColor={color} />
        ) : null}
        <Text flex={1} fontSize="$4" fontWeight={selected ? "600" : "400"}>
          {label}
        </Text>
      </XStack>
    </Pressable>
  );
}

/**
 * Single filter entry point shared by Orders + Deliveries. Statuses are a
 * multi-select checklist; Date / Order Type / Payment are single-select rows.
 * All filters live-apply to the persisted filter store.
 */
export function FilterSheet({
  open,
  onOpenChange,
  title = "Filter",
  statusOptions,
  activeStatus,
  onToggleStatus,
  datePreset,
  onDatePresetChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  orderType,
  orderTypeOptions,
  onOrderTypeChange,
  paymentStatus,
  paymentOptions,
  onPaymentStatusChange,
  onClear,
}: FilterSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={[80]}
      dismissOnSnapToBottom
      zIndex={200_000}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(0,0,0,0.5)"
      />
      <Sheet.Frame
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
        paddingHorizontal="$4"
        paddingTop="$2"
        paddingBottom="$4"
      >
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
        <XStack
          justifyContent="space-between"
          alignItems="center"
          paddingVertical="$2"
        >
          <Text fontSize="$6" fontWeight="800">
            {title}
          </Text>
          <Pressable onPress={() => onOpenChange(false)}>
            <X size={22} color="$color" />
          </Pressable>
        </XStack>

        <ScrollView showsVerticalScrollIndicator={false} flex={1}>
          <YStack gap="$5" paddingVertical="$2">
            <Section title="Order Status">
              <YStack>
                {statusOptions.map((opt) => (
                  <SelectRow
                    key={opt.key}
                    label={opt.label}
                    color={opt.color}
                    shape="square"
                    selected={activeStatus.includes(opt.key)}
                    onPress={() => onToggleStatus(opt.key)}
                  />
                ))}
              </YStack>
            </Section>

            <Section title="Date">
              <YStack>
                {DATE_PRESET_LABELS.map((preset) => (
                  <SelectRow
                    key={preset.key}
                    label={preset.label}
                    selected={datePreset === preset.key}
                    onPress={() => {
                      onDatePresetChange(preset.key);
                      if (preset.key !== "custom") {
                        onDateFromChange("");
                        onDateToChange("");
                      }
                    }}
                  />
                ))}
              </YStack>
              {datePreset === "custom" && (
                <YStack gap="$2" paddingTop="$2">
                  <TamaguiDateInput
                    value={dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined}
                    onChange={(d) => onDateFromChange(d.toISOString().split("T")[0])}
                    placeholder="Start date"
                  />
                  <TamaguiDateInput
                    value={dateTo ? new Date(`${dateTo}T00:00:00`) : undefined}
                    onChange={(d) => onDateToChange(d.toISOString().split("T")[0])}
                    placeholder="End date"
                  />
                </YStack>
              )}
            </Section>

            <Section title="Order Type">
              <YStack>
                {orderTypeOptions.map((opt) => (
                  <SelectRow
                    key={opt.key || "all"}
                    label={opt.label}
                    selected={orderType === opt.key}
                    onPress={() => onOrderTypeChange(opt.key)}
                  />
                ))}
              </YStack>
            </Section>

            <Section title="Payment">
              <YStack>
                {paymentOptions.map((opt) => (
                  <SelectRow
                    key={opt.key || "all"}
                    label={opt.label}
                    selected={paymentStatus === opt.key}
                    onPress={() => onPaymentStatusChange(opt.key)}
                  />
                ))}
              </YStack>
            </Section>
          </YStack>
        </ScrollView>

        <XStack gap="$3" paddingTop="$3">
          <Button flex={1} variant="outline" onPress={onClear}>
            Clear All
          </Button>
          <Button flex={1} onPress={() => onOpenChange(false)}>
            Apply
          </Button>
        </XStack>
      </Sheet.Frame>
    </Sheet>
  );
}
