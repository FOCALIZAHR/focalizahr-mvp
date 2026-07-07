'use client';

// src/app/dashboard/clima/components/ClimaRail.tsx
// Rail de departamentos. Clon de evaluator/cinema/Rail: fixed-bottom colapsable
// (50px ↔ 320px), backdrop blur, carrusel horizontal. Filtros por riskZone.
// Visible SIEMPRE (incluido el Lobby) — el Rail no es una pantalla aparte.

import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import DepartmentRailCard from './DepartmentRailCard';
import { zoneColor } from '@/components/clima/climaZonePalette';
import type { ClimaDepartmentInsight, ClimaRailFilter, RiskZone } from '@/types/clima';

interface ClimaRailProps {
  departments: ClimaDepartmentInsight[];
  selectedId: string | null;
  isExpanded: boolean;
  activeFilter: ClimaRailFilter;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onFilterChange: (f: ClimaRailFilter) => void;
}

const FILTER_ORDER: ClimaRailFilter[] = ['todos', 'roja', 'naranja', 'amarilla', 'verde'];
const FILTER_LABEL: Record<ClimaRailFilter, string> = {
  todos: 'Todos',
  roja: 'Críticos',
  naranja: 'En riesgo',
  amarilla: 'En observación',
  verde: 'Saludables',
};

export default function ClimaRail({
  departments,
  selectedId,
  isExpanded,
  activeFilter,
  onToggle,
  onSelect,
  onFilterChange,
}: ClimaRailProps) {
  const selectedDept = departments.find((d) => d.departmentId === selectedId);
  const carouselRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (activeFilter === 'todos') return departments;
    return departments.filter((d) => d.riskZone === (activeFilter as RiskZone));
  }, [departments, activeFilter]);

  const counts = useMemo(() => {
    const c: Record<ClimaRailFilter, number> = {
      todos: departments.length,
      roja: 0,
      naranja: 0,
      amarilla: 0,
      verde: 0,
    };
    for (const d of departments) {
      if (d.riskZone) c[d.riskZone] += 1;
    }
    return c;
  }, [departments]);

  const scrollLeft = () => carouselRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () => carouselRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#0F172A] via-[#0F172A] to-transparent flex flex-col justify-end border-t border-white/5 backdrop-blur-xl"
      initial={false}
      animate={{
        height: isExpanded ? 320 : 50,
        backgroundColor: isExpanded ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
        borderColor: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
      }}
      transition={{ type: 'spring', stiffness: 250, damping: 30 }}
    >
      {/* Toggle bar — siempre visible */}
      <div
        className="px-4 md:px-8 h-[50px] flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors flex-shrink-0"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
            Departamentos ({departments.length})
          </h3>
          <ChevronUp
            className={cn(
              'w-3 h-3 text-slate-600 transition-transform duration-300',
              isExpanded ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>

        {!isExpanded && selectedId && selectedDept && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Viendo:</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase truncate max-w-[160px]">
              {selectedDept.departmentName}
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
          {isExpanded ? 'Ocultar' : 'Ver deptos'}
        </button>
      </div>

      {/* Contenido expandible */}
      <div
        className={cn(
          'transition-opacity duration-200 flex-1 flex flex-col min-h-0',
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Filtros por zona */}
        <div className="px-4 md:px-8 pb-4 flex gap-2 flex-shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {FILTER_ORDER.map((f) => {
            const isActive = activeFilter === f;
            const count = counts[f];
            if (f !== 'todos' && count === 0) return null;
            return (
              <button
                key={f}
                onClick={(e) => {
                  e.stopPropagation();
                  onFilterChange(f);
                }}
                className={cn(
                  'px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap',
                  isActive
                    ? f === 'todos'
                      ? 'bg-cyan-400 text-slate-950 shadow-[0_2px_10px_rgba(34,211,238,0.3)]'
                      : 'text-slate-950'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700'
                )}
                style={
                  isActive && f !== 'todos'
                    ? { backgroundColor: zoneColor(f as RiskZone) }
                    : undefined
                }
              >
                {FILTER_LABEL[f]} {count}
              </button>
            );
          })}
        </div>

        {/* Carrusel */}
        <div className="relative group">
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div
            ref={carouselRef}
            className="flex overflow-x-auto gap-3 px-4 md:px-8 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {filtered.map((dept) => (
              <DepartmentRailCard
                key={dept.departmentId}
                department={dept}
                isSelected={selectedId === dept.departmentId}
                onClick={() => onSelect(dept.departmentId)}
              />
            ))}
          </div>

          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
