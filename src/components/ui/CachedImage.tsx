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

export function CachedImage({
  source,
  style,
  resizeMode = "cover",
  placeholder = null,
}: CachedImageProps) {
  const url = source?.uri;
  const resolved = useCachedImageUrl(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  if (!resolved) return <>{placeholder}</>;
  const sourceUri = failed && url ? url : resolved;
  if (!sourceUri) return <>{placeholder}</>;

  return (
    <Image
      source={{ uri: sourceUri }}
      style={style}
      resizeMode={resizeMode}
      onError={() => {
        if (!failed && url && url !== resolved) setFailed(true);
      }}
    />
  );
}
