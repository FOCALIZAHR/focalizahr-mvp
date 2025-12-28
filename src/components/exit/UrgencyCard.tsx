// src/components/exit/UrgencyCard.tsx
// 🎯 Urgencia: Tiempo + Riesgo - Presión para actuar

'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, AlertTriangle } from 'lucide-react';

interface UrgencyCardProps {
  /** Fecha límite ISO */
  dueDate: string | null;
  /** Riesgo monetario formateado */
  riskFormatted: string;
  /** Severidad: crítica, alta, media, baja */
  severity: string;
}

export default memo(function UrgencyCard({
  dueDate,
  riskFormatted,
  severity
}: UrgencyCardProps) {
  
  // Calcular tiempo restante
  const timeStatus = useMemo(() => {
    if (!dueDate) return { label: 'Sin SLA definido', urgent: false, expired: false };
    
    const diff = new Date(dueDate).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 0) {
      const absHours = Math.abs(hours);
      if (absHours < 24) {
        return { label: `Vencido hace ${absHours}h`, urgent: true, expired: true };
      }
      return { label: `Vencido hace ${Math.abs(days)}d`, urgent: true, expired: true };
    }
    
    if (hours < 6) return { label: `${hours}h restantes`, urgent: true, expired: false };
    if (hours < 24) return { label: `${hours}h restantes`, urgent: true, expired: false };
    if (days < 3) return { label: `${days}d ${hours % 24}h`, urgent: true, expired: false };
    return { label: `${days} días`, urgent: false, expired: false };
  }, [dueDate]);

  // Config por severidad
  const severityConfig = useMemo(() => {
    const configs: Record<string, { color: string; bg: string; border: string }> = {
      crítica: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
      alta: { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
      media: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
      baja: { color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30' }
    };
    return configs[severity.toLowerCase()] || configs.media;
  }, [severity]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="
        relative overflow-hidden
        bg-slate-900/40 backdrop-blur-xl
        border border-slate-700/50 rounded-xl p-5
      "
    >
      {/* Efecto decorativo */}
      <div className="absolute -bottom-16 -right-16 w-28 h-28 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative grid grid-cols-3 gap-4">
        
        {/* Tiempo */}
        <div className="text-center">
          <div className={`
            w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center
            ${timeStatus.expired ? 'bg-red-500/20' : timeStatus.urgent ? 'bg-amber-500/20' : 'bg-cyan-500/20'}
          `}>
            <Clock className={`h-5 w-5 ${
              timeStatus.expired ? 'text-red-400' : 
              timeStatus.urgent ? 'text-amber-400' : 'text-cyan-400'
            }`} />
          </div>
          <p className={`text-sm font-medium ${
            timeStatus.expired ? 'text-red-400' : 
            timeStatus.urgent ? 'text-amber-400' : 'text-white'
          }`}>
            {timeStatus.label}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">para actuar</p>
        </div>

        {/* Riesgo */}
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center bg-red-500/20">
            <DollarSign className="h-5 w-5 text-red-400" />
          </div>
          <p className="text-sm font-medium text-red-400">{riskFormatted}</p>
          <p className="text-xs text-slate-500 mt-0.5">en riesgo</p>
        </div>

        {/* Severidad */}
        <div className="text-center">
          <div className={`w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center ${severityConfig.bg}`}>
            <AlertTriangle className={`h-5 w-5 ${severityConfig.color}`} />
          </div>
          <p className={`text-sm font-medium uppercase ${severityConfig.color}`}>
            {severity}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">severidad</p>
        </div>
      </div>

      {/* Warning si está vencido */}
      {timeStatus.expired && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-red-500/20"
        >
          <p className="text-xs text-red-400 text-center">
            ⚠️ Esta alerta ha excedido el SLA. La inacción aumenta el riesgo.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
});