'use client';

// Sub-vista — Condición 3 (convergencia crítica O criticalByManager poblado).
// 4 bloques apilados verticalmente:
//   1. Hero — editorial title + veredicto del motor
//   2. Tarjeta(s) de Liderazgo — 1 por grupo de criticalByManager (privacy hardened)
//   3. Sellos Forenses — flags ocultos por dept (silencio/deterioro/ignorada)
//   4. Línea de Combustión — alertas con SLA del scope
//
// Tokens canónicos compliance: bg #0F172A + border 0.5px + rounded 20px.
// Tesla cyan + glow — máxima carga visual de la sección.
// Privacy: NUNCA renderizar managerId. Solo departmentNames.

import { useMemo } from 'react';
import { CRITICAL_BY_MANAGER_COPY } from './_shared/CRITICAL_BY_MANAGER_COPY';
import { FLAGS_OCULTOS_LABELS } from './_shared/FLAGS_OCULTOS_LABELS';
import {
  deriveCriticalGroups,
  deriveDeptHiddenFlags,
  splitAlertsBySLA,
  type CriticalGroup,
  type DeptHiddenFlags,
} from './_shared/helpers';
import { formatCyclePeriod } from '../SectionDimensiones/_shared/helpers';
import type {
  ComplianceReportResponse,
  ComplianceReportAlert,
} from '@/types/compliance';

interface Props {
  report: ComplianceReportResponse;
}

export default function ConvergenciaConfirmada({ report }: Props) {
  const departments = report.data.convergencia.departments;
  const criticalByManager = report.data.convergencia.criticalByManager;
  const cbmNarrativa = report.narratives.criticalByManagerNarrativa;
  const cyclePeriod = formatCyclePeriod({
    startDate: report.campaign.startDate,
    endDate: report.campaign.endDate,
  });

  const criticalGroups = useMemo(
    () => deriveCriticalGroups(criticalByManager, departments),
    [criticalByManager, departments]
  );

  const hiddenFlagsByDept = useMemo(
    () => deriveDeptHiddenFlags(departments, report.data.departments),
    [departments, report.data.departments]
  );

  const alertSplit = useMemo(
    () => splitAlertsBySLA(report.data.alerts),
    [report.data.alerts]
  );

  const totalAlertasGestion =
    alertSplit.enTiempo.length + alertSplit.vencidas.length;

  return (
    <div
      className="relative overflow-hidden rounded-[20px]"
      style={{
        background: '#0F172A',
        border: '0.5px solid #1e293b',
      }}
    >
      {/* Tesla cyan + glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, transparent, #22D3EE 40%, #A78BFA 60%, transparent)',
          boxShadow: '0 0 10px rgba(34,211,238,0.35)',
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
          style={{ background: '#22D3EE' }}
          aria-hidden="true"
        />
        <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
          Estado
        </span>
        <span className="text-[10px] text-slate-500 font-normal">
          Convergencia confirmada{cyclePeriod ? ` · ${cyclePeriod}` : ''}
        </span>
      </div>

      {/* BLOQUE 1 — HERO 60/40 */}
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
              {CRITICAL_BY_MANAGER_COPY.titularHero}
            </span>
            <span
              className="block text-[44px] font-extralight"
              style={{ color: '#22D3EE' }}
            >
              {CRITICAL_BY_MANAGER_COPY.titularHeroSegunda}
            </span>
          </div>

          <p
            className="text-[13px] italic font-light leading-[1.6] pl-3"
            style={{
              color: '#64748b',
              borderLeft: '1px solid #1e293b',
            }}
          >
            {CRITICAL_BY_MANAGER_COPY.veredicto}
          </p>

          <p
            className="text-sm font-light leading-[1.8]"
            style={{ color: '#cbd5e1' }}
          >
            {cbmNarrativa ?? CRITICAL_BY_MANAGER_COPY.descripcion}
          </p>

          <p
            className="text-[11px] font-light leading-[1.6]"
            style={{ color: '#475569' }}
          >
            {CRITICAL_BY_MANAGER_COPY.privacyNote}
          </p>
        </div>

        {/* RIGHT 40% — counter de impacto */}
        <div className="flex flex-col justify-center gap-2 px-7 py-8">
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
            Concentración
          </span>
          <div className="flex items-baseline gap-3">
            <span
              className="text-[64px] font-extralight tabular-nums leading-none"
              style={{ color: '#22D3EE' }}
            >
              {criticalGroups.reduce((sum, g) => sum + g.departmentNames.length, 0)}
            </span>
            <span className="text-xs font-light text-slate-500">
              departamentos
            </span>
          </div>
          <p className="text-[11px] font-light text-slate-500 mt-1 leading-[1.6]">
            {criticalGroups.length === 1
              ? 'bajo la misma línea de mando.'
              : criticalGroups.length > 1
                ? `bajo ${criticalGroups.length} líneas de mando distintas.`
                : 'con señales convergentes.'}
          </p>
        </div>
      </div>

      {/* BLOQUE 2 — TARJETAS DE LIDERAZGO (privacy hardened) */}
      {criticalGroups.length > 0 ? (
        <div style={{ borderTop: '0.5px solid #1e293b' }}>
          <div
            className="px-7 py-4"
            style={{ borderBottom: '0.5px solid #1e293b' }}
          >
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
              Agrupación detectada
            </span>
          </div>
          <div className="flex flex-col gap-0">
            {criticalGroups.map((g, i) => (
              <TarjetaLiderazgo
                key={g.managerId}
                group={g}
                index={i + 1}
                isLast={i === criticalGroups.length - 1}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* BLOQUE 3 — SELLOS FORENSES */}
      {hiddenFlagsByDept.length > 0 ? (
        <div style={{ borderTop: '0.5px solid #1e293b' }}>
          <div
            className="px-7 py-4"
            style={{ borderBottom: '0.5px solid #1e293b' }}
          >
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
              Marcadores forenses
            </span>
            <p className="text-[11px] font-light text-slate-500 mt-1 leading-[1.5]">
              Señales que el sistema registró pero que no aparecen en métricas
              regulares.
            </p>
          </div>
          {hiddenFlagsByDept.map((d, i) => (
            <SellosForensesRow
              key={d.departmentId}
              dept={d}
              isLast={i === hiddenFlagsByDept.length - 1}
            />
          ))}
        </div>
      ) : null}

      {/* BLOQUE 4 — LÍNEA DE COMBUSTIÓN (alertas SLA) */}
      {totalAlertasGestion > 0 ? (
        <div style={{ borderTop: '0.5px solid #1e293b' }}>
          <div
            className="px-7 py-4"
            style={{ borderBottom: '0.5px solid #1e293b' }}
          >
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-600">
              Alertas activas
            </span>
            <p className="text-[11px] font-light text-slate-500 mt-1 leading-[1.5]">
              {alertSplit.vencidas.length > 0
                ? 'Alertas con SLA vencido quedan registradas como gestión no realizada.'
                : 'Alertas con SLA en curso. La inacción queda registrada al vencimiento.'}
            </p>
          </div>
          {alertSplit.enTiempo.map((a, i) => (
            <LineaCombustion
              key={a.id}
              alert={a}
              estado="en_tiempo"
              isLast={
                i === alertSplit.enTiempo.length - 1 &&
                alertSplit.vencidas.length === 0
              }
            />
          ))}
          {alertSplit.vencidas.map((a, i) => (
            <LineaCombustion
              key={a.id}
              alert={a}
              estado="vencida"
              isLast={i === alertSplit.vencidas.length - 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TARJETA DE LIDERAZGO — agrupa deptos sin nombrar manager
// ════════════════════════════════════════════════════════════════════════════

function TarjetaLiderazgo({
  group,
  index,
  isLast,
}: {
  group: CriticalGroup;
  index: number;
  isLast: boolean;
}) {
  return (
    <div
      className="px-7 py-5"
      style={{
        borderBottom: isLast ? 'none' : '0.5px solid #0d1520',
      }}
    >
      <div className="flex items-baseline gap-3 mb-3">
        <span
          className="text-[10px] font-mono uppercase tracking-[0.15em]"
          style={{ color: '#475569' }}
        >
          Línea {index.toString().padStart(2, '0')}
        </span>
        <span
          className="text-[28px] font-extralight tabular-nums leading-none"
          style={{ color: '#22D3EE' }}
        >
          {group.departmentNames.length}
        </span>
        <span className="text-[11px] font-light text-slate-500">
          {group.departmentNames.length === 1 ? 'departamento' : 'departamentos'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {group.departmentNames.map((name) => (
          <span
            key={name}
            className="inline-flex px-2.5 py-[3px] rounded-[20px] text-[10px] font-bold tracking-[0.1em] uppercase"
            style={{
              background: 'rgba(34,211,238,0.06)',
              border: '0.5px solid rgba(34,211,238,0.2)',
              color: '#67e8f9',
            }}
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SELLOS FORENSES — flags ocultos por dept
// ════════════════════════════════════════════════════════════════════════════

function SellosForensesRow({
  dept,
  isLast,
}: {
  dept: DeptHiddenFlags;
  isLast: boolean;
}) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[200px_1fr] items-start gap-3 md:gap-5 px-7 py-4"
      style={{
        borderBottom: isLast ? 'none' : '0.5px solid #0d1520',
      }}
    >
      <div className="text-[13px] font-normal" style={{ color: '#e2e8f0' }}>
        {dept.departmentName}
      </div>
      <div className="flex flex-col gap-2">
        {dept.flags.map((flag) => {
          const copy = FLAGS_OCULTOS_LABELS[flag];
          const sealColor = copy.severidad === 'alta' ? '#fbbf24' : '#94a3b8';
          return (
            <div key={flag} className="flex flex-col gap-1">
              <span
                className="inline-flex self-start px-2 py-1 font-mono uppercase text-[10px] tracking-[0.12em]"
                style={{
                  background: '#070d1a',
                  border: '1px solid #1e293b',
                  color: sealColor,
                  // rounded-none — esquinas afiladas (sello forense)
                  borderRadius: 0,
                }}
              >
                {copy.sello}
              </span>
              <p className="text-[11px] font-light leading-[1.5] text-slate-500 pl-1">
                {copy.descripcion}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LÍNEA DE COMBUSTIÓN — alertas con SLA
// ════════════════════════════════════════════════════════════════════════════

function LineaCombustion({
  alert,
  estado,
  isLast,
}: {
  alert: ComplianceReportAlert;
  estado: 'en_tiempo' | 'vencida';
  isLast: boolean;
}) {
  const dueLabel = formatDueLabel(alert.dueDate, estado);

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3 md:gap-5 px-7 py-4"
      style={{
        borderBottom: isLast ? 'none' : '0.5px solid #0d1520',
      }}
    >
      <div>
        <div
          className="text-[13px] font-normal mb-0.5"
          style={{
            color: estado === 'vencida' ? '#475569' : '#e2e8f0',
            textDecoration: estado === 'vencida' ? 'line-through' : 'none',
          }}
        >
          {alert.title}
          {alert.departmentName ? (
            <span
              className="text-[11px] font-light ml-2"
              style={{ color: '#64748b' }}
            >
              · {alert.departmentName}
            </span>
          ) : null}
        </div>

        {/* Línea de combustión visual */}
        {estado === 'en_tiempo' ? (
          <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full">
            <div
              className="h-full w-full"
              style={{
                background:
                  'linear-gradient(90deg, #F59E0B, #FCD34D)',
              }}
            />
          </div>
        ) : (
          <div
            className="mt-2 text-[10px] font-mono uppercase tracking-[0.15em]"
            style={{ color: '#475569' }}
          >
            SLA INCUMPLIDO · REGISTRO PERMANENTE
          </div>
        )}
      </div>

      <div
        className="text-[11px] font-light tabular-nums"
        style={{
          color: estado === 'vencida' ? '#475569' : '#fcd34d',
        }}
      >
        {dueLabel}
      </div>
    </div>
  );
}

function formatDueLabel(
  dueDate: string | Date | null,
  estado: 'en_tiempo' | 'vencida'
): string {
  if (!dueDate) return '';
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (estado === 'vencida') {
    const overdueDays = Math.abs(diffDays);
    return overdueDays === 0
      ? 'Vencida hoy'
      : `Vencida hace ${overdueDays}d`;
  }

  if (diffDays === 0) return 'Vence hoy';
  if (diffDays === 1) return 'Vence mañana';
  return `Vence en ${diffDays}d`;
}
