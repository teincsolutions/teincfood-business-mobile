/**
 * Re-export core's global reconciliation (400ms Set coalesce, business_id strict).
 * Single source — no app-local duplicate.
 */
export { useSyncReconciliation } from "@teincfood/core";
