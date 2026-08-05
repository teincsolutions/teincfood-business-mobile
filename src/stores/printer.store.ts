import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import { STORAGE_KEYS } from '@/utils/constants';

export interface PrinterConfig {
  id: string;
  name: string;
  ip: string;
  port: number;
  type: 'tcp' | 'bluetooth';
}

interface PrinterStore {
  defaultPrinterId: string | null;
  printers: PrinterConfig[];
  autoPrint: boolean;
  setDefaultPrinter: (id: string | null) => void;
  addPrinter: (printer: PrinterConfig) => void;
  updatePrinter: (id: string, updates: Partial<PrinterConfig>) => void;
  removePrinter: (id: string) => void;
  setAutoPrint: (enabled: boolean) => void;
}

export const usePrinterStore = create<PrinterStore>()(
  persist(
    (set) => ({
      defaultPrinterId: null,
      printers: [],
      autoPrint: false,

      setDefaultPrinter: (id) => set({ defaultPrinterId: id }),

      addPrinter: (printer) =>
        set((state) => ({ printers: [...state.printers, printer] })),

      updatePrinter: (id, updates) =>
        set((state) => ({
          printers: state.printers.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),

      removePrinter: (id) =>
        set((state) => ({
          printers: state.printers.filter((p) => p.id !== id),
          defaultPrinterId:
            state.defaultPrinterId === id ? null : state.defaultPrinterId,
        })),

      setAutoPrint: (enabled) => set({ autoPrint: enabled }),
    }),
    {
      name: STORAGE_KEYS.PRINTER_SETTINGS,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
