// src/components/exit/EISScoreGauge.tsx
// 🎯 GAUGE ADAPTATIVO - Exit Alert Detail Page
// Filosofía: "El trigger es protagonista. El número habla por sí solo."
// v2.1: Usa /src/config/exitAlertConfig.ts centralizado

'use client';

import { memo, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// IMPORTAR DESDE CONFIG CENTRALIZADA
// ═══════════════════════════════════════════════════════════════════════════════
import {
  getExitAlertConfig,
  getEISClassification,
  getNPSClassification,
  getScale5Classification,
  GAUGE_DIMENSIONS,
  GAUGE_TRACK_COLOR,
  type GaugeConfig,
  type ClassificationStyle
} from '@/config/exitAlertConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════════

interface EISScoreGaugeProps {
  alertType: string;
  triggerScore: number;
  triggerMax?: number;
  eisScore?: number;
  eisClassification?: string;
  daysElapsed?: number;
  daysTotal?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Gauge Principal
// ═══════════════════════════════════════════════════════════════════════════════

function GaugeCircle({
  value,
  max,
  scoreType,
  classification,
  gaugeConfig
}: {
  value: number;
  max: number;
  scoreType: string;
  classification: ClassificationStyle;
  gaugeConfig: GaugeConfig;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);

  const getPercent = () => {
    if (scoreType === 'nps') {
      return ((value + 100) / 200) * 100;
    }
    return (value / max) * 100;
  };

  const percent = Math.max(0, Math.min(100, getPercent()));
  const dimensions = isMobile ? GAUGE_DIMENSIONS.mobile : GAUGE_DIMENSIONS.desktop;

  const gaugeData = [
    { value: percent, color: classification.color },
    { value: 100 - percent, color: GAUGE_TRACK_COLOR }
  ];

  const formatDisplayValue = () => {
    if (scoreType === 'nps') {
      const v = Math.round(displayValue);
      return v >= 0 ? `+${v}` : `${v}`;
    }
    if (scoreType === 'scale_5') {
      return displayValue.toFixed(1);
    }
    return Math.round(displayValue).toString();
  };

  const formatMax = () => {
    if (scoreType === 'nps') return '+100';
    return max.toString();
  };

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-[0.15em] mb-4">
        {gaugeConfig.title}
      </h3>

      <div 
        className="relative"
        style={{ 
          width: dimensions.container, 
          height: dimensions.container 
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={dimensions.innerRadius}
              outerRadius={dimensions.outerRadius}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              {gaugeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`${dimensions.fontSize} font-extralight tabular-nums leading-none`}
            style={{ color: classification.color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {formatDisplayValue()}
          </motion.span>
          
          <span className="text-sm font-light text-slate-500 mt-1">
            / {formatMax()}
          </span>
          
          <motion.div
            className={`
              mt-3 px-3 py-1 rounded-full
              ${dimensions.badgeSize} font-medium uppercase tracking-wider
              ${classification.bgClass} ${classification.textClass} ${classification.borderClass}
              border
            `}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            {classification.label}
          </motion.div>
        </div>
      </div>

      <p className="text-xs text-slate-600 mt-4">
        {gaugeConfig.thresholdLabel}: {gaugeConfig.thresholdDirection === 'below' ? '<' : '>'} {gaugeConfig.thresholdValue}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Countdown para denuncia_formal
// ═══════════════════════════════════════════════════════════════════════════════

function CountdownDisplay({
  daysElapsed,
  daysTotal,
  gaugeConfig
}: {
  daysElapsed: number;
  daysTotal: number;
  gaugeConfig: GaugeConfig;
}) {
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);
  const percent = (daysElapsed / daysTotal) * 100;
  const isOverdue = daysElapsed > daysTotal;

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-[0.15em] mb-4">
        {gaugeConfig.title}
      </h3>

      <div className={`
        w-full max-w-[280px] p-6 rounded-xl border
        ${isOverdue 
          ? 'bg-red-500/5 border-red-500/20' 
          : 'bg-slate-800/30 border-slate-700/30'
        }
      `}>
        <div className="text-center mb-4">
          <span className={`
            text-5xl font-extralight tabular-nums
            ${isOverdue ? 'text-red-400' : 'text-slate-200'}
          `}>
            {isOverdue ? `+${daysElapsed - daysTotal}` : daysRemaining}
          </span>
          <span className="text-lg text-slate-500 ml-2">
            / {daysTotal} días
          </span>
        </div>

        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-3">
          <motion.div
            className={`h-full rounded-full ${isOverdue ? 'bg-red-500' : 'bg-amber-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percent)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        <p className={`text-xs text-center ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
          {isOverdue 
            ? 'Plazo legal VENCIDO' 
            : `${daysRemaining} días restantes para concluir investigación`
          }
        </p>
      </div>

      <p className="text-xs text-amber-400/80 mt-4 text-center max-w-[280px]">
        ⚠️ Obligación: Concluir investigación en {daysTotal} días según Ley 21.643
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Sección secundaria EIS
// ═══════════════════════════════════════════════════════════════════════════════

function SecondaryEISContext({
  eisScore,
  eisClassification
}: {
  eisScore: number;
  eisClassification?: string;
}) {
  const classification = getEISClassification(eisScore);

  return (
    <div className="mt-6 pt-4 border-t border-slate-700/50">
      <div className="p-4 bg-slate-800/30 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700/30 rounded-lg">
            <BarChart3 className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Exit Intelligence Score
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-lg font-light ${classification.textClass}`}>
                {eisScore.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
              <span className={`text-xs ${classification.textClass}`}>
                • {eisClassification || classification.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════

export default memo(function EISScoreGauge({
  alertType,
  triggerScore,
  triggerMax = 100,
  eisScore,
  eisClassification,
  daysElapsed = 0,
  daysTotal = 30
}: EISScoreGaugeProps) {
  
  // Obtener config desde fuente centralizada
  const config = useMemo(() => getExitAlertConfig(alertType), [alertType]);
  const gaugeConfig = config.gauge;

  const classification = useMemo(() => {
    switch (gaugeConfig.scoreType) {
      case 'scale_5':
        return getScale5Classification(triggerScore, gaugeConfig.thresholdValue);
      case 'nps':
        return getNPSClassification(triggerScore);
      case 'scale_100':
      default:
        return getEISClassification(triggerScore);
    }
  }, [gaugeConfig.scoreType, gaugeConfig.thresholdValue, triggerScore]);

  const effectiveMax = useMemo(() => {
    switch (gaugeConfig.scoreType) {
      case 'scale_5': return 5;
      case 'nps': return 100;
      case 'scale_100': return 100;
      default: return triggerMax;
    }
  }, [gaugeConfig.scoreType, triggerMax]);

  if (gaugeConfig.displayMode === 'hidden') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="
        relative overflow-hidden rounded-2xl 
        border border-slate-700/50 
        bg-gradient-to-b from-slate-800/40 to-slate-900/40 
        p-6 md:p-8 backdrop-blur-xl
      "
    >
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ backgroundColor: classification.color }}
      />

      <div className="relative z-10">
        {gaugeConfig.displayMode === 'countdown' ? (
          <CountdownDisplay
            daysElapsed={daysElapsed}
            daysTotal={daysTotal}
            gaugeConfig={gaugeConfig}
          />
        ) : (
          <>
            <GaugeCircle
              value={triggerScore}
              max={effectiveMax}
              scoreType={gaugeConfig.scoreType}
              classification={classification}
              gaugeConfig={gaugeConfig}
            />

            {gaugeConfig.showSecondaryEIS && eisScore !== undefined && (
              <SecondaryEISContext
                eisScore={eisScore}
                eisClassification={eisClassification}
              />
            )}
          </>
        )}
      </div>
    </motion.div>
  );
});