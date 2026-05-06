'use client';

// Sub-vista — Condición 2 (2+ fuentes activas, sin convergencia crítica).
// Card 60/40 narrativa-only + bandas tácticas (1 banda por dept con riesgo).
// Mobile-first: bandas colapsan a stack vertical en <md.
//
// Tokens canónicos compliance: bg #0F172A + border 0.5px + rounded 20px.
// Tesla amber soft (sin glow excesivo) — señal en formación, no consolidada.

import { SOURCE_LABEL_NARRATIVE } from '@/config/compliance/sourceLabels';
import { formatCyclePeriod } from '../SectionDimensiones/_shared/helpers';
import type { ComplianceReportResponse, DepartmentConvergencia } from '@/types/compliance';
import type { ComplianceSource } from '@/config/complianceAlertConfig';

interface Props {
  report: ComplianceReportResponse;
}

export default function SenalesParciales({ report }: Props) {
  const activeSources = report.data.convergencia.activeSources;
  const departments = report.data.convergencia.departments;
  const cruceNarrativa = report.narratives.cruceNarrativa;
  const cyclePeriod = formatCyclePeriod({
    startDate: report.campaign.startDate,
    endDate: report.campaign.endDate,
  });

  // Solo bandas con al menos 1 fuente en risk. Sort por riskSignalsCount desc.
  const conRiesgo = departments
    .filter((d) => d.riskSignalsCount > 0)
    .sort((a, b) => b.riskSignalsCount - a.riskSignalsCount);

  return (
    <div
      className="relative overflow-hidden rounded-[20px]"
      style={{
        background: '#0F172A',
        border: '0.5px solid #1e293b',
      }}
    >
      {/* Tesla amber soft */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, #F59E0B 40%, #FCD34D 60%, transparent)',
          boxShadow: '0 0 8px rgba(245,158,11,0.25)',
        }}
        aria-hidden="true"
      />

      {/* STATUS BAR */}
      <div
        className="flex items-center gap-2 px-7 py-3"
        style={{ borderBottom: '0.5px solid #1e293b' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: '#fbbf24' }}
          aria-hidden="true"
        />
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
          Estado
        </span>
        <span className="text-[10px] text-slate-500 font-normal">
          Señales aisladas · {activeSources.length} fuentes activas
          {cyclePeriod ? ` · ${cyclePeriod}` : ''}
        </span>
      </div>

      {/* HERO 60/40 — narrativa, sin tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-[60fr_40fr]">
        <div
          className="flex flex-col gap-5 px-7 py-8 md:pl-7 md:pr-8"
          style={{ borderRight: '0.5px solid #1e293b' }}
        >
          <div className="leading-[1.1]">
            <span
              className="block text-[44px] font-extralight"
              style={{ color: '#f1f5f9' }}
            >
              Señales aisladas.
            </span>
            <span
              className="block text-[44px] font-extralight"
              style={{ color: '#fcd34d' }}
            >
              Sin resonancia estructural.
            </span>
          </div>

          <p
            className="text-[13px] italic font-light leading-[1.6] pl-3"
            style={{
              color: '#64748b',
              borderLeft: '1px solid #1e293b',
            }}
          >
            Más de un instrumento detecta signos. Ninguno los confirma con otro.
          </p>

          {/* Lego central — narrativa de cruce desde el motor */}
          {cruceNarrativa ? (
            <p
              className="text-sm font-light leading-[1.8]"
              style={{ color: '#cbd5e1' }}
            >
              {cruceNarrativa}
            </p>
          ) : (
            <p
              className="text-sm font-light leading-[1.8]"
              style={{ color: '#cbd5e1' }}
            >
              Cada fuente reporta deptos distintos. La señal existe, pero el
              patrón consolidado todavía no — un patrón consolidado no se mueve
              solo.
            </p>
          )}
        </div>

        {/* RIGHT 40% — counters muy sobrios, sin semáforos */}
        <div className="flex flex-col justify-center gap-4 px-7 py-8">
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
            Cobertura
          </span>
          <div className="flex items-baseline gap-3">
            <span
              className="text-[44px] font-extralight tabular-nums"
              style={{ color: '#fcd34d' }}
            >
              {conRiesgo.length}
            </span>
            <span className="text-xs font-light text-slate-500">
              {conRiesgo.length === 1
                ? 'departamento con señal'
                : 'departamentos con señal'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {activeSources.map((s) => (
              <span
                key={s}
                className="text-[10px] font-light px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(100,116,139,0.08)',
                  border: '0.5px solid rgba(100,116,139,0.2)',
                  color: '#94a3b8',
                }}
              >
                {SOURCE_LABEL_NARRATIVE[s]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BANDAS TÁCTICAS — 1 por dept con riesgo */}
      {conRiesgo.length > 0 ? (
        <div
          className="border-t"
          style={{ borderColor: '#1e293b' }}
        >
          <div className="px-7 py-4" style={{ borderBottom: '0.5px solid #1e293b' }}>
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
              Detalle por departamento
            </span>
          </div>
          {conRiesgo.map((d, i) => (
            <BandaTactica
              key={d.departmentId}
              dept={d}
              activeSources={activeSources}
              isLast={i === conRiesgo.length - 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BANDA TÁCTICA — 1 por dept con riesgo
// ════════════════════════════════════════════════════════════════════════════

function BandaTactica({
  dept,
  activeSources,
  isLast,
}: {
  dept: DepartmentConvergencia;
  activeSources: ComplianceSource[];
  isLast: boolean;
}) {
  const sourcesEnRisk = activeSources.filter(
    (s) => dept.signals[s]?.isRisk === true
  );
  const sourcesNoRisk = activeSources.filter(
    (s) => dept.signals[s] !== undefined && dept.signals[s]?.isRisk !== true
  );

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[200px_140px_1fr] items-start gap-3 md:gap-5 px-7 py-4"
      style={{
        borderBottom: isLast ? 'none' : '0.5px solid #0d1520',
      }}
    >
      {/* Col 1 — dept name + level */}
      <div>
        <div
          className="text-[13px] font-normal mb-0.5"
          style={{ color: '#e2e8f0' }}
        >
          {dept.departmentName}
        </div>
        <div
          className="text-[10px] font-light tracking-[0.05em] uppercase"
          style={{ color: '#475569' }}
        >
          {dept.level === 'medio' ? 'Señal media' : 'Señal baja'}
        </div>
      </div>

      {/* Col 2 — bloques de densidad (4 segmentos verticales) */}
      <div>
        <div className="flex items-end gap-[3px] h-6">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="flex-1 rounded-[1px]"
              style={{
                background:
                  i < dept.riskSignalsCount
                    ? '#fbbf24'
                    : 'rgba(71,85,105,0.2)',
                opacity: i < dept.riskSignalsCount ? 0.85 : 1,
                height:
                  i < dept.riskSignalsCount
                    ? `${50 + i * 15}%`
                    : '40%',
              }}
            />
          ))}
        </div>
        <div
          className="text-[10px] font-light tracking-[0.05em] mt-1"
          style={{ color: '#475569' }}
        >
          {dept.riskSignalsCount}/{activeSources.length} fuentes
        </div>
      </div>

      {/* Col 3 — qué fuente marca / qué fuente no */}
      <div className="flex flex-col gap-1.5">
        {sourcesEnRisk.length > 0 ? (
          <div className="text-[12px] font-light leading-[1.6]" style={{ color: '#cbd5e1' }}>
            <span className="text-slate-500">Marca: </span>
            {sourcesEnRisk
              .map((s) => SOURCE_LABEL_NARRATIVE[s])
              .join(' · ')}
          </div>
        ) : null}
        {sourcesNoRisk.length > 0 ? (
          <div className="text-[12px] font-light leading-[1.6]" style={{ color: '#64748b' }}>
            <span className="text-slate-500">No confirma: </span>
            {sourcesNoRisk
              .map((s) => SOURCE_LABEL_NARRATIVE[s])
              .join(' · ')}
          </div>
        ) : null}
      </div>
    </div>
  );
}
