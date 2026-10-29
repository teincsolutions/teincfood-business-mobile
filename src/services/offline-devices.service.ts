import { api } from "./api";

export interface BusinessDeviceMember {
  user_id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  enrolled_at: string;
  last_offline_login_at: string | null;
}

export interface BusinessDevice {
  id: string;
  business_id: string;
  device_uuid: string;
  device_number: string;
  device_name: string | null;
  platform: string | null;
  os_version: string | null;
  app_version: string | null;
  online: boolean;
  license_id: string | null;
  license_status: string;
  license_issued_at: string | null;
  license_expires_at: string | null;
  max_offline_days: number | null;
  activated_at: string | null;
  last_seen: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  members: BusinessDeviceMember[];
}

export async function listBusinessDevices(
  businessId: string,
): Promise<BusinessDevice[]> {
  const response = await api.get<{ data: BusinessDevice[] }>(
    `/businesses/${businessId}/devices`,
  );
  return response.data ?? [];
}

export async function revokeBusinessDevice(
  businessId: string,
  deviceUuid: string,
  reason = "removed_by_owner",
): Promise<BusinessDevice> {
  const response = await api.post<{ data: BusinessDevice }>(
    `/businesses/${businessId}/devices/${encodeURIComponent(deviceUuid)}/revoke`,
    { reason },
  );
  return response.data;
}
