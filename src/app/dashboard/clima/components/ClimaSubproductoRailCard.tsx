'use client';

// src/app/dashboard/clima/components/ClimaSubproductoRailCard.tsx
// Card de subproducto en el Rail de Clima (v3 §3A). Reemplaza a DepartmentRailCard:
// misma huella (160×200) y Línea Tesla top, pero representa un MÓDULO (Cascada /
// Análisis / Ranking / Dimensiones), no un departamento. Acento cyan fijo
// (anti-semáforo: el subproducto no tiene zona de riesgo).

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ClimaSubproductoDef } from '@/lib/constants/climaSubproductos';

interface ClimaSubproductoRailCardProps {
  subproducto: ClimaSubproductoDef;
  isActive: boolean;
  onClick: () => void;
}

const ACCENT = '#22D3EE'; // cyan — acento único del sistema (sin semáforo)

export default function ClimaSubproductoRailCard({
  subproducto,
  isActive,
  onClick,
}: ClimaSubproductoRailCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = subproducto.icon;

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      className={cn(
        'snap-start flex-shrink-0 w-[160px] h-[200px] rounded-xl cursor-pointer',
        'transition-all duration-300 relative group overflow-hidden border',
        isActive
          ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(34,211,238,0.15)]'
          : 'bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10'
      )}
    >
      {/* Línea Tesla TOP — acento cyan fijo */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-[2px] transition-all duration-300',
          isActive ? 'opacity-100' : isHovered ? 'opacity-80' : 'opacity-30',
          (isActive || isHovered) && 'shadow-[0_0_10px_currentColor]'
        )}
        style={{ backgroundColor: isActive || isHovered ? ACCENT : '#334155', color: ACCENT }}
      />

      <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center border-2 bg-slate-800/60"
          style={{ borderColor: isActive || isHovered ? ACCENT : '#475569' }}
        >
          <Icon
            className="w-6 h-6 transition-colors"
            style={{ color: isActive || isHovered ? ACCENT : '#94A3B8' }}
          />
        </div>

        <h4
          className={cn(
            'font-bold text-xs text-center leading-tight transition-colors',
            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
          )}
        >
          {subproducto.label}
        </h4>
      </div>
    </motion.div>
  );
}
