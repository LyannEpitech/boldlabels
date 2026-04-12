import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-green-500', icon: <CheckCircle size={20} /> },
  error: { bg: 'bg-red-500', icon: <AlertCircle size={20} /> },
  warning: { bg: 'bg-yellow-500', icon: <AlertTriangle size={20} /> },
  info: { bg: 'bg-blue-500', icon: <Info size={20} /> },
};

function ToastItem({ toast, onRemove }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 5000);
    
    return () => clearTimeout(timer);
  }, [toast, onRemove]);
  
  const style = toastStyles[toast.type];
  
  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white
        ${style.bg}
        transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      {style.icon}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onRemove(toast.id), 300);
        }}
        className="p-1 rounded hover:bg-white/20 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Global toast state
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

const notify = (type: ToastType, message: string, duration?: number) => {
  const toast: Toast = {
    id: Math.random().toString(36).substring(7),
    type,
    message,
    duration,
  };
  toasts = [...toasts, toast];
  toastListeners.forEach((listener) => listener(toasts));
};

export const toast = {
  success: (message: string, duration?: number) => notify('success', message, duration),
  error: (message: string, duration?: number) => notify('error', message, duration),
  warning: (message: string, duration?: number) => notify('warning', message, duration),
  info: (message: string, duration?: number) => notify('info', message, duration),
};

export function ToastContainer() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    const listener = (newToasts: Toast[]) => setLocalToasts(newToasts);
    toastListeners.push(listener);
    setLocalToasts(toasts);
    
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);
  
  const removeToast = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListeners.forEach((listener) => listener(toasts));
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {localToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
