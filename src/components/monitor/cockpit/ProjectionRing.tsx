import React from 'react';
import { motion } from 'framer-motion';

interface ProjectionRingProps {
  projection: number;
  confidence: number;
  size?: number;
  animated?: boolean;
}

export function ProjectionRing({ 
  projection, 
  confidence, 
  size = 140,
  animated = true 
}: ProjectionRingProps) {
  
  // 🎨 CONFIGURACIÓN COLORES DINÁMICOS
  const projectionColor = projection >= 90 ? '#10B981' : 
                         projection >= 70 ? '#22D3EE' : 
                         projection >= 50 ? '#F59E0B' : '#EF4444';
                         
  const confidenceColor = confidence >= 85 ? '#10B981' :
                         confidence >= 70 ? '#22D3EE' :
                         confidence >= 50 ? '#A78BFA' : '#EF4444';

  // 🧮 CÁLCULOS CÍRCULOS
  const outerRadius = (size - 20) / 2;
  const innerRadius = outerRadius - 15;
  const centerRadius = innerRadius - 20;
  
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;
  
  const projectionOffset = outerCircumference - (projection / 100) * outerCircumference;
  const confidenceOffset = innerCircumference - (confidence / 100) * innerCircumference;

  return (
    <div className="relative flex items-center justify-center">
      <div 
        className="relative"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          style={{
            filter: `drop-shadow(0 0 30px rgba(34, 211, 238, 0.4))`
          }}
        >
          {/* 🔮 CÍRCULO EXTERIOR - PROYECCIÓN */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={outerRadius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="3"
          />
          
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={outerRadius}
            fill="none"
            stroke={`url(#projectionGradient)`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={outerCircumference}
            initial={{ strokeDashoffset: outerCircumference }}
            animate={{ strokeDashoffset: animated ? projectionOffset : projectionOffset }}
            transition={{ 
              duration: animated ? 2.5 : 0, 
              ease: "easeInOut",
              delay: 0.3
            }}
          />
          
          {/* 💎 CÍRCULO INTERIOR - CONFIANZA */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={innerRadius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
          />
          
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={innerRadius}
            fill="none"
            stroke={`url(#confidenceGradient)`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={innerCircumference}
            initial={{ strokeDashoffset: innerCircumference }}
            animate={{ strokeDashoffset: animated ? confidenceOffset : confidenceOffset }}
            transition={{ 
              duration: animated ? 2 : 0, 
              ease: "easeInOut",
              delay: 0.8
            }}
          />

          {/* ✨ CENTRO PULSANTE */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={centerRadius}
            fill={`url(#centerGradient)`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          />

          {/* 🌟 GRADIENTES DINÁMICOS */}
          <defs>
            <linearGradient id="projectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={projectionColor} stopOpacity="1" />
              <stop offset="50%" stopColor={projectionColor} stopOpacity="0.8" />
              <stop offset="100%" stopColor={projectionColor} stopOpacity="0.4" />
            </linearGradient>
            
            <linearGradient id="confidenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={confidenceColor} stopOpacity="0.9" />
              <stop offset="100%" stopColor={confidenceColor} stopOpacity="0.3" />
            </linearGradient>
            
            <radialGradient id="centerGradient">
              <stop offset="0%" stopColor={projectionColor} stopOpacity="0.3" />
              <stop offset="70%" stopColor={projectionColor} stopOpacity="0.1" />
              <stop offset="100%" stopColor={projectionColor} stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* 🎯 VALORES CENTRALES ESPECTACULARES */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.8, type: "spring" }}
          >
            {/* Proyección principal */}
            <div 
              className="text-4xl font-bold mb-1"
              style={{ 
                color: projectionColor,
                textShadow: `0 0 20px ${projectionColor}40`,
                background: `linear-gradient(135deg, ${projectionColor}, ${projectionColor}80)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {projection}%
            </div>
            
            {/* Confianza secundaria */}
            <div 
              className="text-sm font-medium opacity-80"
              style={{ color: confidenceColor }}
            >
              {confidence}% conf.
            </div>
          </motion.div>
        </div>

        {/* 🌊 ONDAS EXPANSIVAS ANIMADAS */}
        {animated && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 opacity-30"
              style={{ borderColor: projectionColor }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 opacity-20"
              style={{ borderColor: confidenceColor }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.2, 0.05, 0.2]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </>
        )}
      </div>

      {/* 📋 ETIQUETAS INFORMATIVAS */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: projectionColor }}
            />
            <span className="text-white/60">Proyección</span>
          </div>
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: confidenceColor }}
            />
            <span className="text-white/60">Confianza</span>
          </div>
        </div>
      </div>
    </div>
  );
}