// ====================================================================
// TAB 1: FACTORES - LA VERDAD DESTILADA
// src/app/dashboard/exit/causes/components/FactorsTab.tsx
// ====================================================================
//
// PREGUNTA: "¿Qué los hace irse realmente?"
// DISEÑO: Barras cyan, badges sutiles, sin colores semánticos agresivos
//
// ====================================================================

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import type { TruthDataPoint } from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface FactorsTabProps {
  data: TruthDataPoint[];
}

// ====================================================================
// FACTOR ROW COMPONENT
// ====================================================================
function FactorRow({ factor, frequency, severity }: {
  factor: string;
  frequency: number;
  severity: number;
}) {
  const severityPercent = (severity / 5) * 100;

  return (
    <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white font-medium">
          {factor}
        </span>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">
            {frequency}x
          </span>
          <span className="text-sm font-semibold text-slate-300 w-8 text-right">
            {severity.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500 rounded-full transition-all duration-500"
          style={{ width: `${severityPercent}%` }}
        />
      </div>
    </div>
  );
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function FactorsTab({ data }: FactorsTabProps) {
  const [showMethodology, setShowMethodology] = useState(false);

  // Ordenar por severidad y generar insight
  const { sortedFactors, insight } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.avgSeverity - a.avgSeverity);

    // Generar insight
    const hasWounds = sorted.some(f => f.avgSeverity >= 3.5);
    const topFactor = sorted[0];
    const mostFrequent = [...data].sort((a, b) => b.frequency - a.frequency)[0];

    let insightText = '';
    if (!topFactor) {
      insightText = 'No hay suficientes datos para generar un análisis.';
    } else if (hasWounds) {
      insightText = `"${topFactor.factor}" tiene la mayor severidad (${topFactor.avgSeverity.toFixed(1)}). Es la causa real de insatisfacción.`;
    } else if (mostFrequent && mostFrequent !== topFactor) {
      insightText = `No hay factores con severidad crítica (≥3.5). "${mostFrequent.factor}" es lo más mencionado pero no representa una herida profunda.`;
    } else {
      insightText = `"${topFactor.factor}" lidera tanto en severidad como en frecuencia. Requiere atención prioritaria.`;
    }

    return { sortedFactors: sorted, insight: insightText };
  }, [data]);

  // Si no hay datos
  if (data.length === 0) {
    return (
      <div className="fhr-card p-6">
        <p className="text-slate-400 text-sm text-center">
          No hay datos de factores disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="fhr-card relative overflow-hidden">
      {/* Línea Tesla */}
      <div className="fhr-top-line" />

      {/* Header */}
      <div className="p-6 pb-4">
        <h3 className="text-lg font-light text-white mb-1">
          La Verdad Destilada
        </h3>
        <p className="text-sm text-slate-400">
          Lo que dicen vs lo que duele
        </p>
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

      {/* Factores por Severidad */}
      <div className="px-6 pb-4">
        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4">
          Factores por Severidad
        </h4>
        <div className="space-y-3">
          {sortedFactors.map(factor => (
            <FactorRow
              key={factor.factor}
              factor={factor.factor}
              frequency={factor.frequency}
              severity={factor.avgSeverity}
            />
          ))}
        </div>
      </div>

      {/* Metodología colapsable */}
      <div className="px-6 pb-6">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showMethodology ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          Ver metodología de clasificación
        </button>

        {showMethodology && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-lg text-sm text-slate-400 space-y-2">
            <p>
              <strong className="text-slate-300">Severidad:</strong> Escala 1-5 donde 5 es el máximo impacto en la decisión de salida.
            </p>
            <p>
              <strong className="text-slate-300">Frecuencia:</strong> Número de menciones del factor en entrevistas de salida.
            </p>
            <p>
              <strong className="text-slate-300">Factores críticos:</strong> Severidad promedio ≥ 3.5 indica causa real de insatisfacción.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
