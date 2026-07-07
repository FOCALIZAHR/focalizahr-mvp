'use client';

// src/components/clima/EngagementGauge.tsx
// COPIA de src/components/evaluator/cinema/SegmentedRing.tsx (el gauge real que
// usa /dashboard/evaluaciones). La FORMA, el comportamiento visual y la
// estructura se copian tal cual; solo cambia el DATO de entrada y el color:
//   - completed/total (% avance)  →  favorability (0-100) + riskZone
//   - getProgressColor(pct)       →  zoneColor(riskZone)  (paleta anti-semáforo)
//   - getInsightText (frase)      →  etiqueta de zona (ZONE_LABEL)
//   - "{completed}/{total} · N pendientes" → momentum vs ciclo anterior, o
//     (si es la primera campaña) gap vs objetivo (75).

import { motion } from 'framer-motion';
import type { RiskZone } from '@/types/clima';
import { zoneColor, ZONE_LABEL, CLIMA_TARGET_FAVORABILITY } from './climaZonePalette';

interface EngagementGaugeProps {
  favorability: number | null; // 0-100; null = sin base
  riskZone: RiskZone | null;
  /** Delta vs medición anterior (pp). null → footer cae a gap vs objetivo. */
  momentum?: number | null;
  size?: number;
}

function getFooterText(favorability: number, momentum: number | null | undefined): string {
  if (momentum !== null && momentum !== undefined) {
    const sign = momentum > 0 ? '+' : '';
    return `${sign}${Math.round(momentum)} pts vs. ciclo anterior`;
  }
  const gap = Math.round(favorability - CLIMA_TARGET_FAVORABILITY);
  return `${Math.abs(gap)} pts ${gap < 0 ? 'bajo' : 'sobre'} el objetivo (${CLIMA_TARGET_FAVORABILITY})`;
}

export default function EngagementGauge({
  favorability,
  riskZone,
  momentum,
  size = 280,
}: EngagementGaugeProps) {
  const strokeWidth = 10;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const hasData = favorability !== null;
  const percentage = hasData ? Math.round(favorability!) : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color = zoneColor(riskZone);
  const label = riskZone ? ZONE_LABEL[riskZone] : 'Sin datos';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow sutil */}
      <div
        className="absolute rounded-full blur-[60px]"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          backgroundColor: color,
          opacity: 0.08,
        }}
      />

      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(71, 85, 105, 0.3)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc */}
        {hasData && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          className="text-7xl font-black text-white tracking-tighter font-mono"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {hasData ? `${percentage}%` : '—'}
        </motion.span>
        <span
          className="text-xs font-bold tracking-[0.2em] uppercase mt-2"
          style={{ color }}
        >
          {label}
        </span>
        {hasData && (
          <span className="text-xs text-slate-500 font-mono mt-1">
            {getFooterText(favorability!, momentum)}
          </span>
        )}
      </div>
    </div>
  );
}
