// ====================================================================
// FOCALIZAHR PREDICTIVE GAUGE - VELOCÍMETRO PREMIUM NÚCLEO PREDICTIVO
// src/components/monitor/cockpit/PredictiveGauge.tsx
// Chat 2: Velocímetro circular con animaciones para proyección final
// ====================================================================

"use client";

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PredictiveGaugeProps {
  value: number;
  confidence: number;
  maxValue?: number;
  size?: number;
  showAnimation?: boolean;
}

export function PredictiveGauge({ 
  value, 
  confidence, 
  maxValue = 100, 
  size = 120,
  showAnimation = true 
}: PredictiveGaugeProps) {
  
  // 🎯 CÁLCULOS PARA VELOCÍMETRO
  const percentage = Math.min(value, maxValue);
  const confidenceLevel = Math.min(confidence, 100);
  
  // 🎨 COLORES BASADOS EN VALOR
  const getColor = (val: number) => {
    if (val >= 80) return '#10B981'; // green-500
    if (val >= 60) return '#22D3EE'; // cyan-400  
    if (val >= 40) return '#F59E0B'; // amber-500
    return '#EF4444'; // red-500
  };

  // 📊 DATOS PARA RECHARTS
  const data = [
    { name: 'Progress', value: percentage, fill: getColor(percentage) },
    { name: 'Remaining', value: maxValue - percentage, fill: 'rgba(255,255,255,0.1)' }
  ];

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* 📊 VELOCÍMETRO CIRCULAR RECHARTS */}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius={size * 0.25}
            outerRadius={size * 0.4}
            strokeWidth={0}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* 🎯 INDICADOR CENTRAL */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="text-2xl font-bold text-cyan-400"
            initial={showAnimation ? { scale: 0, opacity: 0 } : {}}
            animate={showAnimation ? { scale: 1, opacity: 1 } : {}}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          >
            {value}%
          </motion.div>
          <motion.div
            className="text-xs text-cyan-300"
            initial={showAnimation ? { opacity: 0 } : {}}
            animate={showAnimation ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 }}
          >
            {confidence}% conf.
          </motion.div>
        </div>
      </div>

      {/* ✨ ANILLOS DECORATIVOS ANIMADOS */}
      {showAnimation && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border border-cyan-400/20"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border border-cyan-400/10"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 1.3 }}
          />
        </>
      )}

      {/* 🔮 PARTÍCULAS NEURAL */}
      {showAnimation && (
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              style={{
                top: `${20 + i * 30}%`,
                left: `${15 + i * 35}%`
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.4 + 1.5
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}