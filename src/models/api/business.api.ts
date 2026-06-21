// ─── Business ───

export interface Business {
  id: string;
  name: string;
  description: string;
  business_type: string;
  status: string;
  is_open: boolean;
  owner_id: string;
  kyc_status: string;
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

export interface OperatingHours {
  monday: DayHours | null;
  tuesday: DayHours | null;
  wednesday: DayHours | null;
  thursday: DayHours | null;
  friday: DayHours | null;
  saturday: DayHours | null;
  sunday: DayHours | null;
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
  name: string;
  rate_percent: number;
  is_active: boolean;
  business_id: string;
}

export interface TaxRuleListResponse {
  data: TaxRule[];
}

export interface TaxRuleResponse {
  data: TaxRule;
}
