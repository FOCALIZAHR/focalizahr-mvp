// ====================================================================
// MOMENTUM DRIVERS CARD - Tab Resumen Card #2
// src/components/onboarding/MomentumDriversCard.tsx
// 🎯 Muestra top/bottom departamentos de forma compacta y premium
// ====================================================================

'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface Department {
  id?: string;
  name: string;
  avgEXOScore: number;
  activeJourneys?: number;
  atRiskCount?: number;
}

interface MomentumDriversCardProps {
  topDepartment: Department | null;
  bottomDepartment: Department | null;
}

export default function MomentumDriversCard({ 
  topDepartment, 
  bottomDepartment 
}: MomentumDriversCardProps) {
  
  // Si no hay datos
  if (!topDepartment && !bottomDepartment) {
    return (
      <div className="fhr-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-slate-800/50 rounded-lg">
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </div>
          <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Balance Departamental
          </h4>
        </div>
        <p className="text-sm text-slate-400 text-center py-4">
          Sin datos suficientes para análisis
        </p>
      </div>
    );
  }

  return (
    <div className="fhr-card">
      
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-gradient-to-br from-green-500/20 to-red-500/20 rounded-lg">
          <TrendingUp className="h-4 w-4 text-purple-400" />
        </div>
        <h4 className="text-xs uppercase tracking-wider text-purple-400/70 font-semibold">
          Balance Departamental
        </h4>
      </div>

      <div className="space-y-3">
        
        {/* MAYOR IMPULSO */}
        {topDepartment && (
          <div className="flex items-start gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-white truncate">
                  {topDepartment.name}
                </p>
                <span className="text-green-400 font-semibold text-sm whitespace-nowrap">
                  {topDepartment.avgEXOScore.toFixed(1)} pts
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {topDepartment.activeJourneys || 0} journey{(topDepartment.activeJourneys || 0) !== 1 ? 's' : ''} activo{(topDepartment.activeJourneys || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {/* SEPARATOR si hay ambos */}
        {topDepartment && bottomDepartment && (
          <div className="border-t border-slate-800/50" />
        )}

        {/* MAYOR ARRASTRE */}
        {bottomDepartment && (
          <div className="flex items-start gap-2">
            <TrendingDown className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <p className="text-sm font-medium text-white truncate">
                  {bottomDepartment.name}
                </p>
                <span className="text-red-400 font-semibold text-sm whitespace-nowrap">
                  {bottomDepartment.avgEXOScore.toFixed(1)} pts
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {bottomDepartment.atRiskCount || 0} en riesgo · {bottomDepartment.activeJourneys || 0} journeys
              </p>
            </div>
          </div>
        )}

      </div>

      {/* FOOTER - Explicación rápida */}
      <div className="mt-4 pt-3 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-500 text-center">
          {topDepartment && bottomDepartment 
            ? 'Mayor contraste departamental en experiencia de ingreso'
            : topDepartment 
              ? 'Mejor desempeño departamental'
              : 'Departamento requiere mayor atención'}
        </p>
      </div>

    </div>
  );
}