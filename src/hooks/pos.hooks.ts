// Shim → @teincfood/core order lifecycle (offline-first, SQLite + sync_jobs)
export {
  usePOSOrdersQuery,
  usePOSOrderPreviewQuery,
  useCreatePOSOrderMutation,
  useBusinessOpenNow,
  POS_KEYS,
  SELLER_KEYS,
} from "@teincfood/core";
