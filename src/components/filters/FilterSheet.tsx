// @ts-nocheck
import {
  YStack,
  XStack,
  Text,
  Button,
  Sheet,
} from "tamagui";
import { Check, X } from "@tamagui/lucide-icons";
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
    <XStack
      minHeight={48}
      alignItems="center"
      gap="$3"
      paddingHorizontal="$2"
      borderRadius="$3"
      onPress={onPress}
      pressStyle={{ opacity: 0.6, backgroundColor: "$backgroundSoft" }}
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
  );
}

/**
 * Single filter entry point shared by Orders + Deliveries. Statuses are a
 * multi-select checklist; Date / Order Type / Payment are single-select rows.
 * All filters live-apply to the persisted filter store.
 *
 * Uses Sheet.ScrollView so the sheet's drag gesture and scrolling cooperate
 * (a plain ScrollView under Sheet.Frame swallows taps and closes on scroll).
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
      snapPointsMode="percent"
      snapPoints={[85]}
      position={0}
      dismissOnSnapToBottom
      dismissOnOverlayPress
      zIndex={100_000}
    >
      <Sheet.Overlay
        animation="lazy"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
        backgroundColor="rgba(15, 23, 42, 0.28)"
      />
      <Sheet.Frame
        backgroundColor="$background"
        borderTopLeftRadius="$8"
        borderTopRightRadius="$8"
      >
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
        <YStack
          flex={1}
          paddingHorizontal="$5"
          paddingTop="$3"
          paddingBottom={Math.max(insets.bottom, 16)}
        >
          <XStack
            justifyContent="space-between"
            alignItems="center"
            marginBottom="$3"
          >
            <Text fontSize="$6" fontWeight="800">
              {title}
            </Text>
            <Button
              width={40}
              height={40}
              circular
              variant="ghost"
              backgroundColor="transparent"
              padding={0}
              onPress={() => onOpenChange(false)}
              icon={<X size={22} color="$color" />}
            />
          </XStack>

          <Sheet.ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
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
          </Sheet.ScrollView>

          <XStack gap="$3" paddingTop="$3">
            <Button flex={1} variant="outline" height={52} onPress={onClear}>
              Clear All
            </Button>
            <Button flex={1} height={52} onPress={() => onOpenChange(false)}>
              Apply
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
