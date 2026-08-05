/**
 * Offline-first image source resolution.
 *
 * Returns the durable local file path when the image has been cached (via
 * reference sync or an earlier on-demand warm), otherwise the remote URL.
 * While online, uncached images are downloaded in the background so they are
 * available the next time the device goes offline. Falls back to the remote
 * URL if the image has never been cached, so online behavior is unchanged.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnectivityStore } from "@/stores/connectivity.store";
import {
  cacheRemoteImage,
  resolveImageSource,
  stableCacheUrl,
} from "@/reference/image-cache";

const IMAGE_CACHE_KEYS = {
  all: ["cachedImage"] as const,
  url: (url: string) => ["cachedImage", url] as const,
};

export const CACHED_IMAGE_KEYS = IMAGE_CACHE_KEYS;

/** Invalidate every cached-image query (e.g. after a bulk reference sync). */
export function invalidateCachedImages(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: IMAGE_CACHE_KEYS.all });
}

/**
 * Resolve an image URL to a URI for `<Image source>`. Prefers the locally
 * cached file; falls back to the remote URL. Returns null for a null URL.
 */
export function useCachedImageUrl(url: string | null | undefined): string | null {
  const queryClient = useQueryClient();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const enabled = Boolean(url);

  const { data } = useQuery({
    queryKey: IMAGE_CACHE_KEYS.url(stableCacheUrl(url ?? "__none__")),
    queryFn: async () => {
      if (!url) return null;
      const resolved = await resolveImageSource(url);
      if (!resolved) return { uri: url };
      // Warm the cache in the background when online so the next render (or an
      // offline session) can serve the image from disk.
      if (resolved.uri === url && isOnline) {
        cacheRemoteImage(url, { skipIfCached: true })
          .then(() => {
            queryClient.invalidateQueries({
              queryKey: IMAGE_CACHE_KEYS.url(stableCacheUrl(url)),
            });
          })
          .catch(() => {
            // Cache warming is best-effort; never let it break rendering.
          });
      }
      return resolved;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  if (!enabled || !data) return null;
  return data.uri;
}
