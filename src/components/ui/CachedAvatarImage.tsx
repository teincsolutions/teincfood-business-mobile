/**
 * Avatar.Image wrapper that resolves remote/avatar URLs through the offline
 * image cache first. Drop-in for `<Avatar.Image src={...} />`. Renders the
 * local durable file when cached, otherwise the remote URL — so this can be
 * used freely inside `.map()` loops.
 */

import { Avatar } from "tamagui";
import { useCachedImageUrl } from "@teincfood/core";

type AvatarImageProps = React.ComponentProps<typeof Avatar.Image> & {
  src?: string | null;
};

export function CachedAvatarImage({ src, ...rest }: AvatarImageProps) {
  const uri = useCachedImageUrl(src);
  return <Avatar.Image src={uri ?? undefined} {...rest} />;
}