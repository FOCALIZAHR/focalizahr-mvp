'use client';

// ════════════════════════════════════════════════════════════════════════════
// DECISION CONSOLE — Orquestador del workspace 30/70
// DecisionConsole.tsx
// ════════════════════════════════════════════════════════════════════════════
// Bundle Claude Design (Decision Console.html, abril 2026).
//
// LEFT 30% (minmax 320px / 30%):
//   - Header: eyebrow `● Decision console / [periodo]` + título 22px +
//     sub-line "Ordenadas por urgencia · X de Y visibles".
//   - Dividers `Crítico · requiere decisión` / `En observación` con grouping
//     dinámico (focos primero, score asc dentro de cada grupo).
//   - Footer: amber pulse + `X decisiones pendientes hoy` (deptos sin firmar
//     en dims con focos).
//   - Background slate-900/40 + backdrop-blur, border-r slate-800.
//
// RIGHT 70% (flex-1):
//   - DetailPanel ó ResumenPanel — render exclusivo según `selected`.
//   - DetailPanel pinta su propio sticky CTA al fondo del scroll.
//
// Auto-select más crítica al cargar. Bulk save queda en la dim activa
// (decisión 12). Tesla line dinámica color por nivel de dim activa.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  COMPLIANCE_DIMENSION_DICTIONARY,
  classifyDimensionLevel,
  type ComplianceDimensionKey,
  type ComplianceDimensionLevel,
} from '@/config/narratives/ComplianceNarrativeDictionary';
import type {
  ComplianceReportResponse,
  OrigenOrganizacional,
} from '@/types/compliance';
import type { ComplianceDecisionItem } from '@/hooks/useComplianceData';

import TeslaLine from '../../shared/TeslaLine';

import {
  DimensionListItem,
  DimensionPill,
  ResumenListItem,
  ResumenPill,
} from './DecisionConsole.DimensionListItem';
import {
  DetailPanel,
  ResumenPanel,
  type DetailPanelDept,
} from './DecisionConsole.DetailPanel';
import { ISA_NARRATIVES, type ActoLevelKey } from './_shared/constants';
import {
  classifyActoLevel,
  computeOrgWeightedScore,
  countCriticalDepts,
  displayScore,
  formatCyclePeriod,
  getCriticalDepts,
  getOrgOrigenLabel,
  getPeorBrechaGenero,
  type DimKey,
} from './_shared/helpers';
import { encodeTriggerRef } from './_shared/triggerRef';

// ════════════════════════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════════════════════════

export interface DecisionConsoleProps {
  report: ComplianceReportResponse;
  decisiones: ComplianceDecisionItem[];
  narrativasEdit: Record<string, string>;
  upsertDecision: (item: ComplianceDecisionItem) => void;
  updateNarrativaEdit: (triggerRef: string, text: string) => void;
  isPersistingPlan: boolean;
  canEditPlan: boolean;
}

// ════════════════════════════════════════════════════════════════════════════
// MAPPINGS — niveles internos
// ════════════════════════════════════════════════════════════════════════════

const TESLA_COLOR_BY_LEVEL: Record<ActoLevelKey, string> = {
  critico: ISA_NARRATIVES.critico.teslaColor,
  riesgo: ISA_NARRATIVES.riesgo.teslaColor,
  atencion: ISA_NARRATIVES.atencion.teslaColor,
  sano: ISA_NARRATIVES.sano.teslaColor,
  sano_con_focos: ISA_NARRATIVES.sano.teslaColor,
};

function actoLevelToDictionaryLevel(
  level: ActoLevelKey
): ComplianceDimensionLevel {
  return level === 'sano_con_focos' ? 'sano' : level;
}

function actoLevelToDecisionLevel(
  level: ActoLevelKey
): 'atencion' | 'riesgo' | 'critico' | undefined {
  if (level === 'sano' || level === 'sano_con_focos') return undefined;
  return level;
}

function deptRawToDecisionLevel(
  rawScore: number
): 'atencion' | 'riesgo' | 'critico' {
  if (rawScore < 2.0) return 'critico';
  if (rawScore < 3.0) return 'riesgo';
  return 'atencion';
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES INTERNOS
// ════════════════════════════════════════════════════════════════════════════

type SelectedView = ComplianceDimensionKey | 'resumen';

interface DimContext {
  dimensionKey: ComplianceDimensionKey;
  dimensionName: string;
  /** Score 0-100 (display). */
  orgScore: number;
  /** Score 1-5 (raw, para sort y level). */
  orgRaw: number;
  level: ActoLevelKey;
  /** True si la dim entra al grupo "Crítico · requiere decisión". */
  isCritical: boolean;
  criticalDeptsCount: number;
  criticalDepts: DetailPanelDept[];
  /** rawScore por departmentId — usado en bulk save para deptRawToDecisionLevel. */
  deptRawScoreById: Record<string, number>;
  narrative: string;
  dimensionRecomendacion: string;
  orgPlanSugerido: string;
  deptPlanesSugeridos: Record<string, string>;
  orgTriggerRef: string;
  deptTriggerRefs: Record<string, string>;
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export const DecisionConsole = memo(function DecisionConsole({
  report,
  decisiones,
  narrativasEdit,
  upsertDecision,
  updateNarrativaEdit,
  isPersistingPlan,
  canEditPlan,
}: DecisionConsoleProps) {
  // ─── Derivar contexto de las 6 dimensiones ───────────────────────────────
  const dimContexts = useMemo<DimContext[]>(() => {
    const departments = report.data.departments;
    const narrativas = report.narratives.artefacto1_dimensiones;

    const result: DimContext[] = [];

    for (const n of narrativas) {
      const dimKey = n.dimensionKey as DimKey;
      const orgRaw = computeOrgWeightedScore(dimKey, departments);
      const orgScore = displayScore(orgRaw);
      if (orgScore === null || orgRaw === null) continue;

      const dimLevel = classifyDimensionLevel(orgRaw);
      const criticalDeptsRaw = getCriticalDepts(dimKey, departments);
      const criticalCount = criticalDeptsRaw.length;
      const actoLevel = classifyActoLevel(dimLevel, criticalCount);

      const dictLevelOrg = actoLevelToDictionaryLevel(actoLevel);
      const orgDictEntry =
        COMPLIANCE_DIMENSION_DICTIONARY[dimKey][dictLevelOrg];

      const criticalDepts: DetailPanelDept[] = [];
      const deptPlanesSugeridos: Record<string, string> = {};
      const deptTriggerRefs: Record<string, string> = {};
      const deptRawScoreById: Record<string, number> = {};

      for (const item of criticalDeptsRaw) {
        const deptLevel = classifyDimensionLevel(item.rawScore);
        const deptDictEntry =
          COMPLIANCE_DIMENSION_DICTIONARY[dimKey][deptLevel];
        const deptId = item.department.departmentId;

        criticalDepts.push({
          departmentId: deptId,
          departmentName: item.department.departmentName,
          displayScore: item.display,
        });
        deptPlanesSugeridos[deptId] = deptDictEntry.planSugerido;
        deptTriggerRefs[deptId] = encodeTriggerRef(dimKey, {
          targetType: 'department',
          targetId: deptId,
        });
        deptRawScoreById[deptId] = item.rawScore;
      }

      // "Crítico" del bundle = la dim entra al grupo de la izq que lleva
      // el rail cyan. Aplica si la dim es crítico/riesgo a nivel org, o si
      // tiene focos departamentales (incluye 'sano_con_focos').
      const isCritical =
        actoLevel === 'critico' ||
        actoLevel === 'riesgo' ||
        actoLevel === 'sano_con_focos';

      result.push({
        dimensionKey: n.dimensionKey as ComplianceDimensionKey,
        dimensionName: n.dimensionNombre,
        orgScore,
        orgRaw,
        level: actoLevel,
        isCritical,
        criticalDeptsCount: criticalCount,
        criticalDepts,
        deptRawScoreById,
        narrative: n.narrativa,
        dimensionRecomendacion: orgDictEntry.recomendacion,
        orgPlanSugerido: orgDictEntry.planSugerido,
        deptPlanesSugeridos,
        orgTriggerRef: encodeTriggerRef(n.dimensionKey as ComplianceDimensionKey, {
          targetType: 'organization',
          targetId: null,
        }),
        deptTriggerRefs,
      });
    }

    // Sort: focos primero, luego orgRaw asc (peor primero) — gravedad real.
    return result.sort((a, b) => {
      const aHas = a.criticalDeptsCount > 0;
      const bHas = b.criticalDeptsCount > 0;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return a.orgRaw - b.orgRaw;
    });
  }, [report]);

  // ─── Grouping para los dividers del sidebar ──────────────────────────────
  const { criticalDims, observacionDims } = useMemo(() => {
    const c: DimContext[] = [];
    const o: DimContext[] = [];
    for (const d of dimContexts) {
      if (d.isCritical) c.push(d);
      else o.push(d);
    }
    return { criticalDims: c, observacionDims: o };
  }, [dimContexts]);

  // ─── Datos globales (origen, gender gap, teatro) ─────────────────────────
  const globalContext = useMemo(() => {
    const origenOrganizacional: OrigenOrganizacional | null =
      report.data.metaAnalysis?.origen_organizacional ?? null;
    return {
      origen: getOrgOrigenLabel(origenOrganizacional),
      genderGap: getPeorBrechaGenero(report.data.departments),
      teatroDetectado:
        (report.data.metaAnalysis?.teatro_detectado_count ?? 0) > 0,
    };
  }, [report]);

  // ─── Período del ciclo (eyebrow del DetailPanel + sub del LEFT) ──────────
  const cyclePeriod = useMemo(
    () => formatCyclePeriod(report.campaign),
    [report.campaign]
  );

  // ─── Hay focos en alguna dim? (para empty state del resumen) ─────────────
  const hasAnyFocos = useMemo(() => {
    const departments = report.data.departments;
    for (const n of report.narratives.artefacto1_dimensiones) {
      if (countCriticalDepts(n.dimensionKey as DimKey, departments) > 0) {
        return true;
      }
    }
    return false;
  }, [report]);

  // ─── State: selected view (auto-select más crítica al cargar) ───────────
  const initialSelected = useMemo<SelectedView>(() => {
    return dimContexts[0]?.dimensionKey ?? 'resumen';
  }, [dimContexts]);

  const [selected, setSelected] = useState<SelectedView>(initialSelected);

  // ─── Map de triggerRefs registrados por dim ──────────────────────────────
  const triggerRefsByDim = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const d of decisiones) {
      if (!d.dimensionKey) continue;
      const set = map.get(d.dimensionKey) ?? new Set<string>();
      set.add(d.triggerRef);
      map.set(d.dimensionKey, set);
    }
    return map;
  }, [decisiones]);

  // ─── Decisiones pendientes (footer del LEFT) ─────────────────────────────
  // Una dim con focos cuenta como "pendiente" si NO tiene ninguna decisión
  // registrada todavía. Es el contador del bundle: "X decisiones pendientes hoy".
  const pendingCount = useMemo(() => {
    let n = 0;
    for (const d of dimContexts) {
      if (!d.isCritical) continue;
      const registered = triggerRefsByDim.get(d.dimensionKey);
      if (!registered || registered.size === 0) n++;
    }
    return n;
  }, [dimContexts, triggerRefsByDim]);

  // ─── Dim seleccionada actualmente (null si view === 'resumen') ──────────
  const selectedDim = useMemo<DimContext | null>(() => {
    if (selected === 'resumen') return null;
    return dimContexts.find((d) => d.dimensionKey === selected) ?? null;
  }, [selected, dimContexts]);

  // ─── Tesla color: por nivel de dim activa (default cyan si resumen) ─────
  const teslaColor = selectedDim
    ? TESLA_COLOR_BY_LEVEL[selectedDim.level]
    : undefined;

  // ─── Auto-scroll mobile pill activa al centro ────────────────────────────
  const pillsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = pillsRef.current;
    if (!container) return;
    const target = container.querySelector(
      `[data-pill-key="${selected}"]`
    ) as HTMLElement | null;
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selected]);

  // ─── Bulk save handler (para la dim activa) ─────────────────────────────
  const handleBulkSave = useCallback(() => {
    if (!selectedDim) return;
    const dim = selectedDim;
    const now = new Date().toISOString();

    const orgFallback = dim.orgPlanSugerido;
    const orgText = (narrativasEdit[dim.orgTriggerRef] ?? orgFallback).trim();

    if (orgText) {
      if (narrativasEdit[dim.orgTriggerRef] === undefined) {
        updateNarrativaEdit(dim.orgTriggerRef, orgFallback);
      }
      upsertDecision({
        triggerType: 'dimension_low',
        triggerRef: dim.orgTriggerRef,
        triggerLabel: dim.dimensionName,
        dimensionKey: dim.dimensionKey,
        level: actoLevelToDecisionLevel(dim.level),
        addedAt: now,
      });
    }

    for (const dept of dim.criticalDepts) {
      const ref = dim.deptTriggerRefs[dept.departmentId];
      const fallback = dim.deptPlanesSugeridos[dept.departmentId] ?? '';
      const text = (narrativasEdit[ref] ?? fallback).trim();
      if (!text) continue;
      if (narrativasEdit[ref] === undefined) {
        updateNarrativaEdit(ref, fallback);
      }
      const rawScore = dim.deptRawScoreById[dept.departmentId];
      upsertDecision({
        triggerType: 'dimension_low',
        triggerRef: ref,
        triggerLabel: `${dim.dimensionName} · ${dept.departmentName}`,
        dimensionKey: dim.dimensionKey,
        level: deptRawToDecisionLevel(rawScore),
        addedAt: now,
      });
    }
    // Decisión 12: NO navegar — quedarse en la dim activa. El check sutil
    // aparece en el selector vía existingTriggerRefs reactivo.
  }, [selectedDim, narrativasEdit, updateNarrativaEdit, upsertDecision]);

  return (
    <div className="h-full flex flex-col md:flex-row">
      {/* Tesla line dinámica color por nivel de dim activa */}
      <TeslaLine color={teslaColor} />

      {/* ═══════ MOBILE PILLS — visible <md ═══════ */}
      <div
        className="
          md:hidden shrink-0
          border-b border-slate-800/60
          bg-slate-900/40 backdrop-blur-xl
        "
      >
        <div
          ref={pillsRef}
          className="
            flex items-center gap-2
            px-4 py-3
            overflow-x-auto snap-x snap-mandatory scroll-smooth
            [&::-webkit-scrollbar]:hidden
          "
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="tablist"
          aria-label="Dimensiones"
        >
          {dimContexts.map((dim) => (
            <DimensionPill
              key={dim.dimensionKey}
              dimensionKey={dim.dimensionKey}
              dimensionName={dim.dimensionName}
              isCritical={dim.isCritical}
              isActive={selected === dim.dimensionKey}
              onClick={() => setSelected(dim.dimensionKey)}
            />
          ))}
          {/* Gap mayor antes del Resumen */}
          <span className="w-3 shrink-0" aria-hidden="true" />
          <ResumenPill
            isActive={selected === 'resumen'}
            decisionsCount={decisiones.length}
            onClick={() => setSelected('resumen')}
          />
        </div>
      </div>

      {/* ═══════ DESKTOP SIDEBAR — hidden on mobile ═══════ */}
      <aside
        className="
          hidden md:flex
          w-[280px] lg:w-[320px] shrink-0
          flex-col
          border-r border-slate-800/60
          bg-slate-900/40 backdrop-blur-xl
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-slate-600 mb-4">
            <span
              className="w-[5px] h-[5px] rounded-full bg-cyan-400"
              style={{ boxShadow: '0 0 10px rgba(34,211,238,0.7)' }}
              aria-hidden="true"
            />
            <span>Decision console</span>
            {cyclePeriod ? (
              <>
                <span className="opacity-35">/</span>
                <span>{cyclePeriod}</span>
              </>
            ) : null}
          </div>
          <h2 className="text-[22px] font-extralight text-white leading-[1.2] tracking-[-0.015em]">
            Las dimensiones
            <br />
            que esperan tu decisión.
          </h2>
          <p className="text-xs font-light text-slate-500 tracking-[0.04em] mt-1">
            Ordenadas por urgencia · {dimContexts.length} dimensiones
          </p>
        </div>

        {/* List */}
        <div
          className="flex-1 overflow-y-auto py-3"
          role="listbox"
          aria-label="Dimensiones"
        >
          {criticalDims.length > 0 ? (
            <>
              <div className="px-8 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Crítico · requiere decisión
              </div>
              {criticalDims.map((dim) => (
                <DimensionListItem
                  key={dim.dimensionKey}
                  dimensionKey={dim.dimensionKey}
                  dimensionName={dim.dimensionName}
                  orgScore={dim.orgScore}
                  criticalDeptsCount={dim.criticalDeptsCount}
                  isCritical={dim.isCritical}
                  isActive={selected === dim.dimensionKey}
                  isRegistered={
                    (triggerRefsByDim.get(dim.dimensionKey)?.size ?? 0) > 0
                  }
                  onClick={() => setSelected(dim.dimensionKey)}
                />
              ))}
            </>
          ) : null}

          {observacionDims.length > 0 ? (
            <>
              <div className="px-8 pt-4 pb-1.5 text-[9px] uppercase tracking-[0.22em] text-slate-700">
                En observación
              </div>
              {observacionDims.map((dim) => (
                <DimensionListItem
                  key={dim.dimensionKey}
                  dimensionKey={dim.dimensionKey}
                  dimensionName={dim.dimensionName}
                  orgScore={dim.orgScore}
                  criticalDeptsCount={dim.criticalDeptsCount}
                  isCritical={dim.isCritical}
                  isActive={selected === dim.dimensionKey}
                  isRegistered={
                    (triggerRefsByDim.get(dim.dimensionKey)?.size ?? 0) > 0
                  }
                  onClick={() => setSelected(dim.dimensionKey)}
                />
              ))}
            </>
          ) : null}

          <ResumenListItem
            isActive={selected === 'resumen'}
            decisionsCount={decisiones.length}
            onClick={() => setSelected('resumen')}
          />
        </div>

        {/* Footer — amber pulse */}
        <div className="px-8 py-[18px] border-t border-slate-800/60 flex items-center gap-2.5 text-[11px] text-slate-500 shrink-0">
          {pendingCount > 0 ? (
            <>
              <span
                className="w-[6px] h-[6px] rounded-full bg-amber-400 animate-pulse"
                style={{ boxShadow: '0 0 12px rgb(251,191,36)' }}
                aria-hidden="true"
              />
              <span>
                {pendingCount}{' '}
                {pendingCount === 1
                  ? 'decisión pendiente hoy'
                  : 'decisiones pendientes hoy'}
              </span>
            </>
          ) : (
            <>
              <span
                className="w-[6px] h-[6px] rounded-full bg-emerald-400"
                style={{ boxShadow: '0 0 12px rgb(52,211,153)' }}
                aria-hidden="true"
              />
              <span>Sin decisiones pendientes</span>
            </>
          )}
        </div>
      </aside>

      {/* ═══════ RIGHT 70% — Detail / Resumen ═══════ */}
      <main className="flex-1 min-w-0 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {selected === 'resumen' || !selectedDim ? (
              <ResumenPanel
                report={report}
                decisiones={decisiones}
                narrativasEdit={narrativasEdit}
                hasAnyFocos={hasAnyFocos}
              />
            ) : (
              <DetailPanel
                dimensionKey={selectedDim.dimensionKey}
                dimensionName={selectedDim.dimensionName}
                orgScore={selectedDim.orgScore}
                level={selectedDim.level}
                cyclePeriod={cyclePeriod}
                narrative={selectedDim.narrative}
                dimensionRecomendacion={selectedDim.dimensionRecomendacion}
                origen={globalContext.origen}
                genderGap={globalContext.genderGap}
                teatroDetectado={globalContext.teatroDetectado}
                criticalDepts={selectedDim.criticalDepts}
                orgTriggerRef={selectedDim.orgTriggerRef}
                orgPlanSugerido={selectedDim.orgPlanSugerido}
                deptTriggerRefs={selectedDim.deptTriggerRefs}
                deptPlanesSugeridos={selectedDim.deptPlanesSugeridos}
                narrativasEdit={narrativasEdit}
                existingTriggerRefs={
                  triggerRefsByDim.get(selectedDim.dimensionKey) ?? new Set()
                }
                onUpdateNarrativa={updateNarrativaEdit}
                onBulkSave={handleBulkSave}
                isSaving={isPersistingPlan}
                canEdit={canEditPlan}
                pendingCount={pendingCount}
                country={report.company.country ?? null}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
});
