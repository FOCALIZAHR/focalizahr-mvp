// src/components/onboarding/BalanceDepartmentalCard.tsx
/**
 * CARD 2 - QUIÉN IMPULSA TU SCORE v4.0
 * 
 * DATOS: ✅ YA SON REALES
 * - topInfluencer viene de API /api/onboarding/metrics
 * - bottomImpact viene de API /api/onboarding/metrics
 * - contribution calculado con fórmula real en backend:
 *   (score_dept - score_global) × (journeys_dept / total_journeys)
 * 
 * MEJORAS UX v4.0:
 * - Título claro: "QUIÉN IMPULSA TU SCORE"
 * - Micro-insights que guían acción implícita
 * - Números con unidad: "+4.2 pts"
 * - Ancho controlado: max-w-xs
 * - Sin datos secundarios innecesarios
 */

'use client';

import { memo, useMemo } from 'react';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';

interface DepartmentInfluence {
  departmentId: string;
  departmentName: string;
  score: number;
  journeys: number;
  contribution: number;  // ← DATO REAL de API (fórmula ponderada)
}

interface BalanceDepartmentalCardProps {
  topInfluencer?: DepartmentInfluence | null;
  bottomImpact?: DepartmentInfluence | null;
}

export default memo(function BalanceDepartmentalCard({
  topInfluencer,
  bottomImpact
}: BalanceDepartmentalCardProps) {

  // ══════════════════════════════════════════════════════════════
  // MICRO-INSIGHTS QUE GUÍAN ACCIÓN (basados en contribution real)
  // ══════════════════════════════════════════════════════════════
  const insights = useMemo(() => {
    // Insight para top performer - indica QUÉ HACER
    const topInsight = topInfluencer 
      ? topInfluencer.contribution > 5 
        ? 'Benchmark interno a replicar'
        : topInfluencer.contribution > 2
          ? 'El mejor proceso de integración'
          : 'Contribuye positivamente'
      : null;

    // Insight para bottom performer - indica QUÉ HACER
    const bottomInsight = bottomImpact
      ? bottomImpact.contribution < -5
        ? 'Intervención prioritaria'
        : bottomImpact.contribution < -2
          ? 'Foco de mejora identificado'
          : 'Oportunidad de optimización'
      : null;

    return { topInsight, bottomInsight };
  }, [topInfluencer, bottomImpact]);

  // ══════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ══════════════════════════════════════════════════════════════
  if (!topInfluencer || !bottomImpact) {
    return (
      <div 
        className="
          relative overflow-hidden
          bg-slate-900/40 
          backdrop-blur-xl
          border border-slate-700/50 
          rounded-xl 
          p-4
          w-full
          max-w-xs
        "
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-slate-800/50 rounded-lg">
            <Users className="h-3 w-3 text-slate-500" />
          </div>
          <p className="text-[10px] uppercase tracking-wider font-medium text-slate-500">
            Impacto por Área
          </p>
        </div>
        <p className="text-[10px] text-slate-500">
          Se requieren más datos para este análisis
        </p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER - DISEÑO SOPORTE CON ACCIÓN IMPLÍCITA
  // ══════════════════════════════════════════════════════════════
  return (
    <div 
      className="
        relative overflow-hidden
        bg-slate-900/40 
        backdrop-blur-xl
        border border-slate-700/50 
        rounded-xl 
        p-4
        w-full
        max-w-xs
        transition-all duration-300 ease-out
        hover:bg-slate-900/50
        hover:border-slate-600/50
      "
    >
      {/* Efecto decorativo sutil */}
      <div className="absolute -top-16 -left-16 w-28 h-28 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-2xl pointer-events-none" />
      
      {/* ══════════════════════════════════════════════════════════ */}
      {/* HEADER - TÍTULO QUE EXPLICA */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="relative flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg">
          <Users className="h-3 w-3 text-purple-400" />
        </div>
        <p className="text-[10px] uppercase tracking-wider font-medium text-purple-400">
          Quién impulsa tu score
        </p>
      </div>

      <div className="relative space-y-2">
        
        {/* ══════════════════════════════════════════════════════════ */}
        {/* TOP PERFORMER - QUÉ REPLICAR */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
              <p className="text-[11px] text-emerald-400 font-medium truncate">
                {topInfluencer.departmentName}
              </p>
            </div>
            <span className="text-sm font-semibold text-emerald-400 whitespace-nowrap">
              +{Math.abs(topInfluencer.contribution).toFixed(1)} pts
            </span>
          </div>
          <p className="text-[9px] text-emerald-300/60 pl-5">
            {insights.topInsight}
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* BOTTOM PERFORMER - QUÉ MEJORAR */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TrendingDown className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
              <p className="text-[11px] text-amber-400 font-medium truncate">
                {bottomImpact.departmentName}
              </p>
            </div>
            <span className="text-sm font-semibold text-amber-400 whitespace-nowrap">
              {bottomImpact.contribution.toFixed(1)} pts
            </span>
          </div>
          <p className="text-[9px] text-amber-300/60 pl-5">
            {insights.bottomInsight}
          </p>
        </div>

      </div>
    </div>
  );
});