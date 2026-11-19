import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SELLER_DASHBOARD_KEYS,
  computeDashboardMetrics,
  listLocalOrders,
  usePendingOrders,
  useSellerDashboardQuery,
} from "@teincfood/core";
import type { SellerDashboardMetrics, SellerOrder } from "@teincfood/core";

export interface DashboardRecentOrder {
  id: string;
  order_number: string;
  status: string;
  total_minor: number;
  item_count: number;
}

interface DashboardData {
  metrics: SellerDashboardMetrics;
  recent_orders: DashboardRecentOrder[];
}

function orderKey(order: SellerOrder): string {
  return String(order.order_number || order.id);
}

/**
 * The core dashboard query reads SQLite for its offline branch, but when the
 * cloud looks reachable it trusts the server metrics. Server metrics can lag
 * behind a sale that is still sitting in the local outbox, so this wrapper
 * compares the local aggregate (including optimistic pending orders) with the
 * server response and keeps whichever knows about more work.
 */
function mergeLocalAndPending(
  localOrders: SellerOrder[],
  pendingOrders: SellerOrder[],
  businessId: string,
): SellerOrder[] {
  const byKey = new Map<string, SellerOrder>();
  for (const order of localOrders) byKey.set(orderKey(order), order);

  for (const pending of pendingOrders) {
    if (pending.business_id && pending.business_id !== businessId) continue;
    const key = orderKey(pending);
    const existing = byKey.get(key);
    byKey.set(key, existing ? { ...existing, ...pending } : pending);
  }

  return [...byKey.values()];
}

function toRecentOrder(order: SellerOrder): DashboardRecentOrder {
  const itemCount = Array.isArray(order.items)
    ? order.items.reduce(
        (sum, item) => sum + (item?.quantity && item.quantity > 0 ? item.quantity : 1),
        0,
      )
    : 0;

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    total_minor: order.total_minor ?? 0,
    item_count: itemCount || 1,
  };
}

function buildLocalDashboard(
  orders: SellerOrder[],
): DashboardData {
  const todayStr = new Date().toISOString().slice(0, 10);
  const metrics = computeDashboardMetrics(orders, todayStr);
  const recent_orders = [...orders]
    .sort((a, b) =>
      String(b.inserted_at ?? "").localeCompare(String(a.inserted_at ?? "")),
    )
    .slice(0, 5)
    .map(toRecentOrder);

  return { metrics, recent_orders };
}

function pickMetrics(
  local: SellerDashboardMetrics,
  remote: SellerDashboardMetrics | undefined,
): SellerDashboardMetrics {
  if (!remote) return local;

  const localIsAhead =
    local.today_orders > remote.today_orders ||
    local.pending_orders > remote.pending_orders ||
    local.active_orders > remote.active_orders ||
    local.today_revenue_minor > remote.today_revenue_minor;

  const chosen = localIsAhead ? local : remote;
  return {
    ...chosen,
    // Ratings only exist on the server aggregate.
    average_rating: remote.average_rating || chosen.average_rating,
  };
}

export function useSellerDashboardData(businessId?: string, enabled = true) {
  const core = useSellerDashboardQuery(
    businessId ?? "",
    enabled && Boolean(businessId),
  );
  const pendingOrders = usePendingOrders();

  const localQuery = useQuery({
    // Nested under the dashboard key so the existing reconciliation
    // invalidations also refresh this local aggregate.
    queryKey: [...SELLER_DASHBOARD_KEYS.all, "local", businessId],
    queryFn: async (): Promise<SellerOrder[]> => {
      const result = await listLocalOrders(businessId!, {}, 1, 200);
      return result.data ?? [];
    },
    enabled: enabled && Boolean(businessId),
    staleTime: 0,
    retry: false,
    networkMode: "offlineFirst",
  });

  const local = useMemo(
    () =>
      buildLocalDashboard(
        mergeLocalAndPending(
          localQuery.data ?? [],
          pendingOrders,
          businessId ?? "",
        ),
      ),
    [localQuery.data, pendingOrders, businessId],
  );

  const metrics = useMemo(
    () => pickMetrics(local.metrics, core.data?.metrics),
    [local.metrics, core.data?.metrics],
  );

  const recentOrders = useMemo(
    () =>
      local.recent_orders.length > 0
        ? local.recent_orders
        : (core.data?.recent_orders ?? []),
    [local.recent_orders, core.data?.recent_orders],
  );

  const refetch = useCallback(async () => {
    await Promise.all([core.refetch(), localQuery.refetch()]);
  }, [core.refetch, localQuery.refetch]);

  return {
    ...core,
    data: { metrics, recent_orders: recentOrders } as DashboardData,
    isLoading: core.isLoading || (localQuery.isLoading && !core.data),
    refetch,
  };
}
