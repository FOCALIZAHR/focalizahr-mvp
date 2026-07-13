'use client';

// src/app/dashboard/clima/components/ClimaMissionControl.tsx
// Lobby del Cinema Mode de Clima. Layout calcado de
// evaluator/cinema/MissionControl: indicadores IZQUIERDA · gauge CENTRO ·
// CTA único DERECHA (en desktop; apilado en mobile). Entity-centric: el
// "siguiente" es el departamento en peor zona (Smart Router).

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import EngagementGauge from '@/components/clima/EngagementGauge';
import { zoneColor } from '@/components/clima/climaZonePalette';
import { getEngagementDivergenceNarrative } from '@/lib/services/clima/engagementDivergenceNarrative';
import type {
  ClimaCinemaStats,
  ClimaNextDepartment,
  RiskZone,
} from '@/types/clima';

interface ClimaMissionControlProps {
  scope: 'organization' | 'area';
  orgFavorability: number | null;
  orgRiskZone: RiskZone | null;
  orgMomentum: number | null;
  orgMeanMomentum: number | null; // Bloque A — base narrativa divergencia fav↔mean
  stats: ClimaCinemaStats;
  nextDepartment: ClimaNextDepartment | null;
  onSelectDepartment: (id: string) => void;
}

// Etiquetas de zona (concordancia femenina con "zona"), alineadas a ZONE_LABEL.
const ZONE_FEM: Record<RiskZone, string> = {
  roja: 'crítica',
  naranja: 'en riesgo',
  amarilla: 'en observación',
  verde: 'saludable',
};
const ZONE_FEM_PLURAL: Record<RiskZone, string> = {
  roja: 'críticas',
  naranja: 'en riesgo',
  amarilla: 'en observación',
  verde: 'saludables',
};
const ZONE_ORDER: RiskZone[] = ['roja', 'naranja', 'amarilla', 'verde'];

// Tooltip por zona (hover sobre el punto de la leyenda).
const ZONE_TOOLTIP: Record<RiskZone, string> = {
  roja: 'Zona crítica — engagement bajo 60% de favorabilidad',
  naranja: 'Zona en riesgo — engagement 60-64%',
  amarilla: 'Zona en observación — engagement 65-74%',
  verde: 'Zona saludable — engagement 75% o más',
};

// Leyenda de distribución de zonas de la compañía. Severidad = color del punto
// (anti-semáforo); texto neutro. `vertical` para el layout desktop (izquierda).
function ZoneLegend({ stats, vertical }: { stats: ClimaCinemaStats; vertical?: boolean }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-4 gap-y-1',
        vertical && 'md:flex-col md:items-start md:gap-2'
      )}
    >
      {ZONE_ORDER.filter((z) => stats.zoneCounts[z] > 0).map((z) => {
        const count = stats.zoneCounts[z];
        return (
          <span
            key={z}
            title={ZONE_TOOLTIP[z]}
            className="flex items-center gap-1.5 text-[11px] text-slate-400 font-light cursor-help"
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: zoneColor(z) }} />
            {count} {count === 1 ? ZONE_FEM[z] : ZONE_FEM_PLURAL[z]}
          </span>
        );
      })}
    </div>
  );
}

function FocusCTA({
  nextDepartment,
  onSelectDepartment,
}: {
  nextDepartment: ClimaNextDepartment;
  onSelectDepartment: (id: string) => void;
}) {
  const ctaColor = zoneColor(nextDepartment.riskZone);
  return (
    <div className="flex flex-col items-center md:items-start gap-2">
      <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Tu foco</span>
      <motion.button
        onClick={() => onSelectDepartment(nextDepartment.departmentId)}
        className="group relative flex items-center gap-4 rounded-xl pl-5 pr-2 py-3 transition-all"
        style={{
          background: `linear-gradient(135deg, ${ctaColor}, ${ctaColor}DD)`,
          color: '#0F172A',
          boxShadow: `0 8px 24px -6px ${ctaColor}66`,
        }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="text-left">
          <span className="block text-[9px] uppercase tracking-wider font-semibold opacity-70">
            {nextDepartment.riskZone ? `Zona ${ZONE_FEM[nextDepartment.riskZone]}` : 'Revisar'}
          </span>
          <span className="block text-sm font-bold leading-tight">
            {nextDepartment.departmentName}
          </span>
        </div>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-slate-950/10">
          <ArrowRight className="w-4 h-4" />
        </div>
      </motion.button>
    </div>
  );
}

export default function ClimaMissionControl({
  scope,
  orgFavorability,
  orgRiskZone,
  orgMomentum,
  orgMeanMomentum,
  stats,
  nextDepartment,
  onSelectDepartment,
}: ClimaMissionControlProps) {
  const scopeLabel = scope === 'area' ? 'tu área' : 'tu organización';
  // Bloque A — narrativa de divergencia fav↔mean; null si no hay divergencia
  // significativa (→ el gauge muestra solo su línea de favorabilidad sellada).
  const divergenceNarrative = getEngagementDivergenceNarrative({
    favMomentum: orgMomentum,
    meanMomentum: orgMeanMomentum,
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      className="flex flex-col items-center gap-8 w-full max-w-4xl px-4"
    >
      {/* Título scope-aware (word-split) */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-extralight text-white tracking-tight">
          Pulso de{' '}
          <span className="fhr-title-gradient">{scopeLabel}</span>
        </h1>
        <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mt-1">
          {stats.deptCount} departamento{stats.deptCount !== 1 ? 's' : ''} medido
          {stats.deptCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Fila principal — dots IZQUIERDA · gauge CENTRO · CTA DERECHA (desktop) */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 w-full">
        {/* Distribución de zonas — desktop izquierda */}
        <div className="hidden md:block">
          <ZoneLegend stats={stats} vertical />
        </div>

        {/* Gauge */}
        <EngagementGauge favorability={orgFavorability} riskZone={orgRiskZone} momentum={orgMomentum} />

        {/* CTA — desktop derecha */}
        {nextDepartment && (
          <div className="hidden md:block">
            <FocusCTA nextDepartment={nextDepartment} onSelectDepartment={onSelectDepartment} />
          </div>
        )}
      </div>

      {/* Bloque A — narrativa de divergencia fav↔mean bajo el gauge. Solo aparece
          cuando la media (más sensible) diverge del % que ve el CEO arriba. */}
      {divergenceNarrative && (
        <p className="text-sm font-light text-slate-400 leading-relaxed text-center max-w-md mx-auto -mt-2">
          {divergenceNarrative}
        </p>
      )}

      {/* CTA — mobile */}
      {nextDepartment && (
        <div className="md:hidden">
          <FocusCTA nextDepartment={nextDepartment} onSelectDepartment={onSelectDepartment} />
        </div>
      )}

      {/* Distribución de zonas — mobile */}
      <div className="md:hidden">
        <ZoneLegend stats={stats} />
      </div>

      {/* Capacidades del análisis completo (discretas, sin lenguaje "en construcción") */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {['Comentarios', 'Planes de acción', 'Curva Vital del Talento'].map((cap) => (
          <span
            key={cap}
            className="text-[9px] px-2 py-0.5 rounded-full text-slate-400/60 border border-slate-700/30 font-light"
          >
            {cap}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
