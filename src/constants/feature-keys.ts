export type FeatureKey =
  | "seller.online_orders"
  | "seller.pos.terminal"
  | "seller.promo"
  | "limits.menu_items"
  | "limits.members"
  | "limits.terminals_linked"
  | "limits.promo_active"
  | "fleet.dispatch"
  | "limits.riders"
  | "limits.vehicles";

export const FREE_LIMITS = {
  menu_items: 3,
  members: 1,
  terminals_linked: 1,
  promo_active: 0,
} as const;
