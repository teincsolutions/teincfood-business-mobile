import { MutationCache, QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { toast } from "sonner-native";
import { mmkvStorage } from "@/utils/storage";

/**
 * MMKV-backed synchronous storage adapter for TanStack Query persistence.
 */
const queryCacheStorage = {
  getItem: (key: string): string | null => mmkvStorage.getString(key) ?? null,
  setItem: (key: string, value: string): void => {
    mmkvStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    mmkvStorage.delete(key);
  },
};

/**
 * Persister for React Query cache.
 *
 * Persisted cache allows the app to show previously fetched data immediately
 * after restart, even before the network is available.
 */
const queryClientPersister = createSyncStoragePersister({
  storage: queryCacheStorage,
  key: "teincfood-query-cache",
  throttleTime: 1000,
});

/**
 * Shared QueryClient instance.
 *
 * Global mutation error toast: card/kitchen/POS handlers call `.mutate()`
 * without per-call onError, so without this failures are silent. Per-call
 * onError (where provided) still runs first; this is the safety net so no
 * mutation ever fails invisibly.
 */
export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      try {
        const message = error instanceof Error ? error.message : "Something went wrong";
        toast.error(message);
      } catch {}
    },
  }),
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryClientPersister }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
