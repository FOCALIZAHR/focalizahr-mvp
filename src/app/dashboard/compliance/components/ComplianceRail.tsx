'use client';

// src/app/dashboard/compliance/components/ComplianceRail.tsx
// Clon literal del Rail del evaluator (src/components/evaluator/cinema/Rail.tsx).
// Cambia solo los datos: EmployeeRailCard → SectionRailCard,
// employees → COMPLIANCE_SECTIONS, sin tabs de filtrado.

import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSearch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  COMPLIANCE_SECTIONS,
  TESLA_BY_SECTION,
  TESLA_SINTESIS,
  TESLA_COLOR_CYAN,
} from '@/app/dashboard/compliance/lib/labels';
import { getISARiskLevel } from '@/lib/services/compliance/ISAService';
import SectionRailCard from './SectionRailCard';
import type {
  ComplianceCampaignSummary,
  CompliancePageState,
  ComplianceSectionId,
} from '@/types/compliance';

interface ComplianceRailProps {
  activeSection: ComplianceSectionId | null;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (id: ComplianceSectionId) => void;
  alertasCount: number;
  planActionsCount: number;
  orgISA: number | null;
  // ── Movido desde ComplianceHeader ──────────────────────────────────────
  campaigns: ComplianceCampaignSummary[];
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string) => void;
  pageState: CompliancePageState;
}

export default function ComplianceRail({
  activeSection,
  isExpanded,
  onToggle,
  onSelect,
  alertasCount,
  planActionsCount,
  orgISA,
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  pageState,
}: ComplianceRailProps) {
  const selectorDisabled = pageState === 'loading' || pageState === 'error';
  const activeMeta = COMPLIANCE_SECTIONS.find((s) => s.id === activeSection);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    carouselRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };

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
      className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#0F172A] via-[#0F172A] to-transparent flex flex-col justify-end border-t border-white/5 backdrop-blur-xl"
      initial={false}
      animate={{
        height: isExpanded ? 320 : 50,
        backgroundColor: isExpanded ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
        borderColor: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
      }}
      transition={{ type: 'spring', stiffness: 250, damping: 30 }}
    >

      {/* Toggle Bar - Siempre visible */}
      <div
        className="px-6 md:px-8 h-[50px] flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors flex-shrink-0 gap-3"
        onClick={onToggle}
      >
        {/* LEFT — Sections counter + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
            Secciones ({COMPLIANCE_SECTIONS.length})
          </h3>
          <ChevronUp
            className={cn(
              'w-3 h-3 text-slate-600 transition-transform duration-300',
              isExpanded ? 'rotate-180' : 'rotate-0'
            )}
          />
        </div>

        {/* CENTER — "Viendo: X" cuando colapsado */}
        {!isExpanded && activeMeta && (
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-slate-400 font-medium">Viendo:</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
              {activeMeta.railLabel}
            </span>
          </div>
        )}

        {/* RIGHT — Selector + PDFs + Navegar */}
        <div
          className="flex items-center gap-2 md:gap-3 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {campaigns.length > 0 && (
            <select
              value={selectedCampaignId ?? ''}
              onChange={(e) => onSelectCampaign(e.target.value)}
              disabled={selectorDisabled}
              onClick={(e) => e.stopPropagation()}
              aria-label="Seleccionar campaña"
              className="
                text-xs bg-slate-900/70 border border-slate-800
                rounded-lg px-2.5 py-1.5
                text-slate-300
                focus:outline-none focus:border-cyan-500/40 hover:border-slate-700
                disabled:opacity-40 disabled:cursor-not-allowed
                min-w-[140px] md:min-w-[220px]
                cursor-pointer
              "
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.status === 'active' && ' — en curso'}
                  {c.status === 'draft' && ' — borrador'}
                </option>
              ))}
            </select>
          )}

          <PDFRailButton
            icon={<FileText className="w-3.5 h-3.5" />}
            label="Reporte ejecutivo"
          />
          <PDFRailButton
            icon={<FileSearch className="w-3.5 h-3.5" />}
            label="Evidencia legal"
          />

          {/* CTA Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_2px_10px_rgba(34,211,238,0.3)] whitespace-nowrap"
          >
            {isExpanded ? 'Ocultar' : 'Navegar'}
          </button>
        </div>
      </div>

      {/* Contenido expandible */}
      <div className={cn(
        'transition-opacity duration-200 flex-1 flex flex-col min-h-0',
        isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>

        {/* CARRUSEL HORIZONTAL */}
        <div className="relative group">
          {/* Left arrow */}
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-slate-800/90 hover:bg-slate-700 rounded-full flex items-center justify-center border border-slate-700 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div
            ref={carouselRef}
            className="flex overflow-x-auto gap-3 px-8 pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {COMPLIANCE_SECTIONS.map((section, i) => (
              <SectionRailCard
                key={section.id}
                id={section.id}
                index={i}
                label={section.railLabel}
                icon={section.icon}
                isActive={section.id === activeSection}
                teslaColor={teslaColorFor(section.id)}
                badge={badgeFor(section.id)}
                onClick={() => onSelect(section.id)}
              />
            ))}
          </div>

          {/* Right arrow */}
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

// ────────────────────────────────────────────────────────────────────────────
// PDFRailButton — botón placeholder Fase 6 (disabled + tooltip)
// ────────────────────────────────────────────────────────────────────────────
// Patrón heredado de ComplianceHeader.PDFButton (eliminado al integrar al rail).
// Mobile: hidden. Desktop: inline-flex.

function PDFRailButton({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      disabled
      title="Generador de Evidencia Legal en preparación (Disponible en Fase 6)"
      onClick={(e) => e.stopPropagation()}
      className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-slate-900/70 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60"
    >
      {icon}
      {label}
    </button>
  );
}
