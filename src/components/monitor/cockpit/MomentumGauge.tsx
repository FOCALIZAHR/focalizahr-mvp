// ====================================================================
// MOMENTUM GAUGE - SEMICÍRCULO TACÓMETRO CON RECHARTS
// src/components/monitor/cockpit/MomentumGauge.tsx
// RESPONSABILIDAD: Visualización tacómetro momentum departamental
// ====================================================================

"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface MomentumGaugeProps {
  momentum: number; // Score 0-100
  trend: 'completado' | 'acelerando' | 'estable' | 'desacelerando';
  departmentName: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MomentumGauge({ 
  momentum, 
  trend, 
  departmentName, 
  size = 'md' 
}: MomentumGaugeProps) {
  
  // 🎨 COLORES DINÁMICOS POR TREND
  const getTrendColor = () => {
    switch (trend) {
      case 'completado': return '#22D3EE'; // --focalizahr-cyan
      case 'acelerando': return '#10B981'; // --focalizahr-success  
      case 'estable': return '#F59E0B'; // --focalizahr-warning
      case 'desacelerando': return '#EF4444'; // --focalizahr-error
      default: return '#64748B'; // gray
    }
  };

  // 📏 CONFIGURACIÓN POR TAMAÑO
  const sizeConfig = {
    sm: { width: 120, height: 60, fontSize: 'text-lg', strokeWidth: 12 },
    md: { width: 160, height: 80, fontSize: 'text-xl', strokeWidth: 16 },
    lg: { width: 200, height: 100, fontSize: 'text-2xl', strokeWidth: 20 }
  };

  const config = sizeConfig[size];
  const trendColor = getTrendColor();

  // 📊 DATOS PARA SEMICÍRCULO
  const gaugeData = [
    { 
      name: 'momentum', 
      value: momentum, 
      color: trendColor 
    },
    { 
      name: 'remaining', 
      value: 100 - momentum, 
      color: 'rgba(255, 255, 255, 0.1)' 
    }
  ];

  // 🎯 INDICADOR TEXTO TREND
  const getTrendText = () => {
    switch (trend) {
      case 'completado': return '✅ Completado';
      case 'acelerando': return '🚀 Acelerando';
      case 'estable': return '⚡ Estable';
      case 'desacelerando': return '⚠️ Ralentizando';
      default: return '📊 Analizando';
    }
  };

  return (
    <div className="relative flex flex-col items-center">
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
              outerRadius={config.height - 10}
              paddingAngle={2}
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

        {/* 🎯 NÚMERO CENTRAL */}
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          <motion.div
            className="text-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: "spring" }}
          >
            <div 
              className={`${config.fontSize} font-bold text-white neural-glow`}
              style={{ color: trendColor }}
            >
              {momentum}
            </div>
            <div className="text-xs text-white/60 -mt-1">
              momentum
            </div>
          </motion.div>
        </div>
      </div>

      {/* 📋 INFORMACIÓN DEPARTAMENTO */}
      <div className="mt-3 text-center">
        <div className="text-sm font-medium text-white mb-1">
          {departmentName}
        </div>
        <div 
          className="text-xs px-2 py-1 rounded-full"
          style={{ 
            backgroundColor: `${trendColor}20`, 
            color: trendColor,
            border: `1px solid ${trendColor}40`
          }}
        >
          {getTrendText()}
        </div>
      </div>
    </div>
  );
}