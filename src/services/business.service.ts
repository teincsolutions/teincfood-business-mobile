import { api } from './api';

// ─── My Businesses ───

export async function fetchMyBusinesses(): Promise<any> {
  return api.get('/businesses/me');
}

export async function fetchMyMemberships(): Promise<any> {
  return api.get('/businesses/me/memberships');
}

// ─── Business CRUD ───

export async function createBusiness(data: any): Promise<any> {
  return api.post('/businesses', data);
}

export async function updateBusiness(businessId: string, data: any): Promise<any> {
  return api.put(`/businesses/${businessId}`, data);
}

// ─── Business KYC ───

export async function submitBusinessKyc(businessId: string, data: any): Promise<any> {
  return api.post(`/businesses/${businessId}/kyc`, data);
}

export async function fetchMyKycStatus(): Promise<any> {
  return api.get('/kyc/status');
}

// ─── Business Toggle ───

export async function toggleBusinessOpen(businessId: string): Promise<any> {
  return api.post(`/businesses/${businessId}/toggle-open`);
}

// ─── Business Members ───

export async function fetchBusinessMembers(businessId: string): Promise<any> {
  return api.get(`/businesses/${businessId}/members`);
}

export async function addBusinessMember(businessId: string, data: any): Promise<any> {
  return api.post(`/businesses/${businessId}/members`, data);
}

export async function inviteBusinessMember(businessId: string, data: any): Promise<any> {
  return api.post(`/businesses/${businessId}/members/invite`, data);
}

export async function updateBusinessMember(businessId: string, userId: string, data: any): Promise<any> {
  return api.patch(`/businesses/${businessId}/members/${userId}`, data);
}

export async function removeBusinessMember(businessId: string, userId: string): Promise<any> {
  return api.delete(`/businesses/${businessId}/members/${userId}`);
}

export async function acceptBusinessInvitation(data: any): Promise<any> {
  return api.post('/businesses/memberships/accept', data);
}

// ─── Operating Hours ───

export async function fetchOperatingHours(businessId: string): Promise<any> {
  return api.get(`/businesses/${businessId}/operating-hours`);
}

export async function upsertOperatingHours(businessId: string, data: any): Promise<any> {
  return api.put(`/businesses/${businessId}/operating-hours`, data);
}

// ─── Promo Codes (Seller) ───

export async function fetchBusinessPromos(businessId: string): Promise<any> {
  return api.get(`/businesses/${businessId}/promos`);
}

export async function createBusinessPromo(businessId: string, data: any): Promise<any> {
  return api.post(`/businesses/${businessId}/promos`, data);
}

export async function fetchPromo(promoId: string): Promise<any> {
  return api.get(`/promos/${promoId}`);
}

export async function updatePromo(promoId: string, data: any): Promise<any> {
  return api.put(`/promos/${promoId}`, data);
}

export async function deletePromo(promoId: string): Promise<any> {
  return api.delete(`/promos/${promoId}`);
}

// ─── Tax Rules ───

export async function fetchBusinessTaxRules(businessId: string): Promise<any> {
  return api.get(`/businesses/${businessId}/tax-rules`);
}

export async function createBusinessTaxRule(businessId: string, data: any): Promise<any> {
  return api.post(`/businesses/${businessId}/tax-rules`, data);
}

export async function updateTaxRule(taxRuleId: string, data: any): Promise<any> {
  return api.put(`/tax-rules/${taxRuleId}`, data);
}

export async function deleteTaxRule(taxRuleId: string): Promise<any> {
  return api.delete(`/tax-rules/${taxRuleId}`);
}
