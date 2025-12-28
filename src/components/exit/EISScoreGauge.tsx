// src/components/exit/EISScoreGauge.tsx
// 🎯 Gauge Exit Intelligence Score - Contexto cuantitativo

'use client';

import { memo, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Colores por clasificación EIS
const EIS_COLORS = {
  toxic: '#EF4444',       // 0-25: Rojo
  problematic: '#F59E0B', // 26-50: Amber
  neutral: '#22D3EE',     // 51-70: Cyan
  healthy: '#10B981'      // 71-100: Verde
};

interface EISScoreGaugeProps {
  /** Score EIS 0-100 */
  score: number;
  /** Score del trigger (P6, etc.) */
  triggerScore?: number;
  /** Máximo del trigger */
  triggerMax?: number;
  /** Label del trigger */
  triggerLabel?: string;
  /** Umbral de alerta */
  threshold?: number;
}

export default memo(function EISScoreGauge({
  score,
  triggerScore,
  triggerMax = 5,
  triggerLabel = 'P6 Seguridad',
  threshold = 2.5
}: EISScoreGaugeProps) {
  
  const [displayValue, setDisplayValue] = useState(0);

  // Animación contador
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayValue(Math.round(score * 10) / 10);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current * 10) / 10);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [score]);

  // Clasificación y color
  const { color, classification } = useMemo(() => {
    if (score <= 25) return { color: EIS_COLORS.toxic, classification: 'TÓXICO' };
    if (score <= 50) return { color: EIS_COLORS.problematic, classification: 'PROBLEMÁTICO' };
    if (score <= 70) return { color: EIS_COLORS.neutral, classification: 'NEUTRAL' };
    return { color: EIS_COLORS.healthy, classification: 'SALUDABLE' };
  }, [score]);

  // Data para Recharts
  const gaugeData = [
    { value: score, color },
    { value: 100 - score, color: 'rgba(51, 65, 85, 0.3)' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="
        relative overflow-hidden rounded-2xl 
        border border-white/10 
        bg-gradient-to-b from-slate-800/40 to-slate-900/40 
        p-6 md:p-8 backdrop-blur-xl 
        shadow-[0_0_30px_rgba(34,211,238,0.1)]
      "
    >
      {/* Efecto decorativo */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-30"
        style={{ backgroundColor: color }}
      />
      
      <div className="text-center relative z-10">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">
          Exit Intelligence Score
        </h3>
        
        {/* GAUGE PRINCIPAL - 240px */}
        <div className="relative w-[240px] h-[240px] mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                startAngle={-90}
                endAngle={270}
                innerRadius="76%"
                outerRadius="92%"
                dataKey="value"
                stroke="none"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Número central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-5xl font-extralight tabular-nums"
              style={{ color }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {displayValue}
            </motion.span>
            <span className="text-base font-light text-slate-500 mt-1">/100</span>
            
            {/* Badge clasificación */}
            <span 
              className="text-xs font-semibold uppercase tracking-wider mt-3 px-3 py-1.5 rounded-full"
              style={{ 
                color, 
                backgroundColor: `${color}15`,
                border: `1px solid ${color}40`
              }}
            >
              {classification}
            </span>
          </div>
        </div>

        {/* TRIGGER SCORE (P6 Seguridad) */}
        {triggerScore !== undefined && (
          <div className="mt-6 pt-6 border-t border-slate-700/30">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              {triggerLabel}
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-light text-red-400">
                {triggerScore.toFixed(1)}
              </span>
              <span className="text-slate-500">/ {triggerMax}</span>
            </div>
            
            {/* Barra trigger */}
            <div className="w-36 h-2 bg-slate-700/50 rounded-full mx-auto mt-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(triggerScore / triggerMax) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            
            <p className="text-xs text-slate-600 mt-2">
              Umbral crítico: &lt; {threshold}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
});