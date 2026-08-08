import { Modal } from './Modal';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-border-strong hover:bg-white/5 active:bg-white/10 px-4 py-2 text-xs font-semibold text-text-primary transition-colors duration-200"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-semibold text-white transition-colors duration-200 ${
              isDanger
                ? 'bg-primary hover:bg-primary-hover active:bg-primary-active'
                : 'bg-white/10 hover:bg-white/20 active:bg-white/30 border border-strong'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
