'use client';

// src/app/dashboard/compliance/components/shared/IndicatorGauge.tsx
// Gauge de arco SVG animado para indicadores 0-100 (Safety, ISA, etc.).
// Número hero al centro (font-extralight, NUNCA cyan). Arco coloreado según
// nivel de riesgo.
//
// Patrón: similar al ExecutiveGauge del executive-hub. El caller convierte
// raw 1-5 → 0-100 con displayScore() del módulo Dimensiones antes de pasar.

import { motion } from 'framer-motion';

interface IndicatorGaugeProps {
  /** Score 0-100 display (o null si no disponible) */
  score: number | null;
  /** Diámetro en px — default 240 (lg) */
  size?: number;
  /** Label opcional debajo del número (ej. "/ 100"). Default: sin suffix. */
  suffix?: string;
  /** Nivel para color del arco — paleta anti-semáforo Decisión #1 AS v1.0 */
  riskLevel?: 'safe' | 'observation' | 'risk' | 'critical';
}

// Paleta anti-semáforo: cyan / slate-400 / amber / amber-glow. Crítico
// comparte color con riesgo, pero intensifica el glow (no introduce rojo).
const COLORS_BY_LEVEL: Record<string, string> = {
  safe: '#22D3EE',
  observation: '#94A3B8',
  risk: '#F59E0B',
  critical: '#F59E0B',
};

// Intensidad del glow del arco activo según nivel. Crítico = más radio y opacidad.
const GLOW_BY_LEVEL: Record<string, string> = {
  safe: '88',
  observation: '66',
  risk: '88',
  critical: 'cc',
};

// Radio del glow exterior (blur background detrás del arco).
const BACKGROUND_GLOW_OPACITY: Record<string, number> = {
  safe: 0.2,
  observation: 0.1,
  risk: 0.2,
  critical: 0.32,
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

export default function IndicatorGauge({
  score,
  size = 240,
  suffix,
  riskLevel = 'safe',
}: IndicatorGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = size * 0.06;
  const r = size / 2 - strokeWidth;

  const color = COLORS_BY_LEVEL[riskLevel] ?? COLORS_BY_LEVEL.safe;
  const glowAlpha = GLOW_BY_LEVEL[riskLevel] ?? GLOW_BY_LEVEL.safe;
  const bgGlowOpacity = BACKGROUND_GLOW_OPACITY[riskLevel] ?? BACKGROUND_GLOW_OPACITY.safe;
  const normalized = score === null ? 0 : Math.max(0, Math.min(1, score / 100));

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
      {/* Halo FocalizaHR — siempre cyan→purple radial gradient (identidad).
          La opacidad varía por nivel para que crítico tenga halo más intenso,
          pero el color es identidad fija del producto (no per-estado). */}
      <div
        className="absolute inset-0 rounded-full blur-2xl pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, #22D3EE 0%, #A78BFA 60%, transparent 100%)',
          opacity: bgGlowOpacity,
        }}
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
            style={{
              filter: `drop-shadow(0 0 ${riskLevel === 'critical' ? 14 : 8}px ${color}${glowAlpha})`,
            }}
          />
        )}
      </svg>

      {/* Número + suffix al centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="font-extralight text-white tabular-nums tracking-tight"
          style={{ fontSize: size * 0.3, lineHeight: 0.9 }}
        >
          {score !== null ? score : '—'}
        </span>
        {suffix && (
          <span
            className="text-slate-500 font-light mt-2 text-center leading-tight"
            style={{ fontSize: size * 0.09 }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
