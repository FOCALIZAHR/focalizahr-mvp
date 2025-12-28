// src/components/exit/RevelationCard.tsx
// 🎯 PROTAGONISTA - La pregunta es el corazón emocional de la asesoría

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, Quote } from 'lucide-react';

interface RevelationCardProps {
  /** Summary personalizado: "Un colaborador de X, que dejó Y..." */
  summary: string;
  /** La pregunta exacta del survey */
  questionText: string;
  /** ID de la pregunta (P6, EIS, etc.) */
  questionId: string;
  /** Score obtenido */
  scoreValue: number;
  /** Máximo posible */
  scoreMax: number;
  /** Interpretación: "Esta calificación indica que..." */
  interpretation: string;
  /** Disclaimer legal opcional */
  disclaimer?: string;
}

export default memo(function RevelationCard({
  summary,
  questionText,
  questionId,
  scoreValue,
  scoreMax,
  interpretation,
  disclaimer
}: RevelationCardProps) {
  
  const percent = (scoreValue / scoreMax) * 100;
  
  // Color según score (invertido: bajo = malo en este contexto)
  const getScoreColor = () => {
    if (percent <= 40) return { bar: 'from-red-500 to-orange-500', text: 'text-red-400' };
    if (percent <= 60) return { bar: 'from-amber-500 to-yellow-500', text: 'text-amber-400' };
    return { bar: 'from-cyan-500 to-emerald-500', text: 'text-cyan-400' };
  };
  
  const colors = getScoreColor();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="
        relative overflow-hidden w-full
        bg-slate-900/40 backdrop-blur-xl
        border border-slate-700/50 rounded-2xl 
        p-6 md:p-8
      "
    >
      {/* Efecto decorativo superior */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-br from-red-500/5 to-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-xl">
            <Lightbulb className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
              La Pregunta que Activó Esta Alerta
            </h2>
            <p className="text-xs text-slate-500">{questionId}</p>
          </div>
        </div>

        {/* Línea decorativa */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>

        {/* Summary - La historia humana */}
        <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6">
          {summary}
        </p>

        {/* Blockquote Premium - La pregunta exacta */}
        <blockquote className="
          relative pl-5 py-4 mb-6
          border-l-2 border-cyan-500/60
          bg-gradient-to-r from-cyan-500/5 via-cyan-500/3 to-transparent
          rounded-r-xl
        ">
          <Quote className="absolute top-3 left-2 w-3 h-3 text-cyan-500/40" />
          <p className="text-sm md:text-base text-slate-200 italic leading-relaxed pl-2">
            "{questionText}"
          </p>
        </blockquote>

        {/* Score Visual */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 bg-slate-800/30 rounded-xl">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Calificación:</span>
            <span className={`text-2xl font-light ${colors.text}`}>
              {scoreValue.toFixed(1)}
            </span>
            <span className="text-slate-500">/ {scoreMax}</span>
          </div>
          
          <div className="flex-1">
            <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${colors.bar} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-slate-600">0</span>
              <span className="text-xs text-slate-500">{Math.round(percent)}%</span>
              <span className="text-[10px] text-slate-600">{scoreMax}</span>
            </div>
          </div>
        </div>

        {/* Interpretación */}
        <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 mb-4">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-cyan-500/10 rounded-lg mt-0.5">
              <Lightbulb className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                Qué significa
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {interpretation}
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer (si existe) */}
        {disclaimer && (
          <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400/80 leading-relaxed">
              {disclaimer}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
});