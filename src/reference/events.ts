/** Reference events shim → @teincfood/core. */
export {
  REFERENCE_CHANGED_EVENT_TYPE,
  registerReferenceEventEngine,
  registerReferenceInvalidator,
  emitReferenceChanged,
  applyReferenceChangeEvent,
  syncReferenceDataOnReconnect,
} from "@teincfood/core";
export type { ReferenceChangedEventPayload } from "@teincfood/core";