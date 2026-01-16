// ====================================================================
// REVELATION CARD - LA REVELACIÓN
// src/app/dashboard/exit/causes/components/RevelationCard.tsx
// v4.0 - Visual Structure per GUIA_ESTILOS_UNIFICADOS_FOCALIZAHR_v2
// ====================================================================
//
// PROPÓSITO: Mostrar el CONTRASTE entre lo que RRHH registra
// y lo que los empleados revelan en la encuesta confidencial.
//
// AHA MOMENT: "RRHH registra 'mejor oportunidad', pero la encuesta
// revela que huyen del liderazgo"
//
// FUENTES DE DATOS:
// - Izquierda: exitReason (formulario de registro RRHH) - barras SLATE
// - Derecha: exitFactors + severity (encuesta confidencial) - barras CYAN
//
// ====================================================================

'use client';

import { useMemo } from 'react';
import { Lightbulb, Zap } from 'lucide-react';
import type {
  TruthDataPoint,
  PredictabilityData,
  HRHypothesisData
} from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface RevelationCardProps {
  hrHypothesis: HRHypothesisData | null;
  surveyReality: TruthDataPoint[];
  predictability: PredictabilityData | null;
}

// ====================================================================
// HELPERS
// ====================================================================

// Obtener top factores por % de menciones para surveyReality
function getTopByMentions(factors: TruthDataPoint[]): Array<{
  name: string;
  mentionRate: number;
  severity: number;
}> {
  const totalFrequency = factors.reduce((sum, f) => sum + f.frequency, 0);
  if (totalFrequency === 0) return [];

  return factors
    .map(f => ({
      name: f.factor,
      mentionRate: Math.round((f.frequency / totalFrequency) * 100),
      severity: f.avgSeverity
    }))
    .sort((a, b) => b.mentionRate - a.mentionRate)
    .slice(0, 3);
}

// Obtener top razones HR por porcentaje
function getTopHRReasons(hrHypothesis: HRHypothesisData | null): Array<{
  name: string;
  percentage: number;
}> {
  if (!hrHypothesis || hrHypothesis.reasons.length === 0) return [];

  return hrHypothesis.reasons
    .slice(0, 3)
    .map(r => ({
      name: r.label,
      percentage: r.percentage
    }));
}

// Algoritmo para generar insight automático comparando dos fuentes
function generateInsight(
  hrReasons: Array<{ name: string; percentage: number }>,
  surveyFactors: Array<{ name: string; mentionRate: number; severity: number }>,
  predictability: PredictabilityData | null
): string {
  if (hrReasons.length === 0 && surveyFactors.length === 0) {
    return 'No hay suficientes datos para generar un análisis comparativo.';
  }

  if (hrReasons.length === 0) {
    const topFactor = surveyFactors[0];
    return `La encuesta revela que "${topFactor.name}" (${topFactor.mentionRate}% de menciones) ` +
      `es el dolor principal, pero RRHH no ha registrado razones de salida.`;
  }

  if (surveyFactors.length === 0) {
    const topReason = hrReasons[0];
    return `RRHH registra "${topReason.name}" (${topReason.percentage}%) como razón principal, ` +
      `pero aún no hay respuestas de encuesta para validar.`;
  }

  const topHR = hrReasons[0];
  const topSurvey = surveyFactors[0];

  // Normalizar nombres para comparar (caso insensitivo, sin acentos)
  const normalizeText = (text: string) =>
    text.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const hrNormalized = normalizeText(topHR.name);
  const surveyNormalized = normalizeText(topSurvey.name);

  // Si son diferentes = REVELACIÓN
  if (hrNormalized !== surveyNormalized) {
    let insight = `RRHH registra "${topHR.name}" (${topHR.percentage}%), ` +
      `pero los empleados revelan que huyen de "${topSurvey.name}" ` +
      `(${topSurvey.mentionRate}% de menciones).`;

    if (predictability && predictability.predictabilityRate > 0) {
      insight += ` El ${predictability.predictabilityRate}% tenía alertas de onboarding ignoradas.`;
    }

    return insight;
  }

  // Si coinciden = confirmar
  return `"${topHR.name}" coincide en ambas fuentes: ` +
    `${topHR.percentage}% de registros RRHH y ${topSurvey.mentionRate}% de menciones en encuestas. ` +
    `El problema está claramente identificado.`;
}

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function RevelationCard({
  hrHypothesis,
  surveyReality,
  predictability
}: RevelationCardProps) {
  // Calcular datos para las dos columnas
  const { hrReasons, surveyFactors, keyInsight, hasRevelation } = useMemo(() => {
    const hrTop = getTopHRReasons(hrHypothesis);
    const surveyTop = getTopByMentions(surveyReality);
    const insight = generateInsight(hrTop, surveyTop, predictability);

    // Detectar si hay revelación (top HR ≠ top survey)
    let revelation = false;
    if (hrTop.length > 0 && surveyTop.length > 0) {
      const normalizeText = (text: string) =>
        text.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      revelation = normalizeText(hrTop[0].name) !== normalizeText(surveyTop[0].name);
    }

    return {
      hrReasons: hrTop,
      surveyFactors: surveyTop,
      keyInsight: insight,
      hasRevelation: revelation
    };
  }, [hrHypothesis, surveyReality, predictability]);

  // Si no hay datos de ninguna fuente
  if (hrReasons.length === 0 && surveyFactors.length === 0) {
    return (
      <div className="fhr-card p-6">
        <p className="text-slate-400 text-sm text-center">
          No hay datos suficientes para mostrar la revelación
        </p>
      </div>
    );
  }

  return (
    <div className="fhr-card relative p-6">
      {/* Top Line Tesla */}
      <div className="fhr-top-line" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="w-6 h-6 text-cyan-400" />
        <h2 className="fhr-title-card text-lg">
          La <span className="fhr-title-gradient">Revelación</span>
        </h2>
      </div>

      {/* Grid 2 columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Izquierda: Hipótesis RRHH (barras SLATE) */}
        <div>
          <h3 className="text-sm uppercase tracking-wide text-slate-400 mb-4">
            Hipótesis RRHH
          </h3>

          {hrReasons.length > 0 ? (
            <div className="space-y-3">
              {hrReasons.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 truncate pr-2">{item.name}</span>
                    <span className="text-slate-500 flex-shrink-0">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div
                      className="h-full bg-slate-500 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Sin razones registradas
            </p>
          )}

          <p className="text-xs text-slate-500 mt-3">% de registros de salida</p>
        </div>

        {/* Derecha: Realidad Encuesta (barras CYAN, primera PÚRPURA) */}
        <div className="md:border-l md:border-slate-700 md:pl-8">
          <h3 className="text-sm uppercase tracking-wide text-cyan-400 mb-4">
            Realidad Encuesta
          </h3>

          {surveyFactors.length > 0 ? (
            <div className="space-y-3">
              {surveyFactors.map((item, index) => {
                const isFirst = index === 0;
                return (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 truncate pr-2">{item.name}</span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className={isFirst ? 'text-purple-400' : 'text-cyan-400'}>
                          {item.mentionRate}%
                        </span>
                        <span className="text-slate-500 text-xs">
                          (sev: {item.severity.toFixed(1)})
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${isFirst ? 'bg-purple-500' : 'bg-cyan-500'}`}
                        style={{ width: `${item.mentionRate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">
              Sin respuestas de encuesta
            </p>
          )}

          <p className="text-xs text-slate-500 mt-3">% de menciones en encuesta</p>
        </div>

      </div>

      {/* Insight Box */}
      <div className={`
        mt-6 p-4 rounded-xl flex gap-3
        ${hasRevelation
          ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30'
          : 'bg-slate-800/50 border border-slate-700'
        }
      `}>
        <Zap className={`w-5 h-5 flex-shrink-0 ${hasRevelation ? 'text-cyan-400' : 'text-slate-400'}`} />
        <p className={`text-sm ${hasRevelation ? 'text-cyan-300' : 'text-slate-300'}`}>
          {keyInsight}
        </p>
      </div>
    </div>
  );
}
