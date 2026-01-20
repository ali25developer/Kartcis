import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Consistent toast notifications for MASUP.ID
 * All toasts include a "Tutup" action button by default
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action || {
        label: 'Tutup',
        onClick: () => {},
      },
    });
  },

  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action || {
        label: 'Tutup',
        onClick: () => {},
      },
    });
  },

  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action || {
        label: 'Tutup',
        onClick: () => {},
      },
    });
  },
};