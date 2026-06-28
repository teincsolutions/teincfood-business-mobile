import React from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { mmkvStorage } from "@/utils/storage";

/**
 * Shared QueryClient instance with sensible defaults for mobile.
 *
 * - staleTime: 5 min — avoids excessive refetching on screen focus
 * - gcTime: 30 min — keeps unused cache longer for offline scenarios
 * - retry: 2 — retries failed requests twice before surfacing error
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const mmkvPersister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => mmkvStorage.getString(key) ?? null,
    setItem: (key: string, value: string) => mmkvStorage.set(key, value),
    removeItem: (key: string) => mmkvStorage.delete(key),
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: mmkvPersister,
        maxAge: 1000 * 60 * 60 * 24, // 24h
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
