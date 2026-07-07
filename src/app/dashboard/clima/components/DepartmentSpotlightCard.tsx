'use client';

// src/app/dashboard/clima/components/DepartmentSpotlightCard.tsx
// Detalle de clima de un departamento. Clon estructural de
// evaluator/cinema/SpotlightCard: Línea Tesla + 2 columnas (identidad / detalle).
// Ensambla los componentes de contenido genéricos.

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import EngagementGauge from '@/components/clima/EngagementGauge';
import FavorabilityBar from '@/components/clima/FavorabilityBar';
import BusinessCaseCard from '@/components/clima/BusinessCaseCard';
import AcotadoGapCard from '@/components/clima/AcotadoGapCard';
import CrossSignalPanel from '@/components/clima/CrossSignalPanel';
import type { ClimaDepartmentInsight } from '@/types/clima';

interface DepartmentSpotlightCardProps {
  department: ClimaDepartmentInsight;
  onBack: () => void;
}

export default function DepartmentSpotlightCard({
  department,
  onBack,
}: DepartmentSpotlightCardProps) {
  const driverRows = useMemo(() => {
    const analysis = department.driverAnalysis ?? [];
    const scores = department.driverScores ?? {};
    const rows = analysis.length
      ? analysis.map((d) => ({
          driver: d.driver,
          fav: d.fav,
          carried: d.carried,
          sourceDate: scores[d.driver]?.sourceDate,
        }))
      : Object.entries(scores).map(([k, v]) => ({
          driver: k,
          fav: v.fav,
          carried: v.carried,
          sourceDate: v.sourceDate,
        }));
    return rows.sort((a, b) => (a.fav ?? 999) - (b.fav ?? 999));
  }, [department]);

  const businessCases = department.correlationFlags?.businessCases ?? [];
  const participationPct = Math.round(department.participationRate);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 30 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="w-full max-w-5xl"
    >
      <div className="bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800 rounded-[24px] shadow-2xl flex flex-col md:flex-row relative overflow-hidden">
        {/* Línea Tesla */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 15px #22D3EE',
          }}
        />

        {/* Volver al Lobby */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
        >
          <ArrowLeft className="w-3 h-3" /> Resumen
        </button>

        {/* COLUMNA IZQUIERDA: identidad + gauge del depto */}
        <div className="w-full md:w-[280px] md:flex-shrink-0 bg-slate-900/50 p-8 pt-16 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
          <EngagementGauge
            favorability={department.engagementFavorability}
            riskZone={department.riskZone}
            momentum={department.momentum}
            size={200}
          />
          <h2 className="text-lg font-light text-white mt-4 text-center tracking-tight">
            {department.departmentName}
          </h2>
          {department.npsScore !== null && (
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-slate-500 font-light">
                eNPS <span className="text-slate-300 tabular-nums">{Math.round(department.npsScore)}</span>
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-500 font-light mt-2">
            {department.totalResponded} de {department.totalInvited} respondieron ({participationPct}%)
          </p>
        </div>

        {/* COLUMNA DERECHA: detalle */}
        <div className="flex-1 flex flex-col min-h-[500px] p-6 md:p-8 pt-16 md:pt-16 gap-6 bg-gradient-to-br from-[#0F172A] to-[#162032] overflow-y-auto">
          {/* Título */}
          <div>
            <span className="text-[10px] uppercase tracking-widest text-slate-500">
              Inteligencia de Clima
            </span>
            <h3 className="text-xl font-extralight text-white tracking-tight mt-1">
              Diagnóstico de{' '}
              <span className="fhr-title-gradient">{department.departmentName}</span>
            </h3>
          </div>

          {/* Drivers */}
          {driverRows.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Dimensiones (favorabilidad)
              </p>
              {driverRows.map((d) => (
                <FavorabilityBar
                  key={d.driver}
                  label={d.driver}
                  value={d.fav}
                  carried={d.carried}
                  sourceDate={d.sourceDate}
                />
              ))}
            </div>
          )}

          {/* Brecha por nivel de cargo */}
          <AcotadoGapCard scores={department.acotadoGroupScores} />

          {/* Señales convergentes */}
          <CrossSignalPanel flags={department.correlationFlags} />

          {/* Casos de negocio */}
          {businessCases.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Casos de negocio
              </p>
              {businessCases.map((bc, i) => (
                <BusinessCaseCard key={`${bc.type}-${i}`} businessCase={bc} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
