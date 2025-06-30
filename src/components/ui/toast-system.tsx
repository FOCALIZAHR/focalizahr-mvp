'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
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
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)]">
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
          className: 'bg-gradient-to-r from-slate-900/95 to-gray-900/95 border border-cyan-400/70 text-white backdrop-blur-md shadow-xl shadow-cyan-400/30',
          icon: <CheckCircle className="h-5 w-5 text-cyan-400" />,
          accentBorder: 'border-l-cyan-400'
        };
      case 'error':
        return {
          className: 'bg-gradient-to-r from-slate-900/95 to-gray-900/95 border border-red-400/70 text-white backdrop-blur-md shadow-xl shadow-red-400/30',
          icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
          accentBorder: 'border-l-red-400'
        };
      case 'warning':
        return {
          className: 'bg-gradient-to-r from-slate-900/95 to-gray-900/95 border border-purple-400/70 text-white backdrop-blur-md shadow-xl shadow-purple-400/30',
          icon: <AlertTriangle className="h-5 w-5 text-purple-400" />,
          accentBorder: 'border-l-purple-400'
        };
      case 'info':
        return {
          className: 'bg-gradient-to-r from-slate-900/95 to-gray-900/95 border border-cyan-400/70 text-white backdrop-blur-md shadow-xl shadow-cyan-400/30',
          icon: <Info className="h-5 w-5 text-cyan-400" />,
          accentBorder: 'border-l-cyan-400'
        };
    }
  };

  const styles = getToastStyles(toast.type);

  return (
    <div className={`${styles.className} ${styles.accentBorder} relative animate-in slide-in-from-right-full duration-500 ease-out rounded-xl p-5 border-l-4`}>
      {/* Neural glow interior */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 rounded-xl pointer-events-none" />
      
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5 p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/30">
            {styles.icon}
          </div>
          <div className="flex-1 min-w-0">
            {toast.title && (
              <div className="font-bold text-base mb-1 bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                {toast.title}
              </div>
            )}
            <div className="text-sm leading-relaxed text-white/90 font-medium">
              {/* Destacar elementos clave con colores corporativos */}
              <span dangerouslySetInnerHTML={{
                __html: toast.message
                  .replace(/"([^"]+)"/g, '<span class="text-cyan-300 font-bold">$1</span>')
                  .replace(/(\d+)\s+(participantes?)/gi, '<span class="text-purple-300 font-bold">$1 $2</span>')
                  .replace(/(activada|cancelada|cargaron|enviadas)/gi, '<span class="text-cyan-400 font-semibold">$1</span>')
              }} />
            </div>
          </div>
        </div>
        
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-all duration-200 p-2 rounded-lg hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20 group border border-transparent hover:border-cyan-400/30"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4 text-cyan-300 group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>
    </div>
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