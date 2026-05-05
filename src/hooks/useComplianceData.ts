// src/hooks/useComplianceData.ts
// Hook principal del dashboard /dashboard/compliance.
//
// Arquitectura (patrón clonado de useEvaluatorCinemaMode):
//   - Fetch directo + localStorage token (no SWR, no React Query).
//   - PageState derivado como único selector de qué vista renderizar.
//   - interventionPlan derivado con useMemo desde report + planActions.
//   - Auto-select del depto con menor ISA al cargar report.
//   - Navegación 9 secciones canónicas (COMPLIANCE_SECTIONS).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useComplianceCampaigns } from './useComplianceCampaigns';
import type {
  ComplianceCampaignSummary,
  ComplianceReportResponse,
  ComplianceReportDepartment,
  ComplianceSectionId,
  CompliancePageState,
  CompliancePlanAction,
  CompliancePlanActionsResponse,
  InterventionPlan,
  TriggerInput,
  TriggerType,
  DimensionRiskLevel,
} from '@/types/compliance';
import {
  COMPLIANCE_SECTIONS,
  SECTION_INDEX,
  DIMENSION_LABELS,
  DIMENSION_ORDER,
  ALERTA_LABELS,
} from '@/app/dashboard/compliance/lib/labels';
import { pickLowestISA } from '@/app/dashboard/compliance/lib/format';
import { buildInterventionPlan } from '@/lib/services/compliance/InterventionEngine';
import {
  upgradeDecisionItem,
  upgradeDecisions,
} from '@/app/dashboard/compliance/components/sections/SectionDimensiones/_shared/triggerRef';

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null;
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

export interface RegisterPlanActionInput {
  triggerType: TriggerType;
  triggerRef: string;
  triggerLabel: string;
  chosenOption: number;
  interventionId: string;
}

// ═══════════════════════════════════════════════════════════════════
// ActionPlan — carrito de decisiones (modelo genérico ActionPlan)
// ═══════════════════════════════════════════════════════════════════

export interface ComplianceDecisionItem {
  triggerType: TriggerType;
  /**
   * Identificador único de la decisión. Para dimensiones se codifica el scope:
   *   - `dim:KEY:org`            → plan organizacional
   *   - `dim:KEY:dept:DEPTID`    → plan departamental
   *   - `dim:KEY` (LEGACY)       → tratado como org y upgradeado al cargar
   * Para no-dimensiones: `patron:NAME`, `alert:ID`.
   */
  triggerRef: string;
  triggerLabel: string;       // nombre de la dimensión / patrón
  dimensionKey?: string;      // 'P2_seguridad' (si trigger es dimension)
  level?: 'atencion' | 'riesgo' | 'critico';
  addedAt: string;            // ISO
  /**
   * Scope de la decisión. Auto-derivado del triggerRef en `upsertDecision` /
   * hidratación si el caller no lo provee. Decisiones legacy (`dim:KEY` sin
   * scope) se mappean a `'organization'` por compat backward (Opción A).
   */
  targetType?: 'organization' | 'department';
  /** ID del depto cuando targetType === 'department'. null para organization. */
  targetId?: string | null;
}

export interface ActionPlanState {
  id: string;
  estado: 'borrador' | 'aprobado' | 'archivado';
  allowAmendment: boolean;
}

export interface UseComplianceDataReturn {
  pageState: CompliancePageState;
  error: string | null;

  campaigns: ComplianceCampaignSummary[];
  selectedCampaignId: string | null;
  selectedCampaign: ComplianceCampaignSummary | null;
  selectCampaign: (id: string) => void;

  activeSection: ComplianceSectionId | null;
  selectSection: (id: ComplianceSectionId) => void;
  navigateNext: () => void;
  exitToLobby: () => void;
  isRailExpanded: boolean;
  toggleRail: () => void;

  activeParticipationRate: number | null;
  activeCampaign: ComplianceCampaignSummary | null;

  report: ComplianceReportResponse | null;
  selectedDepartmentId: string | null;
  selectedDepartment: ComplianceReportDepartment | null;
  selectDepartment: (id: string) => void;

  planActions: CompliancePlanAction[];
  interventionPlan: InterventionPlan;
  registerPlanAction: (input: RegisterPlanActionInput) => Promise<void>;
  clearPlanAction: (triggerRef: string) => Promise<void>;
  isSavingPlanAction: boolean;

  exportPDF: (type: 'executive' | 'semestral') => Promise<void>;
  isExporting: boolean;

  // ── ActionPlan (modelo genérico) ────────────────────────────────
  actionPlan: ActionPlanState | null;
  decisiones: ComplianceDecisionItem[];
  /** True si hay al menos una decisión registrada — gating para footer del Hub. */
  hasDecisions: boolean;
  upsertDecision: (item: ComplianceDecisionItem) => void;
  removeDecision: (triggerRef: string) => void;
  narrativasEdit: Record<string, string>;
  updateNarrativaEdit: (triggerRef: string, texto: string) => void;
  isPersistingPlan: boolean;
  canEditPlan: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Derivación de triggers desde el report — alimenta InterventionEngine
// ═══════════════════════════════════════════════════════════════════

/**
 * Mapea score (0-5) a nivel categórico dimension:
 *   score ≥ 3.0 → medio
 *   score ≥ 2.0 → bajo
 *   score < 2.0 → critico
 */
function dimensionLevelFromScore(score: number): DimensionRiskLevel {
  if (score >= 3.0) return 'medio';
  if (score >= 2.0) return 'bajo';
  return 'critico';
}

function extractTriggers(report: ComplianceReportResponse | null): TriggerInput[] {
  if (!report) return [];
  const triggers: TriggerInput[] = [];

  // ─── 1) Dimensiones débiles a nivel org ────────────────────────────
  // Promedio ponderado por respondentCount de dimensionScores por dimensión.
  // Si el promedio < 3.0 → se agrega como trigger dimension_low.
  const depts = report.data.departments;
  type DimKey = keyof (typeof depts)[number]['dimensionScores'];
  for (const dimKey of DIMENSION_ORDER as readonly DimKey[]) {
    let weighted = 0;
    let totalWeight = 0;
    for (const d of depts) {
      const score = d.dimensionScores?.[dimKey];
      if (score === null || score === undefined) continue;
      const weight = d.respondentCount ?? 0;
      if (weight <= 0) continue;
      weighted += score * weight;
      totalWeight += weight;
    }
    if (totalWeight === 0) continue;
    const orgScore = weighted / totalWeight;
    if (orgScore >= 3.0) continue;
    triggers.push({
      type: 'dimension_low',
      ref: `dim:${dimKey}`,
      label: DIMENSION_LABELS[dimKey] ?? dimKey,
      riskLevel: dimensionLevelFromScore(orgScore),
      meta: { dimKey, score: orgScore },
    });
  }

  // ─── 2) Patrones LLM ───────────────────────────────────────────────
  // El endpoint /report actual no expone patrones por depto en la salida
  // executive. Se extenderá en Sesión 7 (SectionPatrones) para habilitar
  // triggers de type 'patron'. Por ahora queda vacío.

  // ─── 3) Alertas activas ────────────────────────────────────────────
  for (const alert of report.data.alerts) {
    if (alert.status === 'resolved' || alert.status === 'dismissed') continue;
    const severity: DimensionRiskLevel =
      alert.severity === 'critical'
        ? 'critico'
        : alert.severity === 'high'
          ? 'bajo'
          : 'medio';
    triggers.push({
      type: 'alert',
      ref: `alert:${alert.id}`,
      label: ALERTA_LABELS[alert.alertType] ?? alert.alertType,
      riskLevel: severity,
      meta: { alertType: alert.alertType, alertId: alert.id },
    });
  }

  return triggers;
}

// ═══════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════

export function useComplianceData(initialCampaignId?: string): UseComplianceDataReturn {
  const {
    campaigns,
    isLoading: isLoadingCampaigns,
    error: campaignsError,
  } = useComplianceCampaigns();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    initialCampaignId ?? null
  );

  const [report, setReport] = useState<ComplianceReportResponse | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [planActions, setPlanActions] = useState<CompliancePlanAction[]>([]);
  const [isSavingPlanAction, setIsSavingPlanAction] = useState(false);

  const [activeSection, setActiveSection] = useState<ComplianceSectionId | null>(null);
  const [isRailExpanded, setIsRailExpanded] = useState(false);

  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState(false);

  // ═══════════════════════════════════════════════════════════════════
  // Auto-select campaña al cargar la lista
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isLoadingCampaigns) return;
    if (selectedCampaignId) return;
    if (campaigns.length === 0) return;
    const firstClosed = campaigns.find(
      (c) => c.status === 'completed' && c.hasCompletedAnalysis
    );
    const firstActive = campaigns.find((c) => c.status === 'active');
    const fallback = campaigns[0];
    setSelectedCampaignId(firstClosed?.id ?? firstActive?.id ?? fallback.id);
  }, [isLoadingCampaigns, campaigns, selectedCampaignId]);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId]
  );

  // ═══════════════════════════════════════════════════════════════════
  // Carga del report + plan-actions en paralelo cuando la campaña está
  // 'completed' y tiene análisis.
  // ═══════════════════════════════════════════════════════════════════
  const loadReportAndActions = useCallback(async (campaignId: string) => {
    setIsLoadingReport(true);
    setReportError(null);
    try {
      const [reportRes, actionsRes] = await Promise.all([
        fetch(`/api/compliance/report?campaignId=${campaignId}&type=executive`, {
          headers: getAuthHeaders(),
        }),
        fetch(`/api/compliance/plan-actions?campaignId=${campaignId}`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (!reportRes.ok) {
        const err = await reportRes.json().catch(() => ({ error: `HTTP ${reportRes.status}` }));
        throw new Error(err?.error ?? `HTTP ${reportRes.status}`);
      }
      const reportJson = (await reportRes.json()) as ComplianceReportResponse;
      setReport(reportJson);

      if (actionsRes.ok) {
        const actionsJson = (await actionsRes.json()) as CompliancePlanActionsResponse;
        setPlanActions(actionsJson.actions ?? []);
      } else {
        setPlanActions([]);
      }
    } catch (e) {
      setReportError(e instanceof Error ? e.message : 'Error cargando reporte');
      setReport(null);
      setPlanActions([]);
    } finally {
      setIsLoadingReport(false);
    }
  }, []);

  const campaignCacheKey =
    selectedCampaign &&
    `${selectedCampaign.id}|${selectedCampaign.status}|${selectedCampaign.hasCompletedAnalysis}`;

  useEffect(() => {
    if (!selectedCampaign) {
      setReport(null);
      setPlanActions([]);
      return;
    }
    if (selectedCampaign.status === 'completed' && selectedCampaign.hasCompletedAnalysis) {
      loadReportAndActions(selectedCampaign.id);
    } else {
      setReport(null);
      setPlanActions([]);
    }
    // Reset navegación al cambiar de campaña
    setActiveSection(null);
    setSelectedDepartmentId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignCacheKey]);

  // ═══════════════════════════════════════════════════════════════════
  // Auto-select del depto con menor ISA al cargar report
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!report) return;
    if (selectedDepartmentId) return;
    const pick = pickLowestISA(report.data.departments);
    setSelectedDepartmentId(pick?.departmentId ?? null);
  }, [report, selectedDepartmentId]);

  const selectedDepartment = useMemo<ComplianceReportDepartment | null>(() => {
    if (!report || !selectedDepartmentId) return null;
    return (
      report.data.departments.find((d) => d.departmentId === selectedDepartmentId) ?? null
    );
  }, [report, selectedDepartmentId]);

  // ═══════════════════════════════════════════════════════════════════
  // Derivado: interventionPlan (triggers del report → motor)
  // ═══════════════════════════════════════════════════════════════════
  const interventionPlan = useMemo<InterventionPlan>(() => {
    const triggers = extractTriggers(report);
    return buildInterventionPlan(triggers);
  }, [report]);

  // ═══════════════════════════════════════════════════════════════════
  // PageState
  // ═══════════════════════════════════════════════════════════════════
  const pageState = useMemo<CompliancePageState>(() => {
    if (isLoadingCampaigns) return 'loading';
    if (campaignsError) return 'error';
    if (campaigns.length === 0) return 'empty';
    if (!selectedCampaign) return 'loading';
    if (selectedCampaign.status === 'active' || selectedCampaign.status === 'draft') {
      return 'active';
    }
    if (selectedCampaign.status === 'completed') {
      if (!selectedCampaign.hasCompletedAnalysis || isLoadingReport) return 'loading';
      if (reportError) return 'error';
      return report ? 'closed' : 'loading';
    }
    return 'active';
  }, [
    isLoadingCampaigns,
    campaignsError,
    campaigns.length,
    selectedCampaign,
    isLoadingReport,
    report,
    reportError,
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // Active state helpers
  // ═══════════════════════════════════════════════════════════════════
  const activeParticipationRate = useMemo(() => {
    if (!selectedCampaign) return null;
    const invited = selectedCampaign.totalInvited ?? 0;
    const responded = selectedCampaign.totalResponded ?? 0;
    if (invited === 0) return 0;
    return Math.round((responded / invited) * 100);
  }, [selectedCampaign]);

  // ═══════════════════════════════════════════════════════════════════
  // Navegación
  // ═══════════════════════════════════════════════════════════════════
  const selectSection = useCallback((id: ComplianceSectionId) => {
    setActiveSection(id);
  }, []);

  const navigateNext = useCallback(() => {
    setActiveSection((current) => {
      if (current === null) return COMPLIANCE_SECTIONS[0].id;
      const idx = SECTION_INDEX[current];
      const next = COMPLIANCE_SECTIONS[idx + 1];
      return next ? next.id : current;
    });
  }, []);

  const exitToLobby = useCallback(() => {
    setActiveSection(null);
  }, []);

  const toggleRail = useCallback(() => {
    setIsRailExpanded((v) => !v);
  }, []);

  const selectCampaign = useCallback((id: string) => {
    setSelectedCampaignId(id);
  }, []);

  const selectDepartment = useCallback((id: string) => {
    setSelectedDepartmentId(id);
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // Plan de acción — persistencia
  // ═══════════════════════════════════════════════════════════════════
  const registerPlanAction = useCallback(
    async (input: RegisterPlanActionInput) => {
      if (!selectedCampaignId) return;
      setIsSavingPlanAction(true);
      try {
        const res = await fetch('/api/compliance/plan-actions', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            campaignId: selectedCampaignId,
            ...input,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(err?.error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as { success: true; action: CompliancePlanAction };
        setPlanActions((prev) => {
          const filtered = prev.filter((a) => a.triggerRef !== json.action.triggerRef);
          return [...filtered, json.action];
        });
      } finally {
        setIsSavingPlanAction(false);
      }
    },
    [selectedCampaignId]
  );

  const clearPlanAction = useCallback(
    async (triggerRef: string) => {
      if (!selectedCampaignId) return;
      setIsSavingPlanAction(true);
      try {
        const params = new URLSearchParams({
          campaignId: selectedCampaignId,
          triggerRef,
        });
        const res = await fetch(`/api/compliance/plan-actions?${params.toString()}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!res.ok && res.status !== 404) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(err?.error ?? `HTTP ${res.status}`);
        }
        setPlanActions((prev) => prev.filter((a) => a.triggerRef !== triggerRef));
      } finally {
        setIsSavingPlanAction(false);
      }
    },
    [selectedCampaignId]
  );

  // ═══════════════════════════════════════════════════════════════════
  // Export PDF — Fase 6 (disabled en UI con tooltip)
  // ═══════════════════════════════════════════════════════════════════
  const exportPDF = useCallback(async (_type: 'executive' | 'semestral') => {
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 300));
    setIsExporting(false);
  }, []);

  // ═══════════════════════════════════════════════════════════════════
  // ActionPlan — carrito de decisiones (autosave 1.5s, 3 capas)
  // React state → sessionStorage (per-campaign) → BD (POST/PUT)
  // ═══════════════════════════════════════════════════════════════════
  const sessionKey = useMemo(
    () =>
      selectedCampaignId
        ? `action_plan_compliance_${selectedCampaignId}_v1`
        : null,
    [selectedCampaignId]
  );

  const [actionPlan, setActionPlan] = useState<ActionPlanState | null>(null);
  const [decisionesMap, setDecisionesMap] = useState<
    Map<string, ComplianceDecisionItem>
  >(new Map());
  const [narrativasEdit, setNarrativasEdit] = useState<Record<string, string>>(
    {}
  );
  const [isPersistingPlan, setIsPersistingPlan] = useState(false);
  /**
   * Flag: hubo un upgrade legacy → moderno en la última hidratación.
   * Un effect separado (más abajo) lee este flag y gatilla `scheduleAutosave`
   * para persistir el formato nuevo en BD. Reactivo y libre de race conditions
   * (vs. usar refs directos antes que `scheduleAutosave` esté declarada).
   */
  const [pendingUpgradeAutosave, setPendingUpgradeAutosave] = useState(false);

  const decisionesRef = useRef(decisionesMap);
  const narrativasEditRef = useRef(narrativasEdit);
  const actionPlanRef = useRef(actionPlan);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    decisionesRef.current = decisionesMap;
  }, [decisionesMap]);
  useEffect(() => {
    narrativasEditRef.current = narrativasEdit;
  }, [narrativasEdit]);
  useEffect(() => {
    actionPlanRef.current = actionPlan;
  }, [actionPlan]);

  // ── Hidratar desde sessionStorage al cambiar de campaña ──
  useEffect(() => {
    if (!sessionKey || typeof window === 'undefined') {
      setActionPlan(null);
      setDecisionesMap(new Map());
      setNarrativasEdit({});
      return;
    }
    try {
      const raw = sessionStorage.getItem(sessionKey);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          actionPlan?: ActionPlanState | null;
          decisiones?: Array<[string, ComplianceDecisionItem]>;
          narrativasEdit?: Record<string, string>;
        };
        setActionPlan(parsed.actionPlan ?? null);

        // Upgrade legacy triggerRefs ('dim:KEY' → 'dim:KEY:org') y enriquecer
        // con targetType/targetId. La key del Map se rebuilda con el triggerRef
        // upgradeado para que la dedup funcione correctamente.
        const rawItems = (parsed.decisiones ?? []).map(([, item]) => item);
        const { items: upgraded, anyUpgraded } = upgradeDecisions(rawItems);
        const map = new Map<string, ComplianceDecisionItem>();
        for (const it of upgraded) map.set(it.triggerRef, it);
        setDecisionesMap(map);
        setNarrativasEdit(parsed.narrativasEdit ?? {});

        // Si hubo upgrades, marcar para que un effect posterior gatille
        // autosave a BD con el formato nuevo (sino legacy data nunca migra).
        if (anyUpgraded) setPendingUpgradeAutosave(true);
      } else {
        setActionPlan(null);
        setDecisionesMap(new Map());
        setNarrativasEdit({});
      }
    } catch {
      /* parse error — start clean */
    }
  }, [sessionKey]);

  // ── Cargar borrador desde BD (override de sessionStorage) ──
  useEffect(() => {
    if (!selectedCampaignId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/action-plans?moduleType=compliance&campaignId=${selectedCampaignId}&estado=borrador`,
          { headers: getAuthHeaders() }
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          success: boolean;
          data?: Array<{
            id: string;
            estado: string;
            allowAmendment: boolean;
            decisiones: unknown;
            narrativasEdit: unknown;
          }>;
        };
        if (cancelled || !json.success || !json.data || json.data.length === 0)
          return;
        const plan = json.data[0]; // único borrador por scope
        const decsArr = Array.isArray(plan.decisiones)
          ? (plan.decisiones as ComplianceDecisionItem[])
          : [];

        // Upgrade legacy triggerRefs y enriquecer scope. Mismo patrón que
        // sessionStorage hydration — la BD puede tener datos pre-rediseño.
        const { items: upgraded, anyUpgraded } = upgradeDecisions(decsArr);
        const decsMap = new Map<string, ComplianceDecisionItem>();
        for (const it of upgraded) decsMap.set(it.triggerRef, it);

        const ne =
          plan.narrativasEdit &&
          typeof plan.narrativasEdit === 'object' &&
          !Array.isArray(plan.narrativasEdit)
            ? (plan.narrativasEdit as Record<string, string>)
            : {};
        setActionPlan({
          id: plan.id,
          estado: plan.estado as ActionPlanState['estado'],
          allowAmendment: plan.allowAmendment,
        });
        setDecisionesMap(decsMap);
        setNarrativasEdit(ne);

        if (anyUpgraded) setPendingUpgradeAutosave(true);
      } catch {
        /* offline — usar sessionStorage */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCampaignId]);

  // ── Persistir a sessionStorage en cada cambio ──
  useEffect(() => {
    if (!sessionKey || typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(
        sessionKey,
        JSON.stringify({
          actionPlan,
          decisiones: [...decisionesMap.entries()],
          narrativasEdit,
        })
      );
    } catch {
      /* quota exceeded — ignorar */
    }
  }, [sessionKey, actionPlan, decisionesMap, narrativasEdit]);

  // ── Save (POST primer vez, PUT subsiguientes) ──
  const doSave = useCallback(async () => {
    if (!selectedCampaignId) return;
    if (actionPlanRef.current?.estado === 'aprobado') return;
    setIsPersistingPlan(true);
    try {
      const decisionesArr = [...decisionesRef.current.values()];
      const ne = narrativasEditRef.current;

      let id = actionPlanRef.current?.id ?? null;

      if (!id) {
        const res = await fetch('/api/action-plans', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            moduleType: 'compliance',
            campaignId: selectedCampaignId,
            decisiones: decisionesArr,
            narrativasEdit: ne,
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            data: { id: string; estado: string; allowAmendment: boolean };
          };
          setActionPlan({
            id: json.data.id,
            estado: json.data.estado as ActionPlanState['estado'],
            allowAmendment: json.data.allowAmendment,
          });
          return; // POST ya guardó el state actual
        }
        if (res.status === 409) {
          // Otro tab/race ya creó el borrador — adoptamos su id y PUT.
          const json = (await res.json()) as { existingPlanId?: string };
          if (json.existingPlanId) {
            id = json.existingPlanId;
            setActionPlan({
              id,
              estado: 'borrador',
              allowAmendment: false,
            });
          } else {
            return;
          }
        } else {
          return;
        }
      }

      if (id) {
        await fetch(`/api/action-plans/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            decisiones: decisionesArr,
            narrativasEdit: ne,
          }),
        });
      }
    } catch {
      /* network/error — el próximo cambio re-intenta */
    } finally {
      setIsPersistingPlan(false);
    }
  }, [selectedCampaignId]);

  const scheduleAutosave = useCallback(() => {
    if (!selectedCampaignId) return;
    if (actionPlanRef.current?.estado === 'aprobado') return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void doSave();
    }, 1500);
  }, [selectedCampaignId, doSave]);

  const upsertDecision = useCallback(
    (item: ComplianceDecisionItem) => {
      if (actionPlanRef.current?.estado === 'aprobado') return;
      // Auto-enrich: upgradea legacy triggerRefs + agrega targetType/targetId.
      // Si el caller ya proveyó esos fields, los preserva.
      const enriched = upgradeDecisionItem(item);
      setDecisionesMap((prev) => {
        const next = new Map(prev);
        next.set(enriched.triggerRef, enriched);
        return next;
      });
      scheduleAutosave();
    },
    [scheduleAutosave]
  );

  const removeDecision = useCallback(
    (triggerRef: string) => {
      if (actionPlanRef.current?.estado === 'aprobado') return;
      setDecisionesMap((prev) => {
        if (!prev.has(triggerRef)) return prev;
        const next = new Map(prev);
        next.delete(triggerRef);
        return next;
      });
      scheduleAutosave();
    },
    [scheduleAutosave]
  );

  const updateNarrativaEdit = useCallback(
    (triggerRef: string, texto: string) => {
      if (actionPlanRef.current?.estado === 'aprobado') return;
      setNarrativasEdit((prev) => ({ ...prev, [triggerRef]: texto }));
      scheduleAutosave();
    },
    [scheduleAutosave]
  );

  // Effect: si hubo upgrade durante la hidratación, gatillar autosave una vez
  // para persistir el formato nuevo. Después el flag se resetea solo.
  useEffect(() => {
    if (!pendingUpgradeAutosave) return;
    scheduleAutosave();
    setPendingUpgradeAutosave(false);
  }, [pendingUpgradeAutosave, scheduleAutosave]);

  const decisiones = useMemo(
    () => [...decisionesMap.values()],
    [decisionesMap]
  );

  const hasDecisions = decisionesMap.size > 0;

  const canEditPlan = actionPlan?.estado !== 'aprobado';

  return {
    pageState,
    error: campaignsError ?? reportError,
    campaigns,
    selectedCampaignId,
    selectedCampaign,
    selectCampaign,
    activeSection,
    selectSection,
    navigateNext,
    exitToLobby,
    isRailExpanded,
    toggleRail,
    activeParticipationRate,
    activeCampaign: selectedCampaign,
    report,
    selectedDepartmentId,
    selectedDepartment,
    selectDepartment,
    planActions,
    interventionPlan,
    registerPlanAction,
    clearPlanAction,
    isSavingPlanAction,
    exportPDF,
    isExporting,
    actionPlan,
    decisiones,
    hasDecisions,
    upsertDecision,
    removeDecision,
    narrativasEdit,
    updateNarrativaEdit,
    isPersistingPlan,
    canEditPlan,
  };
}
