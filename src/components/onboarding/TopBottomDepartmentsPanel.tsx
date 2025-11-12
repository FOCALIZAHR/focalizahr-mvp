'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, AlertTriangle, TrendingUp, Users } from 'lucide-react';

// ============================================
// TYPES
// ============================================
interface Department {
  name: string;
  avgEXOScore?: number;
  activeJourneys?: number;
  atRiskCount?: number;
}

interface TopBottomDepartmentsPanelProps {
  topDepartments: Department[];
  bottomDepartments: Department[];
}

// ============================================
// COMPONENT
// ============================================
export const TopBottomDepartmentsPanel = memo(function TopBottomDepartmentsPanel({ 
  topDepartments = [],
  bottomDepartments = []
}: TopBottomDepartmentsPanelProps) {
  
  // ========================================
  // RENDER
  // ========================================
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="fhr-card space-y-6"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-light text-white">
          Performance Departamental
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Top 3</span>
          <span>·</span>
          <span>Bottom 3</span>
        </div>
      </div>

      {/* TOP DEPARTAMENTOS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-green-400" />
          <h4 className="text-sm font-medium text-green-400 uppercase tracking-wide">
            Mejor Performance
          </h4>
        </div>

        {topDepartments.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            No hay datos disponibles aún
          </p>
        ) : (
          <div className="space-y-2">
            {topDepartments.slice(0, 3).map((dept, index) => (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="group p-3 rounded-lg bg-gradient-to-r from-green-500/5 to-transparent border border-green-500/10 hover:border-green-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  {/* NOMBRE + BADGE POSICIÓN */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-white">
                      {dept.name}
                    </span>
                  </div>

                  {/* MÉTRICAS */}
                  <div className="flex items-center gap-4">
                    {/* EXO Score */}
                    {dept.avgEXOScore !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <span className="text-sm font-bold text-green-400">
                          {dept.avgEXOScore}
                        </span>
                        <span className="text-xs text-slate-500">pts</span>
                      </div>
                    )}

                    {/* Active Journeys */}
                    {dept.activeJourneys !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-400">
                          {dept.activeJourneys}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* DIVIDER */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700/50"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-800 px-3 text-xs text-slate-500">
            Requieren atención
          </span>
        </div>
      </div>

      {/* BOTTOM DEPARTAMENTOS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <h4 className="text-sm font-medium text-amber-400 uppercase tracking-wide">
            Requieren Atención
          </h4>
        </div>

        {bottomDepartments.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            No hay alertas activas
          </p>
        ) : (
          <div className="space-y-2">
            {bottomDepartments.slice(0, 3).map((dept, index) => (
              <motion.div
                key={dept.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="group p-3 rounded-lg bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  {/* NOMBRE + BADGE WARNING */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20">
                      <AlertTriangle className="h-3 w-3 text-amber-400" />
                    </div>
                    <span className="text-sm font-medium text-white">
                      {dept.name}
                    </span>
                  </div>

                  {/* MÉTRICAS */}
                  <div className="flex items-center gap-4">
                    {/* EXO Score */}
                    {dept.avgEXOScore !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-amber-400">
                          {dept.avgEXOScore}
                        </span>
                        <span className="text-xs text-slate-500">pts</span>
                      </div>
                    )}

                    {/* At Risk Count */}
                    {dept.atRiskCount !== undefined && dept.atRiskCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 text-red-400" />
                        <span className="text-xs text-red-400 font-medium">
                          {dept.atRiskCount} en riesgo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER ACCIÓN */}
      <div className="pt-4 border-t border-slate-700/50">
        <button className="w-full py-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors font-light">
          Ver análisis completo departamental →
        </button>
      </div>
    </motion.div>
  );
});

TopBottomDepartmentsPanel.displayName = 'TopBottomDepartmentsPanel';