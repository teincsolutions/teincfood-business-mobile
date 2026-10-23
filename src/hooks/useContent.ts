import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { contentService, type ContentAudience } from "@/services/content.service";
import { useRoleStore } from "@/stores/role.store";
import type { PageResponse } from "@/types/content.types";

/**
 * The audience this app shows content for. The business app serves three
 * roles, and each of them gets its own legal pages and help centre.
 */
export function useContentAudience(): ContentAudience {
  const role = useRoleStore((state) => state.role);

  return useMemo(() => {
    switch (role) {
      case "rider":
        return "rider";
      case "fleet_manager":
        return "fleet";
      default:
        return "seller";
    }
  }, [role]);
}

export function useContent(
  slug: string,
  locale: string = "en",
  audience?: string
) {
  const roleAudience = useContentAudience();
  const scoped = audience ?? roleAudience;

  return useQuery<PageResponse | null, Error>({
    queryKey: ["content", slug, locale, scoped],
    queryFn: () => contentService.getPage(slug, locale, scoped),
    staleTime: 30 * 60 * 1000,
  });
}
