import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
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
 */
export const queryClient = new QueryClient({
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
