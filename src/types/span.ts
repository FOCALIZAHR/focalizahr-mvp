// ════════════════════════════════════════════════════════════════════════════
// TIPOS — Span Intelligence (L4 Arquitectura de Liderazgo)
// src/types/span.ts
// ════════════════════════════════════════════════════════════════════════════
// Tipos canónicos para el lente L4 del Efficiency Hub, reemplazo del
// antiguo "Cargos sin impacto" (Jaccard — lente de baja frecuencia).
//
// Spec: .claude/tasks/SPEC_L4_ARQUITECTURA_LIDERAZGO.md (secciones 5, 6,
// 7, 9). Umbrales según §16.2.1 (7 niveles desde standardJobLevel —
// más granular que 4 acotadoGroup).
// ════════════════════════════════════════════════════════════════════════════

/** Estado estructural del span respecto al rango óptimo del arquetipo. */
export type SpanZone = 'MICRO' | 'SUB' | 'EN_RANGO' | 'SOBRE'

/** Zona narrativa — combina spanZone con señales de perfil/metas. */
export type SpanNarrativaZona = 'VERDE' | 'AMARILLA' | 'ROJA'

export type SpanUrgencia = 'NINGUNA' | 'BAJA' | 'MEDIA' | 'ALTA'

/** Perfil evaluativo del manager — de `evaluatorStatsEngine`. */
export type PerfilEvaluativo = 'OPTIMA' | 'CENTRAL' | 'SEVERA' | 'INDULGENTE'

export interface SpanNarrativeResult {
  zona: SpanNarrativaZona
  titulo: string
  narrativa: string
  consecuencia: string | null
  accionSugerida: string
  urgencia: SpanUrgencia
}

export interface RangoOptimo {
  min: number
  max: number
  arquetipo: string
}

export interface SpanManagerProfile {
  // Identidad
  managerId: string
  managerName: string
  cargo: string
  /** Departamento operacional inmediato del manager (L3 típicamente). */
  gerenciaId: string
  gerenciaNombre: string
  /** Gerencia padre (L2) — concepto organizacional que el CEO reconoce
   *  como "Gerencia de X". Fallback al departamento operacional si la
   *  organización no tiene jerarquía L2 definida para este depto. */
  gerenciaParentId: string
  gerenciaParentNombre: string
  standardJobLevel: string
  performanceTrack: 'EJECUTIVO' | 'MANAGER' | 'COLABORADOR'
  tenureMeses: number
  acotadoGroup: string | null

  // Span
  spanActual: number
  spanZone: SpanZone
  spanGap: number // negativo=sub, 0=ok, positivo=sobre
  rangoOptimo: RangoOptimo

  // Perfil evaluativo (null si no hay cycleId — Modo Estructural)
  perfilEvaluativo: PerfilEvaluativo | null
  avgScore: number | null

  // Resultados del equipo (null en Modo Estructural)
  metasEquipoPct: number | null
  roleFitPromedio: number | null

  // Financiero — salary SIEMPRE estimado vía SalaryConfigService
  // (no hay campo Employee.salary). Consistente con L1/L2/L9.
  salarioManager: number
  costoFTEgestionado: number

  // Narrativa pre-calculada determinista
  narrativa: SpanNarrativeResult
}

export interface OrgSpanSummary {
  totalFTE: number
  totalManagers: number
  densidadGerencial: number // 0-1

  managersEnRojo: number
  managersEnAmarillo: number
  managersEnVerde: number

  /** Σ salary de managers en zona ROJA. */
  costoCapasSuboptimas: number
  /** Promedio de costoFTEgestionado entre todos los managers. */
  costoFTEpromedio: number

  /** Hero — protagonista del Acto 1. */
  heroValue: string
  heroUnit: string

  /** Narrativa de densidad gerencial (Acto 2). Null si densidad saludable. */
  densidadNarrativa: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// ROLLUPS PARA MODAL "DISTRIBUCIÓN COMPLETA" (3 tabs)
// ════════════════════════════════════════════════════════════════════════════

/** Distribución por gerencia — Tab 1 del modal.
 *  Agrupa por gerencia padre (L2) cuando existe — concepto organizacional
 *  que el CEO reconoce. Fallback al departamento operacional si no hay
 *  jerarquía L2 definida. */
export interface GerenciaRollup {
  /** ID de la gerencia (parent L2 cuando existe, departamento operacional si no). */
  gerenciaId: string
  gerenciaNombre: string
  totalManagers: number
  spanPromedio: number
  densidadGerencial: number      // managers en gerencia / totalFTE de gerencia
  costoFTEpromedio: number
  enRojo: number
  enAmarillo: number
  enVerde: number
}

/** Distribución por arquetipo McKinsey — Tab 2 del modal. */
export interface ArquetipoRollup {
  standardJobLevel: string       // gerente_director, jefe, etc.
  arquetipo: string              // Player/Coach, Supervisor, etc.
  rangoOptimo: RangoOptimo
  totalManagers: number
  spanPromedio: number
  enRango: number
  fueraRango: number
  distanciaMediaAlOptimo: number // promedio de |spanGap| de los managers
}

/** Capa de la pirámide organizacional — Tab 3 del modal. */
export interface PiramideNivel {
  nivel: number                  // 1 = más alto (CEO/gerentes), 7 = más bajo
  standardJobLevel: string       // gerente_director, jefe, etc.
  arquetipo: string
  fteCount: number               // headcount total de personas en este nivel
  managersCount: number          // cuántos de esos FTE son managers (con span > 0)
  spanPromedio: number | null    // promedio de span de los managers de este nivel
  /** Ratio respecto al nivel inmediatamente inferior. Ej: nivel L3 con
   *  ratio 1:5 significa que por cada manager L3 hay 5 personas en L4
   *  o niveles inferiores conectados. Null para el nivel más bajo. */
  ratioControl: number | null
}

export interface OrgSpanIntelligence {
  org: OrgSpanSummary
  managers: SpanManagerProfile[]
  /** Rollups laterales para el modal "Distribución completa". Se calculan
   *  in-memory desde managers + enriched, sin queries adicionales. */
  byGerencia: GerenciaRollup[]
  byArquetipo: ArquetipoRollup[]
  piramide: PiramideNivel[]
}

// ════════════════════════════════════════════════════════════════════════════
// UMBRALES DE SPAN POR arquetipo McKinsey (§16.2.1 del spec)
// ════════════════════════════════════════════════════════════════════════════

/** Rango óptimo de span por standardJobLevel — 7 niveles granulares. */
export const SPAN_OPTIMO: Record<string, RangoOptimo> = {
  gerente_director:       { min: 3,  max: 6,  arquetipo: 'Player/Coach' },
  subgerente_subdirector: { min: 4,  max: 8,  arquetipo: 'Coach' },
  jefe:                   { min: 5,  max: 10, arquetipo: 'Supervisor' },
  supervisor_coordinador: { min: 8,  max: 14, arquetipo: 'Facilitator' },
  profesional_analista:   { min: 8,  max: 12, arquetipo: 'Supervisor' },
  asistente_otros:        { min: 10, max: 18, arquetipo: 'Coordinator' },
  operativo_auxiliar:     { min: 12, max: 20, arquetipo: 'Coordinator' },
}

/** Fallback si standardJobLevel es null (improbable — 100% cobertura demo). */
export const SPAN_FALLBACK: RangoOptimo = {
  min: 5,
  max: 10,
  arquetipo: 'Supervisor',
}

/** Threshold técnico — span ≤ 2 = MICRO (regla 1 del spec §7). */
export const SPAN_MICRO_THRESHOLD = 2

/** Thresholds de densidad gerencial (§3.2 del spec). */
export const DENSIDAD_TOP_HEAVY = 0.2
export const DENSIDAD_PESADA_MIN = 0.15
export const DENSIDAD_PLANA_MAX = 0.08
