import { api } from './api';
import type {
  Business,
  BusinessResponse,
  BusinessListResponse,
  BusinessMember,
  BusinessMemberListResponse,
  OperatingHours,
  Promo,
  PromoListResponse,
  PromoResponse,
  TaxRule,
  TaxRuleListResponse,
  TaxRuleResponse,
} from '@/types/api';

// ─── My Businesses ───

export async function fetchMyBusinesses(): Promise<BusinessListResponse> {
  return api.get<BusinessListResponse>('/businesses/me');
}

export async function fetchMyMemberships(): Promise<BusinessListResponse> {
  return api.get<BusinessListResponse>('/businesses/me/memberships');
}

// ─── Business CRUD ───

export async function createBusiness(data: Record<string, unknown>): Promise<BusinessResponse> {
  return api.post<BusinessResponse>('/businesses', data);
}

export async function updateBusiness(businessId: string, data: Record<string, unknown>): Promise<BusinessResponse> {
  return api.put<BusinessResponse>(`/businesses/${businessId}`, data);
}

// ─── Business KYC ───

export async function submitBusinessKyc(businessId: string, data: Record<string, unknown>): Promise<BusinessResponse> {
  return api.post<BusinessResponse>(`/businesses/${businessId}/kyc`, data);
}

export async function fetchMyKycStatus(): Promise<{ data: { kyc_status: string } }> {
  return api.get('/kyc/status');
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

export async function acceptBusinessInvitation(data: Record<string, unknown>): Promise<{ data: Record<string, unknown> }> {
  return api.post('/businesses/memberships/accept', data);
}

// ─── Operating Hours ───

export async function fetchOperatingHours(businessId: string): Promise<{ data: OperatingHours }> {
  return api.get(`/businesses/${businessId}/operating-hours`);
}

export async function upsertOperatingHours(businessId: string, data: OperatingHours): Promise<{ data: OperatingHours }> {
  return api.put(`/businesses/${businessId}/operating-hours`, data);
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
