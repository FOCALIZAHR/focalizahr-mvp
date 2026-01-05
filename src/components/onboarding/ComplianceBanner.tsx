// src/components/onboarding/ComplianceBanner.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Users, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ComplianceEfficiencyMatrix from './ComplianceEfficiencyMatrix';
import type { ComplianceEfficiencyData } from '@/types/onboarding';

interface ComplianceBannerProps {
  departments: ComplianceEfficiencyData[];
  loading?: boolean;
}

export default function ComplianceBanner({ 
  departments, 
  loading 
}: ComplianceBannerProps) {
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calcular métricas
  const total = departments?.length || 0;
  const avgCompliance = total > 0
    ? Math.round(departments.reduce((acc, d) => acc + d.compliance, 0) / total)
    : 0;
  const totalOverdue = departments?.reduce((acc, d) => acc + d.overdue, 0) || 0;
  const totalOk = departments?.reduce((acc, d) => acc + d.responded, 0) || 0;

  if (!departments || departments.length === 0) {
    return null;
  }

  // Color compliance
  const getComplianceColor = (value: number) => {
    if (value >= 80) return 'text-cyan-400';
    if (value >= 60) return 'text-slate-300';
    return 'text-amber-400';
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      
      {/* Línea Tesla */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-purple-400/50 to-transparent mb-4" />
      
      {/* Banner - COPIANDO EXACTAMENTE el patrón de OnboardingScoreClassificationCard */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full
          relative
          bg-slate-800/30
          border border-slate-700/40
          rounded-lg
          px-4 sm:px-6 py-4
          overflow-hidden
          transition-all duration-300 ease-out
          hover:bg-slate-900/50
          hover:border-slate-600/50
          group
          cursor-pointer
        "
      >
        
        <div className="relative flex items-center justify-between gap-4">
          
          {/* Izquierda: Ícono + Métricas */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            
            {/* Ícono */}
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg flex-shrink-0">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            
            {/* Texto */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
              
              <span className="text-sm font-semibold text-slate-200">
                Compliance Equipos ({total})
              </span>
              
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm">
                
                <span className="hidden sm:inline text-slate-600">·</span>
                
                {totalOk > 0 && (
                  <span className="font-medium text-emerald-400">
                    {totalOk} al día
                  </span>
                )}
                
                {totalOverdue > 0 && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {totalOverdue} requieren atención
                    </span>
                  </>
                )}
                
                <span className="text-slate-600">·</span>
                <span className={`font-semibold ${getComplianceColor(avgCompliance)}`}>
                  {avgCompliance}% compliance
                </span>
              </div>
            </div>
          </div>

          {/* Derecha: Chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <ChevronDown 
              className="h-5 w-5 text-slate-400 group-hover:text-cyan-400 transition-colors"
            />
          </motion.div>
        </div>
      </button>

      {/* Contenido expandido */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 bg-slate-800/30 border border-slate-700/40 rounded-lg p-4 sm:p-6">
              <ComplianceEfficiencyMatrix
                departments={departments}
                loading={loading}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}