/**
 * Local Node security helpers.
 *
 * The Local Node LAN layer is protected by a shared per-business secret plus a
 * challenge-response handshake over a TLS-encrypted channel.
 *
 * The secret is derived entirely client-side from the active business (no
 * backend support): any terminal logged into the same business derives the same
 * secret; terminals logged into a different business (or not logged in at all)
 * derive a different secret and are rejected by the node.
 */

import * as Crypto from "expo-crypto";
import type { Business } from "@/types/business.model";

const LAN_SECRET_SALT = "teinc-lan";

/**
 * Normalized owner identifier.
 *
 * The active business can be either the frontend model (`ownerId`) or the raw
 * API shape (`owner_id`) depending on how the business store was populated, so
 * accept both to keep the derived secret stable across devices.
 */
function getOwnerId(
  business: Pick<Business, "id"> & Partial<Record<"ownerId" | "owner_id", string>>,
): string {
  return business.ownerId ?? (business as { owner_id?: string }).owner_id ?? "";
}

/** Derive the shared LAN secret for a business. */
export async function deriveLanSecret(
  business: Pick<Business, "id"> &
    Partial<Record<"ownerId" | "owner_id", string>>,
): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${LAN_SECRET_SALT}:${business.id}:${getOwnerId(business)}`,
  );
}

/** Generate a random nonce for the challenge-response handshake. */
export async function generateNonce(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Compute the proof for a given nonce and secret.
 *
 * Prefix-keyed SHA-256 (nonce before the secret) avoids the length-extension
 * weakness of naive `H(secret || message)` constructions.
 */
export async function computeProof(
  secret: string,
  nonce: string,
): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${nonce}:${secret}`,
  );
}
