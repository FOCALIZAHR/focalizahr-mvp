'use client';

import { memo } from 'react';

// ============================================
// TYPES
// ============================================
interface DepartmentRanking {
  name: string;
  avgEXOScore: number;
  activeJourneys?: number;
  atRiskCount?: number;
}

interface TopBottomDepartmentsSimpleProps {
  topDepartments: DepartmentRanking[];
  bottomDepartments: DepartmentRanking[];
}

// ============================================
// COMPONENT - MINIMALISTA PURO
// ============================================
export const TopBottomDepartmentsSimple = memo(function TopBottomDepartmentsSimple({ 
  topDepartments = [],
  bottomDepartments = []
}: TopBottomDepartmentsSimpleProps) {
  
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-lg overflow-hidden">
      
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-slate-800/50">
        <h3 className="text-base font-medium text-slate-200">Performance Departamental</h3>
        <p className="text-xs text-slate-500 mt-1">Top 3 · Bottom 3</p>
      </div>

      <div className="p-6 space-y-6">
        
        {/* TOP DEPARTAMENTOS */}
        <div className="space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
            Mejor Performance
          </p>

          {topDepartments.length === 0 ? (
            <p className="text-sm text-slate-600 italic py-2">
              No hay datos disponibles aún
            </p>
          ) : (
            <div className="space-y-2">
              {topDepartments.slice(0, 3).map((dept, index) => (
                <div
                  key={dept.name + index}
                  className="flex items-center justify-between py-2 border-b border-slate-800/30 last:border-0"
                >
                  {/* NOMBRE */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 font-mono w-4">
                      {index + 1}
                    </span>
                    <span className="text-sm text-slate-300 font-light">
                      {dept.name}
                    </span>
                  </div>

                  {/* MÉTRICAS */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extralight text-green-400 tabular-nums">
                      {Math.round(dept.avgEXOScore)}
                    </span>
                    <span className="text-xs text-slate-500">pts</span>
                    {dept.activeJourneys !== undefined && (
                      <span className="text-xs text-slate-600 ml-2">
                        · {dept.activeJourneys} activos
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DIVIDER */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/50"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-900/30 px-3 text-xs text-slate-600">
              Requieren atención
            </span>
          </div>
        </div>

        {/* BOTTOM DEPARTAMENTOS */}
        <div className="space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-medium">
            Requieren Atención
          </p>

          {bottomDepartments.length === 0 ? (
            <p className="text-sm text-slate-600 italic py-2">
              No hay alertas activas
            </p>
          ) : (
            <div className="space-y-2">
              {bottomDepartments.slice(0, 3).map((dept, index) => (
                <div
                  key={dept.name + index}
                  className={`flex items-center justify-between py-2 border-b border-slate-800/30 last:border-0 ${
                    dept.atRiskCount && dept.atRiskCount > 0 ? 'border-l-2 border-l-amber-500/50 pl-3' : ''
                  }`}
                >
                  {/* NOMBRE */}
                  <span className="text-sm text-slate-300 font-light">
                    {dept.name}
                  </span>

                  {/* MÉTRICAS */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extralight text-amber-400 tabular-nums">
                      {Math.round(dept.avgEXOScore)}
                    </span>
                    <span className="text-xs text-slate-500">pts</span>
                    {dept.atRiskCount !== undefined && dept.atRiskCount > 0 && (
                      <span className="text-xs text-red-400 ml-2">
                        · {dept.atRiskCount} en riesgo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
});

TopBottomDepartmentsSimple.displayName = 'TopBottomDepartmentsSimple';