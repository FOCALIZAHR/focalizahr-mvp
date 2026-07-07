'use client';

// src/app/dashboard/clima/components/ClimaChapterView.tsx
// Capítulo analítico de compañía (Cover→Content simplificado: frame + viz).
// Los 3 capítulos del MAESTRO Gate 4, con deep-link al SpotlightCard del depto.
// (La portada narrativa por capítulo la escribe Victor/Studio IA — pendiente
// del pase de narrativas, principio #4.)

import { motion } from 'framer-motion';
import { ArrowLeft, LayoutGrid, Target, Activity } from 'lucide-react';
import HeatmapGrid from '@/components/clima/HeatmapGrid';
import ImpactGapMatrix from '@/components/clima/ImpactGapMatrix';
import CorrelationScatter from '@/components/clima/CorrelationScatter';
import type { ClimaChapter, ClimaDepartmentInsight } from '@/types/clima';
import type { CompanyBusinessCaseTotal } from '@/lib/services/clima/PulseEngine';

interface ClimaChapterViewProps {
  chapter: ClimaChapter;
  departments: ClimaDepartmentInsight[];
  businessCaseTotals: CompanyBusinessCaseTotal[];
  onBack: () => void;
  onSelectDepartment: (id: string) => void;
}

const META: Record<ClimaChapter, { title: string; gradient: string; subtitle: string; icon: typeof LayoutGrid }> = {
  heatmap: {
    title: 'Mapa',
    gradient: 'de calor',
    subtitle: 'Dimensiones × departamentos de la compañía',
    icon: LayoutGrid,
  },
  impact: {
    title: 'Impacto',
    gradient: '× Brecha',
    subtitle: 'Priorización de dimensiones por impacto en el engagement',
    icon: Target,
  },
  correlacion: {
    title: 'Clima',
    gradient: '× Rotación',
    subtitle: 'Correlación y caso de negocio de la compañía',
    icon: Activity,
  },
};

export default function ClimaChapterView({
  chapter,
  departments,
  businessCaseTotals,
  onBack,
  onSelectDepartment,
}: ClimaChapterViewProps) {
  const meta = META[chapter];
  const Icon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="relative bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl p-6 md:p-8 pt-16">
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)', boxShadow: '0 0 15px #22D3EE' }}
        />
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" /> Resumen
        </button>

        {/* Título */}
        <div className="flex items-start gap-3 mb-6">
          <Icon className="w-5 h-5 text-slate-500 mt-1" />
          <div>
            <h3 className="text-2xl font-extralight text-white tracking-tight">
              {meta.title} <span className="fhr-title-gradient">{meta.gradient}</span>
            </h3>
            <p className="text-sm font-light text-slate-400 mt-1">{meta.subtitle}</p>
          </div>
        </div>

        {/* Contenido */}
        {chapter === 'heatmap' && (
          <HeatmapGrid departments={departments} onSelectDepartment={onSelectDepartment} />
        )}
        {chapter === 'impact' && <ImpactGapMatrix departments={departments} />}
        {chapter === 'correlacion' && (
          <CorrelationScatter departments={departments} businessCaseTotals={businessCaseTotals} />
        )}
      </div>
    </motion.div>
  );
}
