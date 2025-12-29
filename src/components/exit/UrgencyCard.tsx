// src/components/exit/UrgencyCard.tsx
// 🎯 Urgencia: Tiempo + Riesgo + Severidad
// Filosofía v4.0: "SOLO LA BARRA HABLA"
// - La barra de progreso es el ÚNICO elemento con color de estado
// - Todo lo demás susurra en slate
// - Ya sabemos que es una alerta, no necesitamos que todo grite
// ✅ USA exitAlertConfig.ts centralizado

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Coins, Zap } from 'lucide-react';
import { getUrgencyConfig } from '@/config/exitAlertConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface UrgencyCardProps {
  /** Tipo de alerta para obtener config */
  alertType: string;
  /** Fecha límite (Date, ISO string, o null) */
  dueDate: Date | string | null;
  /** Riesgo monetario formateado */
  riskFormatted: string;
  /** Severidad: critical, high, medium, low */
  severity: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE SEVERIDAD
// ═══════════════════════════════════════════════════════════════════════════════

interface SeverityConfig {
  label: string;
  sublabel: string;
}

const SEVERITY_CONFIG: Record<string, SeverityConfig> = {
  critical: { label: 'Crítica', sublabel: 'Acción en 24h' },
  crítica: { label: 'Crítica', sublabel: 'Acción en 24h' },
  high: { label: 'Alta', sublabel: 'Acción en 48h' },
  alta: { label: 'Alta', sublabel: 'Acción en 48h' },
  medium: { label: 'Media', sublabel: 'Seguimiento' },
  media: { label: 'Media', sublabel: 'Seguimiento' },
  low: { label: 'Baja', sublabel: 'Monitoreo' },
  baja: { label: 'Baja', sublabel: 'Monitoreo' }
};

const DEFAULT_SEVERITY: SeverityConfig = {
  label: 'Media',
  sublabel: 'Seguimiento'
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Calcular estado de tiempo
// SOLO la barra tiene color, el resto es slate
// ═══════════════════════════════════════════════════════════════════════════════

interface TimeStatus {
  label: string;
  sublabel: string;
  progress: number;
  isExpired: boolean;
  progressColor: string;  // ÚNICO elemento con color de estado
}

function calculateTimeStatus(dueDate: Date | string | null): TimeStatus {
  if (!dueDate) {
    return {
      label: 'Sin plazo definido',
      sublabel: 'No hay SLA activo',
      progress: 0,
      isExpired: false,
      progressColor: 'bg-slate-600'
    };
  }

  const now = Date.now();
  const due = dueDate instanceof Date ? dueDate.getTime() : new Date(dueDate).getTime();
  const diff = due - now;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(Math.abs(hours) / 24);
  const remainingHours = Math.abs(hours) % 24;

  // VENCIDO
  if (hours < 0) {
    const overdueLabel = days > 0 
      ? `Vencido hace ${days}d`
      : `Vencido hace ${Math.abs(hours)}h`;
    
    return {
      label: overdueLabel,
      sublabel: 'SLA excedido',
      progress: 100,
      isExpired: true,
      progressColor: 'bg-red-500'  // SOLO la barra es roja
    };
  }

  // URGENTE (menos de 24h)
  if (hours < 24) {
    return {
      label: `${hours}h restantes`,
      sublabel: 'Actúa pronto',
      progress: 75 + (24 - hours),
      isExpired: false,
      progressColor: 'bg-amber-500'
    };
  }

  // EN TIEMPO (más de 24h)
  if (days < 7) {
    return {
      label: `${days}d ${remainingHours}h`,
      sublabel: 'En tiempo',
      progress: Math.min(60, days * 10),
      isExpired: false,
      progressColor: 'bg-cyan-500'
    };
  }

  // HOLGADO
  return {
    label: `${days} días`,
    sublabel: 'Sin urgencia',
    progress: 20,
    isExpired: false,
    progressColor: 'bg-emerald-500'
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function UrgencyCard({
  alertType,
  dueDate,
  riskFormatted,
  severity
}: UrgencyCardProps) {
  
  // ✅ Obtener config desde exitAlertConfig.ts
  const urgencyConfig = useMemo(() => getUrgencyConfig(alertType), [alertType]);
  
  const timeStatus = useMemo(() => calculateTimeStatus(dueDate), [dueDate]);
  const severityConfig = SEVERITY_CONFIG[severity.toLowerCase()] || DEFAULT_SEVERITY;

  // Contar cuántos elementos mostrar
  const visibleCount = [
    urgencyConfig.showSLA,
    urgencyConfig.showMonetary,
    urgencyConfig.showSeverity
  ].filter(Boolean).length;

  // Si no hay nada que mostrar, no renderizar
  if (visibleCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="
        relative overflow-hidden
        bg-slate-900/40 backdrop-blur-xl
        border border-slate-700/50 rounded-xl
      "
    >
      {/* Línea Tesla purple sutil */}
      <div className="fhr-top-line-purple opacity-40" />
      
      {/* ═══════════════════════════════════════════════════════════════════
          SECCIÓN 1: TIEMPO/SLA
          TODO en slate excepto la BARRA de progreso
          ═══════════════════════════════════════════════════════════════════ */}
      {urgencyConfig.showSLA && (
        <div className="p-4 bg-slate-800/30 border-b border-slate-700/30">
          <div className="flex items-center gap-3 mb-3">
            {/* Icono en slate - NO grita */}
            <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
              <Clock className="h-5 w-5 text-slate-400" />
            </div>
            <div className="flex-1">
              {/* Texto en slate - NO grita */}
              <p className="text-lg font-medium text-slate-200">
                {timeStatus.label}
              </p>
              <p className="text-xs font-light text-slate-500">
                {urgencyConfig.slaLabel || timeStatus.sublabel}
              </p>
            </div>
          </div>
          
          {/* ═══════════════════════════════════════════════════════════════
              LA BARRA - ÚNICO elemento que habla con color
              ═══════════════════════════════════════════════════════════════ */}
          <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, timeStatus.progress)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${timeStatus.progressColor}`}
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECCIÓN 2: RIESGO + SEVERIDAD
          TODO en slate - son DATOS, no alarmas
          ═══════════════════════════════════════════════════════════════════ */}
      {(urgencyConfig.showMonetary || urgencyConfig.showSeverity) && (
        <div className={`p-4 grid gap-3 ${
          urgencyConfig.showMonetary && urgencyConfig.showSeverity 
            ? 'grid-cols-2' 
            : 'grid-cols-1'
        }`}>
          
          {/* Riesgo Monetario */}
          {urgencyConfig.showMonetary && (
            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="flex items-center gap-2 mb-1">
                <Coins className="h-3 w-3 text-slate-500" />
                <span className="text-[10px] font-light text-slate-500 uppercase tracking-wider">
                  {urgencyConfig.monetaryLabel || 'En riesgo'}
                </span>
              </div>
              <p className="text-lg font-light text-slate-200">
                {riskFormatted}
              </p>
            </div>
          )}

          {/* Severidad */}
          {urgencyConfig.showSeverity && (
            <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-3 w-3 text-slate-500" />
                <span className="text-[10px] font-light text-slate-500 uppercase tracking-wider">
                  Severidad
                </span>
              </div>
              <p className="text-lg font-light text-slate-300">
                {severityConfig.label}
              </p>
              <p className="text-[10px] font-light text-slate-600 mt-0.5">
                {severityConfig.sublabel}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
});