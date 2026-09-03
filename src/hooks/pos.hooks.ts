// Shim → @teincfood/core order lifecycle (offline-first, device-owned outbox)
export {
  usePOSOrdersQuery,
  usePOSOrderPreviewQuery,
  useCreatePOSOrderMutation,
  usePendingOrders,
  POS_KEYS,
  SELLER_KEYS,
} from "@teincfood/core";
