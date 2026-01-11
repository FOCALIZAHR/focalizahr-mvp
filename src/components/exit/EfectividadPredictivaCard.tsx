// src/components/exit/EfectividadPredictivaCard.tsx
// ============================================================================
// EFECTIVIDAD PREDICTIVA CARD - Correlación Onboarding-Exit
// ============================================================================
// Muestra Conservation Index + casos evitables con modal de detalle
// ============================================================================

'use client';

import { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  AlertTriangle,
  TrendingDown,
  Users,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { useOnboardingCorrelation } from '@/hooks/useOnboardingCorrelation';
import FocalizaIntelligenceModal from '@/components/ui/FocalizaIntelligenceModal';
import { formatCurrencyCLP } from '@/lib/financialCalculations';

// ============================================================================
// TYPES
// ============================================================================

interface EfectividadPredictivaCardProps {
  viewMode?: 'gerencias' | 'departamentos';
  scope?: 'company' | 'filtered';
  parentDepartmentId?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getConservationClassification(index: number | null): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  if (index === null) {
    return {
      label: 'Sin datos',
      color: 'text-slate-400',
      bgColor: 'bg-slate-500/10',
      borderColor: 'border-slate-500/20'
    };
  }

  if (index < 40) {
    return {
      label: 'Crítico',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    };
  }
  if (index < 60) {
    return {
      label: 'Bajo',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    };
  }
  if (index < 80) {
    return {
      label: 'Medio',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    };
  }
  return {
    label: 'Alto',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20'
  };
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="fhr-card p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 bg-slate-700/50 rounded" />
        <div className="h-4 w-32 bg-slate-700/50 rounded" />
      </div>
      <div className="h-12 w-20 bg-slate-700/50 rounded mb-3" />
      <div className="h-4 w-40 bg-slate-700/50 rounded" />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EfectividadPredictivaCard = memo(function EfectividadPredictivaCard({
  viewMode = 'gerencias',
  scope = 'filtered',
  parentDepartmentId
}: EfectividadPredictivaCardProps) {

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ════════════════════════════════════════════════════════
  // FETCH DATA
  // ════════════════════════════════════════════════════════
  const { data, isLoading, error } = useOnboardingCorrelation({
    scope,
    departmentId: parentDepartmentId
  });

  // ════════════════════════════════════════════════════════
  // DERIVED VALUES
  // ════════════════════════════════════════════════════════
  const classification = useMemo(() => {
    return getConservationClassification(data?.conservationIndex ?? null);
  }, [data?.conservationIndex]);

  // 🔧 FIX BUG 2: Usar conteo de personas con alertas ignoradas, no total de exits
  const evitablesCount = useMemo(() => {
    if (!data) return 0;
    return data.exitsWithIgnoredAlerts;
  }, [data]);

  // ════════════════════════════════════════════════════════
  // MODAL SECTIONS
  // ════════════════════════════════════════════════════════
  const modalSections = useMemo(() => {
    if (!data) return [];

    const sections = [
      {
        id: 'metricas',
        title: 'Métricas de Correlación',
        content: (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Conservation Index</span>
              <span className={`text-lg font-medium ${classification.color}`}>
                {data.conservationIndex !== null ? `${data.conservationIndex}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Alert Prediction Rate</span>
              <span className="text-lg font-medium text-slate-200">
                {data.alertPredictionRate}%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              El {data.alertPredictionRate}% de las salidas con onboarding tenían alertas ignoradas
            </p>
          </div>
        )
      },
      {
        id: 'desglose',
        title: 'Desglose de Salidas',
        content: (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                <p className="text-2xl font-light text-white">{data.exitsThisMonth}</p>
                <p className="text-xs text-slate-500">Total salidas</p>
              </div>
              <div className="text-center p-3 bg-slate-800/30 rounded-lg">
                <p className="text-2xl font-light text-cyan-400">{data.withOnboarding}</p>
                <p className="text-xs text-slate-500">Con onboarding</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-2xl font-light text-red-400">{data.totalIgnoredAlerts}</p>
                <p className="text-xs text-slate-500">Alertas ignoradas</p>
              </div>
              <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-2xl font-light text-emerald-400">{data.totalManagedAlerts}</p>
                <p className="text-xs text-slate-500">Alertas gestionadas</p>
              </div>
            </div>
          </div>
        )
      },
      {
        id: 'costo',
        title: 'Costo Evitable',
        content: (
          <div className="text-center py-4">
            <p className="text-3xl font-extralight text-red-400">
              {formatCurrencyCLP(data.avoidableCost)}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Costo de las {evitablesCount} salidas que tenían alertas ignoradas
            </p>
            <p className="text-xs text-slate-600 mt-3">
              Metodología: SHRM 2024 (125% salario anual)
            </p>
          </div>
        )
      }
    ];

    // Agregar casos si existen
    if (data.cases.length > 0) {
      const groupLabel = viewMode === 'gerencias' ? 'Gerencia' : 'Departamento';

      sections.push({
        id: 'casos',
        title: `Casos por ${groupLabel}`,
        content: (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.cases.map((c) => (
              <div
                key={c.departmentId}
                className="flex items-center justify-between p-3 bg-slate-800/20 rounded-lg"
              >
                <div>
                  <p className="text-sm text-slate-200">
                    {viewMode === 'gerencias' ? c.gerenciaName || c.departmentName : c.departmentName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.exitsWithIgnoredAlertsCount} personas evitables · {c.ignoredAlertsCount} alertas ignoradas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-400">
                    {formatCurrencyCLP(c.cost)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      });
    }

    return sections;
  }, [data, classification, evitablesCount, viewMode]);

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="fhr-card p-6">
        <div className="flex items-center gap-2 text-slate-500">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">Sin datos de correlación</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="fhr-card p-6 cursor-pointer hover:border-cyan-500/30 transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-light text-slate-500 uppercase tracking-wider">
              Efectividad Predictiva
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </div>

        {/* Conservation Index */}
        <div className="flex items-baseline gap-3 mb-3">
          <span className={`text-4xl font-extralight tabular-nums ${classification.color}`}>
            {data.conservationIndex !== null ? data.conservationIndex : '—'}
          </span>
          {data.conservationIndex !== null && (
            <span className="text-lg text-slate-500 font-light">%</span>
          )}
          <span className={`
            px-2 py-0.5 rounded text-xs font-medium
            ${classification.bgColor} ${classification.color} ${classification.borderColor} border
          `}>
            {classification.label}
          </span>
        </div>

        {/* Mensaje evitables */}
        {evitablesCount > 0 ? (
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <p className="text-sm text-slate-400">
              <span className="text-red-400 font-medium">{evitablesCount}</span> de{' '}
              <span className="text-white">{data.exitsThisMonth}</span> salidas eran{' '}
              <span className="text-red-400">EVITABLES</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {data.exitsThisMonth} salidas este período
          </p>
        )}

        {/* Costo evitable (si hay) */}
        {data.avoidableCost > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-red-400" />
            <span className="text-sm text-slate-400">
              Costo evitable:{' '}
              <span className="text-red-400 font-medium">
                {formatCurrencyCLP(data.avoidableCost)}
              </span>
            </span>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <FocalizaIntelligenceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityName="Correlación Onboarding-Exit"
        entityType="área"
        customMessage={{
          before: 'analizó la correlación entre alertas y',
          after: 'salidas de personal'
        }}
        detection={{
          title: 'Conservation Index',
          description: 'Porcentaje del score onboarding que se conserva al momento de la salida. Un índice bajo indica deterioro significativo.',
          score: data.conservationIndex ?? undefined,
          maxScore: 100
        }}
        cta={{
          label: 'Entendido',
          onClick: () => setIsModalOpen(false)
        }}
        sections={modalSections}
        source="Correlación calculada sobre ExitRecords con onboarding previo"
      />
    </>
  );
});

export default EfectividadPredictivaCard;
