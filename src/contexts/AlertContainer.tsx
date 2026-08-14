import { useAlert } from './AlertContext';
import { AppAlertDialog } from '../components/ui/AlertDialog';

export function AlertContainer() {
  const { alertState, hideAlert } = useAlert();

  return (
    <AppAlertDialog
      open={alertState.open}
      onOpenChange={(open) => {
        if (!open) hideAlert();
      }}
      title={alertState.title}
      description={alertState.description ?? ''}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
      isDestructive={alertState.isDestructive}
      onConfirm={alertState.onConfirm ?? (() => {})}
      onCancel={alertState.onCancel}
    />
  );
}