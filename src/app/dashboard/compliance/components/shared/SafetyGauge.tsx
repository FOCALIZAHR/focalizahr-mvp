'use client';

// src/app/dashboard/compliance/components/shared/SafetyGauge.tsx
// Gauge de arco SVG animado para Safety Score (0-5). Número hero al centro
// (font-extralight, NUNCA cyan). Arco coloreado según nivel de riesgo.
//
// Patrón: similar al ExecutiveGauge del executive-hub, adaptado a escala 0-5.

import { motion } from 'framer-motion';

interface SafetyGaugeProps {
  /** Score 0-5 (o null si no disponible) */
  score: number | null;
  /** Diámetro en px — default 240 (lg) */
  size?: number;
  /** Label opcional debajo del número (ej. "/ 5,0") */
  suffix?: string;
  /** Nivel para color del arco */
  riskLevel?: 'safe' | 'risk' | 'critical';
}

const COLORS_BY_LEVEL: Record<string, string> = {
  safe: '#22D3EE',
  risk: '#F59E0B',
  critical: '#F59E0B',
};

// Ángulo del arco: barrido 270° (desde -135° hasta +135°), deja 90° vacío abajo.
const ARC_START_DEG = -225; // -135 equivalente
const ARC_SWEEP_DEG = 270;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const start = polarToCartesian(cx, cy, r, endDeg);
  const end = polarToCartesian(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function SafetyGauge({
  score,
  size = 240,
  suffix = '/ 5,0',
  riskLevel = 'safe',
}: SafetyGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = size * 0.06;
  const r = size / 2 - strokeWidth;

  const color = COLORS_BY_LEVEL[riskLevel] ?? COLORS_BY_LEVEL.safe;
  const normalized = score === null ? 0 : Math.max(0, Math.min(1, score / 5));

  // Arco base (gris tenue, barrido completo)
  const basePath = describeArc(cx, cy, r, ARC_START_DEG, ARC_START_DEG + ARC_SWEEP_DEG);
  // Arco activo (color, proporcional al score)
  const activePath = describeArc(
    cx,
    cy,
    r,
    ARC_START_DEG,
    ARC_START_DEG + ARC_SWEEP_DEG * normalized
  );

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow sutil detrás */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-20 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <svg width={size} height={size} className="relative">
        {/* Base */}
        <path
          d={basePath}
          stroke="rgb(30, 41, 59)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        {/* Activo — animado */}
        {score !== null && (
          <motion.path
            d={activePath}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
          />
        )}
      </svg>

      {/* Número + suffix al centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex items-end gap-1 leading-none">
          <span
            className="font-extralight text-white tabular-nums"
            style={{ fontSize: size * 0.3 }}
          >
            {score !== null ? score.toFixed(1) : '—'}
          </span>
          {suffix && (
            <span
              className="text-slate-500 font-light pb-1"
              style={{ fontSize: size * 0.09 }}
            >
              {suffix}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
