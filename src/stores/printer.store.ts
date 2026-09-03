/**
 * Printer store — delegates to @teincfood/core (offline, durable).
 * Preserves `usePrinterStore` hook and `getState()` for existing call sites.
 */
import { useSyncExternalStore } from "react";
import {
  getPrinterSnapshot,
  subscribePrinter,
  setDefaultPrinter as coreSetDefault,
  addPrinter as coreAdd,
  updatePrinter as coreUpdate,
  removePrinter as coreRemove,
  setAutoPrint as coreSetAuto,
  printerStore as coreStore,
} from "@teincfood/core";
import type { PrinterConfig } from "@teincfood/core";

export type { PrinterConfig };

// Ensure hydrated
let hydrated = false;
function ensureHydrated() {
  if (!hydrated) {
    hydrated = true;
    void coreStore.hydrate();
  }
}

function usePrinterStore(): {
  defaultPrinterId: string | null;
  printers: PrinterConfig[];
  autoPrint: boolean;
  setDefaultPrinter: (id: string | null) => void;
  addPrinter: (p: PrinterConfig) => void;
  updatePrinter: (id: string, u: Partial<PrinterConfig>) => void;
  removePrinter: (id: string) => void;
  setAutoPrint: (e: boolean) => void;
} {
  ensureHydrated();
  const snap = useSyncExternalStore(subscribePrinter, getPrinterSnapshot, getPrinterSnapshot);
  return {
    defaultPrinterId: snap.defaultPrinterId,
    printers: snap.printers,
    autoPrint: snap.autoPrint,
    setDefaultPrinter: coreSetDefault,
    addPrinter: coreAdd,
    updatePrinter: coreUpdate,
    removePrinter: coreRemove,
    setAutoPrint: coreSetAuto,
  };
}

// Static getState for service call sites
(usePrinterStore as unknown as { getState: () => ReturnType<typeof usePrinterStore> }).getState = () => {
  const s = getPrinterSnapshot();
  return {
    defaultPrinterId: s.defaultPrinterId,
    printers: s.printers,
    autoPrint: s.autoPrint,
    setDefaultPrinter: coreSetDefault,
    addPrinter: coreAdd,
    updatePrinter: coreUpdate,
    removePrinter: coreRemove,
    setAutoPrint: coreSetAuto,
  };
};

export { usePrinterStore };
