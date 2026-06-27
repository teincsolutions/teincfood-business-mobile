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
