// src/components/onboarding/BalanceDepartmentalCard.tsx
/**
 * DISEÑO: Glassmorphism premium
 * ALTURA: Compacta ~90px
 */

'use client';

import { memo } from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface DepartmentInfluence {
  departmentId: string;
  departmentName: string;
  score: number;
  journeys: number;
  contribution: number;
}

interface BalanceDepartmentalCardProps {
  topInfluencer?: DepartmentInfluence | null;
  bottomImpact?: DepartmentInfluence | null;
}

export default memo(function BalanceDepartmentalCard({
  topInfluencer,
  bottomImpact
}: BalanceDepartmentalCardProps) {
  
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
          space-y-2
        "
      >
        <div className="flex items-center gap-2">
          <Scale className="h-3.5 w-3.5 text-slate-500" />
          <p className="text-[10px] uppercase tracking-wider font-medium text-slate-500">
            Balance Departamental
          </p>
        </div>
        <p className="text-[10px] text-slate-500">
          Datos insuficientes
        </p>
      </div>
    );
  }

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
        hover:shadow-lg hover:shadow-purple-500/5
      "
    >
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative flex items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg">
          <Scale className="h-3.5 w-3.5 text-purple-400" />
        </div>
        <p className="text-[11px] uppercase tracking-wider font-medium bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent">
          Balance Departamental
        </p>
      </div>

      <div className="relative space-y-2">
        {/* MAYOR IMPULSO */}
        <div className="flex items-center justify-between gap-3 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <TrendingUp className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-green-400 font-medium truncate">
                {topInfluencer.departmentName}
              </p>
              <p className="text-[9px] text-slate-500">
                {topInfluencer.journeys} journeys · {topInfluencer.score} EXO
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-green-400 flex-shrink-0">
            +{topInfluencer.contribution.toFixed(1)}
          </p>
        </div>

        {/* MAYOR ARRASTRE */}
        <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <TrendingDown className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-amber-400 font-medium truncate">
                {bottomImpact.departmentName}
              </p>
              <p className="text-[9px] text-slate-500">
                {bottomImpact.journeys} journeys · {bottomImpact.score} EXO
              </p>
            </div>
          </div>
          <p className="text-sm font-bold text-amber-400 flex-shrink-0">
            {bottomImpact.contribution.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
});