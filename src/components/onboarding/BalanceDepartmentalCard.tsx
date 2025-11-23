// src/components/onboarding/BalanceDepartmentalCard.tsx
/**
 * ⚖️ BALANCE DEPARTAMENTAL CARD
 * 
 * Muestra quién impulsa (top influencer) y quién frena (bottom impact)
 * el EXO Score global del sistema de Onboarding.
 * 
 * Props:
 * - topInfluencer: Departamento con mayor contribución positiva
 * - bottomImpact: Departamento con mayor arrastre negativo
 * 
 * Diseño: Estilo FocalizaHR premium con glassmorphism
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
  
  // ========================================
  // EMPTY STATE
  // ========================================
  if (!topInfluencer || !bottomImpact) {
    return (
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 space-y-2">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Scale className="h-3.5 w-3.5" />
          <p className="text-[10px] uppercase tracking-wider font-medium">
            Balance Departamental
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Datos insuficientes para calcular balance
        </p>
      </div>
    );
  }

  // ========================================
  // RENDER PRINCIPAL
  // ========================================
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg p-4 space-y-3">
      
      {/* HEADER */}
      <div className="flex items-center gap-1.5 text-cyan-400">
        <Scale className="h-3.5 w-3.5" />
        <p className="text-[10px] uppercase tracking-wider font-medium">
          Balance Departamental
        </p>
      </div>

      {/* TOP INFLUENCER (Mayor impulso) */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-green-400" />
          <p className="text-[10px] uppercase tracking-wider text-green-400 font-medium">
            Mayor Impulso
          </p>
        </div>
        
        <div className="pl-4 space-y-0.5">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-white font-medium">
              {topInfluencer.departmentName}
            </p>
            <p className="text-xs text-green-400 font-bold tabular-nums">
              +{topInfluencer.contribution.toFixed(1)} pts
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>{topInfluencer.score.toFixed(1)} EXO</span>
            <span>·</span>
            <span>{topInfluencer.journeys} journeys</span>
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-slate-800/50" />

      {/* BOTTOM IMPACT (Mayor arrastre) */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <TrendingDown className="h-3 w-3 text-amber-400" />
          <p className="text-[10px] uppercase tracking-wider text-amber-400 font-medium">
            Mayor Arrastre
          </p>
        </div>
        
        <div className="pl-4 space-y-0.5">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-white font-medium">
              {bottomImpact.departmentName}
            </p>
            <p className="text-xs text-amber-400 font-bold tabular-nums">
              {bottomImpact.contribution.toFixed(1)} pts
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <span>{bottomImpact.score.toFixed(1)} EXO</span>
            <span>·</span>
            <span>{bottomImpact.journeys} journeys</span>
          </div>
        </div>
      </div>

    </div>
  );
});