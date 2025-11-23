// src/components/onboarding/OnboardingScoreClassificationCard.tsx
/**
 * 💼 ONBOARDING SCORE CLASSIFICATION CARD
 * 
 * Card conceptual "Cómo nos evalúan los talentos en su ingreso"
 * Muestra clasificación textual + benchmark inline + fortaleza/oportunidad
 * 
 * Props:
 * - score: EXO Score actual (0-100)
 * - periodCount: Meses con datos
 * - totalJourneys: Total de journeys acumulados
 * - companyName: Nombre de la empresa (opcional)
 * 
 * Diseño: Estilo FocalizaHR premium inline
 */

'use client';

import { memo, useMemo } from 'react';
import { Briefcase, TrendingUp, Award } from 'lucide-react';

interface OnboardingScoreClassificationCardProps {
  score: number;
  periodCount: number;
  totalJourneys: number;
  companyName?: string;
}

export default memo(function OnboardingScoreClassificationCard({
  score,
  periodCount,
  totalJourneys,
  companyName = 'tu empresa'
}: OnboardingScoreClassificationCardProps) {
  
  // ========================================
  // HELPER: Obtener clasificación según score
  // ========================================
  const classification = useMemo(() => {
    if (score >= 80) {
      return {
        label: 'Excelente',
        description: 'Proceso de integración sobresaliente que supera ampliamente las expectativas del mercado.',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10'
      };
    }
    if (score >= 65) {
      return {
        label: 'Bueno',
        description: 'Proceso de integración funcionando correctamente con oportunidades de mejora.',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10'
      };
    }
    if (score >= 50) {
      return {
        label: 'Regular',
        description: 'Proceso de integración con desafíos importantes que requieren atención.',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10'
      };
    }
    return {
      label: 'Crítico',
      description: 'Proceso de integración con problemas serios que demandan intervención inmediata.',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10'
    };
  }, [score]);

  // ========================================
  // HELPER: Calcular benchmark vs industria
  // ========================================
  const benchmark = useMemo(() => {
    const industryAvg = 52.5; // Promedio industria Chile (hardcoded por ahora)
    const diff = score - industryAvg;
    const diffPercent = ((diff / industryAvg) * 100).toFixed(0);
    
    const isAbove = diff > 5;
    const isBelow = diff < -5;
    const isNeutral = !isAbove && !isBelow;

    return {
      diff: Math.abs(diff).toFixed(0),
      diffPercent: Math.abs(parseFloat(diffPercent)),
      isAbove,
      isBelow,
      isNeutral,
      status: isAbove ? 'fortaleza' : isBelow ? 'oportunidad' : 'neutral',
      statusEmoji: isAbove ? '✨' : isBelow ? '⚠️' : '➖',
      statusText: isAbove 
        ? `Esto es una fortaleza de ${companyName}`
        : isBelow 
        ? `Esto es una oportunidad de mejora para ${companyName}`
        : `${companyName} está en línea con el mercado`
    };
  }, [score, companyName]);

  // ========================================
  // RENDER PRINCIPAL
  // ========================================
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 space-y-3">
      
      {/* HEADER CON TÍTULO CONCEPTUAL */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Briefcase className="h-3.5 w-3.5" />
          <p className="text-[10px] uppercase tracking-wider font-medium">
            Cómo nos evalúan los talentos
          </p>
        </div>
        <p className="text-[9px] text-slate-500 pl-5">
          en su ingreso
        </p>
      </div>

      {/* CLASIFICACIÓN + DESCRIPCIÓN */}
      <div className={`${classification.bgColor} rounded-lg px-3 py-2.5 space-y-1.5`}>
        <div className="flex items-baseline gap-2">
          <p className={`text-sm font-semibold ${classification.color}`}>
            EXO Score: {classification.label}
          </p>
        </div>
        <p className="text-[10px] text-slate-300 leading-relaxed">
          {classification.description}
        </p>
      </div>

      {/* BENCHMARK INLINE */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-2">
          <TrendingUp className={`h-3.5 w-3.5 ${
            benchmark.isAbove ? 'text-green-400' : 
            benchmark.isBelow ? 'text-amber-400' : 
            'text-slate-400'
          }`} />
          <p className="text-xs text-slate-300">
            <span className={`font-bold ${
              benchmark.isAbove ? 'text-green-400' : 
              benchmark.isBelow ? 'text-amber-400' : 
              'text-slate-400'
            }`}>
              {benchmark.isAbove ? '+' : benchmark.isBelow ? '-' : ''}{benchmark.diffPercent}%
            </span>
            {' '}
            {benchmark.isAbove ? 'sobre' : benchmark.isBelow ? 'bajo' : 'en línea con'} promedio industria
          </p>
        </div>
        
        <div className="flex items-start gap-1.5 pl-5">
          <span className="text-xs">{benchmark.statusEmoji}</span>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            {benchmark.statusText}
          </p>
        </div>
      </div>

      {/* METADATOS */}
      <div className="pt-2 border-t border-slate-800/50">
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <span>{periodCount} {periodCount === 1 ? 'mes' : 'meses'}</span>
          <span>·</span>
          <span>{totalJourneys} journeys</span>
        </div>
      </div>

    </div>
  );
});