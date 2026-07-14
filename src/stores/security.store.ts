import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage";

interface SecurityState {
  isBiometricEnabled: boolean;
  setBiometricEnabled: (enabled: boolean) => void;
  resetSecurity: () => void;
}

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set) => ({
      isBiometricEnabled: false,
      setBiometricEnabled: (enabled) => set({ isBiometricEnabled: enabled }),
      resetSecurity: () => set({ isBiometricEnabled: false }),
    }),
    {
      name: "TeincFood Business-security",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
