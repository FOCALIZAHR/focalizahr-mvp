'use client';

// ════════════════════════════════════════════════════════════════════════════
// DECISION CONSOLE — Detail Panel (columna derecha 70%)
// DecisionConsole.DetailPanel.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bundle Claude Design (Decision Console.html, abril 2026).
//
// JERARQUÍA DEL DOCUMENTO:
//   1. Eyebrow forense con seps `/` (10px tracking 0.22em slate-600)
//   2. Título editorial 56px font-extralight con <em> cyan en la 2a línea
//   3. Score row: 124px mono + columna meta (label + stat) — sin trend
//   4. Sección 01 · Lectura       (narrativa + origen + brecha + teatro)
//   5. Sección 02 · Departamentos críticos (si hasFocos)
//   6. Sección 03 · Recomendación (purple card con top line + ícono + meta grid)
//   7. Sección 04 · Tu plan       (plan-edit cards con toolbar + textareas)
//   8. Sticky CTA: summary + 1 botón cyan sólido (sin gradiente)
//
// Tokens del bundle:
//   - Padding scroll:  56px 64px 40px (md+) / 32px 20px 24px (mobile)
//   - Max-width panel: 820px centered
//   - Card recomendación: rgba(167,139,250,0.05) bg + purple border + top line
//   - Plan editor:     rgba(15,23,42,0.4) bg + slate-700/50 border + focus cyan/40
//   - CTA primary:     bg-cyan-400 text-#0F172A — sin gradiente
// ════════════════════════════════════════════════════════════════════════════

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb } from 'lucide-react';

import type { ComplianceDimensionKey } from '@/config/narratives/ComplianceNarrativeDictionary';
import type { ComplianceReportResponse } from '@/types/compliance';
import type { ComplianceDecisionItem } from '@/hooks/useComplianceData';

import {
  FLOW_COPY,
  PLAN_CONSOLIDADO_FRANCOTIRADOR,
  PLAN_CONSOLIDADO_TODO_SANO,
  RECOMMENDATIONS_BY_LEVEL,
  SCORE_THRESHOLDS,
  getEditorialTitle,
  type ActoLevelKey,
} from './_shared/constants';
import type { GenderGap, OrgOrigenLabel } from './_shared/helpers';
import { decodeTriggerRef } from './_shared/triggerRef';
import { getLegalBadgeText } from '@/config/compliance/legalBadgeConfig';

// ════════════════════════════════════════════════════════════════════════════
// HELPERS DE PRESENTACIÓN
// ════════════════════════════════════════════════════════════════════════════

/** Color del score por nivel — única señal de severidad. */
function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.SANO) return 'text-emerald-400';
  if (score >= SCORE_THRESHOLDS.ATENCION) return 'text-amber-400';
  if (score >= SCORE_THRESHOLDS.RIESGO) return 'text-amber-500';
  return 'text-red-400';
}

/** Mensaje contextual del bloque de planes según nivel. */
function getContextualMessage(level: ActoLevelKey): string {
  switch (level) {
    case 'sano_con_focos':
      return 'La organización está bien. El problema está aquí — en estos equipos.';
    case 'critico':
    case 'riesgo':
      return 'Esta dimensión requiere acción a nivel organización y en los focos específicos.';
    case 'atencion':
      return 'Monitoreo reforzado en el próximo ciclo. La acción a nivel organización sostiene el margen.';
    case 'sano':
      return 'Sin acciones requeridas. La dimensión está sana y sin focos.';
  }
}

/** Stat compacto al costado del score — refleja el contexto del nivel. */
function getScoreStat(level: ActoLevelKey, criticalDeptsCount: number): string {
  if (criticalDeptsCount > 0) {
    const plural = criticalDeptsCount === 1 ? 'área' : 'áreas';
    return `${criticalDeptsCount} ${plural} arrastra${criticalDeptsCount === 1 ? '' : 'n'} el promedio.`;
  }
  switch (level) {
    case 'critico':
      return 'Por debajo del umbral mínimo.';
    case 'riesgo':
      return 'Por debajo del umbral de control.';
    case 'atencion':
      return 'Sobre el umbral mínimo, dentro de la zona de atención.';
    case 'sano':
    case 'sano_con_focos':
      return 'Sobre el umbral saludable.';
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT — DetailPanel (modo dimensión)
// ════════════════════════════════════════════════════════════════════════════

export interface DetailPanelDept {
  departmentId: string;
  departmentName: string;
  /** Score 0-100 (display). Garantizado < 50. */
  displayScore: number;
}

export interface DetailPanelProps {
  dimensionKey: ComplianceDimensionKey;
  dimensionName: string;
  /** Score 0-100 (display) a nivel ORG. */
  orgScore: number;
  /** Nivel del acto (incluye 'sano_con_focos'). */
  level: ActoLevelKey;
  /** Período del ciclo formateado (`Q1 2026`) para el eyebrow. Null = skip slot. */
  cyclePeriod: string | null;
  /** Narrativa clínica del motor. */
  narrative: string;
  /** Recomendación específica de la dim × nivel del diccionario. */
  dimensionRecomendacion: string;
  /** Origen ORG-level mappeado, o null. */
  origen: OrgOrigenLabel | null;
  /** Brecha de género del peor depto, o null. */
  genderGap: GenderGap | null;
  /** Teatro de cumplimiento detectado (flag global meta). */
  teatroDetectado: boolean;
  /** Lista de deptos críticos para esta dim (display < 50). */
  criticalDepts: ReadonlyArray<DetailPanelDept>;

  // Plan editable
  /** TriggerRef ORG canónico para esta dim. */
  orgTriggerRef: string;
  /** Pre-fill del textarea ORG (planSugerido del nivel). */
  orgPlanSugerido: string;
  /** TriggerRefs DEPT keyed by departmentId. */
  deptTriggerRefs: Record<string, string>;
  /** Pre-fills DEPT keyed by departmentId. */
  deptPlanesSugeridos: Record<string, string>;

  // Hook bridge
  narrativasEdit: Record<string, string>;
  existingTriggerRefs: ReadonlySet<string>;
  onUpdateNarrativa: (triggerRef: string, text: string) => void;
  onBulkSave: () => void;
  isSaving: boolean;
  canEdit: boolean;
  /**
   * Decisiones pendientes globales (todas las dims con focos sin firmar).
   * Se renderiza inline en la línea de meta del sticky CTA.
   */
  pendingCount: number;
  /**
   * Código de país ISO 3166-1 alpha-2 (CL/PE/CO/MX/...) desde
   * `report.company.country`. Resuelve el texto del protocolo legal vía
   * `getLegalBadgeText`. `null` cae al texto universal `default`.
   */
  country: string | null;
}

export const DetailPanel = memo(function DetailPanel({
  dimensionKey,
  dimensionName,
  orgScore,
  level,
  cyclePeriod,
  narrative,
  dimensionRecomendacion,
  origen,
  genderGap,
  teatroDetectado,
  criticalDepts,
  orgTriggerRef,
  orgPlanSugerido,
  deptTriggerRefs,
  deptPlanesSugeridos,
  narrativasEdit,
  existingTriggerRefs,
  onUpdateNarrativa,
  onBulkSave,
  isSaving,
  canEdit,
  pendingCount,
  country,
}: DetailPanelProps) {
  const scoreColor = getScoreColor(orgScore);
  const levelRec = RECOMMENDATIONS_BY_LEVEL[level];
  const legalText = getLegalBadgeText(country);
  const hasFocos = criticalDepts.length > 0;
  const editorial = getEditorialTitle(dimensionKey, dimensionName);

  // Numeración dinámica de secciones — Lectura siempre 01; Departamentos solo
  // si hasFocos; Recomendación y Plan se ajustan según presencia de Departamentos.
  const sectionNums = useMemo(() => {
    return {
      lectura: '01',
      deptos: hasFocos ? '02' : null,
      recomendacion: hasFocos ? '03' : '02',
      plan: hasFocos ? '04' : '03',
    };
  }, [hasFocos]);

  // Consolidación de planes transversales: agrupa deptos que comparten el
  // mismo planSugerido. Un grupo de N deptos renderiza UN solo textarea con
  // encabezado "Plan transversal — Depto1, Depto2, ...". Onchange broadcastea
  // el mismo texto a los N triggerRefs del grupo (bulk save sigue saving 1×N).
  const deptGroups = useMemo(() => {
    if (criticalDepts.length === 0) return [];
    const map = new Map<
      string,
      { deptIds: string[]; names: string[]; plan: string }
    >();
    for (const dept of criticalDepts) {
      const plan = deptPlanesSugeridos[dept.departmentId] ?? '';
      const existing = map.get(plan);
      if (existing) {
        existing.deptIds.push(dept.departmentId);
        existing.names.push(dept.departmentName);
      } else {
        map.set(plan, {
          deptIds: [dept.departmentId],
          names: [dept.departmentName],
          plan,
        });
      }
    }
    return Array.from(map.values());
  }, [criticalDepts, deptPlanesSugeridos]);

  // ¿Hay al menos un textarea con texto (para habilitar el CTA)?
  const orgText = narrativasEdit[orgTriggerRef] ?? orgPlanSugerido;
  const totalChars = useMemo(() => {
    let n = orgText.trim().length;
    for (const dept of criticalDepts) {
      const ref = deptTriggerRefs[dept.departmentId];
      const fallback = deptPlanesSugeridos[dept.departmentId] ?? '';
      const text = (narrativasEdit[ref] ?? fallback).trim();
      n += text.length;
    }
    return n;
  }, [
    orgText,
    criticalDepts,
    deptTriggerRefs,
    deptPlanesSugeridos,
    narrativasEdit,
  ]);

  const hasAnyContent = totalChars >= 12;

  const stat = getScoreStat(level, criticalDepts.length);
  const scopeAreasLabel =
    criticalDepts.length > 0
      ? `${criticalDepts.length} ${criticalDepts.length === 1 ? 'área afectada' : 'áreas afectadas'}`
      : 'sin áreas críticas';

  return (
    <div className="h-full flex flex-col">
      {/* ═══════ ZONA SCROLLEABLE ═══════ */}
      <div
        className="
          flex-1 min-h-0 overflow-y-auto
          px-5 py-8
          md:px-16 md:py-14
          scroll-smooth
        "
      >
        <div className="max-w-[820px] mx-auto">
          {/* ─── Eyebrow forense ─── */}
          <div className="flex items-center gap-3.5 flex-wrap text-[10px] uppercase tracking-[0.22em] text-slate-600 mb-[22px]">
            <span>{dimensionName}</span>
            <span className="opacity-35">/</span>
            <span>Ambiente Sano</span>
            {cyclePeriod ? (
              <>
                <span className="opacity-35">/</span>
                <span>{cyclePeriod}</span>
              </>
            ) : null}
          </div>

          {/* ─── Título editorial 56px con <em> cyan ─── */}
          <h2
            className="
              text-[34px] md:text-[56px]
              font-extralight tracking-[-0.025em] leading-[1.04]
              text-white
              [text-wrap:balance]
              mb-7
            "
          >
            {editorial.primera}
            {editorial.segunda ? (
              <>
                <br />
                <em className="not-italic text-cyan-400">{editorial.segunda}</em>
              </>
            ) : null}
          </h2>

          {/* ─── Score row ─── */}
          <div className="flex items-end gap-8 pt-6 pb-9 border-b border-slate-800/60">
            <div
              className={`
                font-mono font-extralight tabular-nums leading-[0.85] tracking-[-0.045em]
                text-[84px] md:text-[124px]
                ${scoreColor}
              `}
              aria-label={`Score ${orgScore} sobre 100`}
            >
              {orgScore}
              <span className="text-[24px] md:text-[28px] text-slate-600 tracking-[-0.02em] ml-1">
                {' '}
                / 100
              </span>
            </div>
            <div className="flex flex-col gap-2 pb-3.5 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-600">
                Score {dimensionName}
              </p>
              <p className="text-xs font-light text-slate-500 leading-[1.55] max-w-[280px]">
                {stat}
              </p>
            </div>
          </div>

          {/* ─── 01 · Lectura ─── */}
          <Section num={sectionNums.lectura} title="Lectura">
            <p className="text-[15px] md:text-[17px] font-light leading-[1.75] text-slate-400 max-w-[720px] [text-wrap:pretty]">
              {narrative}
            </p>

            {origen ? (
              <div className="mt-5 space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-600">
                  Origen del problema
                </p>
                <p className="text-cyan-400 font-light text-sm md:text-base">
                  {origen.label}
                </p>
                <p className="text-slate-600 text-[11px] italic">
                  {origen.scopeNote}
                </p>
              </div>
            ) : null}

            {genderGap ? (
              <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
                <p className="text-slate-300 text-sm font-light leading-relaxed">
                  Brecha de{' '}
                  <span className="text-purple-400 font-medium">
                    {genderGap.gap.toFixed(1)} puntos
                  </span>{' '}
                  entre {genderGap.grupoAfectado} y sus pares en{' '}
                  <span className="text-cyan-400 font-medium">
                    {genderGap.departmentName}
                  </span>
                  .
                </p>
                <p className="text-slate-600 text-[11px] font-light mt-1">
                  {legalText}.
                </p>
              </div>
            ) : null}

            {teatroDetectado ? (
              <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
                <p className="text-slate-400 text-sm font-light leading-relaxed">
                  Las respuestas numéricas y el texto libre dicen cosas
                  distintas. Vale la pena releer los comentarios antes de
                  cerrar conclusiones.
                </p>
              </div>
            ) : null}
          </Section>

          {/* ─── 02 · Departamentos críticos ─── */}
          {hasFocos && sectionNums.deptos ? (
            <Section num={sectionNums.deptos} title="Departamentos críticos">
              <ul className="space-y-2.5">
                {criticalDepts.map((dept) => (
                  <DeptListRow key={dept.departmentId} dept={dept} />
                ))}
              </ul>
            </Section>
          ) : null}

          {/* ─── 03 · Recomendación · purple card ─── */}
          <Section num={sectionNums.recomendacion} title="Recomendación">
            <div
              className="relative overflow-hidden rounded-[18px] px-7 md:px-8 py-7"
              style={{
                background: 'rgba(167, 139, 250, 0.05)',
                border: '1px solid rgba(167, 139, 250, 0.30)',
              }}
            >
              {/* Top accent rule purple */}
              <div
                className="absolute top-0 left-6 right-6 h-px"
                style={{ background: '#A78BFA', opacity: 0.5 }}
                aria-hidden="true"
              />

              <div className="flex items-center gap-3 mb-3.5">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(167, 139, 250, 0.15)' }}
                >
                  <Lightbulb
                    className="w-4 h-4"
                    style={{ color: '#A78BFA' }}
                    aria-hidden="true"
                  />
                </span>
                <span
                  className="text-[11px] uppercase tracking-[0.18em] font-normal"
                  style={{ color: '#A78BFA' }}
                >
                  Recomendación · Ambiente Sano
                </span>
              </div>

              <h4 className="text-[20px] md:text-[22px] font-light text-white tracking-[-0.01em] leading-snug mb-3">
                {dimensionRecomendacion}
              </h4>

              {/* Meta grid: nuestros 3 campos (Urgencia / Plazo / Protocolo) */}
              <div
                className="flex flex-wrap gap-x-8 gap-y-4 pt-3.5"
                style={{ borderTop: '1px dashed rgba(167, 139, 250, 0.2)' }}
              >
                <RecoMetaItem label="Urgencia" value={levelRec.urgency} />
                <RecoMetaItem label="Plazo sugerido" value={levelRec.timeframe} />
                {levelRec.protocol ? (
                  <RecoMetaItem
                    label="Protocolo legal"
                    value={legalText}
                    accent="red"
                  />
                ) : null}
              </div>
            </div>
          </Section>

          {/* ─── 04 · Tu plan ─── */}
          <Section num={sectionNums.plan} title="Tu plan">
            <p className="text-sm text-slate-500 font-light leading-relaxed mb-3.5 max-w-[680px]">
              {getContextualMessage(level)} Edita o reemplaza la propuesta. Lo
              que firmes aquí queda en el expediente.
            </p>

            <PlanEditCard
              scopeName={FLOW_COPY.planConsolidado.scopeOrg}
              triggerRef={orgTriggerRef}
              value={orgText}
              fallback={orgPlanSugerido}
              registered={existingTriggerRefs.has(orgTriggerRef)}
              disabled={!canEdit || isSaving}
              onChange={(text) => onUpdateNarrativa(orgTriggerRef, text)}
            />

            {hasFocos ? (
              <div className="mt-5 space-y-4">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-600">
                  Planes departamentales
                </p>
                {deptGroups.map((group) => {
                  const triggerRefs = group.deptIds.map(
                    (id) => deptTriggerRefs[id]
                  );
                  const scopeName =
                    group.deptIds.length > 1
                      ? `Plan transversal — ${group.names.join(', ')}`
                      : group.names[0];
                  const value = narrativasEdit[triggerRefs[0]] ?? group.plan;
                  const registered = triggerRefs.some((ref) =>
                    existingTriggerRefs.has(ref)
                  );
                  return (
                    <PlanEditCard
                      key={group.deptIds.join(':')}
                      scopeName={scopeName}
                      triggerRef={triggerRefs.join('|')}
                      value={value}
                      fallback={group.plan}
                      registered={registered}
                      disabled={!canEdit || isSaving}
                      onChange={(text) => {
                        for (const ref of triggerRefs) {
                          onUpdateNarrativa(ref, text);
                        }
                      }}
                    />
                  );
                })}
              </div>
            ) : null}
          </Section>

          <div className="h-8" aria-hidden="true" />
        </div>
      </div>

      {/* ═══════ STICKY CTA — bundle: summary + 1 botón cyan sólido ═══════ */}
      <div
        className="
          shrink-0 flex items-center gap-4 md:gap-6
          px-5 py-4 md:px-16
          bg-[#0F172A]/90 backdrop-blur-xl
          border-t border-slate-800/60
        "
      >
        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <p className="text-[13px] font-light text-slate-400 truncate">
            Decisión sobre{' '}
            <span className="text-white font-normal">{dimensionName}</span> ·{' '}
            {scopeAreasLabel}
          </p>
          <p className="text-[11px] text-slate-600 tracking-[0.04em] truncate">
            {isSaving
              ? 'Guardando…'
              : (() => {
                  const base = hasAnyContent
                    ? `${totalChars} caracteres · sin firmar`
                    : 'Edita el plan para registrar tu decisión.';
                  if (pendingCount > 0) {
                    const suffix = `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}`;
                    return hasAnyContent
                      ? `${base} · ${suffix}`
                      : `Edita el plan para registrar · ${suffix}`;
                  }
                  return base;
                })()}
          </p>
        </div>

        <button
          type="button"
          onClick={onBulkSave}
          disabled={!canEdit || isSaving || !hasAnyContent}
          className="
            inline-flex items-center gap-2.5 shrink-0
            px-5 py-3 rounded-full
            bg-cyan-400 hover:bg-cyan-500
            border border-cyan-400 hover:border-cyan-500
            text-[13px] font-medium tracking-[0.02em]
            text-[#0F172A]
            transition-colors duration-[250ms]
            disabled:opacity-35 disabled:cursor-not-allowed
            disabled:bg-transparent disabled:text-slate-500 disabled:border-slate-700/50
            focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60
          "
        >
          <span className="hidden sm:inline">Registrar decisión</span>
          <span className="sm:hidden">Registrar</span>
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
});

// ────────────────────────────────────────────────────────────────────────────
// SUB — Section wrapper (numbered)
// ────────────────────────────────────────────────────────────────────────────

function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-10 pb-2">
      <div className="flex items-baseline gap-3.5 mb-[18px]">
        <span
          className="
            font-mono text-[10px] tracking-[0.14em] text-slate-600
            px-2 py-[3px]
            border border-slate-800/60 rounded
          "
        >
          {num}
        </span>
        <h3 className="text-[18px] font-light text-slate-300 tracking-[-0.005em] m-0">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB — Recomendación meta item
// ────────────────────────────────────────────────────────────────────────────

function RecoMetaItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'red';
}) {
  const labelColor = accent === 'red' ? 'text-red-300' : 'text-slate-600';
  const valueColor = accent === 'red' ? 'text-red-300' : 'text-slate-300';
  return (
    <div className="flex flex-col gap-[3px]">
      <p
        className={`text-[10px] uppercase tracking-[0.14em] ${labelColor} font-light`}
      >
        {label}
      </p>
      <p className={`font-mono text-[13px] ${valueColor} font-normal`}>
        {value}
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB — fila de depto crítico (bundle: grid 1fr 90px 130px 100px)
// ────────────────────────────────────────────────────────────────────────────

function DeptListRow({ dept }: { dept: DetailPanelDept }) {
  return (
    <li
      className="
        grid grid-cols-[1fr_auto] md:grid-cols-[1fr_90px_130px_100px]
        items-center gap-3 md:gap-[18px]
        px-4 md:px-[18px] py-3.5
        rounded-xl border border-slate-800/60 bg-slate-900/35
        hover:border-slate-700/50 hover:bg-slate-800/40
        transition-colors duration-[250ms]
      "
    >
      {/* Name */}
      <div className="text-sm text-slate-300 font-normal min-w-0">
        <p className="truncate">{dept.departmentName}</p>
      </div>

      {/* Score */}
      <div className="font-mono text-[18px] md:text-[22px] font-light text-red-400 tracking-[-0.02em] tabular-nums text-right md:text-left">
        {dept.displayScore}
      </div>

      {/* Mini bar — desktop only */}
      <div className="hidden md:block h-1 w-full rounded-full bg-slate-700/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-red-400"
          style={{ width: `${Math.max(4, dept.displayScore)}%` }}
        />
      </div>

      {/* Delta — placeholder neutral (no ciclo anterior) */}
      <div className="hidden md:block font-mono text-[11px] text-slate-600 text-right">
        crítico
      </div>
    </li>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SUB — Plan editor card (bundle: bordered + toolbar + autosave flag)
// ────────────────────────────────────────────────────────────────────────────

function PlanEditCard({
  scopeName,
  triggerRef,
  value,
  fallback,
  registered,
  disabled,
  onChange,
}: {
  scopeName: string;
  triggerRef: string;
  value: string;
  fallback: string;
  registered: boolean;
  disabled: boolean;
  onChange: (text: string) => void;
}) {
  const [savedVisible, setSavedVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autosave indicator: cuando el textarea cambia, esconde el flag y lo
  // re-muestra 600ms después como "● Guardado · borrador" (visual debounce).
  // El save real es responsabilidad del hook upstream (narrativasEdit).
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (text: string) => {
    onChange(text);
    setSavedVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSavedVisible(true), 600);
  };

  return (
    <div
      className="
        relative overflow-hidden
        rounded-2xl
        border border-slate-700/50
        bg-slate-900/40
        transition-[border-color,box-shadow] duration-300
        focus-within:border-cyan-500/40
        focus-within:shadow-[0_0_0_3px_rgba(34,211,238,0.08)]
      "
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2.5 px-[18px] py-3 border-b border-slate-800/60 text-[11px] text-slate-600">
        <span className="uppercase tracking-[0.16em]">{scopeName}</span>
        <span className="flex-1" />
        {registered ? (
          <span className="font-mono text-[10px] text-cyan-300/80 tracking-[0.05em]">
            <span className="text-cyan-300/80">● </span>En tu plan
          </span>
        ) : (
          <span
            className={`
              font-mono text-[10px] text-emerald-400 tracking-[0.05em]
              transition-opacity duration-[400ms]
              ${savedVisible ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <span className="text-emerald-400">● </span>Guardado · borrador
          </span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        id={triggerRef}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={
          fallback || 'Describe tu decisión: a quién involucras, qué cambia esta semana, cuándo revisas.'
        }
        disabled={disabled}
        rows={4}
        className="
          w-full min-h-[180px] md:min-h-[220px]
          px-5 py-5
          bg-transparent border-none resize-y
          font-sans text-[14px] md:text-[15px] font-light leading-[1.75]
          text-slate-300 outline-none
          placeholder:text-slate-600 placeholder:italic
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT — ResumenPanel (modo "Resumen del plan")
// ════════════════════════════════════════════════════════════════════════════

export interface ResumenPanelProps {
  report: ComplianceReportResponse;
  decisiones: ComplianceDecisionItem[];
  narrativasEdit: Record<string, string>;
  /** True si hay focos en alguna dim — controla el empty state. */
  hasAnyFocos: boolean;
}

interface ResumenRow {
  triggerRef: string;
  scope: string;
  scopeType: 'organization' | 'department';
  texto: string;
}

interface ResumenGroup {
  dimensionKey: string;
  dimensionName: string;
  rows: ResumenRow[];
}

export const ResumenPanel = memo(function ResumenPanel({
  report,
  decisiones,
  narrativasEdit,
  hasAnyFocos,
}: ResumenPanelProps) {
  const groups = useMemo<ResumenGroup[]>(() => {
    const dimNameByKey = new Map<string, string>();
    for (const n of report.narratives.artefacto1_dimensiones) {
      dimNameByKey.set(n.dimensionKey, n.dimensionNombre);
    }
    const deptNameById = new Map<string, string>();
    for (const d of report.data.departments) {
      deptNameById.set(d.departmentId, d.departmentName);
    }

    const byDim = new Map<string, ResumenGroup>();

    for (const decision of decisiones) {
      const decoded = decodeTriggerRef(decision.triggerRef);
      if (!decoded) continue;

      const { dimensionKey, targetType, targetId } = decoded;
      const dimensionName =
        dimNameByKey.get(dimensionKey) ??
        decision.triggerLabel?.split(' · ')[0] ??
        dimensionKey;

      let scope: string;
      if (targetType === 'organization') {
        scope = FLOW_COPY.planConsolidado.scopeOrg;
      } else if (targetId) {
        scope =
          deptNameById.get(targetId) ??
          decision.triggerLabel?.split(' · ')[1] ??
          'Departamento';
      } else {
        scope = FLOW_COPY.planConsolidado.scopeOrg;
      }

      const texto = (narrativasEdit[decision.triggerRef] ?? '').trim();
      const textoDisplay = texto || '(sin texto registrado)';

      const row: ResumenRow = {
        triggerRef: decision.triggerRef,
        scope,
        scopeType: targetType,
        texto: textoDisplay,
      };

      const existing = byDim.get(dimensionKey);
      if (existing) {
        existing.rows.push(row);
      } else {
        byDim.set(dimensionKey, {
          dimensionKey,
          dimensionName,
          rows: [row],
        });
      }
    }

    for (const group of byDim.values()) {
      group.rows.sort((a, b) => {
        if (a.scopeType === 'organization' && b.scopeType !== 'organization')
          return -1;
        if (a.scopeType !== 'organization' && b.scopeType === 'organization')
          return 1;
        return a.scope.localeCompare(b.scope);
      });
    }

    return Array.from(byDim.values()).sort((a, b) =>
      a.dimensionName.localeCompare(b.dimensionName)
    );
  }, [decisiones, narrativasEdit, report]);

  const isEmpty = groups.length === 0;

  return (
    <div className="h-full overflow-y-auto px-5 py-8 md:px-16 md:py-14">
      <div className="max-w-[820px] mx-auto space-y-7">
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-600">
            Plan consolidado
          </p>
          <h2 className="text-[34px] md:text-[56px] font-extralight tracking-[-0.025em] leading-[1.04] text-white">
            Plan de
            <br />
            <em className="not-italic text-cyan-400">este ciclo.</em>
          </h2>
        </div>

        {isEmpty ? (
          <ResumenEmptyState hasFocos={hasAnyFocos} />
        ) : (
          <div className="space-y-7">
            {groups.map((group) => (
              <ResumenDimSection key={group.dimensionKey} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

function ResumenDimSection({ group }: { group: ResumenGroup }) {
  return (
    <section
      aria-labelledby={`resumen-${group.dimensionKey}`}
      className="space-y-3"
    >
      <h3
        id={`resumen-${group.dimensionKey}`}
        className="text-cyan-400 text-base font-light"
      >
        {group.dimensionName}
      </h3>
      <ul className="rounded-2xl border border-slate-800/60 bg-[#0F172A]/60 p-5 divide-y divide-slate-800/40">
        {group.rows.map((row) => (
          <li
            key={row.triggerRef}
            className="py-3 first:pt-0 last:pb-0 space-y-1"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-600">
              {row.scope}
            </p>
            <p className="text-slate-300 text-sm font-light leading-relaxed whitespace-pre-wrap">
              {row.texto}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ResumenEmptyState({ hasFocos }: { hasFocos: boolean }) {
  const copy = hasFocos
    ? PLAN_CONSOLIDADO_FRANCOTIRADOR
    : PLAN_CONSOLIDADO_TODO_SANO;
  const textColor = hasFocos ? 'text-amber-300/90' : 'text-emerald-300/90';

  return (
    <div className="flex items-center justify-center px-4 py-12 md:py-20">
      <p
        className={`
          font-light text-base md:text-lg leading-relaxed text-center
          max-w-md whitespace-pre-line
          ${textColor}
        `}
      >
        {copy}
      </p>
    </div>
  );
}
