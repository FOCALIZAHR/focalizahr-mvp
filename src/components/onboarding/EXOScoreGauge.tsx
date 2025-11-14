// ====================================================================
// EXO SCORE GAUGE - DISEÑO CIRCULAR COMPLETO CON CONTADOR ANIMADO
// src/components/onboarding/EXOScoreGauge.tsx
// 🎯 Basado en gauge de Torre de Control (PredictiveView.tsx)
// ====================================================================

'use client';

import { memo, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// ============================================
// TYPES
// ============================================
interface EXOScoreGaugeProps {
  score: number | null;
  label: string;
  trend?: number | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// ============================================
// CONSTANTS
// ============================================
const COLORS = {
  excellent: '#10B981',  // Verde - 80-100
  good: '#22D3EE',       // Cyan - 60-79
  warning: '#F59E0B',    // Amarillo - 40-59
  critical: '#EF4444'    // Rojo - 0-39
};

const SIZE_CONFIG = {
  sm: { 
    container: 180, 
    fontSize: 'text-3xl',
    labelSize: 'text-sm',
    trendSize: 'text-xs'
  },
  md: { 
    container: 240, 
    fontSize: 'text-4xl',
    labelSize: 'text-base',
    trendSize: 'text-sm'
  },
  lg: { 
    container: 300, 
    fontSize: 'text-5xl',
    labelSize: 'text-lg',
    trendSize: 'text-sm'
  },
  xl: { 
    container: 360, 
    fontSize: 'text-6xl',
    labelSize: 'text-xl',
    trendSize: 'text-base'
  }
};

// ============================================
// COMPONENT
// ============================================
const EXOScoreGauge = memo(function EXOScoreGauge({ 
  score,
  label,
  trend,
  size = 'xl'
}: EXOScoreGaugeProps) {
  
  const currentScore = score ?? 0;
  const config = SIZE_CONFIG[size];

  // ========================================
  // CONTADOR ANIMADO (Estilo Torre Control)
  // ========================================
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const startCounting = () => {
      setIsAnimating(true);
      setDisplayValue(0);
      
      const duration = 2500; // 2.5 segundos
      const startTime = Date.now();
      const targetValue = currentScore;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Curva suave easeOut
        const easeOut = 1 - Math.pow(1 - progress, 2);
        const currentValue = Math.round(targetValue * easeOut);
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };
      
      animate();
    };

    // Iniciar inmediatamente
    startCounting();
    
    // Repetir cada 12 segundos
    const interval = setInterval(startCounting, 12000);
    
    return () => clearInterval(interval);
  }, [currentScore]);

  // ========================================
  // LÓGICA COLOR Y LABEL
  // ========================================
  const { color, statusLabel } = useMemo(() => {
    let scoreColor: string;
    let status: string;

    if (currentScore >= 80) {
      scoreColor = COLORS.excellent;
      status = 'Excelente';
    } else if (currentScore >= 60) {
      scoreColor = COLORS.good;
      status = 'Bueno';
    } else if (currentScore >= 40) {
      scoreColor = COLORS.warning;
      status = 'Regular';
    } else {
      scoreColor = COLORS.critical;
      status = 'Crítico';
    }

    return { color: scoreColor, statusLabel: status };
  }, [currentScore]);

  // ========================================
  // DATOS GAUGE (1 solo segmento) - SINCRONIZADO CON CONTADOR
  // ========================================
  const gaugeData = useMemo(() => [
    { 
      name: 'Score', 
      value: displayValue,  // ← Usar displayValue animado
      color: color
    },
    { 
      name: 'Restante', 
      value: 100 - displayValue,  // ← Usar displayValue animado
      color: 'rgba(255, 255, 255, 0.05)' // Gris muy sutil
    }
  ], [displayValue, color]);  // ← Dependencia en displayValue

  // ========================================
  // TREND LOGIC
  // ========================================
  const TrendIcon = useMemo(() => {
    if (trend === null || trend === undefined) return Minus;
    if (trend > 0) return TrendingUp;
    if (trend < 0) return TrendingDown;
    return Minus;
  }, [trend]);

  const trendColor = useMemo(() => {
    if (trend === null || trend === undefined) return '#94a3b8';
    if (trend > 0) return '#10B981';
    if (trend < 0) return '#EF4444';
    return '#94a3b8';
  }, [trend]);

  // ========================================
  // RENDER
  // ========================================
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      {/* GAUGE CIRCULAR */}
      <div 
        className="relative"
        style={{ 
          width: config.container, 
          height: config.container 
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              data={gaugeData} 
              cx="50%" 
              cy="50%" 
              startAngle={-90}   // ← Empieza arriba (12 en punto)
              endAngle={270}     // ← Completa 360° horario
              innerRadius="80%"  // Dona gruesa
              outerRadius="88%" 
              dataKey="value" 
              stroke="none"
              isAnimationActive={false}  // ← Desactivar animación de Recharts
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

        {/* OVERLAY SUTIL (Efecto sheen) */}
        <div 
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
          style={{
            background: 'linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.03) 50%, transparent 100%)'
          }}
        />

        {/* NÚMERO CENTRAL ANIMADO */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            className={`${config.fontSize} font-extralight text-white tabular-nums leading-none`}
            animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            {displayValue}
          </motion.div>
          
          <div 
            className={`${config.labelSize} font-light uppercase tracking-wide mt-2`}
            style={{ color }}
          >
            {isAnimating ? 'Procesando...' : statusLabel}
          </div>

          {/* BADGE RANGO MINI DENTRO DEL GAUGE */}
          <div 
            className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-light"
            style={{ 
              backgroundColor: `${color}15`,
              color: color,
              border: `1px solid ${color}40`
            }}
          >
            {
              currentScore >= 80 ? '80-100' :
              currentScore >= 60 ? '60-79' :
              currentScore >= 40 ? '40-59' :
              '0-39'
            }
          </div>
        </div>
      </div>

      {/* LABEL */}
      <div className="text-center mt-4">
        <p className="text-lg text-slate-300 font-light">
          {label}
        </p>
      </div>

      {/* TREND MINI - SIEMPRE VISIBLE SI EXISTE (FIX 3) */}
      {trend !== null && trend !== undefined && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 mt-3"
        >
          <TrendIcon 
            className="h-3 w-3"
            style={{ color: trendColor }}
          />
          <span 
            className="text-xs font-light"
            style={{ color: trendColor }}
          >
            {trend > 0 ? '+' : ''}{trend.toFixed(1)} pts
          </span>
        </motion.div>
      )}
    </motion.div>
  );
});

EXOScoreGauge.displayName = 'EXOScoreGauge';

export default EXOScoreGauge;