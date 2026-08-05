'use client';

// src/components/clima/ClimaProgressRing.tsx
// ════════════════════════════════════════════════════════════════════════════
// Anillo de progreso 0-100. Pieza chica y reutilizable: el número vive DENTRO
// del anillo y el anillo no sabe qué está midiendo.
//
// MOLDE: `src/components/evaluator/cinema/SegmentedRing.tsx` — el anillo del
// sistema. Se clona su mecánica exacta: `<circle>` de fondo + `<motion.circle>` de
// progreso, `strokeDasharray = circunferencia`, `strokeDashoffset` animado desde
// la circunferencia completa, `-rotate-90` en el `<svg>` para que arranque arriba,
// `strokeLinecap="round"`.
//
// ⛔ NO SE CLONA `getProgressColor()` (`SegmentedRing.tsx:18-23`), que devuelve
// esmeralda ≥100, cyan ≥60 y violeta ≥30. Eso es un SEMÁFORO: el mismo dato cambia
// de color según su valor, que es el anti-patrón que el proyecto prohíbe y que
// Victor ya rechazó dos veces en esta cápsula. Acá el color es UN parámetro fijo
// del consumidor —la identidad de la sección— e idéntico para 0% y para 100%.
//
// Tampoco se clona el `getInsightText()` ("Ritmo Constante", "Recta Final"): eso
// es interpretación, y la cobertura es un conteo. El anillo no opina.
//
// El número va en BLANCO siempre, por lo mismo.
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion';

interface ClimaProgressRingProps {
  /** 0-100. Se recorta al rango: un valor fuera de él dibujaría un arco imposible. */
  value: number;
  /** Diámetro en px. */
  size?: number;
  strokeWidth?: number;
  /** Color del arco. FIJO por consumidor — nunca derivado de `value`. */
  color?: string;
  /** Tamaño del número interior. Se omite en anillos muy chicos. */
  labelClassName?: string;
}

export default function ClimaProgressRing({
  value,
  size = 56,
  strokeWidth = 5,
  color = '#10B981',
  labelClassName = 'text-[13px]',
}: ClimaProgressRingProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Riel de fondo — mismo valor que el molde (`SegmentedRing.tsx:55`). */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(71, 85, 105, 0.3)"
          strokeWidth={strokeWidth}
        />
        {/* Arco de progreso. En 0% no se dibuja nada, que es la lectura correcta:
            el anillo vacío ES el dato, no un estado de carga. */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{ strokeDasharray: circumference }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>

      <span
        className={`absolute font-light text-white tabular-nums ${labelClassName}`}
      >
        {pct}
        <span className="text-[0.7em] text-slate-500">%</span>
      </span>
    </div>
  );
}
