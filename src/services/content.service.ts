import { api } from "./api";
import type { PageResponse } from "@/types/content.types";

/**
 * The audience the app asks the backend for. The backend scopes a slug to an
 * audience, so each role sees its own legal pages and help centre.
 */
export type ContentAudience = "seller" | "fleet" | "rider";

export const contentService = {
  async getPage(
    slug: string,
    locale: string = "en",
    audience: string = "seller"
  ): Promise<PageResponse | null> {
    try {
      // `api.get` resolves with the response body, so the page is on
      // `res.data` — reading `res.data.data` returned undefined and every
      // page silently rendered empty.
      const res = await api.get<{ data: PageResponse }>(
        `/pages/${slug}?locale=${locale}&audience=${audience}`
      );
      return res.data ?? null;
    } catch {
      return null;
    }
  },
};
