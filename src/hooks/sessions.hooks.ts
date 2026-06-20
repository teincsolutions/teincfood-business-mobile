/**
 * Sessions Hooks
 * TanStack Query hooks for session management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@/services/sessions.service';
import * as sessionsService from '@/services/sessions.service';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const SESSIONS_KEYS = {
  all: ['sessions'] as const,
  list: () => [...SESSIONS_KEYS.all, 'list'] as const,
};

// ─── Query Hooks ─────────────────────────────────────────────────────────────

/**
 * Fetches all active sessions with automatic refetching
 */
export function useSessionsQuery(enabled = true) {
  return useQuery({
    queryKey: SESSIONS_KEYS.list(),
    queryFn: () => sessionsService.fetchSessions(),
    enabled,
    staleTime: 30000,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

/**
 * Terminate a specific session
 */
export function useTerminateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => sessionsService.terminateSession(sessionId),

    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: SESSIONS_KEYS.list() });

      const previous = queryClient.getQueryData<Session[]>(SESSIONS_KEYS.list());

      if (previous) {
        queryClient.setQueryData<Session[]>(
          SESSIONS_KEYS.list(),
          previous.filter((s) => s.id !== sessionId)
        );
      }

      return { previous };
    },

    onError: (_err, _sessionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SESSIONS_KEYS.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEYS.list() });
    },
  });
}

/**
 * Terminate all other sessions except current
 */
export function useTerminateAllOtherSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => sessionsService.terminateAllOtherSessions(),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: SESSIONS_KEYS.list() });

      const previous = queryClient.getQueryData<Session[]>(SESSIONS_KEYS.list());

      if (previous) {
        queryClient.setQueryData<Session[]>(
          SESSIONS_KEYS.list(),
          previous.filter((s) => s.is_current)
        );
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SESSIONS_KEYS.list(), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SESSIONS_KEYS.list() });
    },
  });
}

// Export query keys for external use
export { SESSIONS_KEYS as sessionsKeys };