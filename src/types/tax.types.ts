export interface TaxRuleForm {
  name: string;
  rate_percent: string;
  applies_to: 'subtotal' | 'subtotal_plus_delivery';
  is_inclusive: boolean;
  is_active: boolean;
}

export function taxRuleToForm(rule: {
  name: string;
  rate_basis_points: number;
  applies_to: 'subtotal' | 'subtotal_plus_delivery';
  is_inclusive: boolean;
  is_active: boolean;
}): TaxRuleForm {
  return {
    name: rule.name,
    rate_percent: String(rule.rate_basis_points / 100),
    applies_to: rule.applies_to,
    is_inclusive: rule.is_inclusive,
    is_active: rule.is_active,
  };
}

export const defaultTaxRuleForm: TaxRuleForm = {
  name: '',
  rate_percent: '',
  applies_to: 'subtotal',
  is_inclusive: false,
  is_active: true,
};
