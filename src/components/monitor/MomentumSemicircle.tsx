import React from 'react';
import { motion } from 'framer-motion';

interface MomentumSemicircleProps {
  value: number;
  trend: string;
  velocity: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  animated?: boolean;
}

export function MomentumSemicircle({ 
  value, 
  trend, 
  velocity, 
  size = 'md',
  showLabels = true,
  animated = true
}: MomentumSemicircleProps) {
  
  // 🎯 CÁLCULOS VISUALES
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  const angle = (normalizedValue / 100) * 180;
  const velocityIntensity = Math.min(Math.abs(velocity), 10) / 10;
  
  // 📏 TAMAÑOS RESPONSIVOS
  const sizeConfig = {
    sm: { radius: 40, strokeWidth: 4, fontSize: 'text-xs' },
    md: { radius: 60, strokeWidth: 6, fontSize: 'text-sm' },
    lg: { radius: 80, strokeWidth: 8, fontSize: 'text-base' }
  };
  
  const { radius, strokeWidth, fontSize } = sizeConfig[size];
  const circumference = Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;
  
  // 🎨 COLORES DINÁMICOS BASADOS EN TREND
  const getTrendColor = () => {
    switch (trend.toLowerCase()) {
      case 'acelerando': return '#10B981'; // Verde
      case 'completado': return '#22D3EE'; // Cyan
      case 'estable': return '#F59E0B'; // Amber
      case 'desacelerando': return '#EF4444'; // Rojo
      default: return '#A78BFA'; // Purple
    }
  };
  
  const trendColor = getTrendColor();
  
  // ⚡ EFECTOS VISUALES SEGÚN VELOCIDAD
  const getVelocityEffects = () => {
    if (velocity > 5) return 'neural-pulse'; // Alta velocidad
    if (velocity > 2) return 'momentum-flow'; // Velocidad media
    return ''; // Velocidad baja
  };
  
  return (
    <div className="flex flex-col items-center space-y-3">
      {/* 🎯 SEMICÍRCULO PRINCIPAL */}
      <div className="relative">
        {/* Contenedor SVG con efectos */}
        <div className={`relative ${getVelocityEffects()}`}>
          <svg
            width={radius * 2 + 20}
            height={radius + 20}
            className="transform -rotate-180"
            style={{ filter: `drop-shadow(0 0 20px ${trendColor}40)` }}
          >
            {/* Fondo del arco */}
            <path
              d={`M 10 ${radius + 10} A ${radius} ${radius} 0 0 1 ${radius * 2 + 10} ${radius + 10}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            
            {/* Arco de progreso animado */}
            <motion.path
              d={`M 10 ${radius + 10} A ${radius} ${radius} 0 0 1 ${radius * 2 + 10} ${radius + 10}`}
              fill="none"
              stroke={`url(#momentum-gradient-${trend})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={animated ? strokeDashoffset : 0}
              initial={{ strokeDashoffset: strokeDasharray }}
              animate={{ strokeDashoffset: strokeDashoffset }}
              transition={{ 
                duration: animated ? 2 : 0, 
                ease: "easeOut",
                delay: 0.5 
              }}
            />
            
            {/* Gradientes dinámicos */}
            <defs>
              <linearGradient id={`momentum-gradient-${trend}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={trendColor} stopOpacity="0.8" />
                <stop offset="50%" stopColor="#22D3EE" stopOpacity="1" />
                <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            
            {/* Indicador de posición actual */}
            <motion.circle
              cx={10 + Math.cos((180 - angle) * Math.PI / 180) * radius}
              cy={radius + 10 - Math.sin((180 - angle) * Math.PI / 180) * radius}
              r={strokeWidth / 2 + 2}
              fill={trendColor}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              style={{
                boxShadow: `0 0 20px ${trendColor}`,
                filter: `drop-shadow(0 0 10px ${trendColor})`
              }}
            />
          </svg>
          
          {/* Valor central */}
          <motion.div 
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
          >
            <div className={`font-bold text-white ${fontSize === 'text-xs' ? 'text-lg' : fontSize === 'text-sm' ? 'text-2xl' : 'text-3xl'}`}>
              {normalizedValue.toFixed(0)}%
            </div>
            {velocity !== 0 && (
              <div className={`font-medium text-center ${fontSize}`} style={{ color: trendColor }}>
                {velocity > 0 ? '+' : ''}{velocity.toFixed(1)}%/d
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Efectos de partículas para alta velocidad */}
        {velocity > 5 && animated && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-70"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${30 + Math.random() * 40}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.8, 0],
                  x: [0, (Math.random() - 0.5) * 40],
                  y: [0, (Math.random() - 0.5) * 40],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 📊 LABELS INFORMATIVOS */}
      {showLabels && (
        <motion.div 
          className="text-center space-y-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <div className={`font-semibold ${fontSize}`} style={{ color: trendColor }}>
            {trend.charAt(0).toUpperCase() + trend.slice(1)}
          </div>
          {velocityIntensity > 0.3 && (
            <div className={`text-white/60 ${fontSize === 'text-xs' ? 'text-xs' : 'text-sm'}`}>
              Intensidad: {(velocityIntensity * 100).toFixed(0)}%
            </div>
          )}
        </motion.div>
      )}
      
      {/* 🎯 INDICADORES DE ZONA */}
      <div className="flex justify-between w-full max-w-[120px] text-xs text-white/40">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
}