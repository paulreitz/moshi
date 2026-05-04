import { createSignal } from 'solid-js';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

const [toasts, setToasts] = createSignal<Toast[]>([]);

let toastIdCounter = 0;

export function addToast(
  message: string,
  variant: ToastVariant = 'info',
  duration: number = 5000
): string {
  const id = `toast-${++toastIdCounter}`;
  const toast: Toast = { id, message, variant, duration };

  setToasts((prev) => [...prev, toast]);

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

export function removeToast(id: string): void {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

export function clearToasts(): void {
  setToasts([]);
}

export function getToasts() {
  return toasts();
}

// Convenience functions
export const toast = {
  success: (message: string, duration?: number) => addToast(message, 'success', duration),
  error: (message: string, duration?: number) => addToast(message, 'error', duration),
  warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
  info: (message: string, duration?: number) => addToast(message, 'info', duration)
};
