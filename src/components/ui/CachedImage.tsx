import { useState, useEffect } from "react";
import { Image } from "react-native";
import { useCachedImageUrl } from "@teincfood/core";

/**
 * `<Image>` backed by the offline-first disk cache.
 * Renders nothing while the URL is missing, so callers keep their own
 * placeholder branches for the empty case. If the resolved (cached) source
 * fails to load, falls back to the raw remote URL so the tile never stays
 * broken.
 */
interface CachedImageProps {
  source: { uri: string } | null | undefined;
  style?: any;
  resizeMode?: "cover" | "contain" | "stretch" | "repeat" | "center";
  placeholder?: React.ReactNode;
}

// A bare S3 key (e.g. menus/business/item.jpg) has no native image loader and
// would crash RN <Image>. Only feed URLs with a real scheme to the fallback.
const LOADABLE_URI_RE = /^(https?|file|data|asset|content):/i;

export function CachedImage({
  source,
  style,
  resizeMode = "cover",
  placeholder = null,
}: CachedImageProps) {
  const url = source?.uri;
  const resolved = useCachedImageUrl(url);
  const rawRemote = url && LOADABLE_URI_RE.test(url) ? url : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved, url]);

  // Prefer the durable cache, but never let a missing/broken cache entry hide
  // an otherwise valid remote image.
  const primary = failed ? rawRemote : (resolved ?? rawRemote);
  if (!primary) return <>{placeholder}</>;

  return (
    <Image
      source={{ uri: primary }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (!failed && rawRemote && primary !== rawRemote) {
          setFailed(true);
        }
      }}
    />
  );
}
