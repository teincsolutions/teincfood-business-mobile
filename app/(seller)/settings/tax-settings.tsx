// @ts-nocheck
import { useRouter } from "expo-router";
import { YStack, Text, Card, XStack, ScrollView, Separator, Switch, Sheet, useMedia } from "tamagui";
import { Percent, Plus, Pencil, Trash2, ChevronRight } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { BackButton, Button } from "@/components/ui";
import { FormInput } from "@/components/ui/FormInput";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { useBusinessStore } from "@/stores/business.store";
import {
  useBusinessTaxRulesQuery,
  useCreateTaxRuleMutation,
  useUpdateTaxRuleMutation,
  useDeleteTaxRuleMutation,
} from "@/hooks/tax.hooks";
import type { TaxRule } from "@/types/api";
import { taxRuleToForm, defaultTaxRuleForm } from "@/types/tax.types";
import type { TaxRuleForm } from "@/types/tax.types";

const APPLIES_TO_OPTIONS = [
  { value: 'subtotal' as const, label: 'Subtotal' },
  { value: 'subtotal_plus_delivery' as const, label: 'Subtotal + Delivery' },
];

function rateLabel(rule: TaxRule) {
  const pct = rule.rate_basis_points / 100;
  return `${pct}%`;
}

function appliesLabel(value: string) {
  return value === 'subtotal_plus_delivery' ? 'Subtotal + Delivery' : 'Subtotal';
}

export default function TaxSettings() {
  const router = useRouter();
  const media = useMedia();
  const insets = useSafeAreaInsets();
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);
  const { data, isLoading } = useBusinessTaxRulesQuery();
  const createMutation = useCreateTaxRuleMutation();
  const updateMutation = useUpdateTaxRuleMutation();
  const deleteMutation = useDeleteTaxRuleMutation();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null);
  const [form, setForm] = useState<TaxRuleForm>(defaultTaxRuleForm);
  const [deleteTarget, setDeleteTarget] = useState<TaxRule | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const rules = data?.data ?? [];

  function openCreate() {
    setEditingRule(null);
    setForm(defaultTaxRuleForm);
    setFormErrors({});
    setSheetOpen(true);
  }

  function openEdit(rule: TaxRule) {
    setEditingRule(rule);
    setForm(taxRuleToForm(rule));
    setFormErrors({});
    setSheetOpen(true);
  }

  function handleSave() {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    const rate = parseFloat(form.rate_percent);
    if (!form.rate_percent || isNaN(rate) || rate < 0) errors.rate_percent = 'Enter a valid percentage';
    if (rate > 1000) errors.rate_percent = 'Rate cannot exceed 1000%';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      tax_rule: {
        name: form.name.trim(),
        code: form.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
        country_code: 'GH',
        rate_basis_points: Math.round(rate * 100),
        applies_to: form.applies_to,
        is_inclusive: form.is_inclusive,
        is_active: form.is_active,
      },
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: payload }, {
        onSuccess: () => setSheetOpen(false),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setSheetOpen(false),
      });
    }
  }

  function confirmDelete(rule: TaxRule) {
    setDeleteTarget(rule);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteOpen(false),
    });
  }

  function handleToggleActive(rule: TaxRule) {
    const payload = {
      tax_rule: {
        is_active: !rule.is_active,
      },
    };
    updateMutation.mutate({ id: rule.id, data: payload });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top + 8, 24)} {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center", width: "100%" } : {})}>
      {/* Header */}
      <XStack padding="$4" alignItems="center" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        <BackButton />
        <Text fontSize="$6" fontWeight="bold" flex={1}>Tax Settings</Text>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 24}>
          {!activeBusinessId ? (
            <Card padding="$6" bordered alignItems="center" gap="$3">
              <YStack alignItems="center" gap="$2">
                <Percent size={40} color="$colorMuted" />
                <Text color="$colorMuted" textAlign="center">
                  Select a business to manage tax rules
                </Text>
              </YStack>
            </Card>
          ) : (
            <>
          {/* Add button */}
          <Button variant="primary" width="100%" icon={<Plus size={18} />} onPress={openCreate}>
            Add Tax Rule
          </Button>

          {isLoading ? (
            <Text color="$colorMuted" textAlign="center" marginTop="$4">Loading tax rules...</Text>
          ) : rules.length === 0 ? (
            <Text color="$colorMuted" textAlign="center" marginTop="$4">No tax rules configured. Add one to apply taxes to orders.</Text>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id} padding="$4" bordered opacity={rule.is_active ? 1 : 0.5}>
                <YStack gap="$2">
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack flex={1}>
                      <Text fontSize="$4" fontWeight="bold">{rule.name}</Text>
                      <Text fontSize="$3" color="$colorMuted">{rateLabel(rule)} — {appliesLabel(rule.applies_to)}</Text>
                    </YStack>
                    <Switch
                      size="$3"
                      checked={rule.is_active}
                      onCheckedChange={() => handleToggleActive(rule)}
                      backgroundColor={rule.is_active ? "$green9" : "$gray9"}
                    >
                      <Switch.Thumb animation="quick" backgroundColor="$background" />
                    </Switch>
                  </XStack>
                  <XStack gap="$2" alignItems="center">
                    {rule.is_inclusive && (
                      <Text fontSize="$2" color="$colorMuted" backgroundColor="$backgroundSoft" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                        Inclusive
                      </Text>
                    )}
                    {!rule.is_inclusive && (
                      <Text fontSize="$2" color="$colorMuted" backgroundColor="$backgroundSoft" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                        Exclusive
                      </Text>
                    )}
                  </XStack>
                  <Separator />
                  <XStack gap="$3" justifyContent="flex-end">
                    <Button variant="outline" height={36} paddingHorizontal="$3" icon={<Pencil size={14} />} onPress={() => openEdit(rule)}>
                      Edit
                    </Button>
                    <Button variant="dangerOutline" height={36} paddingHorizontal="$3" icon={<Trash2 size={14} />} onPress={() => confirmDelete(rule)}>
                      Delete
                    </Button>
                  </XStack>
                </YStack>
              </Card>
            ))
          )}
            </>
          )}
        </YStack>
      </ScrollView>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} snapPoints={[70]} dismissOnSnapToBottom modal>
        <Sheet.Overlay />
        <Sheet.Frame paddingBottom={insets.bottom + 16} {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}>
          <Sheet.Handle />
          <Text fontSize="$5" fontWeight="bold" paddingHorizontal="$4" paddingTop="$2" paddingBottom="$2">
            {editingRule ? 'Edit Tax Rule' : 'Add Tax Rule'}
          </Text>
          <ScrollView>
            <YStack paddingHorizontal="$4" paddingBottom="$4" gap="$3">
              <FormInput
                label="Tax Name"
                placeholder="e.g. VAT"
                value={form.name}
                onChangeText={(v) => { setForm({ ...form, name: v }); setFormErrors({ ...formErrors, name: '' }); }}
                error={formErrors.name}
              />
              <FormInput
                label="Rate (%)"
                placeholder="e.g. 15"
                keyboardType="numeric"
                value={form.rate_percent}
                onChangeText={(v) => { setForm({ ...form, rate_percent: v }); setFormErrors({ ...formErrors, rate_percent: '' }); }}
                error={formErrors.rate_percent}
              />

              {/* Applies To */}
              <YStack gap="$2">
                <Text fontSize="$3" fontWeight="600" color="$color">Applies To</Text>
                <XStack gap="$2">
                  {APPLIES_TO_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setForm({ ...form, applies_to: opt.value })}
                      style={{ flex: 1 }}
                    >
                      <YStack
                        padding="$3"
                        borderRadius="$3"
                        backgroundColor={form.applies_to === opt.value ? '$primary' : '$backgroundSoft'}
                        alignItems="center"
                      >
                        <Text
                          fontSize="$3"
                          fontWeight="600"
                          color={form.applies_to === opt.value ? '$background' : '$color'}
                        >
                          {opt.label}
                        </Text>
                      </YStack>
                    </TouchableOpacity>
                  ))}
                </XStack>
              </YStack>

              {/* Inclusive toggle */}
              <XStack justifyContent="space-between" alignItems="center" paddingVertical="$2">
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600">Inclusive Tax</Text>
                  <Text fontSize="$2" color="$colorMuted">Tax included in item prices</Text>
                </YStack>
                <Switch
                  size="$3"
                  checked={form.is_inclusive}
                  onCheckedChange={(v) => setForm({ ...form, is_inclusive: v })}
                  backgroundColor={form.is_inclusive ? '$green9' : '$gray9'}
                >
                  <Switch.Thumb animation="quick" backgroundColor="$background" />
                </Switch>
              </XStack>

              {/* Active toggle */}
              <XStack justifyContent="space-between" alignItems="center" paddingVertical="$2">
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600">Active</Text>
                  <Text fontSize="$2" color="$colorMuted">Apply to new orders</Text>
                </YStack>
                <Switch
                  size="$3"
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  backgroundColor={form.is_active ? '$green9' : '$gray9'}
                >
                  <Switch.Thumb animation="quick" backgroundColor="$background" />
                </Switch>
              </XStack>

              <Button
                variant="primary"
                width="100%"
                marginTop="$4"
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : editingRule ? 'Update Tax Rule' : 'Create Tax Rule'}
              </Button>
            </YStack>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>

      {/* Delete Confirmation */}
      <AppAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Tax Rule"
        description={`Remove "${deleteTarget?.name || ''}" from your tax rules? It will be deactivated and no longer applied to new orders.`}
        confirmText="Delete"
        isDestructive
        onConfirm={handleDelete}
      />
    </YStack>
  );
}
