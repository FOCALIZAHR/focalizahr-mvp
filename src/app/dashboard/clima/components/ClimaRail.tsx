'use client';

// src/app/dashboard/clima/components/ClimaRail.tsx
// Rail de SUBPRODUCTOS de Clima (v3 §3A). Antes listaba departamentos (hasta 250
// en un carrusel plano — inviable a escala e inconsistente con el patrón de Rail
// del resto de módulos). Ahora es el MENÚ del producto: 4 cards fijas
// [Cascada] [Análisis de Clima] [Ranking] [Dimensiones]. Cada una abre su propia
// vista; el filtrado jerárquico se resuelve DENTRO de cada vista, nunca acá.
//
// Se reusa el shell (fixed-bottom colapsable 50px ↔ 320px, backdrop blur,
// carrusel, selector de campaña) — solo cambia la card interna y se retiran los
// filtros por zona (un subproducto no tiene zona de riesgo).

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClimaSubproductoRailCard from './ClimaSubproductoRailCard';
import { CLIMA_SUBPRODUCTOS, climaSubproductoLabel } from '@/lib/constants/climaSubproductos';
import type { ClimaSubproducto, ClimaCampaignSummary } from '@/types/clima';

interface ClimaRailProps {
  activeSubproducto: ClimaSubproducto | null;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectSubproducto: (s: ClimaSubproducto) => void;
  // Selector de campaña (movido acá desde el header para no cortar el título).
  campaigns: ClimaCampaignSummary[];
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
}

export default function ClimaRail({
  activeSubproducto,
  isExpanded,
  onToggle,
  onSelectSubproducto,
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
}: ClimaRailProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => carouselRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () => carouselRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#0F172A] via-[#0F172A] to-transparent flex flex-col justify-end border-t border-white/5 backdrop-blur-xl"
      initial={false}
      animate={{
        height: isExpanded ? 320 : 50,
        backgroundColor: isExpanded ? 'rgba(15, 23, 42, 0.95)' : 'rgba(15, 23, 42, 0)',
        borderColor: isExpanded ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0)',
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
            Explorar
          </h3>
          <ChevronUp
            className={cn(
              'w-3 h-3 text-slate-600 transition-transform duration-300',
              isExpanded ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>

        {!isExpanded && activeSubproducto && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-medium">Viendo:</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase truncate max-w-[160px]">
              {climaSubproductoLabel(activeSubproducto)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Selector de campaña (movido del header) */}
          {campaigns.length > 0 && (
            <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
              <select
                value={selectedCampaignId ?? ''}
                onChange={(e) => onSelectCampaign(e.target.value)}
                className="appearance-none bg-slate-900/60 border border-slate-700/50 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-200 font-medium hover:border-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors max-w-[150px] md:max-w-[240px] truncate cursor-pointer"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                    {c.name}
                    {c.hasCompletedAnalysis ? '' : ' (sin análisis)'}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(34,211,238,0.3)]"
          >
            {isExpanded ? 'Ocultar' : 'Módulos'}
          </button>
        </div>
      </div>

      {/* Contenido expandible */}
      <div
        className={cn(
          'transition-opacity duration-200 flex-1 flex flex-col min-h-0 justify-center',
          isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Carrusel de subproductos */}
        <div className="relative group">
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div
            ref={carouselRef}
            className="flex overflow-x-auto gap-3 px-4 md:px-8 pb-6 justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {CLIMA_SUBPRODUCTOS.map((sub) => (
              <ClimaSubproductoRailCard
                key={sub.id}
                subproducto={sub}
                isActive={activeSubproducto === sub.id}
                onClick={() => onSelectSubproducto(sub.id)}
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
