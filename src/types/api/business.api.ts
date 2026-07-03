// ─── Business ───

export interface Business {
  id: string;
  name: string;
  description: string;
  type: string;
  phone: string;
  email: string;
  status: string;
  currency: string;
  is_open: boolean;
  owner_id: string;
  business_number: string;
  latitude: number;
  longitude: number;
  logo_url: string | null;
  cover_image_url: string | null;
  kyc_status: string;
  rating: number | null;
  address?: { street: string; city: string; region?: string; country?: string; latitude?: number; longitude?: number } | null;
  inserted_at: string;
  updated_at: string;
}

export interface BusinessResponse {
  data: Business;
}

export interface BusinessListResponse {
  data: Business[];
}

// ─── Business Member ───

export interface BusinessMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  inserted_at: string;
}

export interface BusinessMemberListResponse {
  data: BusinessMember[];
}

// ─── Operating Hours ───

export interface OperatingHoursEntry {
  id?: string;
  day_of_week: number; // 0=Monday, 6=Sunday
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export interface OperatingHoursResponse {
  data: OperatingHoursEntry[];
}

export interface DayHours {
  open: string;
  close: string;
}

// ─── Promo ───

export interface Promo {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_minor: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  business_id: string;
}

export interface PromoListResponse {
  data: Promo[];
}

export interface PromoResponse {
  data: Promo;
}

// ─── Tax Rule ───

export interface TaxRule {
  id: string;
  business_id: string;
  name: string;
  code: string;
  country_code: string;
  rate_basis_points: number;
  applies_to: 'subtotal' | 'subtotal_plus_delivery';
  is_inclusive: boolean;
  is_active: boolean;
  display_order: number;
  inserted_at: string;
  updated_at: string;
}

export interface TaxRuleListResponse {
  data: TaxRule[];
}

export interface TaxRuleResponse {
  data: TaxRule;
}

export interface TaxRuleRequest {
  tax_rule: {
    name: string;
    code: string;
    country_code: string;
    rate_basis_points: number;
    applies_to: 'subtotal' | 'subtotal_plus_delivery';
    is_inclusive: boolean;
    is_active: boolean;
    display_order?: number;
  };
}
