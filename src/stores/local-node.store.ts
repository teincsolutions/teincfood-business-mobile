/**
 * Local Node store — now core-owned.
 * Re-exports @teincfood/core store for compat.
 */
export type { DiscoveredNode, ConnectedClient } from "@teincfood/core";
export { localNodeStore, useLocalNodeStore } from "@teincfood/core";
