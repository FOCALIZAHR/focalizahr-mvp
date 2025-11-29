// src/hooks/useOnboardingJourneys.ts
// ============================================================================
// HOOK: useOnboardingJourneys
// Pipeline Kanban Proactivo - Onboarding Journey Intelligence
// ============================================================================
//
// PROPÓSITO:
// - Consumir API /api/onboarding/journeys
// - Agrupar journeys por currentStage (Map para Kanban)
// - Auto-refresh configurable
// - Manejo de loading/error states
//
// USO:
// const { journeysByStage, loading, refetch } = useOnboardingJourneys({
//   status: 'active',
//   autoRefresh: true
// });
//
// ============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// TYPES - Importados desde src/types/onboarding.ts (centralizado)
// ============================================================================

import type {
  Journey,
  JourneyDepartment,
  JourneyAlert,
  JourneyParticipant,
  StageStats,
  RiskStats,
  JourneysStats,
  PaginationInfo,
  UseOnboardingJourneysOptions,
  UseOnboardingJourneysReturn
} from '@/types/onboarding';

// Re-export para que componentes puedan importar desde el hook
export type {
  Journey,
  JourneyDepartment,
  JourneyAlert,
  JourneyParticipant,
  StageStats,
  RiskStats,
  JourneysStats,
  PaginationInfo,
  UseOnboardingJourneysOptions,
  UseOnboardingJourneysReturn
};

// ============================================================================
// CONFIGURACIÓN DE STAGES
// ============================================================================

export const STAGE_CONFIG = [
  { 
    stage: 0, 
    title: 'Sin Iniciar', 
    shortTitle: 'Pendiente',
    color: 'slate', 
    icon: 'FileText',
    description: 'Colaboradores registrados sin iniciar onboarding'
  },
  { 
    stage: 1, 
    title: 'Día 1 - Compliance', 
    shortTitle: 'Día 1',
    color: 'cyan', 
    icon: 'Shield',
    description: 'Primera impresión y cumplimiento básico'
  },
  { 
    stage: 2, 
    title: 'Día 7 - Clarification', 
    shortTitle: 'Día 7',
    color: 'blue', 
    icon: 'Lightbulb',
    description: 'Claridad del rol y expectativas'
  },
  { 
    stage: 3, 
    title: 'Día 30 - Culture', 
    shortTitle: 'Día 30',
    color: 'purple', 
    icon: 'Users',
    description: 'Integración cultural con el equipo'
  },
  { 
    stage: 4, 
    title: 'Día 90 - Connection', 
    shortTitle: 'Día 90',
    color: 'green', 
    icon: 'Star',
    description: 'Consolidación y conexión organizacional'
  }
] as const;

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useOnboardingJourneys(
  options: UseOnboardingJourneysOptions = {}
): UseOnboardingJourneysReturn {
  
  // Estados
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [stats, setStats] = useState<JourneysStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Construir URL con query params
  const buildURL = useCallback(() => {
    const params = new URLSearchParams();
    
    // Limit alto para Kanban (ver todos)
    params.append('limit', '100');
    
    if (options.status) {
      params.append('status', options.status);
    }
    if (options.riskLevel) {
      params.append('riskLevel', options.riskLevel);
    }
    if (options.departmentId) {
      params.append('departmentId', options.departmentId);
    }
    if (options.stage !== undefined) {
      params.append('stage', String(options.stage));
    }
    
    return `/api/onboarding/journeys?${params.toString()}`;
  }, [options.status, options.riskLevel, options.departmentId, options.stage]);
  
  // Función fetch
  const fetchJourneys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = buildURL();
      console.log(`🔄 [useOnboardingJourneys] Fetching: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include', // Incluir cookies (JWT)
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }
      
      setJourneys(result.data || []);
      setStats(result.stats || null);
      setPagination(result.pagination || null);
      setLastUpdated(new Date());
      
      console.log(`✅ [useOnboardingJourneys] Loaded ${result.data?.length || 0} journeys`);
      
    } catch (err: any) {
      console.error('❌ [useOnboardingJourneys] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [buildURL]);
  
  // Effect: Carga inicial
  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);
  
  // Effect: Auto-refresh
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(
        fetchJourneys,
        options.refreshInterval || 300000 // Default: 1 minuto
      );
      
      console.log(`🔄 [useOnboardingJourneys] Auto-refresh enabled: ${options.refreshInterval || 300000}ms`);
      
      return () => {
        clearInterval(interval);
        console.log(`⏹️ [useOnboardingJourneys] Auto-refresh disabled`);
      };
    }
  }, [options.autoRefresh, options.refreshInterval, fetchJourneys]);
  
  // Memo: Agrupar journeys por stage (para Kanban)
  const journeysByStage = useMemo(() => {
    const map = new Map<number, Journey[]>();
    
    // Inicializar 5 columnas (stages 0-4)
    for (let stage = 0; stage <= 4; stage++) {
      map.set(stage, []);
    }
    
    // Distribuir journeys en sus stages
    journeys.forEach(journey => {
      const stage = journey.currentStage;
      const stageJourneys = map.get(stage) || [];
      stageJourneys.push(journey);
      map.set(stage, stageJourneys);
    });
    
    console.log(`📊 [useOnboardingJourneys] Distribution by stage:`, {
      stage0: map.get(0)?.length || 0,
      stage1: map.get(1)?.length || 0,
      stage2: map.get(2)?.length || 0,
      stage3: map.get(3)?.length || 0,
      stage4: map.get(4)?.length || 0
    });
    
    return map;
  }, [journeys]);
  
  return {
    journeys,
    journeysByStage,
    stats,
    pagination,
    loading,
    error,
    refetch: fetchJourneys,
    lastUpdated
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcula días desde la contratación
 */
export function getDaysSinceHire(hireDate: string): number {
  const hire = new Date(hireDate);
  const now = new Date();
  const diffTime = now.getTime() - hire.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Obtiene el color CSS para un nivel de riesgo
 */
export function getRiskColor(risk: string | null): string {
  switch (risk) {
    case 'critical': return 'red';
    case 'high': return 'orange';
    case 'medium': return 'yellow';
    case 'low': return 'green';
    default: return 'slate';
  }
}

/**
 * Obtiene label legible para nivel de riesgo
 */
export function getRiskLabel(risk: string | null): string {
  switch (risk) {
    case 'critical': return 'Crítico';
    case 'high': return 'Alto';
    case 'medium': return 'Medio';
    case 'low': return 'Bajo';
    default: return 'Pendiente';
  }
}

/**
 * Obtiene el color para EXO Score
 */
export function getExoScoreColor(score: number | null): string {
  if (score === null) return 'slate';
  if (score >= 80) return 'green';
  if (score >= 60) return 'cyan';
  if (score >= 40) return 'yellow';
  return 'red';
}

/**
 * Formatea fecha para mostrar
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}