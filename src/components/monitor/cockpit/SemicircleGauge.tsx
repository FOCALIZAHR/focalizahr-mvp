import React from 'react';
import { motion } from 'framer-motion';

interface SemicircleGaugeProps {
  value: number;
  status: 'acelerando' | 'desacelerando' | 'estable' | 'completado';
  size?: number;
  animated?: boolean;
}

export function SemicircleGauge({ 
  value, 
  status, 
  size = 120,
  animated = true 
}: SemicircleGaugeProps) {
  
  // 🎨 CONFIGURACIÓN COLORES DINÁMICOS
  const configs = {
    acelerando: {
      color: '#22D3EE',
      glow: 'rgba(34, 211, 238, 0.6)',
      gradient: 'linear-gradient(90deg, #22D3EE, #06B6D4)',
      bgColor: 'rgba(34, 211, 238, 0.1)'
    },
    desacelerando: {
      color: '#EF4444', 
      glow: 'rgba(239, 68, 68, 0.6)',
      gradient: 'linear-gradient(90deg, #EF4444, #DC2626)',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    },
    estable: {
      color: '#A78BFA',
      glow: 'rgba(167, 139, 250, 0.6)', 
      gradient: 'linear-gradient(90deg, #A78BFA, #8B5CF6)',
      bgColor: 'rgba(167, 139, 250, 0.1)'
    },
    completado: {
      color: '#10B981',
      glow: 'rgba(16, 185, 129, 0.6)',
      gradient: 'linear-gradient(90deg, #10B981, #059669)', 
      bgColor: 'rgba(16, 185, 129, 0.1)'
    }
  };

  const config = configs[status];
  
  // 🧮 CÁLCULOS SEMICÍRCULO
  const radius = (size - 20) / 2;
  const circumference = Math.PI * radius; // Solo semicírculo
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative flex flex-col items-center">
      {/* 🎯 SVG SEMICÍRCULO ESPECTACULAR */}
      <div 
        className="relative"
        style={{ width: size, height: size / 2 + 20 }}
      >
        <svg
          width={size}
          height={size / 2 + 20}
          className="transform rotate-0"
          style={{
            filter: `drop-shadow(0 0 20px ${config.glow})`
          }}
        >
          {/* Fondo semicírculo */}
          <path
            d={`M 10 ${size/2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size/2 + 10}`}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Progreso animado */}
          <motion.path
            d={`M 10 ${size/2 + 10} A ${radius} ${radius} 0 0 1 ${size - 10} ${size/2 + 10}`}
            fill="none"
            stroke={`url(#gradient-${status})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: animated ? strokeDashoffset : strokeDashoffset }}
            transition={{ 
              duration: animated ? 2 : 0, 
              ease: "easeInOut",
              delay: 0.5 
            }}
          />
          
          {/* Gradientes dinámicos */}
          <defs>
            <linearGradient id={`gradient-${status}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={config.color} stopOpacity="0.8" />
              <stop offset="50%" stopColor={config.color} stopOpacity="1" />
              <stop offset="100%" stopColor={config.color} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          
          {/* Punto indicador animado */}
          {animated && (
            <motion.circle
              cx={10 + (size - 20) * (value / 100)}
              cy={size/2 + 10}
              r="6"
              fill={config.color}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 2.2, duration: 0.5 }}
              style={{
                filter: `drop-shadow(0 0 10px ${config.glow})`,
              }}
            />
          )}
        </svg>

        {/* 🔥 VALOR CENTRAL ESPECTACULAR */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8, type: "spring" }}
          >
            <div 
              className="text-3xl font-bold mb-1"
              style={{ 
                color: config.color,
                textShadow: `0 0 20px ${config.glow}`,
                background: config.gradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              {value}
            </div>
            <div className="text-xs text-white/60 font-medium uppercase tracking-wider">
              {status}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 🌟 EFECTOS ADICIONALES */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full opacity-20"
          style={{ background: config.bgColor }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
}