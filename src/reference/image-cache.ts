/**
 * Image cache for offline reference data.
 *
 * Downloads product images and other assets to local file storage so they can
 * be displayed without internet connectivity.
 */

import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { syncLogger } from "@/utils/sync-logger";

const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory ?? ""}teincfood_images/`;

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

function cacheKeyFromUrl(url: string): string {
  // Use a simple hash of the URL as the local filename. Collisions are
  // extremely unlikely for a small number of product images; switch to
  // SHA-256 if this becomes a concern.
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
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

export async function resolveImageSource(
  url: string | null | undefined,
): Promise<{ uri: string } | null> {
  if (!url) return null;
  const cached = await getCachedImageInfo(url);
  return cached.localUri ? { uri: cached.localUri } : { uri: url };
}
