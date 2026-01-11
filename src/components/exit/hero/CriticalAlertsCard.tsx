// ====================================================================
// CRITICAL ALERTS CARD - Exit Intelligence
// src/components/exit/hero/CriticalAlertsCard.tsx
//
// Filosofía: Número gigante de alertas críticas estilo AlertsMoneyWall
// Diseño: Glassmorphism + Tesla line + gradiente rojo/naranja
// ====================================================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Scale, Skull, ArrowRight, Clock } from 'lucide-react';

// ====================================================================
// INTERFACES
// ====================================================================

interface CriticalAlertsCardProps {
  /** Número de alertas críticas (Ley Karin + Exit Tóxico) */
  criticalCount: number;
  /** Total de alertas pendientes */
  pendingCount: number;
  /** Alertas Ley Karin pendientes (SLA 24h) */
  leyKarinCount?: number;
  /** Alertas Exit Tóxico pendientes (SLA 48h) */
  toxicCount?: number;
  /** Alertas que vencen en menos de 7 días */
  slaExpiringCount?: number;
  /** Callback para navegar al centro de alertas */
  onViewAlerts: () => void;
}

// ====================================================================
// COMPONENT
// ====================================================================

export default memo(function CriticalAlertsCard({
  criticalCount,
  pendingCount,
  leyKarinCount = 0,
  toxicCount = 0,
  slaExpiringCount = 0,
  onViewAlerts
}: CriticalAlertsCardProps) {

  const hasCritical = criticalCount > 0;
  const hasAnyPending = pendingCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
      {/* ══════════════════════════════════════════════════════════════
          TESLA LINE - Línea superior con gradiente
          Rojo si hay alertas críticas, cyan si todo está bien
         ══════════════════════════════════════════════════════════════ */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: hasCritical
            ? 'linear-gradient(90deg, transparent, #EF4444, #F59E0B, #EF4444, transparent)'
            : hasAnyPending
              ? 'linear-gradient(90deg, transparent, #F59E0B, transparent)'
              : 'linear-gradient(90deg, transparent, #22D3EE, transparent)'
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          CARD GLASSMORPHISM
         ══════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 md:p-8">

        {/* ════════════════════════════════════════════════════════════
            HEADER
           ════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className={`w-5 h-5 ${
            hasCritical ? 'text-red-400' :
            hasAnyPending ? 'text-amber-400' :
            'text-cyan-400'
          }`} />
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
            Alertas Críticas
          </span>
        </div>

        {/* ════════════════════════════════════════════════════════════
            NÚMERO GIGANTE - El protagonista
           ════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <span className={`text-7xl sm:text-8xl font-bold tracking-tight text-transparent bg-clip-text ${
            hasCritical
              ? 'bg-gradient-to-r from-red-400 via-orange-400 to-red-500'
              : hasAnyPending
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
                : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
          }`}>
            {criticalCount}
          </span>
          <p className="text-slate-400 mt-2 text-lg">
            {hasCritical
              ? 'requieren acción inmediata'
              : hasAnyPending
                ? 'sin alertas críticas'
                : 'sin alertas pendientes'}
          </p>
        </motion.div>

        {/* ════════════════════════════════════════════════════════════
            BREAKDOWN POR TIPO (Solo si hay alertas críticas)
           ════════════════════════════════════════════════════════════ */}
        {hasCritical && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-800/30 rounded-xl"
          >
            {/* Ley Karin */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Scale className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white tabular-nums">{leyKarinCount}</p>
                <p className="text-xs text-slate-500">Ley Karin (24h)</p>
              </div>
            </div>

            {/* Exit Tóxico */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Skull className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white tabular-nums">{toxicCount}</p>
                <p className="text-xs text-slate-500">Exit Tóxico (48h)</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════
            SLA WARNING (Si hay alertas por vencer)
           ════════════════════════════════════════════════════════════ */}
        {slaExpiringCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 mb-6 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-sm text-amber-400">
              {slaExpiringCount} alerta{slaExpiringCount !== 1 ? 's' : ''} vence{slaExpiringCount === 1 ? '' : 'n'} en &lt;7 días
            </span>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PENDING COUNT (Si hay pendientes pero no críticas)
           ════════════════════════════════════════════════════════════ */}
        {!hasCritical && hasAnyPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mb-6 text-slate-400"
          >
            <span className="text-sm">
              {pendingCount} alerta{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de menor severidad
            </span>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════
            CTA BUTTON
           ════════════════════════════════════════════════════════════ */}
        <motion.button
          onClick={onViewAlerts}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            hasCritical
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
              : hasAnyPending
                ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30'
                : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
          }`}
        >
          Ver Centro de Alertas
          <ArrowRight className="w-4 h-4" />
        </motion.button>

      </div>
    </motion.div>
  );
});
