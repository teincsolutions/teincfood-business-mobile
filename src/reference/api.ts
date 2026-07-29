/**
 * API service for reference data synchronization.
 *
 * These endpoints are expected on the backend. If they are not available,
 * the ReferenceSyncService falls back to legacy menu endpoints.
 */

import { api } from "@/services/api";
import type {
  ReferenceDataKey,
  ReferenceVersionInfo,
  ReferenceChangeSet,
} from "./types";

export async function fetchReferenceVersions(
  businessId: string,
): Promise<ReferenceVersionInfo[]> {
  return api.get<ReferenceVersionInfo[]>(
    `/businesses/${businessId}/reference-versions`,
  );
}

export async function fetchReferenceData(
  businessId: string,
  keys: ReferenceDataKey[],
): Promise<Record<ReferenceDataKey, unknown>> {
  return api.get<Record<ReferenceDataKey, unknown>>(
    `/businesses/${businessId}/reference-data`,
    { params: { keys: keys.join(",") } },
  );
}

export async function fetchReferenceChanges<T>(
  businessId: string,
  key: ReferenceDataKey,
  fromVersion: string,
): Promise<ReferenceChangeSet<T>> {
  return api.get<ReferenceChangeSet<T>>(
    `/businesses/${businessId}/reference-changes`,
    { params: { key, from_version: fromVersion } },
  );
}
