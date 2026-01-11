// ====================================================================
// PREVENTABLE SPLIT CARD - Exit Intelligence
// src/components/exit/hero/PreventableSplitCard.tsx
// Filosofia: Colapsable que muestra exits prevenibles vs estructurales
// ====================================================================

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle, Building2 } from 'lucide-react';

interface PreventableSplitCardProps {
  preventable: {
    percentage: number;
    amount: number;
    count: number;
    description: string;
  };
  structural: {
    percentage: number;
    amount: number;
    count: number;
    description: string;
  };
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

export default function PreventableSplitCard({
  preventable,
  structural,
  defaultExpanded = false
}: PreventableSplitCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="fhr-card overflow-hidden">
      {/* Header colapsable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/20 transition-colors"
      >
        <span className="text-sm font-medium text-slate-300">
          Analisis Prevenible vs Estructural
        </span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-0">

              {/* Prevenible */}
              <div className="p-4 rounded-xl bg-amber-500/5 border-l-4 border-amber-500">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                    Prevenible
                  </span>
                </div>

                <div className="text-3xl font-light text-white mb-1">
                  {preventable.percentage}%
                </div>

                <div className="text-lg font-light text-amber-300 mb-2">
                  {formatCLP(preventable.amount)}
                </div>

                <div className="text-xs text-slate-400">
                  {preventable.count} salidas · {preventable.description}
                </div>
              </div>

              {/* Estructural */}
              <div className="p-4 rounded-xl bg-slate-500/5 border-l-4 border-slate-500">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Estructural
                  </span>
                </div>

                <div className="text-3xl font-light text-white mb-1">
                  {structural.percentage}%
                </div>

                <div className="text-lg font-light text-slate-300 mb-2">
                  {formatCLP(structural.amount)}
                </div>

                <div className="text-xs text-slate-400">
                  {structural.count} salidas · {structural.description}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
