import { create } from 'zustand';
import type { Toast, ToastType } from '../components/ui/Toast';

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  success: (title: string, message: string, duration?: number) => void;
  error: (title: string, message: string, duration?: number) => void;
  warning: (title: string, message: string, duration?: number) => void;
  info: (title: string, message: string, duration?: number) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: generateId() }],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  success: (title, message, duration) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: generateId(), type: 'success', title, message, duration },
      ],
    })),

  error: (title, message, duration) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: generateId(), type: 'error', title, message, duration: duration || 8000 },
      ],
    })),

  warning: (title, message, duration) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: generateId(), type: 'warning', title, message, duration },
      ],
    })),

  info: (title, message, duration) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: generateId(), type: 'info', title, message, duration },
      ],
    })),
}));

// Helper hook for components
export function useToast() {
  const store = useToastStore();
  return {
    success: store.success,
    error: store.error,
    warning: store.warning,
    info: store.info,
    addToast: store.addToast,
    removeToast: store.removeToast,
    clearToasts: store.clearToasts,
  };
}
