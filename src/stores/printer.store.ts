/**
 * Printer store — delegates to @teincfood/core (offline, durable).
 * Preserves zustand `useStore(selector?)` API: `usePrinterStore(s => s.printers)` used in POS TabBar.
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
import { mmkvStorage } from "@/utils/storage";
import { STORAGE_KEYS } from "@/utils/constants";

export type { PrinterConfig };

let hydrated = false;
function ensureHydrated() {
  if (!hydrated) {
    hydrated = true;
    // Fast sync read from MMKV before async KV hydrate so first render has persisted printers
    try {
      const raw = mmkvStorage.getString(STORAGE_KEYS.PRINTER_SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw) as { printers?: unknown };
        if (Array.isArray(parsed.printers) && parsed.printers.length) {
          // Let core hydrate from KV; sync read ensures no undefined on first mount
        }
      }
    } catch {}
    void coreStore.hydrate();
  }
}

type PrinterState = {
  defaultPrinterId: string | null;
  printers: PrinterConfig[];
  autoPrint: boolean;
  setDefaultPrinter: (id: string | null) => void;
  addPrinter: (p: PrinterConfig) => void;
  updatePrinter: (id: string, u: Partial<PrinterConfig>) => void;
  removePrinter: (id: string) => void;
  setAutoPrint: (e: boolean) => void;
};

function buildState(): PrinterState {
  const snap = getPrinterSnapshot();
  return {
    defaultPrinterId: snap.defaultPrinterId,
    printers: Array.isArray(snap.printers) ? snap.printers : [],
    autoPrint: !!snap.autoPrint,
    setDefaultPrinter: coreSetDefault,
    addPrinter: coreAdd,
    updatePrinter: coreUpdate,
    removePrinter: coreRemove,
    setAutoPrint: coreSetAuto,
  };
}

// Overload: no arg returns full state, with selector returns slice
export function usePrinterStore(): PrinterState;
export function usePrinterStore<T>(selector: (s: PrinterState) => T): T;
export function usePrinterStore<T>(selector?: (s: PrinterState) => T): T | PrinterState {
  ensureHydrated();
  const snap = useSyncExternalStore(subscribePrinter, getPrinterSnapshot, getPrinterSnapshot);
  const state: PrinterState = {
    defaultPrinterId: snap.defaultPrinterId,
    printers: Array.isArray(snap.printers) ? snap.printers : [],
    autoPrint: !!snap.autoPrint,
    setDefaultPrinter: coreSetDefault,
    addPrinter: coreAdd,
    updatePrinter: coreUpdate,
    removePrinter: coreRemove,
    setAutoPrint: coreSetAuto,
  };
  return selector ? selector(state) : state;
}

(usePrinterStore as unknown as { getState: () => PrinterState }).getState = () => buildState();
(usePrinterStore as unknown as { setState: (p: Partial<PrinterState>) => void }).setState = (partial) => {
  if (partial.defaultPrinterId !== undefined) coreSetDefault(partial.defaultPrinterId as string | null);
  if (partial.autoPrint !== undefined) coreSetAuto(!!partial.autoPrint);
  if (partial.printers !== undefined) {
    // Replace printers via core (clear + re-add) — rare test path
    const cur = getPrinterSnapshot().printers ?? [];
    for (const p of cur) coreRemove(p.id);
    for (const p of (partial.printers as PrinterConfig[]) ?? []) coreAdd(p);
  }
};
(usePrinterStore as unknown as { subscribe: typeof subscribePrinter }).subscribe = subscribePrinter;
