/**
 * Lib-owned mesh crypto — re-export only.
 *
 * The formula AND its inputs live in @teincfood/core
 * (src/local-node/security.ts): business-only secret, prefix-keyed proofs.
 * This module exists so existing `./security` imports keep working; do NOT
 * add a local derivation here — any second formula is a mesh split waiting
 * to happen (see `invalid_proof` history).
 */
export { deriveLanSecret, generateNonce, computeProof } from "@teincfood/core";
