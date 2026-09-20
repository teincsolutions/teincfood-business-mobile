import { useMemo } from 'react';
import { useEntitlements } from './useEntitlements';
import type { FeatureKey } from '@/constants/feature-keys';

/**
 * Plan limit gate for UI actions (menu items, members, ...).
 * Returns the known numeric limit and whether `currentCount` reached it.
 * Unknown (never synced) => { limit: null, atCap: false }: the UI must not
 * block what it cannot prove — the backend (HTTP 402) stays authoritative.
 */
export function usePlanLimit(
  key: FeatureKey,
  currentCount: number,
): { limit: number | null; atCap: boolean } {
  const { data } = useEntitlements();
  return useMemo(() => {
    const raw = (data as Record<string, unknown> | null)?.[key];
    const limit = typeof raw === 'number' ? raw : null;
    return { limit, atCap: limit !== null && currentCount >= limit };
  }, [data, key, currentCount]);
}
