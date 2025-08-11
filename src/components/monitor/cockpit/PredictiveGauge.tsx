// ====================================================================
// PREDICTIVE GAUGE - GAUGE INTEGRADO PARA VISTA PREDICTIVA  
// src/components/monitor/cockpit/PredictiveGauge.tsx
// RESPONSABILIDAD: Visualización gauge simple para proyecciones
// ====================================================================

"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface PredictiveGaugeProps {
  currentValue: number;
  targetValue: number;
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
}

export function PredictiveGauge({ 
  currentValue, 
  targetValue, 
  confidence,
  size = 'md' 
}: PredictiveGaugeProps) {
  
  // 📏 CONFIGURACIÓN POR TAMAÑO
  const sizeConfig = {
    sm: { width: 100, height: 50, fontSize: 'text-sm', strokeWidth: 8 },
    md: { width: 140, height: 70, fontSize: 'text-base', strokeWidth: 12 },
    lg: { width: 180, height: 90, fontSize: 'text-lg', strokeWidth: 16 }
  };

  const config = sizeConfig[size];

  // 🎨 COLORES DINÁMICOS SEGÚN CONFIANZA
  const getConfidenceColor = () => {
    if (confidence >= 80) return '#10B981'; // Verde - alta confianza
    if (confidence >= 60) return '#F59E0B'; // Amarillo - media confianza  
    return '#EF4444'; // Rojo - baja confianza
  };

  const confidenceColor = getConfidenceColor();

  // 📊 DATOS PARA SEMICÍRCULO
  const progress = Math.min((currentValue / targetValue) * 100, 100);
  
  const gaugeData = [
    { 
      name: 'progress', 
      value: progress, 
      color: confidenceColor 
    },
    { 
      name: 'remaining', 
      value: 100 - progress, 
      color: 'rgba(255, 255, 255, 0.1)' 
    }
  ];

  // 🎯 INDICADOR ESTADO PROYECCIÓN
  const getProjectionStatus = () => {
    if (currentValue >= targetValue) return '✅ Objetivo alcanzado';
    if (progress >= 80) return '🎯 Muy cerca del objetivo';
    if (progress >= 60) return '📈 En buen camino';
    return '🚀 Necesita impulso';
  };

  return (
    <div className="relative flex flex-col items-center w-full">
      {/* 📊 SEMICÍRCULO GAUGE */}
      <div 
        className="relative"
        style={{ width: config.width, height: config.height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="85%" // Posición para crear semicírculo
              startAngle={180} // Inicio semicírculo
              endAngle={0}     // Fin semicírculo
              innerRadius={config.strokeWidth}
              outerRadius={config.height - 8}
              paddingAngle={1}
              dataKey="value"
              stroke="none"
            >
              {gaugeData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* 🎯 PROGRESO CENTRAL */}
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, type: "spring" }}
          >
            <div 
              className={`${config.fontSize} font-bold text-white`}
              style={{ color: confidenceColor }}
            >
              {Math.round(progress)}%
            </div>
          </motion.div>
        </div>
      </div>

      {/* 📋 INFORMACIÓN PROYECCIÓN */}
      <div className="mt-2 text-center w-full">
        <div className="text-xs text-white/60 leading-tight">
          {currentValue}% → {targetValue}%
        </div>
        <div 
          className="text-xs mt-1 px-2 py-1 rounded-full"
          style={{ 
            backgroundColor: `${confidenceColor}20`, 
            color: confidenceColor,
            border: `1px solid ${confidenceColor}40`
          }}
        >
          {getProjectionStatus()}
        </div>
      </div>
    </div>
  );
}