// ====================================================================
// ACTO 1: LA VERDAD DESTILADA
// src/components/exit/causes/TruthScatterChart.tsx
// v2.0 - Refactorizado según FILOSOFIA_DISENO_FOCALIZAHR
// ====================================================================
//
// PRINCIPIO: "Entender en 3 segundos → Decidir en 10 → Actuar en 1 clic"
//
// ESTRUCTURA:
// 1. Insight protagonista (text-xl)
// 2. "Lo que duele" (severidad >= 3.5)
// 3. "Ruido" (severidad < 3.5)
// 4. Metodología colapsable
//
// ====================================================================

'use client';

import { useState, useMemo } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, AlertTriangle, Volume2 } from 'lucide-react';
import type { TruthDataPoint } from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface TruthScatterChartProps {
  data: TruthDataPoint[];
}

// ====================================================================
// FACTOR ROW COMPONENT
// ====================================================================
function FactorRow({
  factor,
  severity,
  frequency,
  isWound
}: {
  factor: string;
  severity: number;
  frequency: number;
  isWound: boolean;
}) {
  const severityPercent = (severity / 5) * 100;

  return (
    <div className={`
      p-4 rounded-lg border transition-all
      ${isWound
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-slate-800/50 border-slate-700/30'
      }
    `}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-white font-medium">
          {factor}
        </span>
        <span className={`
          px-2 py-0.5 rounded text-xs font-medium
          ${isWound ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}
        `}>
          {frequency}x
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isWound ? 'bg-red-500' : 'bg-blue-400'
            }`}
            style={{ width: `${severityPercent}%` }}
          />
        </div>
        <span className={`text-sm font-semibold w-8 text-right ${
          isWound ? 'text-red-400' : 'text-slate-400'
        }`}>
          {severity.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function TruthScatterChart({ data }: TruthScatterChartProps) {
  const [showMethodology, setShowMethodology] = useState(false);

  // Separar en "Lo que duele" vs "Ruido"
  const { loQueDuele, ruido, insight } = useMemo(() => {
    const threshold = 3.5;

    const wounds = data
      .filter(f => f.avgSeverity >= threshold)
      .sort((a, b) => b.avgSeverity - a.avgSeverity);

    const noise = data
      .filter(f => f.avgSeverity < threshold)
      .sort((a, b) => b.frequency - a.frequency);

    // Generar insight dinámico
    const topWound = wounds[0];
    const topNoise = noise[0];

    let insightText = '';
    if (topWound && topNoise) {
      insightText = `El ${Math.round((topNoise.frequency / data.reduce((s, d) => s + d.frequency, 0)) * 100)}% menciona "${topNoise.factor}", pero "${topWound.factor}" tiene severidad ${topWound.avgSeverity.toFixed(1)}. Se van por ${topWound.factor.toLowerCase()}, no por ${topNoise.factor.toLowerCase()}.`;
    } else if (topWound) {
      insightText = `"${topWound.factor}" es la causa real con severidad ${topWound.avgSeverity.toFixed(1)}. Requiere atención inmediata.`;
    } else if (topNoise) {
      insightText = `No hay factores con severidad crítica (≥3.5). "${topNoise.factor}" es lo más mencionado pero no representa una herida profunda.`;
    } else {
      insightText = 'No hay suficientes datos para generar un análisis.';
    }

    return {
      loQueDuele: wounds,
      ruido: noise,
      insight: insightText
    };
  }, [data]);

  // Si no hay datos
  if (data.length === 0) {
    return (
      <div className="fhr-card p-6">
        <h3 className="text-lg font-light text-white mb-4">La Verdad Destilada</h3>
        <p className="text-slate-400 text-sm">No hay datos de factores disponibles</p>
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

      {/* INSIGHT PROTAGONISTA */}
      <div className="px-6 pb-6">
        <div className="p-5 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Lightbulb className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-lg font-medium text-slate-200 leading-relaxed">
              {insight}
            </p>
          </div>
        </div>
      </div>

      {/* LO QUE DUELE */}
      {loQueDuele.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h4 className="text-sm font-medium text-red-400 uppercase tracking-wide">
              Lo que duele (Severidad ≥ 3.5)
            </h4>
          </div>
          <div className="space-y-3">
            {loQueDuele.map(factor => (
              <FactorRow
                key={factor.factor}
                factor={factor.factor}
                severity={factor.avgSeverity}
                frequency={factor.frequency}
                isWound={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* RUIDO */}
      {ruido.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-medium text-blue-400 uppercase tracking-wide">
              Ruido (Alta frecuencia, baja severidad)
            </h4>
          </div>
          <div className="space-y-3">
            {ruido.map(factor => (
              <FactorRow
                key={factor.factor}
                factor={factor.factor}
                severity={factor.avgSeverity}
                frequency={factor.frequency}
                isWound={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* METODOLOGÍA COLAPSABLE */}
      <div className="px-6 pb-6">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="
            flex items-center gap-2 text-sm text-slate-500
            hover:text-slate-300 transition-colors
          "
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
              <strong className="text-slate-300">Lo que duele:</strong> Factores con severidad promedio ≥ 3.5 sobre 5.0. Representan las causas reales de insatisfacción.
            </p>
            <p>
              <strong className="text-slate-300">Ruido:</strong> Factores mencionados frecuentemente pero con severidad &lt; 3.5. Son quejas comunes pero no las verdaderas razones de salida.
            </p>
            <p>
              <strong className="text-slate-300">Severidad:</strong> Escala 1-5 donde 5 es el máximo impacto en la decisión de salida.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
