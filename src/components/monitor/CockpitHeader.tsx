// ====================================================================
// FOCALIZAHR COCKPIT HEADER - VELOCÍMETRO TESLA FOCO ABSOLUTO
// src/components/monitor/CockpitHeader.tsx  
// Chat 30: DEMOLICIÓN Y RECONSTRUCCIÓN - MINIMALISMO RADICAL TESLA
// ====================================================================

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import '@/styles/focalizahr-design-system.css';
import type { CampaignMonitorData } from '@/hooks/useCampaignMonitor';

// ✅ INTERFACE PROPS - COMPONENTE "TONTO"
interface CockpitHeaderProps {
  monitorData: CampaignMonitorData;
}

// 🎯 VELOCÍMETRO TESLA - FOCO ABSOLUTO RADICAL
const CockpitHeader: React.FC<CockpitHeaderProps> = ({ monitorData }) => {
  const { 
    participationRate, 
    isLoading,
    participationPrediction,
    daysRemaining 
  } = monitorData;

  // 🎯 MÉTRICA ESTRELLA DEL NORTE - ÚNICA Y ABSOLUTA
  const starMetric = Math.round(participationRate);

  // 🧠 VELOCIDAD SECUNDARIA - SUTIL
  const velocity = participationPrediction?.velocity || 0;

  // 🎯 LOADING STATE MINIMALISTA
  if (isLoading) {
    return (
      <div className="fhr-card w-full h-[28rem] flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-white/20 border-t-[var(--focalizahr-cyan)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.23, 1, 0.320, 1] }}
      className="fhr-card w-full h-[28rem] flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* 🌟 AURA NEURAL CORPORATIVA SUTIL */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, var(--focalizahr-cyan) 0%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />

      {/* 🎯 VELOCÍMETRO PRINCIPAL - DOMINANCIA VISUAL ABSOLUTA */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* ⚡ VELOCÍMETRO TESLA - TAMAÑO AUMENTADO 40% */}
        <div className="relative w-80 h-80 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="90%"
              data={[{ value: starMetric }]}
              startAngle={90}
              endAngle={450}
            >
              {/* 🔘 TRACK BACKGROUND ULTRA SUTIL */}
              <RadialBar
                dataKey="value"
                cornerRadius={16}
                fill="rgba(71, 85, 105, 0.08)"
                background={{ 
                  fill: 'rgba(71, 85, 105, 0.04)',
                  cornerRadius: 16 
                }}
                data={[{ value: 100 }]}
              />
              
              {/* ⚡ ARCO PRINCIPAL - GRADIENTE CORPORATIVO OBLIGATORIO */}
              <RadialBar
                dataKey="value"
                cornerRadius={16}
                fill="url(#focalizahrGradient)"
                style={{
                  filter: 'drop-shadow(var(--fhr-glow-neural))',
                }}
              />

              {/* 🌈 GRADIENTE CORPORATIVO DEFINIDO */}
              <defs>
                <linearGradient id="focalizahrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--focalizahr-cyan)" />
                  <stop offset="100%" stopColor="var(--focalizahr-purple)" />
                </linearGradient>
              </defs>
            </RadialBarChart>
          </ResponsiveContainer>

          {/* 🎯 CENTRO TESLA - JERARQUÍA VISUAL ABSOLUTA */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {/* ⭐ MÉTRICA ESTRELLA DEL NORTE - DOMINANCIA TOTAL */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8, type: 'spring', stiffness: 120 }}
                className="relative mb-4"
              >
                <div 
                  className="text-8xl font-thin text-white tracking-tight"
                  style={{
                    textShadow: 'var(--fhr-glow-cyan)',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {starMetric}
                </div>
                <div className="text-2xl text-white/30 font-light -mt-4">%</div>
              </motion.div>

              {/* 🎭 DATO SECUNDARIO - CLARAMENTE SUBORDINADO */}
              {velocity > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.6 }}
                  className="text-sm font-light text-white/60"
                  style={{ letterSpacing: '0.02em' }}
                >
                  +{velocity.toFixed(1)} resp/día
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* 🎛️ HUD TESLA - INFORMACIÓN PERIFÉRICA SUTIL */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="w-full max-w-sm flex justify-between items-center px-4"
        >
          {/* Meta Sutil */}
          <div className="text-center">
            <div className="text-2xl font-light text-white/60">70</div>
            <div className="text-xs font-light text-white/40 uppercase tracking-[0.15em]">
              Meta
            </div>
          </div>

          {/* Días Restantes Sutil */}
          <div className="text-center">
            <div className="text-2xl font-light text-white/60">
              {daysRemaining}
            </div>
            <div className="text-xs font-light text-white/40 uppercase tracking-[0.15em]">
              Días
            </div>
          </div>
        </motion.div>
      </div>

      {/* ✨ GLOW NEURAL PREMIUM REFINADO */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: 'var(--focalizahr-gradient)',
          filter: 'blur(120px)',
        }}
      />
    </motion.div>
  );
};

export default CockpitHeader;