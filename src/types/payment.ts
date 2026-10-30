export type MomoProvider = "mtn" | "vod" | "atl";

export interface MomoQuote {
  base_amount_minor: number;
  fee_minor: number;
  total_minor: number;
  fee_basis_points?: number;
  currency: string;
  order_id?: string;
  invoice_id?: string;
  business_id?: string;
}

export type MomoChargeStatus =
  | "initiated"
  | "pending"
  | "otp_required"
  | "success"
  | "failed"
  | "expired"
  | "abandoned";

export type MomoNextAction =
  "approve_on_phone" | "submit_otp" | "pay_offline" | null;

export interface MomoCharge {
  reference: string;
  provider: string;
  channel: string;
  purpose: string;
  status: MomoChargeStatus;
  next_action: MomoNextAction;
  display_text?: string | null;
  amount_minor: number;
  fee_minor: number;
  currency: string;
  order_id?: string | null;
  invoice_id?: string | null;
  business_id?: string | null;
  provider_code?: string | null;
  phone_last4?: string | null;
  expires_at?: string | null;
  completed_at?: string | null;
}
