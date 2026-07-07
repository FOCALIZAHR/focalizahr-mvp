'use client';

// src/app/dashboard/clima/components/DepartmentRailCard.tsx
// Card de departamento en el Rail. Clon de evaluator/cinema/EmployeeRailCard:
// misma huella (160×200), Línea Tesla top con color dinámico — acá por riskZone.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import MomentumBadge from '@/components/clima/MomentumBadge';
import { zoneColor, ZONE_LABEL } from '@/components/clima/climaZonePalette';
import type { ClimaDepartmentInsight } from '@/types/clima';

interface DepartmentRailCardProps {
  department: ClimaDepartmentInsight;
  isSelected: boolean;
  onClick: () => void;
}

export default function DepartmentRailCard({
  department,
  isSelected,
  onClick,
}: DepartmentRailCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const zone = department.riskZone;
  // Paleta anti-semáforo (climaZonePalette): Tesla + anillo por zoneColor.
  const teslaHex = zone ? zoneColor(zone) : '#334155';
  const ringColor = zone ? zoneColor(zone) : '#475569';
  const fav = department.engagementFavorability;

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      className={cn(
        'snap-start flex-shrink-0 w-[160px] h-[200px] rounded-xl cursor-pointer',
        'transition-all duration-300 relative group overflow-hidden border',
        isSelected
          ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(34,211,238,0.15)]'
          : 'bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10'
      )}
    >
      {/* Línea Tesla TOP — color por riskZone (anti-semáforo) */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-[2px] transition-all duration-300',
          isSelected ? 'opacity-100' : isHovered ? 'opacity-80' : 'opacity-30',
          (isSelected || isHovered) && 'shadow-[0_0_10px_currentColor]'
        )}
        style={{ backgroundColor: isSelected || isHovered ? teslaHex : '#334155', color: teslaHex }}
      />

      <div className="flex flex-col items-center justify-center h-full p-4">
        {/* Número EI favorability con borde por zona */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-extralight tabular-nums text-white border-2 mb-3 bg-slate-800/60"
          style={{ borderColor: ringColor }}
        >
          {fav !== null ? Math.round(fav) : '—'}
        </div>

        {/* Nombre + zona */}
        <div className="text-center w-full space-y-1">
          <h4
            className={cn(
              'font-bold text-xs truncate transition-colors',
              isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
            )}
          >
            {department.departmentName}
          </h4>
          <p className="text-[9px] truncate font-medium" style={{ color: ringColor }}>
            {zone ? ZONE_LABEL[zone] : 'Sin datos'}
          </p>
        </div>

        {/* Momentum */}
        <div className="mt-3">
          <MomentumBadge momentum={department.momentum} size="sm" />
        </div>
      </div>
    </motion.div>
  );
}
