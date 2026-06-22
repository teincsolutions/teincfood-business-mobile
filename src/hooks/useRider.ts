import { useMutation, useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type {
  RiderMetrics,
  RiderDelivery,
  RiderDeliveryDetail,
  RiderEarnings,
  RiderTransaction,
  EarningsBreakdown,
  RiderStatistics,
  VehicleInfo,
  DeliveryZone,
  NavigationSettings,
  NavigationApp,
} from '@/types/rider.model';
import type { RiderDashboard } from '@/types/api/rider.api';
import * as riderService from '@/services/rider.service';

// Query keys
const RIDER_KEYS = {
  all: ['rider'] as const,
  profile: () => [...RIDER_KEYS.all, 'profile'] as const,
  metrics: () => [...RIDER_KEYS.all, 'metrics'] as const,
  activeDelivery: () => [...RIDER_KEYS.all, 'active-delivery'] as const,
  deliveries: () => [...RIDER_KEYS.all, 'deliveries'] as const,
  deliveryDetail: (id: string) => [...RIDER_KEYS.all, 'delivery', id] as const,
  earnings: () => [...RIDER_KEYS.all, 'earnings'] as const,
  earningsBreakdown: () => [...RIDER_KEYS.all, 'earnings-breakdown'] as const,
  transactions: () => [...RIDER_KEYS.all, 'transactions'] as const,
  statistics: () => [...RIDER_KEYS.all, 'statistics'] as const,
  vehicleInfo: () => [...RIDER_KEYS.all, 'vehicle'] as const,
  deliveryZones: () => [...RIDER_KEYS.all, 'zones'] as const,
  navigationSettings: () => [...RIDER_KEYS.all, 'navigation'] as const,
  navigationApps: () => [...RIDER_KEYS.all, 'navigation-apps'] as const,
};

// ─── Available Orders ───

export function useAvailableOrdersQuery(enabled = true) {
  return useQuery({
    queryKey: [...RIDER_KEYS.all, 'available-orders'],
    queryFn: async () => {
      const res = await riderService.fetchAvailableOrders();
      return res.data;
    },
    enabled,
    staleTime: 15000,
  });
}

export function useClaimOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => riderService.acceptDelivery(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...RIDER_KEYS.all, 'available-orders'] });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.deliveries() });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.activeDelivery() });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.metrics() });
    },
  });
}

// ─── Metrics & Dashboard Hooks ───

export function useRiderProfileQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.profile(),
    queryFn: async () => {
      const res = await riderService.fetchRiderProfile();
      return res.data;
    },
    enabled,
    staleTime: 30000,
  });
}

export function useRiderMetricsQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.metrics(),
    queryFn: async () => {
      const res = await riderService.fetchRiderDashboard();
      return res.data;
    },
    enabled,
  });
}

export function useActiveDeliveryQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.activeDelivery(),
    queryFn: async () => {
      const res = await riderService.fetchActiveDelivery();
      return res.data?.[0] ?? null;
    },
    enabled,
  });
}

// ─── Deliveries Hooks ───

export function useRiderDeliveriesQuery(enabled = true) {
  return useInfiniteQuery({
    queryKey: RIDER_KEYS.deliveries(),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await riderService.fetchRiderDeliveries(pageParam);
      return res;
    },
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination ?? {};
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    select: (data) => data.pages.flatMap(p => p.data),
    enabled,
  });
}

export function useDeliveryDetailQuery(deliveryId: string, enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.deliveryDetail(deliveryId),
    queryFn: () => riderService.fetchDeliveryDetail(deliveryId),
    enabled: enabled && Boolean(deliveryId),
  });
}

export function useUpdateDeliveryStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deliveryId, action }: { deliveryId: string; action: string }) => {
      const actions: Record<string, (id: string) => Promise<any>> = {
        'in-transit': riderService.markDeliveryInTransit,
        arrived: riderService.markDeliveryArrived,
        delivered: riderService.markDeliveryDelivered,
        failed: riderService.markDeliveryFailed,
        returned: riderService.markDeliveryReturned,
        'confirm-pickup': riderService.confirmDeliveryPickup,
        'confirm-handover': riderService.confirmDeliveryHandover,
      };
      const fn = actions[action];
      if (!fn) return Promise.reject(new Error(`Unknown action: ${action}`));
      return fn(deliveryId);
    },
    onSuccess: (_, { deliveryId }) => {
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.deliveries() });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.deliveryDetail(deliveryId) });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.activeDelivery() });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.metrics() });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.earnings() });
    },
  });
}

export function useAcceptDeliveryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => riderService.acceptDelivery(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...RIDER_KEYS.all, 'available-orders'] });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.deliveries() });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.activeDelivery() });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.metrics() });
    },
  });
}

// ─── Earnings Hooks ───

export function useRiderEarningsQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.earnings(),
    queryFn: () => riderService.fetchRiderEarnings(),
    enabled,
  });
}

export function useEarningsBreakdownQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.earningsBreakdown(),
    queryFn: () => riderService.fetchEarningsBreakdown(),
    enabled,
  });
}

export function useWalletHistoryQuery(enabled = true) {
  return useInfiniteQuery({
    queryKey: RIDER_KEYS.transactions(),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await riderService.fetchWalletHistory(pageParam);
      return res;
    },
    getNextPageParam: (lastPage) => {
      const { page, total_pages } = lastPage.pagination ?? {};
      return page < total_pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    select: (data) => data.pages.flatMap(p => p.data.entries),
    enabled,
  });
}

export function useRequestPayoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (_amount: number) => Promise.reject(new Error('Payout not implemented on backend')),
    onError: () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.earnings() });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.transactions() });
    },
  });
}

// ─── Statistics Hooks ───

export function useRiderStatisticsQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.statistics(),
    queryFn: () => riderService.fetchRiderStatistics(),
    enabled,
  });
}

// ─── Vehicle Info Hooks ───

export function useVehicleInfoQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.vehicleInfo(),
    queryFn: () => riderService.fetchVehicleInfo(),
    enabled,
  });
}

export function useCreateVehicleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleInfo: any) =>
      riderService.createVehicle(vehicleInfo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.vehicleInfo() });
    },
  });
}

// ─── Delivery Zones Hooks ───

export function useDeliveryZonesQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.deliveryZones(),
    queryFn: () => riderService.fetchDeliveryZones(),
    enabled,
  });
}

export function useUpdateDeliveryZonesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (zones: DeliveryZone[]) => riderService.updateDeliveryZones(zones),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.deliveryZones() });
    },
  });
}

export function useToggleDeliveryZoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, enabled }: { zoneId: string; enabled: boolean }) =>
      riderService.toggleDeliveryZone(zoneId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.deliveryZones() });
    },
  });
}

// ─── Navigation Settings Hooks ───

export function useNavigationSettingsQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.navigationSettings(),
    queryFn: () => riderService.fetchNavigationSettings(),
    enabled,
  });
}

export function useUpdateNavigationSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<NavigationSettings>) =>
      riderService.updateNavigationSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.navigationSettings() });
    },
  });
}

// ─── Online Status Hooks ───

export function useUpdateOnlineStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isOnline: boolean) => riderService.updateOnlineStatus(isOnline),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.profile() });
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.metrics() });
    },
  });
}

// ─── Navigation Apps Hooks ───

export function useNavigationAppsQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.navigationApps(),
    queryFn: () => riderService.fetchNavigationApps(),
    enabled,
    staleTime: Infinity, // Navigation apps list doesn't change often
  });
}

// ─── Vehicle Types Hooks ───

export function useVehicleTypesQuery(enabled = true) {
  return useQuery({
    queryKey: [...RIDER_KEYS.all, 'vehicle-types'],
    queryFn: () => riderService.fetchVehicleTypes(),
    enabled,
    staleTime: Infinity, // Vehicle types list doesn't change often
  });
}

// Export query keys for external use
export { RIDER_KEYS };
