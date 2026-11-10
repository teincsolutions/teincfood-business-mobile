export interface SellerSetupStatus {
  business_id: string;
  business_status: string;
  kyc_status: string;
  plan: {
    slug: string | null;
    online_orders_allowed: boolean;
  };
  operating_hours_set: boolean;
  payment_methods: string[];
  cash_enabled: boolean;
  payment_methods_set: boolean;
  menu_items_count: number;
  first_cash_order_completed: boolean;
  online_ordering_enabled: boolean;
  ready_for_online_orders: boolean;
  blockers: string[];
  checked_at: string;
}
