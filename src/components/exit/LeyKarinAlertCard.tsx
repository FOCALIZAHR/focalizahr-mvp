// src/components/exit/LeyKarinAlertCard.tsx
// ============================================================================
// CARD ESPECIAL LEY KARIN - EXIT INTELLIGENCE
// ============================================================================
// PROPÓSITO: Card con tratamiento visual especial para alertas Ley Karin
// CARACTERÍSTICAS:
// - Borde rojo permanente (border-red-500/50)
// - Badge "⚠️ LEY KARIN - ACCIÓN INMEDIATA"
// - SLA countdown usando calculateSLARemaining
// - Business case: "$35M tutela + $4M multa = $39M"
// - Textarea para notas → botón [Confirmar]
// ============================================================================

'use client';

import { memo, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Siren, 
  Clock, 
  User, 
  Building2, 
    Calendar,
    AlertTriangle,
    CheckCircle,
    Loader2,
    FileText
} from 'lucide-react';
import { ExitAlertWithRelations } from '@/types/exit';
import { StatusBadge } from '@/components/shared/intelligence/StatusBadge';
import {
    calculateSLARemaining,
    AlertStatus
} from '@/components/shared/intelligence/types';

// ============================================================================
// INTERFACE
// ============================================================================

interface LeyKarinAlertCardProps {
  alert: ExitAlertWithRelations;
  onAcknowledge: (id: string, notes?: string) => Promise<void>;
  onResolve: (id: string, notes: string) => Promise<void>;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const COSTO_TOTAL_LEY_KARIN = 39000000; // $35M tutela + $4M multa
const DEFAULT_LEY_KARIN_SLA_HOURS = 24; // SLA por defecto si no viene en el registro

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(0)}M`;
  }
  return `$${amount.toLocaleString('es-CL')}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const LeyKarinAlertCard = memo(function LeyKarinAlertCard({
  alert,
  onAcknowledge,
  onResolve
}: LeyKarinAlertCardProps) {
  
  // ========================================
  // STATE
  // ========================================
  
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  
  // ========================================
  // CÁLCULOS
  // ========================================
  
  // Convertir dueDate a string para calculateSLARemaining
  const slaInfo = useMemo(() => {
    if (!alert.dueDate) {
      return { hours: 0, isOverdue: false, label: 'Sin SLA' };
    }
    // Si es Date, convertir a ISO string
    const dueDateStr = alert.dueDate instanceof Date 
      ? alert.dueDate.toISOString() 
      : String(alert.dueDate);
    return calculateSLARemaining(dueDateStr);
  }, [alert.dueDate]);
  
  // SLA hours: usar del alert o fallback a default
  const slaHours = alert.slaHours ?? DEFAULT_LEY_KARIN_SLA_HOURS;
  
  // Cast status a AlertStatus (viene del backend con valores correctos)
  const alertStatus = alert.status as AlertStatus;
  const isResolved = alertStatus === 'resolved';
  const isAcknowledged = alertStatus === 'acknowledged';
  const isPending = alertStatus === 'pending';
  
  // ========================================
  // HANDLERS
  // ========================================
  
  const handleAcknowledge = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAcknowledge(alert.id, notes || undefined);
      setNotes('');
      setShowNotesInput(false);
    } catch (error) {
      console.error('[LeyKarinAlertCard] Error acknowledging:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [alert.id, notes, onAcknowledge, isSubmitting]);
  
  const handleResolve = useCallback(async () => {
    if (isSubmitting || !notes.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onResolve(alert.id, notes.trim());
      setNotes('');
      setShowNotesInput(false);
    } catch (error) {
      console.error('[LeyKarinAlertCard] Error resolving:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [alert.id, notes, onResolve, isSubmitting]);
  
  // ========================================
  // RENDER
  // ========================================
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-900
        border-2 border-red-500/50
        ${slaInfo.isOverdue ? 'animate-pulse' : ''}
      `}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/5 pointer-events-none" />
      
      {/* Header con badge Ley Karin */}
      <div className="relative p-4 border-b border-red-500/20">
        <div className="flex items-center justify-between">
          {/* Badge principal */}
          <motion.div
            animate={{ 
              boxShadow: ['0 0 10px rgba(239,68,68,0.3)', '0 0 20px rgba(239,68,68,0.5)', '0 0 10px rgba(239,68,68,0.3)']
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/40 rounded-full"
          >
            <Siren className="h-4 w-4 text-red-400" />
            <span className="text-sm font-semibold text-red-300 uppercase tracking-wide">
              ⚠️ LEY KARIN - ACCIÓN INMEDIATA
            </span>
          </motion.div>
          
          {/* Status badge */}
          <StatusBadge status={alertStatus} size="sm" />
        </div>
        
        {/* SLA Countdown */}
        <div className={`
          flex items-center gap-2 mt-3 px-3 py-2 rounded-lg
          ${slaInfo.isOverdue 
            ? 'bg-red-500/20 border border-red-500/30' 
            : 'bg-amber-500/10 border border-amber-500/20'
          }
        `}>
          <Clock className={`h-4 w-4 ${slaInfo.isOverdue ? 'text-red-400' : 'text-amber-400'}`} />
          <span className={`text-sm font-medium ${slaInfo.isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
            {slaInfo.label}
          </span>
          <span className="text-xs text-slate-500 ml-auto">
            SLA: {slaHours}h
          </span>
        </div>
      </div>
      
      {/* Contenido */}
      <div className="relative p-4 space-y-4">
        
        {/* Título y descripción */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-1">
            {alert.title}
          </h4>
          <p className="text-sm text-slate-400">
            {alert.description}
          </p>
        </div>
        
        {/* Info del colaborador */}
        {alert.exitRecord && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Colaborador</p>
                <p className="text-sm text-slate-300 font-medium">
                  {alert.exitRecord.nationalId}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Departamento</p>
                <p className="text-sm text-slate-300 font-medium">
                  {alert.department?.displayName || 'Sin asignar'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 col-span-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Fecha de salida</p>
                <p className="text-sm text-slate-300 font-medium">
                  {new Date(alert.exitRecord.exitDate).toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Business Case - Costo potencial */}
        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-red-400 uppercase tracking-wide font-medium">
              Riesgo Financiero
            </span>
          </div>
          <p className="text-sm text-slate-300">
            <span className="text-amber-400 font-semibold">$35M</span>
            <span className="text-slate-500"> tutela + </span>
            <span className="text-red-400 font-semibold">$4M</span>
            <span className="text-slate-500"> multa = </span>
            <span className="text-red-400 font-bold text-lg">
              {formatCurrency(COSTO_TOTAL_LEY_KARIN)}
            </span>
          </p>
        </div>
        
        {/* Notas de resolución si ya está resuelta */}
        {isResolved && alert.resolutionNotes && (
          <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 uppercase tracking-wide font-medium">
                Resolución
              </span>
            </div>
            <p className="text-sm text-slate-300">{alert.resolutionNotes}</p>
            {alert.resolvedAt && (
              <p className="text-xs text-slate-500 mt-2">
                Resuelta el {new Date(alert.resolvedAt).toLocaleDateString('es-CL')}
              </p>
            )}
          </div>
        )}
        
        {/* Área de notas y botones (si no está resuelta) */}
        {!isResolved && (
          <div className="space-y-3 pt-2 border-t border-slate-700/30">
            
            {/* Toggle para mostrar input de notas */}
            {!showNotesInput && isPending && (
              <button
                onClick={() => setShowNotesInput(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-400 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Agregar notas y gestionar
              </button>
            )}
            
            {/* Input de notas */}
            {(showNotesInput || isAcknowledged) && (
              <>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isAcknowledged 
                    ? "Describe las acciones tomadas para resolver esta alerta (obligatorio)..."
                    : "Notas sobre la gestión de esta alerta..."
                  }
                  className="w-full h-24 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 resize-none"
                />
                
                {/* Botones de acción */}
                <div className="flex gap-2">
                  {isPending && (
                    <>
                      <button
                        onClick={() => setShowNotesInput(false)}
                        className="px-4 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAcknowledge}
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-amber-500/20 border border-amber-500/30 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/30 transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Clock className="h-4 w-4" />
                            Marcar En Gestión
                          </>
                        )}
                      </button>
                    </>
                  )}
                  
                  {isAcknowledged && (
                    <button
                      onClick={handleResolve}
                      disabled={isSubmitting || !notes.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-sm font-medium text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Confirmar Resolución
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                {isAcknowledged && !notes.trim() && (
                  <p className="text-xs text-amber-400/70 text-center">
                    Las notas de resolución son obligatorias
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default LeyKarinAlertCard;