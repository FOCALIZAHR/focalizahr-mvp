// src/components/exit/EmblamaticCasesPanel.tsx
// 🎯 Casos Emblemáticos - Boeing, Uber, etc.

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Building2, AlertOctagon, Lightbulb } from 'lucide-react';
import type { EmblamaticCase } from '@/types/ExitBusinessCase';

interface EmblamaticCasesPanelProps {
  /** Array de casos emblemáticos */
  cases: EmblamaticCase[];
  /** Estadística principal destacada */
  statistic?: {
    value: string;
    description: string;
    source: string;
  };
}

export default memo(function EmblamaticCasesPanel({
  cases,
  statistic
}: EmblamaticCasesPanelProps) {
  
  if (!cases || cases.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p className="text-sm">No hay casos emblemáticos disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      
      {/* Mensaje introductorio fijo */}
      <p className="text-slate-400 text-sm text-center mb-6">
        Empresas que ignoraron señales similares:
      </p>

      {/* Lista de casos */}
      <div className="space-y-4">
        {cases.map((caso, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className="
              p-4 rounded-xl
              bg-slate-800/30 
              border-l-2 border-red-500/50
              hover:bg-slate-800/50 transition-colors
            "
          >
            {/* Header: Empresa + Año */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-500/10 rounded-lg">
                  <Building2 className="h-4 w-4 text-red-400" />
                </div>
                <h4 className="text-white font-medium">{caso.company}</h4>
              </div>
              <span className="text-xs text-slate-500">{caso.year}</span>
            </div>

            {/* Incidente */}
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              {caso.incident}
            </p>

            {/* Costo + Consecuencia */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-3.5 w-3.5 text-red-400" />
                <span className="text-red-400 text-sm font-medium">{caso.cost}</span>
              </div>
              {caso.consequence && (
                <>
                  <span className="hidden sm:block text-slate-600">·</span>
                  <span className="text-slate-500 text-xs">{caso.consequence}</span>
                </>
              )}
            </div>

            {/* Lección */}
            <div className="mt-3 pt-3 border-t border-slate-700/30">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-400/80 text-xs italic leading-relaxed">
                  {caso.lesson}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Estadística principal */}
      {statistic && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4 mt-4">
          <p className="text-center">
            <span className="text-yellow-400 text-3xl font-bold">
              {statistic.value}
            </span>
            <span className="text-slate-300 block mt-1">
              {statistic.description}
            </span>
            <span className="text-slate-500 text-xs">
              — {statistic.source}
            </span>
          </p>
        </div>
      )}
    </div>
  );
});