'use client';

// src/app/dashboard/compliance/components/SectionRailCard.tsx
// Card de una sección en el Rail del Cinema Mode.
// Patrón: EmployeeRailCard del evaluator adaptado a secciones.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ComplianceSectionId } from '@/types/compliance';

interface SectionRailCardProps {
  id: ComplianceSectionId;
  index: number;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  teslaColor: string;
  badge?: number | null;
  onClick: () => void;
}

export default function SectionRailCard({
  index,
  label,
  icon: Icon,
  isActive,
  teslaColor,
  badge,
  onClick,
}: SectionRailCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const highlight = isActive || isHovered;

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4 }}
      className={cn(
        'snap-start flex-shrink-0 w-[160px] h-[200px] rounded-xl cursor-pointer text-left',
        'transition-all duration-300 relative overflow-hidden border',
        isActive
          ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(34,211,238,0.15)]'
          : 'bg-slate-900/40 border-white/5 hover:bg-slate-800 hover:border-white/10'
      )}
    >
      {/* Tesla line top — color propio de la sección */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-[2px] transition-all duration-300',
          highlight ? 'opacity-100 shadow-[0_0_10px_currentColor]' : 'opacity-30'
        )}
        style={{ backgroundColor: highlight ? teslaColor : 'rgb(51 65 85)' }}
      />

      <div className="flex flex-col items-center justify-center h-full p-4">
        {/* Index badge */}
        <span className="absolute top-3 left-3 text-[10px] font-mono font-bold text-slate-600">
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Alert badge */}
        {badge !== null && badge !== undefined && badge > 0 && (
          <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500/90 text-slate-950 text-[10px] font-bold flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}

        {/* Icono grande */}
        <div
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center border mb-3 transition-all',
            isActive
              ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-cyan-500/30 text-white'
              : 'bg-slate-800 border-slate-700/50 text-slate-500'
          )}
        >
          <Icon className="w-6 h-6" />
        </div>

        {/* Label */}
        <div className="text-center w-full">
          <h4
            className={cn(
              'font-semibold text-xs truncate transition-colors',
              isActive ? 'text-white' : 'text-slate-400'
            )}
          >
            {label}
          </h4>
        </div>

        {/* Indicador de activa */}
        {isActive && (
          <span className="absolute bottom-3 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        )}
      </div>
    </motion.button>
  );
}
