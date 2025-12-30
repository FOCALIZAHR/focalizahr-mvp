// src/components/exit/ResolvedAlertDetailModal.tsx
// ============================================================================
// MODAL: Detalle de Alerta Resuelta - FocalizaHR Design System
// ============================================================================
// FILOSOFÍA: Mostrar información de resolución de forma clara y elegante
// DISEÑO: Glassmorphism, línea Tesla, mobile-first
// FIX: Bloqueo de scroll, portal rendering, centrado correcto
// ============================================================================

'use client';

import { memo, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  User, 
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============================================================================
// INTERFACES
// ============================================================================

interface ResolvedAlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: {
    id: string;
    alertType: string;
    title: string;
    description?: string;
    status: string;
    resolutionNotes: string | null;
    resolvedAt: Date | string | null;
    resolvedBy: string | null;
    acknowledgedAt: Date | string | null;
    department?: {
      displayName: string;
    };
  } | null;
}

// ============================================================================
// HELPERS
// ============================================================================

const formatDate = (date: Date | string | null): string => {
  if (!date) return 'No disponible';
  const d = new Date(date);
  return d.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'resolved':
      return { 
        label: 'Resuelta', 
        color: 'text-emerald-400', 
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        lineClass: 'fhr-top-line'
      };
    case 'acknowledged':
      return { 
        label: 'En Gestión', 
        color: 'text-amber-400', 
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        lineClass: 'fhr-top-line-purple'
      };
    default:
      return { 
        label: 'Gestionada', 
        color: 'text-slate-400', 
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/30',
        lineClass: 'fhr-top-line'
      };
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

const ResolvedAlertDetailModal = memo(function ResolvedAlertDetailModal({
  isOpen,
  onClose,
  alert
}: ResolvedAlertDetailModalProps) {
  
  const router = useRouter();
  
  const statusConfig = useMemo(() => 
    alert ? getStatusConfig(alert.status) : getStatusConfig('resolved'),
    [alert?.status]
  );
  
  // ════════════════════════════════════════════════════════════════════════
  // BLOQUEAR SCROLL DEL BODY CUANDO MODAL ESTÁ ABIERTO
  // ════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual y bloquear
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restaurar scroll al cerrar
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  // ════════════════════════════════════════════════════════════════════════
  // CERRAR CON ESCAPE
  // ════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  const handleViewDetail = () => {
    if (alert?.id) {
      router.push(`/dashboard/exit/alerts/${alert.id}`);
      onClose();
    }
  };

  // No renderizar si no está abierto o no hay alert
  if (!isOpen || !alert) return null;
  
  // ════════════════════════════════════════════════════════════════════════
  // USAR PORTAL PARA RENDERIZAR FUERA DEL ÁRBOL DOM
  // ════════════════════════════════════════════════════════════════════════
  const modalContent = (
    <div className="fixed inset-0 z-[9999]">
      {/* ════════════════════════════════════════════════════════════════
          BACKDROP
          ════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* ════════════════════════════════════════════════════════════════
          MODAL CONTAINER - Centrado con flexbox
          ════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="
            w-full max-w-md
            my-auto
            pointer-events-auto
          "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="
            relative overflow-hidden
            bg-slate-800 
            border border-slate-700/50 
            rounded-2xl 
            shadow-2xl shadow-black/50
          ">
            
            {/* ══════════════════════════════════════════════════════════
                LÍNEA TESLA - Top accent
                ══════════════════════════════════════════════════════════ */}
            <div className={statusConfig.lineClass} />
            
            {/* ══════════════════════════════════════════════════════════
                HEADER
                ══════════════════════════════════════════════════════════ */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-700/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`
                    p-2.5 rounded-xl
                    ${statusConfig.bg} ${statusConfig.border} border
                  `}>
                    <CheckCircle2 className={`w-5 h-5 ${statusConfig.color}`} strokeWidth={1.5} />
                  </div>
                  
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-white">
                      Alerta {statusConfig.label}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {alert.department?.displayName || 'Sin departamento'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="
                    p-2 -m-1
                    text-slate-400 hover:text-white 
                    hover:bg-slate-700/50 
                    rounded-lg 
                    transition-colors
                  "
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
            </div>
            
            {/* ══════════════════════════════════════════════════════════
                CONTENT
                ══════════════════════════════════════════════════════════ */}
            <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-5">
              
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">
                  Alerta Original
                </p>
                <p className="text-sm sm:text-base text-slate-200">
                  {alert.title}
                </p>
              </div>
              
              {alert.resolutionNotes && (
                <div className="
                  p-4 rounded-xl
                  bg-slate-900/50 
                  border border-slate-700/30
                ">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-cyan-400" strokeWidth={1.5} />
                    <p className="text-xs text-slate-500 uppercase tracking-wider">
                      Acción Registrada
                    </p>
                  </div>
                  <p className="text-sm sm:text-base text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {alert.resolutionNotes}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                {alert.resolvedAt && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calendar className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                    <div>
                      <p className="text-slate-500 text-xs">Resuelto</p>
                      <p className="text-slate-300">{formatDate(alert.resolvedAt)}</p>
                    </div>
                  </div>
                )}
                
                {!alert.resolvedAt && alert.acknowledgedAt && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Clock className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                    <div>
                      <p className="text-slate-500 text-xs">En gestión desde</p>
                      <p className="text-slate-300">{formatDate(alert.acknowledgedAt)}</p>
                    </div>
                  </div>
                )}
                
                {alert.resolvedBy && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <User className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                    <div>
                      <p className="text-slate-500 text-xs">Gestionado por</p>
                      <p className="text-slate-300">Usuario #{alert.resolvedBy.slice(-6)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* ══════════════════════════════════════════════════════════
                FOOTER - Acciones
                ══════════════════════════════════════════════════════════ */}
            <div className="
              px-5 py-4 sm:px-6 
              border-t border-slate-700/50
              flex flex-col sm:flex-row gap-3 sm:justify-end
            ">
              <button
                onClick={onClose}
                className="
                  w-full sm:w-auto
                  px-4 py-2.5
                  text-sm font-medium text-slate-400
                  hover:text-white hover:bg-slate-700/50
                  rounded-xl
                  transition-colors
                  order-2 sm:order-1
                "
              >
                Cerrar
              </button>
              
              <button
                onClick={handleViewDetail}
                className="
                  w-full sm:w-auto
                  px-4 py-2.5
                  text-sm font-medium
                  text-cyan-400
                  border border-cyan-500/30
                  hover:bg-cyan-500/10
                  rounded-xl
                  transition-colors
                  flex items-center justify-center gap-2
                  order-1 sm:order-2
                "
              >
                <span>Ver Detalle Completo</span>
                <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Renderizar con portal si estamos en el cliente
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
});

export default ResolvedAlertDetailModal;