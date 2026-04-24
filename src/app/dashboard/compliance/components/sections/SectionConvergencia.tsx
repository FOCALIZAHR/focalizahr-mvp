'use client';

// src/app/dashboard/compliance/components/sections/SectionConvergencia.tsx
// El costo — señales cruzadas deptos × fuentes. Tesla Line cyan.
// Flex rows (NO tabla HTML). Columnas sólo por activeSources del global.
// Dots amber × nivel. Narrativa contradicción protagonista con borde-l.

import { cn } from '@/lib/utils';
import SectionShell from './_shared/SectionShell';
import { NODO_LABELS } from '@/app/dashboard/compliance/lib/labels';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';
import type {
  ComplianceSource,
  ConvergenciaLevel,
  ConvergenciaSignal,
  DepartmentConvergencia,
} from '@/types/compliance';

const LEVEL_DOTS: Record<ConvergenciaLevel, number> = {
  sin_riesgo: 0,
  bajo: 1,
  medio: 2,
  convergente: 3,
  critico: 4,
};

export default function SectionConvergencia({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;
  if (!report) return null;

  const activeSources = report.data.convergencia.activeSources;
  const deptRows = report.data.convergencia.departments;
  const narrativas = report.narratives.artefacto3_convergencia;
  const narrativaByDept = new Map(narrativas.map((n) => [n.departmentId, n]));

  // Ordenar por nivel descendente (crítico primero)
  const ordered = [...deptRows].sort(
    (a, b) => LEVEL_DOTS[b.level] - LEVEL_DOTS[a.level]
  );

  return (
    <SectionShell sectionId="convergencia" onNext={hook.navigateNext}>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">
          Señales cruzadas
        </p>
        <h2 className="text-xl md:text-2xl font-light text-white leading-snug">
          Cuando tres fuentes apuntan al mismo lugar, eso no es coincidencia.
        </h2>
        <p className="text-sm text-slate-500 font-light mt-2 leading-relaxed">
          Fuentes activas este ciclo:{' '}
          {activeSources.length > 0 ? (
            <span className="text-slate-300 font-normal">
              {activeSources.map((s) => NODO_LABELS[s] ?? s).join(' · ')}
            </span>
          ) : (
            <em className="text-slate-600">solo Ambiente Sano</em>
          )}
          .
        </p>
      </div>

      {/* Header — fuentes activas */}
      <div className="grid grid-cols-[1fr_auto] md:grid-cols-[minmax(160px,1fr)_repeat(var(--cols),auto)_auto] gap-x-4 gap-y-3 items-center"
        style={{ ['--cols' as string]: String(activeSources.length) }}
      >
        <span className="text-[10px] uppercase tracking-widest text-slate-500">
          Departamento
        </span>
        {activeSources.map((src) => (
          <span
            key={src}
            className="hidden md:inline text-[10px] uppercase tracking-widest text-slate-500 text-center"
          >
            {NODO_LABELS[src] ?? src}
          </span>
        ))}
        <span className="text-[10px] uppercase tracking-widest text-slate-500 text-right">
          Señales
        </span>

        {/* Rows */}
        {ordered.map((row) => (
          <DeptRow
            key={row.departmentId}
            row={row}
            activeSources={activeSources}
            narrative={narrativaByDept.get(row.departmentId)?.narrativa}
            contradiccion={narrativaByDept.get(row.departmentId)?.contradiccionProtagonista}
          />
        ))}
      </div>

      {ordered.length === 0 && (
        <p className="text-slate-500 text-sm font-light italic mt-4">
          Sin señales convergentes este ciclo.
        </p>
      )}
    </SectionShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Subcomponentes
// ═══════════════════════════════════════════════════════════════════

function DeptRow({
  row,
  activeSources,
  narrative,
  contradiccion,
}: {
  row: DepartmentConvergencia;
  activeSources: ComplianceSource[];
  narrative?: string;
  contradiccion?: string;
}) {
  const dots = LEVEL_DOTS[row.level] ?? 0;

  return (
    <>
      <div className="font-light text-slate-200 text-sm truncate col-span-2 md:col-span-1">
        {row.departmentName}
      </div>

      {/* Dots por fuente — hidden mobile */}
      {activeSources.map((src) => {
        const sig = row.signals?.[src];
        return (
          <div
            key={src}
            className="hidden md:flex justify-center"
            title={tooltipForSignal(sig)}
          >
            <SignalDot signal={sig} />
          </div>
        );
      })}

      {/* Nivel de convergencia con dots amber */}
      <div
        className={cn(
          'flex justify-end col-start-2 md:col-start-auto',
          'row-start-1 md:row-start-auto'
        )}
      >
        <LevelDots count={dots} />
      </div>

      {/* Narrativa + contradicción protagonista span full */}
      {(narrative || contradiccion) && (
        <div className="col-span-2 md:col-span-full pb-4 border-b border-slate-800/40 -mt-2">
          {narrative && (
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              {narrative}
            </p>
          )}
          {contradiccion && (
            <p className="text-sm text-slate-300 font-light leading-relaxed italic border-l-2 border-cyan-500/30 pl-4 mt-2">
              {contradiccion}
            </p>
          )}
        </div>
      )}
      {!narrative && !contradiccion && (
        <div className="col-span-2 md:col-span-full border-b border-slate-800/40 pb-2 -mt-2" />
      )}
    </>
  );
}

function SignalDot({ signal }: { signal: ConvergenciaSignal | undefined }) {
  if (!signal) {
    return <span className="w-2 h-2 rounded-full bg-slate-900/60" />;
  }
  if (signal.isCritical) {
    return <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />;
  }
  if (signal.isRisk) {
    return <span className="w-2 h-2 rounded-full bg-amber-500/60" />;
  }
  return <span className="w-2 h-2 rounded-full bg-slate-600" />;
}

function LevelDots({ count }: { count: number }) {
  const max = 4;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-colors',
            i < count ? 'bg-amber-400' : 'bg-slate-800'
          )}
        />
      ))}
    </div>
  );
}

function tooltipForSignal(sig: ConvergenciaSignal | undefined): string {
  if (!sig) return 'Sin dato';
  if (sig.isCritical) return `Crítico${sig.note ? ': ' + sig.note : ''}`;
  if (sig.isRisk) return `Riesgo${sig.note ? ': ' + sig.note : ''}`;
  return sig.note ?? 'OK';
}
