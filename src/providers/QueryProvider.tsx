import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { toast } from "sonner-native";
import { mmkvStorage } from "@/utils/storage";
import { createAppQueryClient, createQueryPersister } from "@teincfood/core";

/**
 * Persister for React Query cache (core factory over MMKV).
 *
 * Persisted cache allows the app to show previously fetched data immediately
 * after restart, even before the network is available.
 */
const queryClientPersister = createQueryPersister({
  getItem: (key: string): string | null => mmkvStorage.getString(key) ?? null,
  setItem: (key: string, value: string): void => {
    mmkvStorage.set(key, value);
  },
  removeItem: (key: string): void => {
    mmkvStorage.delete(key);
  },
});

/**
 * Shared QueryClient instance (core factory).
 *
 * Global mutation error toast: card/kitchen/POS handlers call `.mutate()`
 * without per-call onError, so without this failures are silent. Per-call
 * onError (where provided) still runs first; this is the safety net so no
 * mutation ever fails invisibly.
 */
export const queryClient = createAppQueryClient((message) => toast.error(message));

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
