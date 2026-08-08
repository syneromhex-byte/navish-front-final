import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@utils/cn';
import { Z_INDEX } from '@constants/brand';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Prevent stealing focus if an input inside the modal is already focused
    if (!dialogRef.current?.contains(document.activeElement)) {
      dialogRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: Z_INDEX.modal }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'glass-panel relative w-full rounded-2xl bg-surface-2/90 p-6 shadow-2xl outline-none',
              'max-h-[90vh] overflow-y-auto',
              SIZE_CLASSES[size],
              className,
            )}
          >
            {title && (
              <h2 id="modal-title" className="font-display text-lg font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
            <div className={cn(title || description ? 'mt-4' : undefined)}>{children}</div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-white/[0.08] hover:text-text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
