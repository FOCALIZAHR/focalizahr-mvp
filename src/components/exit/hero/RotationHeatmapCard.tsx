// ====================================================================
// ROTATION HEATMAP CARD - Exit Intelligence
// src/components/exit/hero/RotationHeatmapCard.tsx
// Filosofia: Colapsable con mapa de calor por departamentos segun EIS
// ====================================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Flame } from 'lucide-react';

interface RotationHeatmapCardProps {
  departments: Array<{
    departmentId: string;
    departmentName: string;
    avgEIS: number | null;
    totalExits: number;
    eisClassification: 'healthy' | 'neutral' | 'problematic' | 'toxic' | null;
  }>;
  defaultExpanded?: boolean;
}

function getEISStyles(classification: string | null, avgEIS: number | null): {
  bg: string;
  border: string;
  text: string;
} {
  // Priorizar clasificacion, fallback a score
  const effectiveClass = classification || getClassificationFromScore(avgEIS);

  switch (effectiveClass) {
    case 'toxic':
      return { bg: 'bg-red-500/10', border: 'border-red-500/50', text: 'text-red-400' };
    case 'problematic':
      return { bg: 'bg-amber-500/10', border: 'border-amber-500/50', text: 'text-amber-400' };
    case 'neutral':
      return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400' };
    case 'healthy':
      return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', text: 'text-emerald-400' };
    default:
      return { bg: 'bg-slate-500/10', border: 'border-slate-500/50', text: 'text-slate-400' };
  }
}

function getClassificationFromScore(score: number | null): string | null {
  if (score === null) return null;
  if (score < 25) return 'toxic';
  if (score < 50) return 'problematic';
  if (score < 70) return 'neutral';
  return 'healthy';
}

export default function RotationHeatmapCard({
  departments,
  defaultExpanded = false
}: RotationHeatmapCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Ordenar por EIS (peores primero)
  const sortedDepartments = [...departments]
    .filter(d => d.totalExits > 0)
    .sort((a, b) => (a.avgEIS ?? 100) - (b.avgEIS ?? 100));

  return (
    <div className="fhr-card overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-medium text-slate-300">
            Mapa de Calor - Gerencias
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </motion.div>
      </button>

      {/* Contenido colapsable */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-4 pt-0">
              {/* Leyenda */}
              <div className="flex flex-wrap gap-3 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <span className="text-slate-400">Toxico (&lt;25)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <span className="text-slate-400">Problematico (25-49)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <span className="text-slate-400">Neutral (50-69)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  <span className="text-slate-400">Saludable (70+)</span>
                </div>
              </div>

              {/* Grid de badges */}
              <div className="flex flex-wrap gap-2">
                {sortedDepartments.map((dept, index) => {
                  const styles = getEISStyles(dept.eisClassification, dept.avgEIS);

                  return (
                    <motion.div
                      key={dept.departmentId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        px-3 py-2 rounded-lg border
                        ${styles.bg} ${styles.border}
                        transition-all hover:scale-105
                      `}
                    >
                      <div className={`text-xs font-medium ${styles.text}`}>
                        {dept.departmentName}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-light ${styles.text}`}>
                          {dept.avgEIS !== null ? dept.avgEIS.toFixed(0) : '--'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {dept.totalExits} exit{dept.totalExits !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}

                {sortedDepartments.length === 0 && (
                  <div className="w-full text-center py-4 text-sm text-slate-500">
                    Sin datos de departamentos con salidas
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
