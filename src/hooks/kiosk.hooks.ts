import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as kioskService from '@/services/kiosk.service';
import { orderRepository, orderSnapshotsService, getConnectivityState } from "@teincfood/core";
import { useBusinessStore } from '@/stores/business.store';
import { useConnectivityStore } from '@/stores/connectivity.store';
import { SELLER_KEYS } from '@/hooks/seller.hooks';
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from "@teincfood/core";
import { usePendingOrders } from "@/hooks/pending-orders.hooks";

export const KIOSK_KEYS = {
  all: ['kiosk'] as const,
  orders: (businessId?: string) => [...KIOSK_KEYS.all, 'orders', businessId] as const,
  riders: (businessId?: string) => [...KIOSK_KEYS.all, 'riders', businessId] as const,
};

function useBusinessId() {
  return useBusinessStore((s) => s.activeBusiness?.id);
}

export function useKioskOrdersQuery(enabled = true) {
  const businessId = useBusinessId();
  const pendingOrders = usePendingOrders(businessId);
  return useQuery({
    queryKey: KIOSK_KEYS.orders(businessId),
    queryFn: async () => {
      const s = getConnectivityState();
      const offline = !s.isOnline || s.isCloudReachable === "unreachable";
      if (offline) {
        const list = businessId ? await orderSnapshotsService.getSellerList(businessId, businessId) : null;
        if (list) return { data: mergeKioskPending(pendingOrders, list) } as unknown as { data: unknown[] };
        if (pendingOrders.length) return { data: pendingOrders } as unknown as { data: unknown[] };
        return { data: [] } as unknown as { data: unknown[] };
      }
      try {
        const res = await kioskService.fetchKioskOrders(businessId) as unknown as { data: unknown[] };
        if (businessId && Array.isArray(res?.data)) {
          orderSnapshotsService.persistSellerOrders(businessId, businessId, res.data as never[]).catch(() => {});
        }
        // Single source: offline db + hook merge — return with pending overlay
        const data = res?.data as unknown as never[] ?? [];
        const merged = mergeKioskPending(pendingOrders, data as never[]);
        return { data: merged } as unknown as { data: unknown[] };
      } catch (e) {
        const list = businessId ? await orderSnapshotsService.getSellerList(businessId, businessId) : null;
        if (list) return { data: mergeKioskPending(pendingOrders, list as never[]) } as unknown as { data: unknown[] };
        if (pendingOrders.length) return { data: pendingOrders } as unknown as { data: unknown[] };
        throw e;
      }
    },
    enabled,
    staleTime: 30 * 1000,
    retry: false,
    networkMode: "offlineFirst" as const,
  });
}

function mergeKioskPending(pending: unknown[], server: unknown[]): unknown[] {
  if (!pending.length) return server;
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const o of pending as Array<{ order_number: string }>) { seen.add(o.order_number); out.push(o); }
  for (const o of server as Array<{ order_number: string }>) if (!seen.has(o.order_number)) out.push(o);
  return out.sort((a: unknown, b: unknown) => String((b as { inserted_at?: string }).inserted_at ?? "").localeCompare(String((a as { inserted_at?: string }).inserted_at ?? "")));
}

export function useAvailableRidersQuery(enabled = true) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: KIOSK_KEYS.riders(businessId),
    queryFn: () => kioskService.fetchAvailableRiders(businessId),
    enabled,
    staleTime: 0,
    select: (response) =>
      (response?.data ?? []).map((rider: Record<string, any>) => ({
        id: rider.id,
        name: rider.user?.full_name || rider.rider_number || 'Rider',
        phone: rider.phone || null,
        vehicle_type: rider.vehicle?.type || null,
        rating: null,
        distance: null,
      })),
  });
}

const preSnapshotByOrder = new Map<string, { isOnline: boolean; isCloudReachable: string; navOnline: boolean | null; at: string }>();

function capturePreSnapshot(orderId: string) {
  const s = useConnectivityStore.getState();
  const snap = { isOnline: s.isOnline, isCloudReachable: s.isCloudReachable, navOnline: typeof navigator !== "undefined" ? navigator.onLine : null, at: new Date().toISOString() };
  preSnapshotByOrder.set(orderId, snap);
  return snap;
}

function logTransition(action: string, orderId: string, businessId?: string) {
  const snap = capturePreSnapshot(orderId);
  console.debug(`[kiosk] ${action}`, { orderId, businessId, ...snap });
}

function logTransitionError(action: string, error: unknown, orderId: string, businessId?: string) {
  const pre = preSnapshotByOrder.get(orderId);
  const now = useConnectivityStore.getState();
  const e = error as { status?: number; code?: string; message?: string };
  console.error(`[kiosk] ${action} failed`, {
    orderId,
    businessId,
    pre,
    now: { isOnline: now.isOnline, isCloudReachable: now.isCloudReachable, navOnline: typeof navigator !== "undefined" ? navigator.onLine : null },
    status: e?.status ?? null,
    code: (e as unknown as { code?: string })?.code ?? null,
    error,
  });
}

function isQueuedTransition(result: unknown): boolean {
  const r = result as { status?: string; command_id?: string; id?: string } | undefined;
  return r?.status === "pending" && typeof r?.command_id === "string" && !r?.id;
}

function handleTransitionSuccess(action: string, orderId: string, businessId: string | undefined, result: unknown, successMessage: string) {
  const pre = preSnapshotByOrder.get(orderId);
  const now = useConnectivityStore.getState();
  if (isQueuedTransition(result)) {
    const queued = result as { command_id?: string; status?: string };
    // pre vs now reveals the 2.5s timeout race: pre was unknown → now is unreachable, so the queued log's "unknown" was stale.
    console.warn(`[kiosk] ${action} QUEUED offline — will sync when online`, {
      orderId,
      businessId,
      queued,
      pre,
      now: { isOnline: now.isOnline, isCloudReachable: now.isCloudReachable, navOnline: typeof navigator !== "undefined" ? navigator.onLine : null },
      hint: "Check [SyncEngine] + [http]/[api] lines below for the real error (timeout, ERR_NETWORK, HTTP status, elapsed). Diagnostics → Probe Cloud shows last probe.",
    });
    toast.warning("Queued offline — will sync when online");
    return true;
  }
  console.debug(`[kiosk] ${action} onSuccess`, { orderId, businessId, pre, now: { isOnline: now.isOnline, isCloudReachable: now.isCloudReachable }, result });
  toast.success(successMessage);
  return false;
}

export function useAcceptKioskOrderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => {
      if (!businessId) throw new Error('No active business');
      logTransition('acceptOrder → sync engine', orderId, businessId);
      return orderRepository.acceptOrder({ orderId, businessId });
    },
    onSuccess: (data, orderId) => {
      const queued = handleTransitionSuccess('acceptOrder', orderId, businessId, data, 'Order accepted');
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
      if (queued) return;
    },
    onError: (error, orderId) => {
      logTransitionError('acceptOrder', error, orderId, businessId);
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export function useRejectKioskOrderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => {
      if (!businessId) throw new Error('No active business');
      logTransition('rejectOrder → sync engine', orderId, businessId);
      return orderRepository.rejectOrder({ orderId, businessId });
    },
    onSuccess: (data, orderId) => {
      const queued = handleTransitionSuccess('rejectOrder', orderId, businessId, data, 'Order rejected');
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
      if (queued) return;
    },
    onError: (error, orderId) => {
      logTransitionError('rejectOrder', error, orderId, businessId);
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export function useStartPreparingKioskOrderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => {
      if (!businessId) throw new Error('No active business');
      logTransition('startPreparingOrder → sync engine', orderId, businessId);
      return orderRepository.startPreparingOrder({ orderId, businessId });
    },
    onSuccess: (data, orderId) => {
      const queued = handleTransitionSuccess('startPreparingOrder', orderId, businessId, data, 'Preparing started');
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
      if (queued) return;
    },
    onError: (error, orderId) => {
      logTransitionError('startPreparingOrder', error, orderId, businessId);
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export function useMarkKioskOrderReadyMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => {
      if (!businessId) throw new Error('No active business');
      logTransition('markOrderReady → sync engine', orderId, businessId);
      return orderRepository.markOrderReady({ orderId, businessId });
    },
    onSuccess: (data, orderId) => {
      const queued = handleTransitionSuccess('markOrderReady', orderId, businessId, data, 'Order ready for delivery');
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
      if (queued) return;
    },
    onError: (error, orderId) => {
      logTransitionError('markOrderReady', error, orderId, businessId);
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export function useAssignRiderMutation() {
  const businessId = useBusinessId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, riderId }: { orderId: string; riderId: string }) => {
      if (!businessId) throw new Error('No active business');
      capturePreSnapshot(orderId);
      console.debug('[kiosk] assignRider → sync engine', { orderId, riderId, businessId, ...preSnapshotByOrder.get(orderId)! });
      return orderRepository.assignRider({ orderId, riderId, businessId });
    },
    onSuccess: (data, vars) => {
      const pre = preSnapshotByOrder.get(vars.orderId);
      const now = useConnectivityStore.getState();
      if (isQueuedTransition(data)) {
        console.warn('[kiosk] assignRider QUEUED offline — will sync when online', { businessId, data, pre, now: { isOnline: now.isOnline, isCloudReachable: now.isCloudReachable } });
        toast.warning('Queued offline — will sync when online');
        return;
      }
      queryClient.invalidateQueries({ queryKey: KIOSK_KEYS.orders(businessId) });
      queryClient.invalidateQueries({ queryKey: SELLER_KEYS.all });
      toast.success('Rider assigned successfully');
    },
    onError: (error) => {
      console.error('[kiosk] assignRider failed', { businessId, error });
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export { KIOSK_KEYS as kioskKeys };
