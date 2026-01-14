// ====================================================================
// ACTO 4: LA CRÓNICA DE UNA MUERTE ANUNCIADA
// src/components/exit/causes/PredictabilityTimeline.tsx
// v2.0 - Refactorizado según FILOSOFIA_DISENO_FOCALIZAHR
// ====================================================================
//
// PRINCIPIO: "Entender en 3 segundos → Decidir en 10 → Actuar en 1 clic"
//
// ESTRUCTURA:
// 1. KPI GIGANTE como protagonista (100% PREDECIBLE)
// 2. Grid de 4 métricas secundarias
// 3. Insight accionable al final
//
// ====================================================================

'use client';

import { useMemo } from 'react';
import { AlertTriangle, Bell, BellOff, CheckCircle, Lightbulb } from 'lucide-react';
import type { PredictabilityData } from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface PredictabilityTimelineProps {
  data: PredictabilityData | null;
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function PredictabilityTimeline({ data }: PredictabilityTimelineProps) {
  // Calcular insight dinámico
  const insight = useMemo(() => {
    if (!data || data.totalWithOnboarding === 0) {
      return '';
    }

    const { predictabilityRate, totalWithOnboarding, withIgnoredAlerts } = data;

    if (predictabilityRate === 100) {
      return `En TODAS las ${totalWithOnboarding} salidas con onboarding existían alertas sin gestionar. La oportunidad está en ACTUAR sobre las alertas, no en generar más datos.`;
    } else if (predictabilityRate >= 70) {
      return `${withIgnoredAlerts} de ${totalWithOnboarding} salidas tenían alertas ignoradas. El sistema alertó tempranamente en la mayoría de estos casos.`;
    } else if (predictabilityRate >= 40) {
      return `El sistema detectó alertas en ${withIgnoredAlerts} casos antes de la salida. Hay oportunidad de mejora en la gestión de alertas.`;
    } else {
      return `Solo ${withIgnoredAlerts} de ${totalWithOnboarding} salidas tenían alertas previas. El sistema de alertas podría necesitar calibración.`;
    }
  }, [data]);

  // Si no hay datos
  if (!data || data.totalWithOnboarding === 0) {
    return (
      <div className="fhr-card p-6 h-full">
        <h3 className="text-lg font-light text-white mb-4">Crónica Anunciada</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">
            No hay datos de correlación onboarding-exit disponibles
          </p>
        </div>
      </div>
    );
  }

  const {
    totalWithOnboarding,
    withIgnoredAlerts,
    predictabilityRate,
    avgIgnoredAlerts,
    avgManagedAlerts
  } = data;

  // Determinar nivel de urgencia para colores
  const isHighPredictability = predictabilityRate >= 70;
  const isMediumPredictability = predictabilityRate >= 40 && predictabilityRate < 70;

  const kpiColor = isHighPredictability
    ? 'text-red-400'
    : isMediumPredictability
    ? 'text-yellow-400'
    : 'text-green-400';

  const bgColor = isHighPredictability
    ? 'bg-red-500/10'
    : isMediumPredictability
    ? 'bg-yellow-500/10'
    : 'bg-green-500/10';

  return (
    <div className="fhr-card relative overflow-hidden h-full flex flex-col">
      {/* Línea Tesla */}
      <div className="fhr-top-line" />

      {/* Header */}
      <div className="p-6 pb-4">
        <h3 className="text-lg font-light text-white mb-1">
          Crónica Anunciada
        </h3>
        <p className="text-sm text-slate-400">
          ¿El sistema avisó y no actuamos?
        </p>
      </div>

      {/* KPI GIGANTE PROTAGONISTA */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        <div className={`
          w-full max-w-[280px] p-8 rounded-2xl text-center
          ${bgColor} border border-slate-700/30
        `}>
          {/* BIG NUMBER */}
          <div className={`text-6xl font-bold ${kpiColor} mb-2`}>
            {predictabilityRate}%
          </div>

          {/* LABEL */}
          <div className={`text-xl font-medium ${kpiColor} uppercase tracking-wider`}>
            PREDECIBLE
          </div>

          {/* Descripción breve */}
          <p className="text-xs text-slate-400 mt-3">
            de las salidas tenían alertas sin gestionar
          </p>
        </div>
      </div>

      {/* GRID DE 4 MÉTRICAS SECUNDARIAS */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Con Onboarding */}
          <div className="p-3 bg-slate-800/50 rounded-lg text-center">
            <div className="text-xl font-semibold text-white mb-1">
              {totalWithOnboarding}
            </div>
            <div className="flex items-center justify-center gap-1">
              <Bell className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-slate-400">Con Onb.</span>
            </div>
          </div>

          {/* Alertas Ignoradas */}
          <div className="p-3 bg-slate-800/50 rounded-lg text-center">
            <div className="text-xl font-semibold text-red-400 mb-1">
              {withIgnoredAlerts}
            </div>
            <div className="flex items-center justify-center gap-1">
              <BellOff className="w-3 h-3 text-red-400" />
              <span className="text-xs text-slate-400">Ignoradas</span>
            </div>
          </div>

          {/* Prom. Ignoradas */}
          <div className="p-3 bg-slate-800/50 rounded-lg text-center">
            <div className="text-xl font-semibold text-yellow-400 mb-1">
              {avgIgnoredAlerts}
            </div>
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-slate-400">Prom.Ign</span>
            </div>
          </div>

          {/* Prom. Gestionadas */}
          <div className="p-3 bg-slate-800/50 rounded-lg text-center">
            <div className="text-xl font-semibold text-green-400 mb-1">
              {avgManagedAlerts}
            </div>
            <div className="flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-xs text-slate-400">Prom.Ges</span>
            </div>
          </div>
        </div>
      </div>

      {/* INSIGHT */}
      <div className="px-6 pb-6">
        <div className={`
          p-4 rounded-xl flex items-start gap-3
          ${isHighPredictability
            ? 'bg-red-500/10 border border-red-500/20'
            : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20'
          }
        `}>
          {isHighPredictability ? (
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-sm ${isHighPredictability ? 'text-red-300' : 'text-slate-300'}`}>
            {insight}
          </p>
        </div>
      </div>
    </div>
  );
}
