// src/hooks/useClimaCinemaMode.ts
// Estado + lógica central del Cinema Mode de Clima (Gate 4).
// Clon estructural de useEvaluatorCinemaMode + selector de campaña
// (patrón useComplianceData). Entity-centric: las entidades son DEPARTAMENTOS.
//
// Máquina de estados (en Gate 4 el punto de entrada ES el Lobby; la Cascada
// previa llega en Gate 4.5):
//   activeChapter===null && selectedDepartmentId===null → Lobby (MissionControl)
//   activeChapter!==null                                → Capítulo de compañía
//   selectedDepartmentId!==null                         → SpotlightCard de depto

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useClimaCampaigns } from './useClimaCampaigns';
import { CLIMA_DIMENSIONS } from '@/lib/constants/climaDimensions';
import {
  aggregateClimaDimension,
  type ClimaDimensionAgg,
} from '@/lib/utils/aggregateClimaDimension';
import type {
  ClimaResultsResponse,
  ClimaChapter,
  ClimaRailFilter,
  ClimaSubproducto,
  ClimaNextDepartment,
  ClimaCinemaStats,
  RiskZone,
} from '@/types/clima';

export type ClimaPageState = 'loading' | 'error' | 'empty' | 'ready';

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('focalizahr_token') : null;
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

// Peor zona primero (menor rank = más crítica). null (sin zona) al final.
const ZONE_RANK: Record<RiskZone, number> = { roja: 0, naranja: 1, amarilla: 2, verde: 3 };

function rankZone(zone: RiskZone | null): number {
  return zone ? ZONE_RANK[zone] : 99;
}

export interface UseClimaCinemaModeReturn {
  pageState: ClimaPageState;
  error: string | null;

  // Campañas + selector
  campaigns: ReturnType<typeof useClimaCampaigns>['campaigns'];
  selectedCampaignId: string | null;
  selectCampaign: (id: string) => void;

  // Resultados
  results: ClimaResultsResponse | null;
  stats: ClimaCinemaStats;
  /** Agregado read-time de las 8 dimensiones (Cards + Toolbar del Lobby, 4.5b). */
  dimensions: Record<string, ClimaDimensionAgg>;
  orgFavorability: number | null;
  orgRiskZone: RiskZone | null;
  orgMomentum: number | null;
  orgMeanMomentum: number | null; // Bloque A — base narrativa divergencia fav↔mean
  scope: 'organization' | 'area';

  // Smart Router
  nextDepartment: ClimaNextDepartment | null;

  // Cascada Ejecutiva (Gate 4.5a) — precede al Lobby. introDismissed=false hasta
  // que el CEO termina/salta la secuencia; se resetea al cambiar de campaña.
  introDismissed: boolean;
  dismissIntro: () => void;

  // Navegación
  selectedDepartmentId: string | null;
  activeChapter: ClimaChapter | null;
  /** Subproducto abierto desde el Rail (v3 §3A). null = Lobby. */
  activeSubproducto: ClimaSubproducto | null;
  /** Dimensión de aterrizaje de la vista Dimensiones (Toolbar §3E). null = focus[0]. */
  dimensionesInitialDriver: string | null;
  isRailExpanded: boolean;
  railFilter: ClimaRailFilter;
  selectDepartment: (id: string) => void;
  selectChapter: (chapter: ClimaChapter) => void;
  selectSubproducto: (s: ClimaSubproducto) => void;
  exitSubproducto: () => void;
  openDimensionesAt: (driver: string) => void;
  exitToLobby: () => void;
  toggleRail: () => void;
  setRailFilter: (f: ClimaRailFilter) => void;

  reload: () => Promise<void>;
}

export function useClimaCinemaMode(initialCampaignId?: string): UseClimaCinemaModeReturn {
  const { campaigns, isLoading: isLoadingCampaigns, error: campaignsError } = useClimaCampaigns();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    initialCampaignId ?? null
  );

  const [results, setResults] = useState<ClimaResultsResponse | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  // Navegación
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<ClimaChapter | null>(null);
  const [activeSubproducto, setActiveSubproducto] = useState<ClimaSubproducto | null>(null);
  // Dimensión de aterrizaje al abrir Dimensiones desde el Toolbar (§3E). null =
  // entrada por el Rail → aterriza en la peor dimensión (focus[0]).
  const [dimensionesInitialDriver, setDimensionesInitialDriver] = useState<string | null>(null);
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [railFilter, setRailFilter] = useState<ClimaRailFilter>('todos');

  // Cascada Ejecutiva (Gate 4.5a): la intro se muestra ANTES del Lobby hasta que
  // el CEO la termina o la salta. Sticky por campaña (se resetea abajo al cambiar).
  const [introDismissed, setIntroDismissed] = useState(false);

  // Auto-seleccionar campaña al cargar la lista (primera con análisis, luego
  // primera activa, luego cualquiera) — respeta initialCampaignId.
  useEffect(() => {
    if (isLoadingCampaigns) return;
    if (selectedCampaignId) return;
    if (campaigns.length === 0) return;
    const firstAnalyzed = campaigns.find((c) => c.hasCompletedAnalysis);
    setSelectedCampaignId(firstAnalyzed?.id ?? campaigns[0].id);
  }, [isLoadingCampaigns, campaigns, selectedCampaignId]);

  const loadResults = useCallback(async (campaignId: string) => {
    setIsLoadingResults(true);
    setResultsError(null);
    try {
      const res = await fetch(`/api/clima/results?campaignId=${campaignId}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as ClimaResultsResponse;
      setResults(json);
    } catch (e) {
      setResultsError(e instanceof Error ? e.message : 'Error cargando resultados');
      setResults(null);
    } finally {
      setIsLoadingResults(false);
    }
  }, []);

  const selectedCampaign = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId]
  );

  const campaignCacheKey = selectedCampaign
    ? `${selectedCampaign.id}|${selectedCampaign.hasCompletedAnalysis}`
    : null;

  useEffect(() => {
    if (!selectedCampaign) {
      setResults(null);
      return;
    }
    if (selectedCampaign.hasCompletedAnalysis) {
      loadResults(selectedCampaign.id);
    } else {
      setResults(null);
    }
    // Reset navegación al cambiar de campaña
    setSelectedDepartmentId(null);
    setActiveChapter(null);
    setActiveSubproducto(null);
    setDimensionesInitialDriver(null);
    setRailFilter('todos');
    // La Cascada Ejecutiva vuelve a mostrarse para la nueva campaña.
    setIntroDismissed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignCacheKey]);

  // Smart Router: peor departamento (zona más crítica, desempate por menor EI).
  const nextDepartment = useMemo<ClimaNextDepartment | null>(() => {
    if (!results || results.departments.length === 0) return null;
    const sorted = [...results.departments].sort((a, b) => {
      const rankDiff = rankZone(a.riskZone) - rankZone(b.riskZone);
      if (rankDiff !== 0) return rankDiff;
      const favA = a.engagementFavorability ?? Infinity;
      const favB = b.engagementFavorability ?? Infinity;
      return favA - favB;
    });
    const worst = sorted[0];
    return {
      departmentId: worst.departmentId,
      departmentName: worst.departmentName,
      riskZone: worst.riskZone,
    };
  }, [results]);

  const stats = useMemo<ClimaCinemaStats>(() => {
    if (!results) {
      return { deptCount: 0, zoneCounts: { verde: 0, amarilla: 0, naranja: 0, roja: 0 } };
    }
    return {
      deptCount: results.companyPulse.deptCount,
      zoneCounts: results.companyPulse.zoneCounts,
    };
  }, [results]);

  // Agregado por dimensión (las 8) para las Cards + el ClimaToolbar del Lobby.
  const dimensions = useMemo<Record<string, ClimaDimensionAgg>>(() => {
    if (!results) return {};
    const out: Record<string, ClimaDimensionAgg> = {};
    for (const dim of CLIMA_DIMENSIONS) {
      out[dim.key] = aggregateClimaDimension(results, dim.key);
    }
    return out;
  }, [results]);

  const pageState = useMemo<ClimaPageState>(() => {
    if (isLoadingCampaigns) return 'loading';
    if (campaignsError) return 'error';
    if (campaigns.length === 0) return 'empty';
    if (!selectedCampaign) return 'loading';
    if (!selectedCampaign.hasCompletedAnalysis) return 'empty';
    if (isLoadingResults) return 'loading';
    if (resultsError) return 'error';
    return results ? 'ready' : 'loading';
  }, [
    isLoadingCampaigns,
    campaignsError,
    campaigns.length,
    selectedCampaign,
    isLoadingResults,
    resultsError,
    results,
  ]);

  // Handlers de navegación
  const selectDepartment = useCallback((id: string) => {
    setSelectedDepartmentId(id);
    setActiveChapter(null);
    setActiveSubproducto(null);
    setIsRailExpanded(false);
  }, []);

  const selectChapter = useCallback((chapter: ClimaChapter) => {
    setActiveChapter(chapter);
    setSelectedDepartmentId(null);
    setActiveSubproducto(null);
  }, []);

  // Rail de subproductos (v3 §3A). Cascada no es una vista aparte: re-arma la
  // secuencia intro sobre el Lobby (introDismissed=false). El resto abre su vista.
  const selectSubproducto = useCallback((s: ClimaSubproducto) => {
    setSelectedDepartmentId(null);
    setActiveChapter(null);
    setIsRailExpanded(false);
    if (s === 'cascada') {
      setActiveSubproducto(null);
      setIntroDismissed(false);
    } else {
      // Entrada por el Rail → sin dimensión fija (aterriza en focus[0]).
      if (s === 'dimensiones') setDimensionesInitialDriver(null);
      setActiveSubproducto(s);
    }
  }, []);

  const exitSubproducto = useCallback(() => setActiveSubproducto(null), []);

  // Atajo del Toolbar (§3E): abre Dimensiones aterrizando en una dimensión.
  const openDimensionesAt = useCallback((driver: string) => {
    setSelectedDepartmentId(null);
    setActiveChapter(null);
    setIsRailExpanded(false);
    setDimensionesInitialDriver(driver);
    setActiveSubproducto('dimensiones');
  }, []);

  const exitToLobby = useCallback(() => {
    setSelectedDepartmentId(null);
    setActiveChapter(null);
    setActiveSubproducto(null);
  }, []);

  const toggleRail = useCallback(() => setIsRailExpanded((v) => !v), []);

  const dismissIntro = useCallback(() => setIntroDismissed(true), []);

  const selectCampaign = useCallback((id: string) => setSelectedCampaignId(id), []);

  const reload = useCallback(async () => {
    if (selectedCampaignId) await loadResults(selectedCampaignId);
  }, [selectedCampaignId, loadResults]);

  return {
    pageState,
    error: campaignsError ?? resultsError,
    campaigns,
    selectedCampaignId,
    selectCampaign,
    results,
    stats,
    dimensions,
    orgFavorability: results?.orgFavorability ?? null,
    orgRiskZone: results?.orgRiskZone ?? null,
    orgMomentum: results?.orgMomentum ?? null,
    orgMeanMomentum: results?.orgMeanMomentum ?? null, // Bloque A
    scope: results?.scope ?? 'organization',
    introDismissed,
    dismissIntro,
    nextDepartment,
    selectedDepartmentId,
    activeChapter,
    activeSubproducto,
    dimensionesInitialDriver,
    isRailExpanded,
    railFilter,
    selectDepartment,
    selectChapter,
    selectSubproducto,
    exitSubproducto,
    openDimensionesAt,
    exitToLobby,
    toggleRail,
    setRailFilter,
    reload,
  };
}
