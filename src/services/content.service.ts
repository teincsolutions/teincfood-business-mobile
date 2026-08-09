import { api } from "./api";
import type { PageResponse } from "@/types/content.types";

export const contentService = {
  async getPage(slug: string, locale: string = "en"): Promise<PageResponse> {
    return api.get<PageResponse>(`/pages/${slug}?locale=${locale}`);
  },

  async listPages(locale: string = "en"): Promise<PageResponse[]> {
    return api.get<PageResponse[]>(`/pages?locale=${locale}`);
  },

  async getFaqs(locale: string = "en", category?: string): Promise<PageResponse> {
    const params = new URLSearchParams({ locale });
    if (category) params.append("category", category);
    return api.get<PageResponse>(`/pages/help?${params}`);
  },
};
