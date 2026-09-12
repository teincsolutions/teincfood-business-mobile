/**
 * Seller hooks — delegates to @teincfood/core for full offline support.
 * UI toast remains here; core handles outbox/queuing.
 */
export {
  useSellerOrdersQuery,
  useSellerOrderQuery,
  useAcceptOrderMutation,
  useRejectOrderMutation,
  useStartPreparingOrderMutation,
  useMarkOrderReadyMutation,
  useCompletePickupMutation,
  useCancelOrderMutation,
  useConfirmHandoverMutation,
  useAssignRiderMutation,
  useUpdateOrderStatusMutation,
  isQueuedTransition,
  SELLER_KEYS,
} from "@teincfood/core";
export { SELLER_KEYS as sellerKeys } from "@teincfood/core";

export { useBusinessDeliveriesQuery } from "@teincfood/core";
