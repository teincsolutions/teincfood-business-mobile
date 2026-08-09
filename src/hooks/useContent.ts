import { useQuery } from "@tanstack/react-query";
import { contentService } from "@/services/content.service";
import type { PageResponse } from "@/types/content.types";

export function useContent(slug: string, locale: string = "en") {
  return useQuery<PageResponse, Error>({
    queryKey: ["content", slug, locale],
    queryFn: () => contentService.getPage(slug, locale),
    staleTime: 30 * 60 * 1000,
  });
}

export function useFaqs(locale: string = "en", category?: string) {
  return useQuery<PageResponse, Error>({
    queryKey: ["faqs", locale, category],
    queryFn: () => contentService.getFaqs(locale, category),
    staleTime: 30 * 60 * 1000,
  });
}
