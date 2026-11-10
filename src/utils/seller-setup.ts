import type { User } from "@/types/user.model";

interface BusinessOwnerFields {
  ownerId?: string | null;
  owner_id?: string | null;
}

/** Newly created businesses are stored with `ownerId`; server payloads use
 * `owner_id`. Treat either as the owner check. */
export function isBusinessOwner(
  business: BusinessOwnerFields | null | undefined,
  user: User | null | undefined,
): boolean {
  if (!business || !user?.id) return false;
  const ownerId = business.owner_id ?? business.ownerId;
  return ownerId === user.id;
}
