import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AlertOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  alertState: AlertOptions & { open: boolean };
}

const AlertContext = createContext<AlertContextType | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertOptions & { open: boolean }>({
    open: false,
    title: '',
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({ ...options, open: true });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, alertState }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}