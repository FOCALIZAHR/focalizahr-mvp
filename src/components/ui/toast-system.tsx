'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
      autoClose: toast.autoClose ?? true
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (newToast.autoClose) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, title?: string) => {
    addToast({ type: 'success', message, title });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    addToast({ type: 'error', message, title, autoClose: false });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    addToast({ type: 'info', message, title });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    addToast({ type: 'warning', message, title });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{
      toasts,
      addToast,
      removeToast,
      success,
      error,
      info,
      warning
    }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          className: 'bg-green-50 border-green-200 text-green-800',
          icon: <CheckCircle className="h-4 w-4 text-green-600" />
        };
      case 'error':
        return {
          className: 'bg-red-50 border-red-200 text-red-800',
          icon: <AlertTriangle className="h-4 w-4 text-red-600" />
        };
      case 'warning':
        return {
          className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />
        };
      case 'info':
        return {
          className: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: <Info className="h-4 w-4 text-blue-600" />
        };
    }
  };

  const styles = getToastStyles(toast.type);

  return (
    <Alert className={`${styles.className} relative animate-in slide-in-from-right-full duration-300`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          {styles.icon}
          <div className="flex-1 min-w-0">
            {toast.title && (
              <div className="font-medium text-sm mb-1">{toast.title}</div>
            )}
            <AlertDescription className="text-sm leading-relaxed">
              {toast.message}
            </AlertDescription>
          </div>
        </div>
        
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity p-1 -m-1 rounded"
          aria-label="Cerrar notificación"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </Alert>
  );
}

// Hook para detectar cambios en participantes y mostrar notificaciones
export function useParticipantsNotifications(campaigns: any[]) {
  const { success } = useToast();
  const [previousCampaigns, setPreviousCampaigns] = useState<any[]>([]);

  React.useEffect(() => {
    if (previousCampaigns.length > 0 && campaigns.length > 0) {
      // Detectar campañas con participantes añadidos
      campaigns.forEach(campaign => {
        const previous = previousCampaigns.find(p => p.id === campaign.id);
        if (previous && previous.totalInvited === 0 && campaign.totalInvited > 0) {
          success(
            `Se cargaron ${campaign.totalInvited} participantes en "${campaign.name}"`,
            "¡Éxito!"
          );
        }
      });
    }
    setPreviousCampaigns(campaigns);
  }, [campaigns, previousCampaigns, success]);
}

export default ToastProvider;