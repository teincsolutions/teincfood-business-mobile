// @ts-nocheck
// Tablet permanent-drawer detail — re-uses the same single source as the
// Stack modal at `app/(seller)/orders/[id].tsx:1`. Keeping a separate file
// inside `(drawer)` avoids the "permanent drawer + modal Stack" 404 on
// tablets where `drawerType: "permanent"` (see app/(seller)/(drawer)/_layout.tsx:182).
export { default } from "../../../orders/[id]";
