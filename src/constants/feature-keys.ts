export type FeatureKey =
  | "seller.online_orders"
  | "seller.pos.terminal"
  | "seller.promo"
  | "limits.menu_items"
  | "limits.members"
  | "limits.terminals_linked"
  | "limits.promo_active"
  | "analytics.overview"
  | "analytics.sales_trends"
  | "analytics.channel_split"
  | "analytics.teller_performance"
  | "analytics.payment_methods"
  | "analytics.order_types"
  | "analytics.hourly_heatmap"
  | "analytics.export"
  | "analytics.scheduled_reports"
  | "fleet.dispatch"
  | "limits.riders"
  | "limits.vehicles";

export const FREE_LIMITS = {
  menu_items: 5,
  members: 1,
  terminals_linked: 1,
  promo_active: 0,
} as const;
