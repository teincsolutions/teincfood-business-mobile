import { api } from './api';

export interface RoleCapability {
  label: string;
  capabilities: string[];
}

export interface RolesResponse {
  data: Record<string, RoleCapability>;
}

export async function fetchBusinessRoles(): Promise<RolesResponse> {
  return api.get<RolesResponse>('/businesses/roles');
}
