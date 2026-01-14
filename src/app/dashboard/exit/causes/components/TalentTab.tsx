// ====================================================================
// TAB 3: TALENTO - DRENAJE DE TALENTO
// src/app/dashboard/exit/causes/components/TalentTab.tsx
// ====================================================================
//
// PREGUNTA: "¿Perdimos grasa o músculo?"
// DISEÑO: Donut cyan/slate, sin emojis ni colores semánticos
//
// ====================================================================

'use client';

import { useMemo } from 'react';
import { Lightbulb } from 'lucide-react';
import type { TalentDrainData } from '@/hooks/useExitCauses';

// ====================================================================
// PROPS
// ====================================================================
interface TalentTabProps {
  data: TalentDrainData[];
}

// ====================================================================
// CONSTANTS
// ====================================================================
const TALENT_CONFIG: Record<string, {
  label: string;
  color: string;
}> = {
  key_talent: {
    label: 'Pérdida Estratégica',
    color: '#22D3EE' // cyan
  },
  meets_expectations: {
    label: 'Pérdida Estándar',
    color: '#64748B' // slate-500
  },
  poor_fit: {
    label: 'Rotación Sana',
    color: '#334155' // slate-700
  }
};

// ====================================================================
// COMPONENTE PRINCIPAL
// ====================================================================
export default function TalentTab({ data }: TalentTabProps) {
  // Calcular totales y KPI
  const { total, keyTalentPercent, sortedData, insight } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const keyTalent = data.find(d => d.classification === 'key_talent');
    const keyTalentPct = keyTalent?.percentage || 0;

    // Ordenar: key_talent, meets_expectations, poor_fit
    const order = ['key_talent', 'meets_expectations', 'poor_fit'];
    const sorted = [...data].sort(
      (a, b) => order.indexOf(a.classification) - order.indexOf(b.classification)
    );

    // Generar insight
    let insightText = '';
    if (keyTalentPct >= 30) {
      insightText = `El ${keyTalentPct}% de las salidas fueron talento clave. No son errores de selección, son promesas rotas.`;
    } else if (keyTalentPct > 0) {
      insightText = `El ${keyTalentPct}% de las salidas fueron talento clave. Aunque no es crítico, cada pérdida estratégica tiene alto impacto.`;
    } else {
      insightText = 'No hay pérdidas de talento clave registradas. La rotación actual es principalmente estándar o sana.';
    }

    return {
      total,
      keyTalentPercent: keyTalentPct,
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
      <div className="fhr-card p-6">
        <p className="text-slate-400 text-sm text-center">
          No hay datos de clasificación disponibles
        </p>
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
    <div className="fhr-card relative overflow-hidden">
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

      {/* Donut + Leyenda */}
      <div className="px-6 pb-6">
        <div className="flex flex-col items-center">
          {/* DONUT CON KPI CENTRAL */}
          <div className="relative mb-6">
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
              {segments.map((segment) => (
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
              <span className="text-4xl font-light text-cyan-400">
                {keyTalentPercent}%
              </span>
              <span className="text-xs text-slate-400 text-center mt-1">
                Talento<br />Clave
              </span>
            </div>
          </div>

          {/* LEYENDA */}
          <div className="w-full max-w-sm space-y-3">
            {segments.map(segment => (
              <div
                key={segment.classification}
                className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: segment.config.color }}
                  />
                  <span className="text-sm text-slate-300">
                    {segment.config.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400">
                    {segment.count} pers.
                  </span>
                  <span className="text-slate-300 font-medium w-12 text-right">
                    {segment.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
