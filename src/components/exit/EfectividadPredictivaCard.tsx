// ====================================================================
// EFECTIVIDAD PREDICTIVA CARD v4.0 - Optimizado Mobile-First
// src/components/exit/EfectividadPredictivaCard.tsx
// ====================================================================
// OPTIMIZACIONES:
// - Padding reducido: p-6 → p-4 mobile, p-5 desktop
// - Layout más horizontal en desktop
// - Número + badge en línea compacta
// - Altura balanceada con card hermana
// ====================================================================

'use client';

import { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  AlertTriangle,
  TrendingDown,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { useOnboardingCorrelation } from '@/hooks/useOnboardingCorrelation';
import FocalizaIntelligenceModal from '@/components/ui/FocalizaIntelligenceModal';
import { formatCurrencyCLP } from '@/lib/financialCalculations';

// ====================================================================
// TYPES
// ====================================================================

interface EfectividadPredictivaCardProps {
  viewMode?: 'gerencias' | 'departamentos';
  scope?: 'company' | 'filtered';
  parentDepartmentId?: string;
}

// ====================================================================
// HELPERS
// ====================================================================

function getConservationConfig(index: number | null): {
  label: string;
  insight: string;
  color: string;
} {
  if (index === null) {
    return { label: 'N/A', insight: 'Datos insuficientes', color: 'text-slate-500' };
  }
  if (index >= 80) {
    return { label: 'Alto', insight: 'Percepción estable', color: 'text-emerald-400' };
  }
  if (index >= 60) {
    return { label: 'Medio', insight: 'Percepción moderada', color: 'text-cyan-400' };
  }
  if (index >= 40) {
    return { label: 'Bajo', insight: 'Percepción deteriorada', color: 'text-amber-400' };
  }
  return { label: 'Crítico', insight: 'Percepción degradada', color: 'text-red-400' };
}

// ====================================================================
// LOADING STATE
// ====================================================================

function LoadingSkeleton() {
  return (
    <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      <div className="p-4 sm:p-5 animate-pulse space-y-3">
        <div className="flex justify-between">
          <div className="h-2.5 w-32 bg-slate-700/50 rounded" />
          <div className="h-4 w-4 bg-slate-700/50 rounded" />
        </div>
        <div className="flex items-baseline gap-2">
          <div className="h-8 w-16 bg-slate-700/50 rounded" />
          <div className="h-4 w-12 bg-slate-700/50 rounded" />
        </div>
        <div className="h-3 w-28 bg-slate-700/50 rounded" />
        <div className="h-px bg-slate-700/30" />
        <div className="h-4 w-40 bg-slate-700/50 rounded" />
      </div>
    </div>
  );
}

// ====================================================================
// MAIN COMPONENT
// ====================================================================

export const EfectividadPredictivaCard = memo(function EfectividadPredictivaCard({
  viewMode = 'gerencias',
  scope = 'filtered',
  parentDepartmentId
}: EfectividadPredictivaCardProps) {

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = useOnboardingCorrelation({
    scope,
    departmentId: parentDepartmentId
  });

  const config = useMemo(() => {
    return getConservationConfig(data?.conservationIndex ?? null);
  }, [data?.conservationIndex]);

  const evitablesCount = useMemo(() => data?.exitsWithIgnoredAlerts ?? 0, [data]);
  const hasEvitables = evitablesCount > 0;

  // Modal sections
  const modalSections = useMemo(() => {
    if (!data) return [];

    return [
      {
        id: 'metricas',
        title: 'Métricas de Correlación',
        content: (
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-slate-400">Conservation Index</span>
              <span className={`text-lg font-extralight ${config.color}`}>
                {data.conservationIndex !== null ? `${data.conservationIndex}%` : '—'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
              <span className="text-sm text-slate-400">Alert Prediction Rate</span>
              <span className="text-lg font-extralight text-slate-200">{data.alertPredictionRate}%</span>
            </div>
          </div>
        )
      },
      {
        id: 'desglose',
        title: 'Desglose de Salidas',
        content: (
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center p-3 bg-slate-800/30 rounded-lg">
              <p className="text-2xl font-extralight text-white">{data.exitsThisMonth}</p>
              <p className="text-[10px] text-slate-500 uppercase">Total</p>
            </div>
            <div className="text-center p-3 bg-slate-800/30 rounded-lg">
              <p className="text-2xl font-extralight text-cyan-400">{data.withOnboarding}</p>
              <p className="text-[10px] text-slate-500 uppercase">Con onboarding</p>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <p className="text-2xl font-extralight text-red-400">{data.totalIgnoredAlerts}</p>
              <p className="text-[10px] text-slate-500 uppercase">Ignoradas</p>
            </div>
            <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <p className="text-2xl font-extralight text-emerald-400">{data.totalManagedAlerts}</p>
              <p className="text-[10px] text-slate-500 uppercase">Gestionadas</p>
            </div>
          </div>
        )
      },
      {
        id: 'costo',
        title: 'Costo Evitable',
        content: (
          <div className="text-center py-4">
            <p className="text-3xl font-extralight text-red-400">{formatCurrencyCLP(data.avoidableCost)}</p>
            <p className="text-xs text-slate-500 mt-2">Costo de {evitablesCount} salidas evitables</p>
            <p className="text-[10px] text-slate-600 mt-2">SHRM 2024 · 125% salario anual</p>
          </div>
        )
      },
      ...(data.cases.length > 0 ? [{
        id: 'casos',
        title: `Casos por ${viewMode === 'gerencias' ? 'Gerencia' : 'Departamento'}`,
        content: (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {data.cases.map((c) => (
              <div key={c.departmentId} className="flex justify-between items-center p-2 bg-slate-800/20 rounded-lg">
                <div>
                  <p className="text-sm text-slate-200">{viewMode === 'gerencias' ? c.gerenciaName || c.departmentName : c.departmentName}</p>
                  <p className="text-[10px] text-slate-500">{c.exitsWithIgnoredAlertsCount} evitables</p>
                </div>
                <p className="text-sm text-red-400">{formatCurrencyCLP(c.cost)}</p>
              </div>
            ))}
          </div>
        )
      }] : [])
    ];
  }, [data, config, evitablesCount, viewMode]);

  if (isLoading) return <LoadingSkeleton />;

  if (error || !data) {
    return (
      <div className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-2 text-slate-500">
          <AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
          <span className="text-xs font-light">Sin datos de correlación</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-xl overflow-hidden cursor-pointer group"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Línea Tesla */}
        <div 
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)' }}
        />

        {/* Hover border */}
        <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-cyan-500/20 transition-colors pointer-events-none" />

        {/* ════════════════════════════════════════════════════
            CONTENIDO - Compacto mobile-first
           ════════════════════════════════════════════════════ */}
        <div className="p-4 sm:p-5">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-3.5 w-3.5 text-cyan-400/70" strokeWidth={1.5} />
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                Efectividad Predictiva
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" strokeWidth={1.5} />
          </div>

          {/* Número protagonista - Compacto */}
          <div className="mb-3">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl sm:text-4xl font-extralight tabular-nums ${config.color}`}>
                {data.conservationIndex !== null ? data.conservationIndex : '—'}
              </span>
              {data.conservationIndex !== null && (
                <span className="text-sm sm:text-base text-slate-600 font-extralight">%</span>
              )}
              <span className={`text-[10px] ml-1 ${config.color}`}>{config.label}</span>
            </div>
            <p className="text-xs text-slate-500 font-light mt-0.5">{config.insight}</p>
          </div>

          {/* Separador */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent mb-3" />

          {/* Evitables */}
          {hasEvitables ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-3.5 w-3.5 text-red-400/80" strokeWidth={1.5} />
                <p className="text-xs sm:text-sm text-slate-400">
                  <span className="text-red-400">{evitablesCount}</span>
                  <span className="text-slate-600"> de </span>
                  <span className="text-slate-300">{data.exitsThisMonth}</span>
                  <span className="text-slate-600"> eran </span>
                  <span className="text-red-400">evitables</span>
                </p>
              </div>
              {data.avoidableCost > 0 && (
                <p className="text-[11px] text-slate-500 pl-5">
                  {formatCurrencyCLP(data.avoidableCost)} en costo evitable
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400/80" strokeWidth={1.5} />
              <p className="text-xs sm:text-sm text-slate-500 font-light">
                {data.exitsThisMonth > 0 ? `${data.exitsThisMonth} salidas · Sin evitables` : 'Sin salidas'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal */}
      <FocalizaIntelligenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityName="Correlación Onboarding-Exit"
        entityType="área"
        customMessage={{ before: 'analizó la correlación entre alertas y', after: 'salidas de personal' }}
        detection={{
          title: 'Conservation Index',
          description: 'Porcentaje del score onboarding que se conserva al momento de la salida.',
          score: data.conservationIndex ?? undefined,
          maxScore: 100
        }}
        cta={{ label: 'Entendido', onClick: () => setIsModalOpen(false) }}
        sections={modalSections}
        source="Correlación sobre ExitRecords con onboarding previo"
      />
    </>
  );
});

export default EfectividadPredictivaCard;