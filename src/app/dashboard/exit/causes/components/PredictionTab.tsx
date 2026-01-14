// ====================================================================
// TAB 4: PREDICCIÓN - CRÓNICA ANUNCIADA
// src/app/dashboard/exit/causes/components/PredictionTab.tsx
// ====================================================================
//
// PREGUNTA: "¿El sistema avisó?"
// DISEÑO: KPI cyan grande, métricas slate, insight conclusivo
//
// ====================================================================

'use client';

import { useMemo } from 'react';
import { Bell, BellOff, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import type { PredictabilityData } from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface PredictionTabProps {
  data: PredictabilityData | null;
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function PredictionTab({ data }: PredictionTabProps) {
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
      <div className="fhr-card p-6">
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

  return (
    <div className="fhr-card relative overflow-hidden">
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

      {/* KPI PROTAGONISTA */}
      <div className="px-6 pb-6">
        <div className="p-8 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-center">
          <div className="text-6xl font-light text-cyan-400 mb-2">
            {predictabilityRate}%
          </div>
          <div className="text-xl font-medium text-cyan-300 uppercase tracking-wider mb-3">
            PREDECIBLE
          </div>
          <p className="text-sm text-slate-400">
            de las salidas tenían alertas sin gestionar
          </p>
        </div>
      </div>

      {/* GRID DE 4 MÉTRICAS */}
      <div className="px-6 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Con Onboarding */}
          <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg text-center">
            <div className="text-2xl font-light text-white mb-1">
              {totalWithOnboarding}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">Con Onb.</span>
            </div>
          </div>

          {/* Alertas Ignoradas */}
          <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg text-center">
            <div className="text-2xl font-light text-cyan-400 mb-1">
              {withIgnoredAlerts}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <BellOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">Ignoradas</span>
            </div>
          </div>

          {/* Prom. Ignoradas */}
          <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg text-center">
            <div className="text-2xl font-light text-slate-300 mb-1">
              {avgIgnoredAlerts}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">Prom. Ign</span>
            </div>
          </div>

          {/* Prom. Gestionadas */}
          <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg text-center">
            <div className="text-2xl font-light text-slate-300 mb-1">
              {avgManagedAlerts}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">Prom. Ges</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="px-6 pb-6">
        <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300">
              {insight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
