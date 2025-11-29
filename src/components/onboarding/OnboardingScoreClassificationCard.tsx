// src/components/onboarding/OnboardingScoreClassificationCard.tsx
/**
 * DISEÑO: Mantener glassmorphism premium original
 * CONTENIDO: Explicar significado sin repetir "BUENO"
 */

'use client';

import { memo, useMemo } from 'react';
import { Briefcase, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface OnboardingScoreClassificationCardProps {
  score: number;
  periodCount: number;
  totalJourneys: number;
  companyName?: string;
  benchmarkScore?: number | null;
}

export default memo(function OnboardingScoreClassificationCard({
  score,
  periodCount,
  totalJourneys,
  companyName = 'tu empresa',
  benchmarkScore = null
}: OnboardingScoreClassificationCardProps) {
  
  const classification = useMemo(() => {
    if (score >= 80) {
      return {
        meaning: 'Proceso de integración excepcional que supera ampliamente estándares del mercado. Los nuevos talentos tienen experiencias sobresalientes desde día 1.',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20'
      };
    }
    if (score >= 60) {
      return {
        meaning: 'Proceso de integración sólido y funcional con áreas de oportunidad identificadas. La experiencia del talento es positiva pero mejorable.',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        borderColor: 'border-cyan-500/20'
      };
    }
    if (score >= 40) {
      return {
        meaning: 'Proceso de integración con desafíos importantes que requieren atención. Los nuevos talentos experimentan fricciones que afectan su compromiso inicial.',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20'
      };
    }
    return {
      meaning: 'Proceso de integración con problemas críticos que demandan intervención urgente. La experiencia del talento nuevo está comprometida seriamente.',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    };
  }, [score]);

  const benchmark = useMemo(() => {
    const industryAvg = benchmarkScore ?? 52.5;
    const diff = score - industryAvg;
    const diffPercent = Math.abs((diff / industryAvg) * 100);
    
    const isAbove = diff > 2;
    const isBelow = diff < -2;

    let positionText = '';
    if (isAbove) {
      positionText = `${companyName} está ${Math.round(diffPercent)}% sobre el promedio nacional`;
    } else if (isBelow) {
      positionText = `${companyName} está ${Math.round(diffPercent)}% bajo el promedio nacional`;
    } else {
      positionText = `${companyName} está alineado con la mediana nacional`;
    }

    return {
      industryAvg: Math.round(industryAvg),
      isAbove,
      isBelow,
      positionText,
      icon: isAbove ? TrendingUp : isBelow ? TrendingDown : Info,
      iconColor: isAbove ? 'text-green-400' : isBelow ? 'text-amber-400' : 'text-slate-400'
    };
  }, [score, companyName, benchmarkScore]);

  return (
    <div 
      className="
        relative overflow-hidden
        bg-slate-900/40 
        backdrop-blur-xl
        border border-slate-700/50 
        rounded-xl 
        p-4 
        space-y-3
        transition-all duration-300 ease-out
        hover:bg-slate-900/50
        hover:border-slate-600/50
        hover:shadow-lg hover:shadow-cyan-500/5
      "
    >
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative space-y-0.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-lg">
            <Briefcase className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <p className="text-[11px] uppercase tracking-wider font-medium bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">
            Cómo nos evalúan los talentos
          </p>
        </div>
        <p className="text-[9px] text-slate-500 pl-8">
          en su ingreso
        </p>
      </div>

      <div className={`${classification.bgColor} ${classification.borderColor} border rounded-lg px-3 py-2.5 space-y-1.5`}>
        <div className="flex items-start gap-2">
          <Info className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${classification.color}`} />
          <div className="space-y-1">
            <p className={`text-[10px] font-medium ${classification.color}`}>
              ¿Qué significa este score?
            </p>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              {classification.meaning}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2">
          <benchmark.icon className={`h-3.5 w-3.5 ${benchmark.iconColor}`} />
          <p className="text-xs text-slate-300">
            {benchmark.positionText}
          </p>
        </div>
        <p className="text-[9px] text-slate-500 pl-5">
          Benchmark Chile: {benchmark.industryAvg} pts
        </p>
      </div>

      <div className="pt-2 border-t border-slate-700/50">
        <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 bg-cyan-500/50 rounded-full"></span>
            {periodCount} {periodCount === 1 ? 'mes' : 'meses'}
          </span>
          <span className="text-slate-700">·</span>
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 bg-purple-500/50 rounded-full"></span>
            {totalJourneys} journeys
          </span>
        </div>
      </div>
    </div>
  );
});