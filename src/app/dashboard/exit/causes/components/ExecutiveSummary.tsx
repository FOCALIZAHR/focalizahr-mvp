// ====================================================================
// EXECUTIVE SUMMARY - DIAGNÓSTICO EJECUTIVO
// src/app/dashboard/exit/causes/components/ExecutiveSummary.tsx
// ====================================================================
//
// PRINCIPIO: "Entender en 3 segundos → Decidir en 10"
// ABOVE THE FOLD: Card protagonista con línea Tesla
//
// ====================================================================

'use client';

import { useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import type {
  TruthDataPoint,
  PainMapNode,
  TalentDrainData,
  PredictabilityData,
  ROIData
} from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface ExecutiveSummaryProps {
  truth: TruthDataPoint[];
  painmap: PainMapNode[];
  drain: TalentDrainData[];
  predictability: PredictabilityData | null;
  roi: ROIData | null;
}

// ====================================================================
// HELPERS
// ====================================================================
function formatCLP(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(0)}M`;
  }
  return `$${Math.round(amount).toLocaleString('es-CL')}`;
}

// ====================================================================
// COMPONENTE
// ====================================================================
export default function ExecutiveSummary({
  truth,
  painmap,
  drain,
  predictability,
  roi
}: ExecutiveSummaryProps) {
  // Generar diagnóstico ejecutivo dinámico
  const { mainDiagnosis, actionableInsight } = useMemo(() => {
    const parts: string[] = [];

    // 1. Focos tóxicos
    const toxicDepts = painmap.filter(d => d.avgSeverity >= 4.0);
    if (toxicDepts.length > 0) {
      const deptNames = toxicDepts.slice(0, 2).map(d => d.departmentName).join(' y ');
      parts.push(`${toxicDepts.length} departamento${toxicDepts.length > 1 ? 's son focos' : ' es foco'} tóxico${toxicDepts.length > 1 ? 's' : ''} (${deptNames})`);
    }

    // 2. Talento clave
    const keyTalent = drain.find(d => d.classification === 'key_talent');
    if (keyTalent && keyTalent.percentage > 0) {
      parts.push(`El ${keyTalent.percentage}% de salidas fue talento clave`);
    }

    // 3. Predictibilidad
    if (predictability && predictability.predictabilityRate > 0) {
      parts.push(`El sistema predijo el ${predictability.predictabilityRate}% de casos`);
    }

    // 4. Costo
    if (roi && roi.estimatedCostCLP > 0) {
      parts.push(`Costo: ${formatCLP(roi.estimatedCostCLP)} CLP`);
    }

    // Generar diagnóstico
    const diagnosis = parts.length > 0
      ? parts.join('. ') + '.'
      : 'No hay suficientes datos para generar un diagnóstico.';

    // Generar insight accionable
    let insight = '';
    if (predictability && predictability.predictabilityRate >= 70) {
      insight = 'La oportunidad está en ACTUAR sobre las alertas existentes, no en generar más datos.';
    } else if (toxicDepts.length > 0) {
      insight = 'Intervención específica requerida en departamentos tóxicos. No es un problema generalizado.';
    } else if (roi && roi.benchmarkComparison === 'worse') {
      insight = `Tu severidad supera al mercado. No es el mercado, hay oportunidad de mejora interna.`;
    } else {
      insight = 'Monitorea continuamente los indicadores para detectar cambios tempranos.';
    }

    return { mainDiagnosis: diagnosis, actionableInsight: insight };
  }, [truth, painmap, drain, predictability, roi]);

  return (
    <div className="fhr-card relative overflow-hidden">
      {/* Línea Tesla */}
      <div className="fhr-top-line" />

      {/* Contenido */}
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-cyan-500/20 rounded-xl flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">
              Diagnóstico Ejecutivo
            </h2>
            <p className="text-sm text-slate-400">
              Resumen inteligente de causas de salida
            </p>
          </div>
        </div>

        {/* Diagnóstico Principal */}
        <p className="text-xl sm:text-2xl font-light text-slate-200 leading-relaxed mb-6">
          {mainDiagnosis}
        </p>

        {/* Insight Accionable */}
        <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-xl">
          <p className="text-base text-cyan-300 font-medium">
            {actionableInsight}
          </p>
        </div>
      </div>
    </div>
  );
}
