import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from '@/models/rider.model';
import * as riderService from '@/services/rider.service';

// Query keys
const RIDER_KEYS = {
  all: ['rider'] as const,
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
};

// ─── Metrics & Dashboard Hooks ───

export function useRiderMetricsQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.metrics(),
    queryFn: () => riderService.fetchRiderMetrics(),
    enabled,
  });
}

export function useActiveDeliveryQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.activeDelivery(),
    queryFn: () => riderService.fetchActiveDelivery(),
    enabled,
  });
}

// ─── Deliveries Hooks ───

export function useRiderDeliveriesQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.deliveries(),
    queryFn: () => riderService.fetchRiderDeliveries(),
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
    mutationFn: ({ deliveryId, status }: { deliveryId: string; status: RiderDeliveryDetail['status'] }) =>
      riderService.updateDeliveryStatus(deliveryId, status),
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
    mutationFn: (deliveryId: string) => riderService.acceptDelivery(deliveryId),
    onSuccess: () => {
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

export function useRecentTransactionsQuery(enabled = true) {
  return useQuery({
    queryKey: RIDER_KEYS.transactions(),
    queryFn: () => riderService.fetchRecentTransactions(),
    enabled,
  });
}

export function useRequestPayoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => riderService.requestPayout(amount),
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

export function useUpdateVehicleInfoMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleInfo: Partial<VehicleInfo>) =>
      riderService.updateVehicleInfo(vehicleInfo),
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
      queryClient.invalidateQueries({ queryKey: RIDER_KEYS.metrics() });
    },
  });
}

// Export query keys for external use
export { RIDER_KEYS };