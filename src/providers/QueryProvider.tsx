import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Shared QueryClient instance with sensible defaults for mobile.
 *
 * - staleTime: 5 min — avoids excessive refetching on screen focus
 * - gcTime: 30 min — keeps unused cache longer for offline scenarios
 * - retry: 2 — retries failed requests twice before surfacing error
 */
const queryClient = new QueryClient({
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

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
