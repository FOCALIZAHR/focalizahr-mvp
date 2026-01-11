// ====================================================================
// ROOT CAUSES PANEL - Exit Intelligence
// src/components/exit/hero/RootCausesPanel.tsx
// Filosofia: Colapsable mostrando top 3 factores de salida
// ====================================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Target } from 'lucide-react';

interface RootCausesPanelProps {
  factors: Array<{
    factor: string;
    mentionRate: number;
    cost: number;
    avgScore: number;
  }>;
  defaultExpanded?: boolean;
}

function formatCLP(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(0)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString('es-CL')}`;
}

function getScoreColor(score: number): string {
  if (score >= 4) return 'text-emerald-400';
  if (score >= 3) return 'text-cyan-400';
  if (score >= 2) return 'text-amber-400';
  return 'text-red-400';
}

function getBarColor(score: number): string {
  if (score >= 4) return 'bg-emerald-500';
  if (score >= 3) return 'bg-cyan-500';
  if (score >= 2) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function RootCausesPanel({
  factors,
  defaultExpanded = false
}: RootCausesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Tomar solo top 3
  const topFactors = factors.slice(0, 3);

  return (
    <div className="fhr-card overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">
            Causas Raiz - Top 3 Factores
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
            <div className="p-4 pt-0 space-y-4">
              {topFactors.map((item, index) => (
                <div key={item.factor} className="space-y-2">
                  {/* Header del factor */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {item.factor}
                      </span>
                    </div>
                    <span className="text-sm text-slate-400">
                      {Math.round(item.mentionRate * 100)}% mencionado
                    </span>
                  </div>

                  {/* Barra de progreso */}
                  <div className="h-2 bg-slate-700/30 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${getBarColor(item.avgScore)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.mentionRate * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    />
                  </div>

                  {/* Metricas */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Costo estimado: <span className="text-amber-300">{formatCLP(item.cost)}</span>
                    </span>
                    <span className={getScoreColor(item.avgScore)}>
                      Score: {item.avgScore.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              ))}

              {topFactors.length === 0 && (
                <div className="text-center py-4 text-sm text-slate-500">
                  Sin datos de factores disponibles
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
