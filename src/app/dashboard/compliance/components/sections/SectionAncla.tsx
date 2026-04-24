'use client';

// src/app/dashboard/compliance/components/sections/SectionAncla.tsx
// Por departamento — pills selector + gauge + 4 nodos "Masa y Gravedad".
// Tesla Line: cyan.

import { cn } from '@/lib/utils';
import SectionShell from './_shared/SectionShell';
import SafetyGauge from '../shared/SafetyGauge';
import {
  NODO_LABELS,
  NODO_REQUIRES,
} from '@/app/dashboard/compliance/lib/labels';
import {
  formatISA,
  formatDelta,
  isaLevelToLegacyRisk,
} from '@/app/dashboard/compliance/lib/format';
import { getISARiskLevel } from '@/lib/services/compliance/ISAService';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';
import type { ComplianceSource } from '@/types/compliance';

const NODO_ORDER: ComplianceSource[] = [
  'ambiente_sano',
  'exit',
  'onboarding',
  'pulso',
];

export default function SectionAncla({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;
  if (!report) return null;

  const depts = report.data.departments;
  const selectedId = hook.selectedDepartmentId;
  const dept = hook.selectedDepartment;

  const convergenciaDept = dept
    ? report.data.convergencia.departments.find((c) => c.departmentId === dept.departmentId)
    : null;
  const activeSourcesDept = new Set<ComplianceSource>(
    convergenciaDept?.activeSources ?? ['ambiente_sano']
  );

  const orgSafetyScore = report.data.orgSafetyScore;
  const orgISA = report.data.orgISA;
  const anclaTitular = report.narratives.ancla.titular;
  const anclaDescripcion = report.narratives.ancla.descripcion;

  return (
    <SectionShell sectionId="ancla" onNext={hook.navigateNext}>
      {/* Narrativa general del acto */}
      <div className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">
          Por departamento
        </p>
        <h2 className="text-xl md:text-2xl font-light text-white leading-snug">
          {anclaTitular}
        </h2>
        <p className="text-sm text-slate-500 font-light mt-2 leading-relaxed">
          {anclaDescripcion}
        </p>
      </div>

      {/* Pills selector de depto (scroll horizontal en mobile) */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 [&::-webkit-scrollbar]:hidden mb-6">
        {depts.map((d) => {
          const isActive = d.departmentId === selectedId;
          return (
            <button
              key={d.departmentId}
              onClick={() => hook.selectDepartment(d.departmentId)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full border text-xs font-light transition-all whitespace-nowrap',
                isActive
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              )}
            >
              {d.departmentName}
              {d.isaScore !== null && (
                <span className="ml-2 text-slate-600 tabular-nums font-mono text-[10px]">
                  {d.isaScore}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {dept ? (
        <>
          {/* Gauge + composición */}
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Gauge del depto */}
            <div className="flex flex-col items-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3">
                {dept.departmentName}
              </p>
              <SafetyGauge
                score={dept.safetyScore}
                riskLevel={
                  dept.isaScore !== null
                    ? isaLevelToLegacyRisk(getISARiskLevel(dept.isaScore))
                    : 'safe'
                }
                size={220}
              />
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-3xl font-extralight text-white tabular-nums">
                  {formatISA(dept.isaScore)}
                </span>
                <span className="text-slate-600 text-[10px] uppercase tracking-widest font-light">
                  índice del área
                </span>
              </div>
            </div>

            {/* Track A — datos de contexto */}
            <TrackA
              dept={dept}
              orgSafetyScore={orgSafetyScore}
              orgISA={orgISA}
            />
          </div>

          {/* 4 nodos Masa y Gravedad */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
            {NODO_ORDER.map((source) => {
              const isActive = activeSourcesDept.has(source);
              const nodeValue = nodeValueFor(source, dept, convergenciaDept);
              return (
                <div
                  key={source}
                  className={cn(
                    'relative overflow-hidden p-4 rounded-xl border transition-all',
                    isActive
                      ? 'bg-slate-900/60 border-slate-800'
                      : 'bg-slate-900/20 border-slate-900 opacity-40'
                  )}
                >
                  <p className="text-[9px] uppercase tracking-widest text-slate-500">
                    {NODO_LABELS[source]}
                  </p>
                  <p className="text-2xl font-extralight text-white tabular-nums mt-1">
                    {isActive ? nodeValue : '—'}
                  </p>
                  {!isActive && NODO_REQUIRES[source] && (
                    <p className="text-[9px] text-slate-600 mt-1 italic leading-tight">
                      {NODO_REQUIRES[source]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-[20px]">
          <p className="text-slate-500 text-sm font-light">
            Selecciona un departamento para ver su composición.
          </p>
        </div>
      )}
    </SectionShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Subcomponentes
// ═══════════════════════════════════════════════════════════════════

function TrackA({
  dept,
  orgSafetyScore,
  orgISA,
}: {
  dept: NonNullable<UseComplianceDataReturn['selectedDepartment']>;
  orgSafetyScore: number | null;
  orgISA: number | null;
}) {
  const vsOrgSafety =
    orgSafetyScore !== null ? dept.safetyScore - orgSafetyScore : null;
  const vsOrgISA =
    orgISA !== null && dept.isaScore !== null ? dept.isaScore - orgISA : null;
  const generoGap = computeGenderGap(dept);

  return (
    <div className="space-y-4 text-sm">
      <TrackRow
        label="Respecto a la organización"
        value={vsOrgISA !== null ? `${formatDelta(vsOrgISA)} pts` : '—'}
        hint={
          vsOrgSafety !== null
            ? `${vsOrgSafety >= 0 ? '+' : ''}${vsOrgSafety.toFixed(1)} vs score org`
            : undefined
        }
      />
      <TrackRow
        label="Comparado con el ciclo anterior"
        value={
          dept.deltaVsAnterior !== null
            ? `${formatDelta(dept.deltaVsAnterior)} pts`
            : 'Primera medición'
        }
      />
      {generoGap !== null && (
        <TrackRow
          label="Brecha por género (M − F)"
          value={`${generoGap >= 0 ? '+' : ''}${generoGap.toFixed(1)}`}
          hint={
            Math.abs(generoGap) >= 0.5
              ? 'Diferencia apreciable — revisar'
              : undefined
          }
        />
      )}
      <TrackRow
        label="Respondieron"
        value={`${dept.respondentCount} ${dept.respondentCount === 1 ? 'persona' : 'personas'}`}
      />
    </div>
  );
}

function TrackRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-slate-800/60">
      <div>
        <p className="text-[11px] text-slate-500 font-light uppercase tracking-wider">
          {label}
        </p>
        {hint && <p className="text-[10px] text-slate-600 font-light mt-0.5">{hint}</p>}
      </div>
      <span className="text-slate-200 text-sm font-light tabular-nums">{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function computeGenderGap(
  dept: NonNullable<UseComplianceDataReturn['selectedDepartment']>
): number | null {
  const gb = dept.genderBreakdown;
  if (!gb || !gb.male || !gb.female) return null;
  return gb.male.score - gb.female.score;
}

function nodeValueFor(
  source: ComplianceSource,
  dept: NonNullable<UseComplianceDataReturn['selectedDepartment']>,
  _convergencia: ReturnType<typeof Object> extends infer _R ? unknown : unknown
): string {
  // De momento solo 'ambiente_sano' tiene métrica nativa expuesta en el report
  // (safetyScore). Los demás nodos muestran "Activo" cuando la fuente está
  // disponible en convergencia, pero el detalle numérico de cada uno se
  // construye por fuente en Sesión 7 (convergencia) y alertas.
  if (source === 'ambiente_sano') return dept.safetyScore.toFixed(1);
  return 'Activo';
}
