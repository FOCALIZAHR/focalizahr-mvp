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
import type {
  ClimaResultsResponse,
  ClimaChapter,
  ClimaRailFilter,
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
  orgFavorability: number | null;
  orgRiskZone: RiskZone | null;
  orgMomentum: number | null;
  scope: 'organization' | 'area';

  // Smart Router
  nextDepartment: ClimaNextDepartment | null;

  // Navegación
  selectedDepartmentId: string | null;
  activeChapter: ClimaChapter | null;
  isRailExpanded: boolean;
  railFilter: ClimaRailFilter;
  selectDepartment: (id: string) => void;
  selectChapter: (chapter: ClimaChapter) => void;
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
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [railFilter, setRailFilter] = useState<ClimaRailFilter>('todos');

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
    setRailFilter('todos');
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
    setIsRailExpanded(false);
  }, []);

  const selectChapter = useCallback((chapter: ClimaChapter) => {
    setActiveChapter(chapter);
    setSelectedDepartmentId(null);
  }, []);

  const exitToLobby = useCallback(() => {
    setSelectedDepartmentId(null);
    setActiveChapter(null);
  }, []);

  const toggleRail = useCallback(() => setIsRailExpanded((v) => !v), []);

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
    orgFavorability: results?.orgFavorability ?? null,
    orgRiskZone: results?.orgRiskZone ?? null,
    orgMomentum: results?.orgMomentum ?? null,
    scope: results?.scope ?? 'organization',
    nextDepartment,
    selectedDepartmentId,
    activeChapter,
    isRailExpanded,
    railFilter,
    selectDepartment,
    selectChapter,
    exitToLobby,
    toggleRail,
    setRailFilter,
    reload,
  };
}
