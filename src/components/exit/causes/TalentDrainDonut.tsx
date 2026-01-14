// ====================================================================
// ACTO 3: EL DRENAJE DE TALENTO
// src/components/exit/causes/TalentDrainDonut.tsx
// v2.0 - Refactorizado según FILOSOFIA_DISENO_FOCALIZAHR
// ====================================================================
//
// PRINCIPIO: "Entender en 3 segundos → Decidir en 10 → Actuar en 1 clic"
//
// ESTRUCTURA:
// 1. Donut centrado con KPI en el centro
// 2. Leyenda ABAJO (no al lado)
// 3. Insight al final
//
// ====================================================================

'use client';

import { useMemo } from 'react';
import { Lightbulb, AlertTriangle } from 'lucide-react';
import type { TalentDrainData } from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface TalentDrainDonutProps {
  data: TalentDrainData[];
}

// ====================================================================
// CONSTANTS
// ====================================================================
const TALENT_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  key_talent: {
    label: 'Pérdida Estratégica',
    color: '#EF4444',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: '🔴'
  },
  meets_expectations: {
    label: 'Pérdida Estándar',
    color: '#F59E0B',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: '🟡'
  },
  poor_fit: {
    label: 'Rotación Sana',
    color: '#10B981',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: '🟢'
  }
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function TalentDrainDonut({ data }: TalentDrainDonutProps) {
  // Calcular totales y KPI
  const { total, keyTalentPercent, keyTalentCount, sortedData, insight } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const keyTalent = data.find(d => d.classification === 'key_talent');
    const keyTalentPct = keyTalent?.percentage || 0;
    const keyTalentCnt = keyTalent?.count || 0;

    // Ordenar: key_talent, meets_expectations, poor_fit
    const order = ['key_talent', 'meets_expectations', 'poor_fit'];
    const sorted = [...data].sort(
      (a, b) => order.indexOf(a.classification) - order.indexOf(b.classification)
    );

    // Generar insight
    let insightText = '';
    if (keyTalentPct >= 30) {
      insightText = `${keyTalentCnt} de cada ${total} salidas fueron talento clave. No son errores de selección, son promesas rotas.`;
    } else if (keyTalentPct > 0) {
      insightText = `El ${keyTalentPct}% de las salidas fueron talento clave. Aunque no es crítico, cada pérdida estratégica tiene alto impacto.`;
    } else {
      insightText = 'No hay pérdidas de talento clave registradas. La rotación actual es principalmente estándar o sana.';
    }

    return {
      total,
      keyTalentPercent: keyTalentPct,
      keyTalentCount: keyTalentCnt,
      sortedData: sorted,
      insight: insightText
    };
  }, [data]);

  // SVG Donut params
  const radius = 70;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  // Si no hay datos
  if (data.length === 0 || total === 0) {
    return (
      <div className="fhr-card p-6 h-full">
        <h3 className="text-lg font-light text-white mb-4">Drenaje de Talento</h3>
        <p className="text-slate-400 text-sm">No hay datos de clasificación disponibles</p>
      </div>
    );
  }

  // Calcular segmentos del donut
  let currentOffset = 0;
  const segments = sortedData.map(segment => {
    const config = TALENT_CONFIG[segment.classification] || TALENT_CONFIG.meets_expectations;
    const segmentLength = (segment.percentage / 100) * circumference;
    const dashArray = `${segmentLength} ${circumference - segmentLength}`;
    const dashOffset = -currentOffset;
    currentOffset += segmentLength;

    return {
      ...segment,
      config,
      dashArray,
      dashOffset
    };
  });

  return (
    <div className="fhr-card relative overflow-hidden h-full flex flex-col">
      {/* Línea Tesla */}
      <div className="fhr-top-line" />

      {/* Header */}
      <div className="p-6 pb-4">
        <h3 className="text-lg font-light text-white mb-1">
          Drenaje de Talento
        </h3>
        <p className="text-sm text-slate-400">
          ¿Perdimos grasa o músculo?
        </p>
      </div>

      {/* DONUT CON KPI CENTRAL */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative">
          <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-700"
            />
            {/* Segments */}
            {segments.map((segment, index) => (
              <circle
                key={segment.classification}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={segment.config.color}
                strokeWidth={strokeWidth}
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            ))}
          </svg>

          {/* KPI Central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-white">
              {keyTalentPercent}%
            </span>
            <span className="text-xs text-slate-400 text-center mt-1">
              Talento<br />Clave
            </span>
          </div>
        </div>
      </div>

      {/* LEYENDA ABAJO */}
      <div className="px-6 pb-6 space-y-3">
        {segments.map(segment => (
          <div
            key={segment.classification}
            className={`
              flex items-center gap-3 p-3 rounded-lg border
              ${segment.config.bgColor} ${segment.config.borderColor}
            `}
          >
            <span className="text-lg">{segment.config.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white font-medium">
                  {segment.config.label}
                </span>
                <span className="text-sm font-semibold" style={{ color: segment.config.color }}>
                  {segment.percentage}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${segment.percentage}%`,
                      backgroundColor: segment.config.color
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-12 text-right">
                  {segment.count} pers.
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* INSIGHT */}
      {keyTalentPercent > 0 && (
        <div className="px-6 pb-6">
          <div className={`
            p-4 rounded-xl flex items-start gap-3
            ${keyTalentPercent >= 30
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20'
            }
          `}>
            {keyTalentPercent >= 30 ? (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Lightbulb className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${keyTalentPercent >= 30 ? 'text-red-300' : 'text-slate-300'}`}>
              {insight}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
