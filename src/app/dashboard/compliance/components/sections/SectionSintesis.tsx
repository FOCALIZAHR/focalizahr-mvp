'use client';

// src/app/dashboard/compliance/components/sections/SectionSintesis.tsx
// El gancho. Hero ISA + narrativa portada + 3 chips + CTA a depto menor ISA.
// Tesla Line dinámica según ISA riskLevel (TESLA_SINTESIS).

import SectionShell from './_shared/SectionShell';
import {
  ISA_LABELS,
  TESLA_SINTESIS,
} from '@/app/dashboard/compliance/lib/labels';
import { getISARiskLevel } from '@/lib/services/compliance/ISAService';
import { formatISA } from '@/app/dashboard/compliance/lib/format';
import { pickLowestISA } from '@/app/dashboard/compliance/lib/format';
import type { UseComplianceDataReturn } from '@/hooks/useComplianceData';

export default function SectionSintesis({ hook }: { hook: UseComplianceDataReturn }) {
  const report = hook.report;
  if (!report) return null;

  const orgISA = report.data.orgISA;
  const risk = orgISA !== null ? getISARiskLevel(orgISA) : 'saludable';
  const teslaColor = TESLA_SINTESIS[risk];
  const isaLabel = ISA_LABELS[risk];

  const portada = report.narratives.portada;
  const meta = report.data.metaAnalysis;

  // Chips de contexto ejecutivo
  const convergenteDepts = report.data.convergencia.departments.filter(
    (c) => c.level === 'convergente' || c.level === 'critico'
  ).length;
  const alertasActivas = report.data.alerts.filter(
    (a) => a.status !== 'resolved' && a.status !== 'dismissed'
  ).length;
  const teatroCount = meta?.teatro_detectado_count ?? 0;

  const deptMenorISA = pickLowestISA(report.data.departments);

  return (
    <SectionShell
      sectionId="sintesis"
      teslaColorOverride={teslaColor}
      onNext={hook.navigateNext}
    >
      {/* Hero ISA */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
          Síntesis del ciclo
        </p>
        <div className="flex items-center justify-center leading-none">
          <span className="text-[96px] md:text-[120px] font-extralight tabular-nums text-white leading-none">
            {formatISA(orgISA)}
          </span>
        </div>
        <p className="text-slate-500 text-sm uppercase tracking-widest mt-2">
          {isaLabel.label}
        </p>
        <p className="text-slate-600 text-xs mt-1 font-light italic">
          {isaLabel.descripcion}
        </p>
      </div>

      {/* Narrativa portada + delta + hallazgo meta */}
      <div className="mt-10 max-w-2xl mx-auto text-center">
        <p className="text-slate-200 font-light text-lg md:text-xl leading-relaxed">
          {portada.titular}
        </p>
        <p className="text-slate-500 font-light text-sm mt-3">
          {portada.subtitular}
        </p>
        {portada.deltaLabel && (
          <span className="text-slate-400 text-xs mt-3 block tabular-nums">
            {portada.deltaLabel}
          </span>
        )}
      </div>

      {/* 3 chips resumen */}
      <div className="flex flex-wrap justify-center gap-3 mt-10">
        <Chip
          label={`${convergenteDepts} ${convergenteDepts === 1 ? 'señal convergente' : 'señales convergentes'}`}
        />
        <Chip
          label={`${alertasActivas} ${alertasActivas === 1 ? 'alerta activa' : 'alertas activas'}`}
          accent={alertasActivas > 0 ? 'amber' : 'slate'}
        />
        {teatroCount > 0 && (
          <Chip
            label={`Teatro detectado en ${teatroCount} ${teatroCount === 1 ? 'área' : 'áreas'}`}
            accent="amber"
          />
        )}
      </div>

      {/* CTA a depto de mayor riesgo */}
      {deptMenorISA && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => {
              hook.selectDepartment(deptMenorISA.departmentId);
              hook.selectSection('ancla');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all text-sm font-light"
          >
            Ver {deptMenorISA.departmentName} →
          </button>
        </div>
      )}
    </SectionShell>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Subcomponentes
// ═══════════════════════════════════════════════════════════════════

function Chip({
  label,
  accent = 'slate',
}: {
  label: string;
  accent?: 'slate' | 'amber';
}) {
  const styles =
    accent === 'amber'
      ? 'border-amber-500/30 text-amber-300 bg-amber-500/5'
      : 'border-slate-700 text-slate-400 bg-slate-900/40';
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full border text-xs font-light ${styles}`}
    >
      {label}
    </span>
  );
}
