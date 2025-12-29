// src/components/exit/EISScoreGauge.tsx
// 🎯 GAUGE ADAPTATIVO - Exit Alert Detail Page
// Filosofía v3.2: "El número habla. El resto susurra."
// FIX: Usar eisClassification de BD directamente, solo traducir para display

'use client';

import { memo, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

import {
  getExitAlertConfig,
  getEISClassification,
  getNPSClassification,
  getScale5Classification,
  type GaugeConfig,
  type ClassificationStyle
} from '@/config/exitAlertConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES DE DISEÑO v3.2
// ═══════════════════════════════════════════════════════════════════════════════

const GAUGE_TRACK_COLOR = 'rgba(167, 139, 250, 0.35)';

const GAUGE_DIMENSIONS = {
  mobile: {
    container: 160,
    innerRadius: '68%',
    outerRadius: '85%',
    fontSize: 'text-4xl',
  },
  desktop: {
    container: 180,
    innerRadius: '70%',
    outerRadius: '87%',
    fontSize: 'text-5xl',
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRADUCCIÓN BD → DISPLAY (solo presentación, NO lógica)
// ═══════════════════════════════════════════════════════════════════════════════

const CLASSIFICATION_DISPLAY: Record<string, string> = {
  'toxic': 'tóxico',
  'problematic': 'problemático',
  'neutral': 'neutral',
  'healthy': 'saludable',
  'detractor': 'detractor',
  'passive': 'pasivo',
  'promoter': 'promotor'
};

function translateToSpanish(value: string): string {
  return CLASSIFICATION_DISPLAY[value.toLowerCase()] || value;
}

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
// HELPER
// ═══════════════════════════════════════════════════════════════════════════════

function capitalizeTitle(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
      <h3 className="text-sm font-light text-slate-400 tracking-wide mb-4">
        {capitalizeTitle(gaugeConfig.title)}
      </h3>

      <div 
        className="relative"
        style={{ width: dimensions.container, height: dimensions.container }}
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
          
          <span className="text-base font-light text-slate-500 mt-1">
            / {formatMax()}
          </span>
        </div>
      </div>

      <p className="text-xs font-light text-slate-600 mt-4">
        Umbral crítico: {gaugeConfig.thresholdValue}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: Countdown
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
      <h3 className="text-sm font-light text-slate-400 tracking-wide mb-4">
        {capitalizeTitle(gaugeConfig.title)}
      </h3>

      <div className={`
        w-full max-w-[260px] p-6 rounded-2xl border
        ${isOverdue ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/20 border-slate-700/30'}
      `}>
        <div className="text-center mb-4">
          <span className={`text-5xl font-extralight tabular-nums ${isOverdue ? 'text-red-400' : 'text-slate-200'}`}>
            {isOverdue ? `+${daysElapsed - daysTotal}` : daysRemaining}
          </span>
          <span className="text-base font-light text-slate-500 ml-2">
            / {daysTotal} días
          </span>
        </div>

        <div className="h-1.5 bg-slate-700/30 rounded-full overflow-hidden mb-3">
          <motion.div
            className={`h-full rounded-full ${isOverdue ? 'bg-red-500/60' : 'bg-amber-500/60'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percent)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        <p className={`text-xs font-light text-center ${isOverdue ? 'text-red-400/80' : 'text-slate-500'}`}>
          {isOverdue ? 'Plazo legal vencido' : `${daysRemaining} días restantes`}
        </p>
      </div>

      <p className="text-xs font-light text-slate-600 mt-4 text-center max-w-[260px]">
        Obligación: Concluir en {daysTotal} días (Ley 21.643)
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE: EIS Secundario
// ═══════════════════════════════════════════════════════════════════════════════

function SecondaryEISContext({
  eisScore,
  eisClassification
}: {
  eisScore: number;
  eisClassification?: string;
}) {
  // Estilos visuales (color) desde el score
  const style = getEISClassification(eisScore);
  
  // Label para display: usar BD si existe, si no usar fallback
  // CRÍTICO: translateToSpanish('toxic') → 'tóxico'
  const displayLabel = eisClassification 
    ? translateToSpanish(eisClassification)
    : translateToSpanish(style.label);

  return (
    <div className="mt-5 pt-4 border-t border-slate-700/30">
      <div className="p-4 bg-slate-800/20 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700/20 rounded-lg">
            <BarChart3 className="h-4 w-4 text-slate-500" />
          </div>
          
          <div>
            <p className="text-[11px] font-light text-slate-500 tracking-wide">
              Exit Intelligence Score
            </p>
            
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={`text-lg font-light ${style.textClass}`}>
                {eisScore.toFixed(1)}
              </span>
              <span className="text-xs font-light text-slate-500">/ 100</span>
              <span className={`text-xs font-light ${style.textClass}`}>
                · {displayLabel}
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
        border border-slate-700/40 
        bg-gradient-to-b from-slate-800/30 to-slate-900/30 
        p-6 md:p-8 backdrop-blur-xl
      "
    >
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-[0.05]"
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