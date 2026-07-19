import { useEffect } from 'react';
import { motion } from 'framer-motion';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, type, message, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-surface-2/90 border-green-500/20',
      icon: '✓',
      iconClass: 'text-green-400',
    },
    error: {
      bg: 'bg-surface-2/90 border-primary/20',
      icon: '✕',
      iconClass: 'text-primary',
    },
    info: {
      bg: 'bg-surface-2/90 border-border-strong',
      icon: 'ℹ',
      iconClass: 'text-text-secondary',
    },
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`glass-panel flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${typeConfig.bg}`}
    >
      <span className={`text-sm font-bold ${typeConfig.iconClass}`}>{typeConfig.icon}</span>
      <span className="text-sm font-medium text-text-primary">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="ml-auto text-xs text-text-tertiary hover:text-text-primary transition-colors duration-200"
      >
        ✕
      </button>
    </motion.div>
  );
}
