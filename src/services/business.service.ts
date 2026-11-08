import { api } from './api';
import type {
  Business,
  BusinessResponse,
  BusinessListResponse,
  BusinessMembership,
  BusinessMembershipListResponse,
  BusinessMember,
  BusinessMemberListResponse,
  OperatingHoursEntry,
  OperatingHoursResponse,
  Promo,
  PromoListResponse,
  PromoResponse,
  TaxRule,
  TaxRuleListResponse,
  TaxRuleResponse,
  BusinessMembershipResponse,
} from '@teincfood/core';

// ─── My Businesses ───

export async function fetchMyBusinesses(): Promise<BusinessListResponse> {
  return api.get<BusinessListResponse>('/businesses/me');
}

export async function fetchMyMemberships(): Promise<BusinessMembershipListResponse> {
  return api.get<BusinessMembershipListResponse>('/businesses/me/memberships');
}

export async function fetchMyBusinessMembership(businessId: string): Promise<BusinessMembershipResponse> {
  return api.get<BusinessMembershipResponse>(`/businesses/${businessId}/my-membership`);
}

// ─── Business CRUD ───

export async function fetchBusinessById(id: string): Promise<BusinessResponse> {
  return api.get<BusinessResponse>(`/businesses/${id}`);
}

export async function createBusiness(data: Record<string, unknown>): Promise<BusinessResponse> {
  return api.post<BusinessResponse>('/businesses', data);
}

export async function updateBusiness(businessId: string, data: Record<string, unknown>): Promise<BusinessResponse> {
  return api.put<BusinessResponse>(`/businesses/${businessId}`, data);
}

// ─── Payment Settings ───

export interface BusinessPaymentSettings {
  configured: boolean;
  currency?: string;
  payment_methods: string[];
  payout_method?: 'mobile_money' | 'bank' | null;
  payout_bank_name?: string | null;
  payout_bank_code?: string | null;
  payout_account_name?: string | null;
  payout_account_number?: string | null;
  payout_provider?: string | null;
  payout_momo_number?: string | null;
  payout_schedule?: string | null;
  instant_payout_enabled?: boolean;
  payout_fee_minor?: number;
  bank_payout_fee_minor?: number;
}

export interface BusinessPaymentSettingsResponse {
  data: BusinessPaymentSettings;
}

export async function fetchPaymentSettings(
  businessId: string,
): Promise<BusinessPaymentSettingsResponse> {
  return api.get<BusinessPaymentSettingsResponse>(
    `/businesses/${businessId}/payment-settings`,
  );
}

export async function updatePaymentSettings(
  businessId: string,
  data: {
    payment_methods: string[];
    payout_method?: 'mobile_money' | 'bank';
    payout_bank_name?: string;
    payout_bank_code?: string;
    payout_account_name?: string;
    payout_account_number?: string;
    payout_momo_number?: string;
    payout_provider?: string;
    payout_schedule?: string;
    instant_payout_enabled?: boolean;
  },
): Promise<BusinessPaymentSettingsResponse> {
  return api.put<BusinessPaymentSettingsResponse>(
    `/businesses/${businessId}/payment-settings`,
    data,
  );
}

// ─── Business KYC ───

export async function submitBusinessKyc(
  businessId: string,
  data: Record<string, unknown> & { user_type?: string; partial?: boolean },
): Promise<BusinessResponse> {
  return api.post<BusinessResponse>(`/businesses/${businessId}/kyc`, data);
}

// ─── Business Toggle ───

export async function toggleBusinessOpen(businessId: string): Promise<BusinessResponse> {
  return api.post<BusinessResponse>(`/businesses/${businessId}/toggle-open`);
}

// ─── Business Members ───

export async function fetchBusinessMembers(businessId: string): Promise<BusinessMemberListResponse> {
  return api.get<BusinessMemberListResponse>(`/businesses/${businessId}/members`);
}

export async function addBusinessMember(businessId: string, data: Record<string, unknown>): Promise<{ data: BusinessMember }> {
  return api.post(`/businesses/${businessId}/members`, data);
}

export async function inviteBusinessMember(businessId: string, data: Record<string, unknown>): Promise<{ data: Record<string, unknown> }> {
  return api.post(`/businesses/${businessId}/members/invite`, data);
}

export async function updateBusinessMember(businessId: string, userId: string, data: Record<string, unknown>): Promise<{ data: BusinessMember }> {
  return api.patch(`/businesses/${businessId}/members/${userId}`, data);
}

export async function removeBusinessMember(businessId: string, userId: string): Promise<void> {
  return api.delete(`/businesses/${businessId}/members/${userId}`);
}

export async function acceptBusinessInvitation(data: { code: string }): Promise<{ data: Record<string, unknown> }> {
  return api.post<{ data: Record<string, unknown> }>('/businesses/memberships/accept', data);
}

export async function declineBusinessInvitation(data: { code: string }): Promise<{ data: Record<string, unknown> }> {
  return api.post<{ data: Record<string, unknown> }>('/businesses/memberships/decline', data);
}

// ─── Business Member Invitations ───

export async function fetchBusinessMemberInvitations(businessId: string): Promise<{ data: { id: string }[] }> {
  return api.get(`/businesses/${businessId}/members/invitations`);
}

export async function revokeBusinessMemberInvitation(businessId: string, invitationId: string): Promise<{ data: unknown }> {
  return api.post(`/businesses/${businessId}/members/invitations/${invitationId}/revoke`);
}

export async function resendBusinessMemberInvitation(businessId: string, invitationId: string): Promise<{ data: unknown }> {
  return api.post(`/businesses/${businessId}/members/invitations/${invitationId}/resend`);
}

export async function deleteBusinessMemberInvitation(businessId: string, invitationId: string): Promise<{ data: { deleted: boolean } }> {
  return api.delete(`/businesses/${businessId}/members/invitations/${invitationId}`);
}

// ─── User Invitations ───

export interface UserInvitation {
  id: string;
  type: 'business_owner' | 'fleet_rider' | 'business_member' | 'rider_linked';
  status: string;
  business_name: string | null;
  business_id: string | null;
  code: string | null;
  role?: string;
  is_fleet_managed: boolean;
  created_at: string | null;
}

export async function fetchUserInvitations(): Promise<{ data: UserInvitation[] }> {
  return api.get<{ data: UserInvitation[] }>('/users/me/invitations');
}

export async function leaveBusiness(invitationId: string): Promise<{ data: { status: string } }> {
  return api.post<{ data: { status: string } }>(`/users/me/invitations/${invitationId}/leave`);
}

// ─── Operating Hours ───

export async function fetchOperatingHours(businessId: string): Promise<OperatingHoursResponse> {
  return api.get<OperatingHoursResponse>(`/businesses/${businessId}/operating-hours`);
}

export async function upsertOperatingHours(businessId: string, data: OperatingHoursEntry[]): Promise<OperatingHoursResponse> {
  return api.put<OperatingHoursResponse>(`/businesses/${businessId}/operating-hours`, { operating_hours: data });
}

// ─── Promo Codes (Seller) ───

export async function fetchBusinessPromos(businessId: string): Promise<PromoListResponse> {
  return api.get<PromoListResponse>(`/businesses/${businessId}/promos`);
}

export async function createBusinessPromo(businessId: string, data: Record<string, unknown>): Promise<PromoResponse> {
  return api.post<PromoResponse>(`/businesses/${businessId}/promos`, data);
}

export async function fetchPromo(promoId: string): Promise<PromoResponse> {
  return api.get<PromoResponse>(`/promos/${promoId}`);
}

export async function updatePromo(promoId: string, data: Record<string, unknown>): Promise<PromoResponse> {
  return api.put<PromoResponse>(`/promos/${promoId}`, data);
}

export async function deletePromo(promoId: string): Promise<void> {
  return api.delete(`/promos/${promoId}`);
}

// ─── Tax Rules ───

export async function fetchBusinessTaxRules(businessId: string): Promise<TaxRuleListResponse> {
  return api.get<TaxRuleListResponse>(`/businesses/${businessId}/tax-rules`);
}

export async function createBusinessTaxRule(businessId: string, data: Record<string, unknown>): Promise<TaxRuleResponse> {
  return api.post<TaxRuleResponse>(`/businesses/${businessId}/tax-rules`, data);
}

export async function updateTaxRule(taxRuleId: string, data: Record<string, unknown>): Promise<TaxRuleResponse> {
  return api.put<TaxRuleResponse>(`/tax-rules/${taxRuleId}`, data);
}

export async function deleteTaxRule(taxRuleId: string): Promise<void> {
  return api.delete(`/tax-rules/${taxRuleId}`);
}
