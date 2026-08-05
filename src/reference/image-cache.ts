/**
 * Image cache for offline reference data.
 *
 * Downloads product images and other assets to local file storage so they can
 * be displayed without internet connectivity.
 */

import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { syncLogger } from "@/utils/sync-logger";

// Durable cache: documentDirectory survives OS cache eviction and app restarts,
// so images remain available offline for hours/days. Pruned by
// pruneImageCache() during reference sync.
const IMAGE_CACHE_DIR = `${FileSystem.documentDirectory ?? ""}teincfood_images/`;

export interface ImageCacheEntry {
  remoteUrl: string;
  localUri: string | null;
  etag: string | null;
  lastModified: string | null;
  cachedAt: string | null;
}

export interface ImageCacheOptions {
  /**
   * If true, skip re-download if the file already exists locally.
   * ETag/last-modified checks still happen if the server supports them.
   */
  skipIfCached?: boolean;
  /** If true, delete the local file if the remote request fails (e.g. 404). */
  removeOnFailure?: boolean;
}

/**
 * Ensure the image cache directory exists.
 */
export async function ensureImageCacheDir(): Promise<string> {
  const dir = IMAGE_CACHE_DIR;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Backend serves presigned S3/MinIO URLs for images (e.g. `image_url`,
 * `logo_url`). These carry expiring `X-Amz-*` query params that change on every
 * fetch, so the raw URL is not a stable cache key. Reduce it to the stable
 * object path (origin + pathname, query/hash stripped) so the same underlying
 * object always maps to the same local file, regardless of when it was signed.
 * External CDN URLs (served as-is by the backend) keep their path; fall back to
 * the original URL if it cannot be parsed.
 */
export function stableCacheUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}

function cacheKeyFromUrl(url: string): string {
  // Use a simple hash of the stable URL as the local filename. Collisions are
  // extremely unlikely for a small number of product images; switch to
  // SHA-256 if this becomes a concern.
  let hash = 0;
  const stable = stableCacheUrl(url);
  for (let i = 0; i < stable.length; i++) {
    const char = stable.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `${Math.abs(hash).toString(16)}.img`;
}

export function getCachedImagePath(url: string): string {
  return `${IMAGE_CACHE_DIR}${cacheKeyFromUrl(url)}`;
}

export async function getCachedImageInfo(url: string): Promise<ImageCacheEntry> {
  const localPath = getCachedImagePath(url);
  const info = await FileSystem.getInfoAsync(localPath);
  return {
    remoteUrl: url,
    localUri: info.exists && !info.isDirectory ? localPath : null,
    etag: null,
    lastModified: null,
    cachedAt: info.exists ? new Date().toISOString() : null,
  };
}

export async function cacheRemoteImage(
  url: string | null | undefined,
  options: ImageCacheOptions = {},
): Promise<ImageCacheEntry | null> {
  if (!url) return null;

  // On web, FileSystem may not be available. Return the remote URL as-is.
  if (Platform.OS === "web") {
    return {
      remoteUrl: url,
      localUri: url,
      etag: null,
      lastModified: null,
      cachedAt: new Date().toISOString(),
    };
  }

  await ensureImageCacheDir();
  // Keyed by the stable (query-stripped) URL so a re-signed presigned URL
  // still resolves to the file downloaded earlier. The full `url` is kept for
  // the actual download, since only it contains the live credentials.
  const localPath = getCachedImagePath(url);
  const existing = await FileSystem.getInfoAsync(localPath);

  if (options.skipIfCached && existing.exists && !existing.isDirectory) {
    syncLogger.debug("ImageCache", "Using cached image", { url, localPath });
    return {
      remoteUrl: url,
      localUri: localPath,
      etag: null,
      lastModified: null,
      cachedAt: existing.modificationTime
        ? new Date(existing.modificationTime * 1000).toISOString()
        : new Date().toISOString(),
    };
  }

  try {
    const download = FileSystem.createDownloadResumable(
      url,
      localPath,
      { cache: false },
    );
    const result = await download.downloadAsync();
    if (result && result.status >= 200 && result.status < 300) {
      syncLogger.debug("ImageCache", "Image downloaded", { url, localPath });
      return {
        remoteUrl: url,
        localUri: localPath,
        etag: result.headers?.etag ?? null,
        lastModified: result.headers?.["last-modified"] ?? null,
        cachedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    syncLogger.warn("ImageCache", "Failed to download image", {
      url,
      error: String(error),
    });
  }

  if (options.removeOnFailure) {
    await FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {
      // ignore cleanup errors
    });
  }

  // If a stale cached file exists, return it as a graceful fallback.
  if (existing.exists && !existing.isDirectory) {
    return {
      remoteUrl: url,
      localUri: localPath,
      etag: null,
      lastModified: null,
      cachedAt: existing.modificationTime
        ? new Date(existing.modificationTime * 1000).toISOString()
        : new Date().toISOString(),
    };
  }

  return {
    remoteUrl: url,
    localUri: null,
    etag: null,
    lastModified: null,
    cachedAt: null,
  };
}

export async function cacheImageBatch(
  urls: (string | null | undefined)[],
  options: ImageCacheOptions = {},
): Promise<ImageCacheEntry[]> {
  const results = await Promise.all(
    urls.map((url) => cacheRemoteImage(url, options)),
  );
  return results.filter((r): r is ImageCacheEntry => r !== null);
}

export async function clearImageCache(): Promise<void> {
  await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
}

/**
 * Delete cached image files that are not in `knownUrls` and are older than
 * `maxAgeDays`. Filenames are a hash of the stable (query-stripped) URL, so
 * orphans are any file whose source URL is no longer referenced by the current
 * payloads (e.g. an edited/removed menu image). Recent files are kept to avoid
 * deleting images referenced by pending/queued items or other businesses.
 */
export async function pruneImageCache(
  knownUrls: Iterable<string | null | undefined>,
  maxAgeDays = 30,
): Promise<number> {
  try {
    const known = new Set<string>();
    for (const url of knownUrls) {
      if (url) known.add(url);
    }

    const dir = IMAGE_CACHE_DIR;
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists || info.isDirectory !== true) return 0;

    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    const entries = await FileSystem.readDirectoryAsync(dir);

    let pruned = 0;
    for (const fileName of entries) {
      if (!fileName.endsWith(".img")) continue;
      // Reconstruct the URL the file was keyed from — only the hash is in the
      // name, so a file is an orphan if no known URL maps to it.
      if ([...known].some((url) => getCachedImagePath(url) === `${dir}${fileName}`)) {
        continue;
      }
      const fileInfo = await FileSystem.getInfoAsync(`${dir}${fileName}`);
      if (!fileInfo.exists) continue;
      const modifiedAt = (fileInfo.modificationTime ?? 0) * 1000;
      if (modifiedAt > cutoff) continue;
      await FileSystem.deleteAsync(`${dir}${fileName}`, { idempotent: true });
      pruned += 1;
    }

    if (pruned > 0) {
      syncLogger.info("ImageCache", "Pruned orphan images", { pruned });
    }
    return pruned;
  } catch (error) {
    syncLogger.warn("ImageCache", "Failed to prune image cache", {
      error: String(error),
    });
    return 0;
  }
}

export async function resolveImageSource(
  url: string | null | undefined,
): Promise<{ uri: string } | null> {
  if (!url) return null;
  const cached = await getCachedImageInfo(url);
  return cached.localUri ? { uri: cached.localUri } : { uri: url };
}
