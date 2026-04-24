'use client';

// src/app/dashboard/compliance/components/ComplianceRail.tsx
// Bottom drawer colapsable 50↔320px — clon del Rail del evaluator.
// Muestra las 9 secciones canónicas como carrusel horizontal.

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  COMPLIANCE_SECTIONS,
  TESLA_BY_SECTION,
  TESLA_SINTESIS,
  TESLA_COLOR_CYAN,
} from '@/app/dashboard/compliance/lib/labels';
import { getISARiskLevel } from '@/lib/services/compliance/ISAService';
import SectionRailCard from './SectionRailCard';
import type { ComplianceSectionId } from '@/types/compliance';

interface ComplianceRailProps {
  activeSection: ComplianceSectionId;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (id: ComplianceSectionId) => void;
  alertasCount: number;
  planActionsCount: number;
  orgISA: number | null;
}

export default function ComplianceRail({
  activeSection,
  isExpanded,
  onToggle,
  onSelect,
  alertasCount,
  planActionsCount,
  orgISA,
}: ComplianceRailProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const activeMeta = COMPLIANCE_SECTIONS.find((s) => s.id === activeSection);

  const scrollLeft = () =>
    carouselRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () =>
    carouselRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

  // Tesla color de cada sección (síntesis es dinámico según ISA)
  const teslaColorFor = (id: ComplianceSectionId): string => {
    if (id === 'sintesis') {
      const isa = orgISA ?? 100;
      return TESLA_SINTESIS[getISARiskLevel(isa)];
    }
    return TESLA_BY_SECTION[id] ?? TESLA_COLOR_CYAN;
  };

  const badgeFor = (id: ComplianceSectionId): number | null => {
    if (id === 'alertas') return alertasCount;
    if (id === 'simulador' || id === 'cierre') return planActionsCount;
    return null;
  };

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col justify-end border-t border-white/5 backdrop-blur-xl"
      initial={false}
      animate={{
        height: isExpanded ? 320 : 50,
        backgroundColor: isExpanded ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0.4)',
      }}
      transition={{ type: 'spring', stiffness: 250, damping: 30 }}
    >
      {/* Toggle bar — 50px siempre visible */}
      <div
        className="px-6 md:px-8 h-[50px] flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors flex-shrink-0"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Secciones ({COMPLIANCE_SECTIONS.length})
          </h3>
          <ChevronUp
            className={cn(
              'w-3 h-3 text-slate-600 transition-transform duration-300',
              isExpanded ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>

        {!isExpanded && activeMeta && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Viendo:</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
              {activeMeta.railLabel}
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(34,211,238,0.3)]"
        >
          {isExpanded ? 'Ocultar' : 'Navegar'}
        </button>
      </div>

      {/* Contenido expandible */}
      <div
        className={cn(
          'transition-opacity duration-200 flex-1 flex flex-col min-h-0 pt-3',
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="relative group">
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll izquierda"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div
            ref={carouselRef}
            className="flex overflow-x-auto gap-3 px-6 md:px-8 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {COMPLIANCE_SECTIONS.map((s, i) => (
              <SectionRailCard
                key={s.id}
                id={s.id}
                index={i}
                label={s.railLabel}
                icon={s.icon}
                isActive={s.id === activeSection}
                teslaColor={teslaColorFor(s.id)}
                badge={badgeFor(s.id)}
                onClick={() => onSelect(s.id)}
              />
            ))}
          </div>

          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll derecha"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
