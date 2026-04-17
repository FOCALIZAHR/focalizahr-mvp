// ════════════════════════════════════════════════════════════════════════════
// useEfficiencyWorkspace — Hook centralizado del Efficiency Intelligence Hub
// src/hooks/useEfficiencyWorkspace.ts
// ════════════════════════════════════════════════════════════════════════════
// Patrón canónico: hook central con state + callbacks + derivados memo-izados.
// Mismo patrón que useTACCinemaMode.ts — prop drilling desde el Orchestrator,
// no Context.
//
// Responsabilidades:
//  · Fetch /api/efficiency/diagnostic
//  · Flow: step 'guardarrail' → 'hub'
//  · Navegación entre lentes (activeLenteId + visitados)
//  · Gerencias excluidas por L3 (editable manualmente)
//  · Carrito Map con dedup canónico `${tipo}:${id}`
//  · Derivados: decisionesDelLenteActivo, resumenCarrito, lentesDisponibles
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  calcularResumenCarrito,
  decisionKey,
  type DecisionItem,
  type ResumenCarrito,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import type {
  LenteId,
  FamiliaId,
} from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS DE RESPUESTA DEL ENDPOINT
// ════════════════════════════════════════════════════════════════════════════

export interface LenteAPI {
  id: LenteId
  familia: FamiliaId
  titulo: string
  subtitulo: string
  hayData: boolean
  datos: Record<string, string>
  detalle: unknown
  usandoFallback?: boolean
  narrativa: string
}

export interface FamiliaAPI {
  id: FamiliaId
  titulo: string
  subtitulo: string
  lentes: LenteId[]
}

export interface DiagnosticData {
  familias: FamiliaAPI[]
  lentes: Record<LenteId, LenteAPI>
  meta: {
    totalEmployees: number
    enrichedCount: number
    confidence: 'high' | 'medium' | 'low'
    avgExposure: number
  }
}

interface DiagnosticResponse {
  success: boolean
  data?: DiagnosticData
  error?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ════════════════════════════════════════════════════════════════════════════

/** Threshold de clima crítico (escala 0-5) para guardarraíl L3 */
const CLIMA_CRITICO_THRESHOLD = 2.5

/**
 * Lentes disponibles en el rail (orden canónico).
 * L3 es guardarraíl pre-Hub, no está aquí.
 * L6 está congelado — omitido del rail (no se muestra "Próximamente").
 */
const LENTES_DISPONIBLES: LenteId[] = [
  'l1_inercia',
  'l2_zombie',
  'l4_fantasma',
  'l5_brecha',
  'l7_fuga',      // el componente L7L8MapaTalento se registra bajo l7_fuga
  'l9_pasivo',
]

// ════════════════════════════════════════════════════════════════════════════
// PERSISTENCIA — sessionStorage (Sesión 4 agregará persistencia real en BD)
// ════════════════════════════════════════════════════════════════════════════

const CARRITO_STORAGE_KEY = 'efficiency_carrito_v1'

/** Serializa el Map como array de tuplas para sessionStorage */
function serializeCarrito(carrito: Map<string, DecisionItem>): string {
  return JSON.stringify([...carrito.entries()])
}

/** Hidrata el Map desde sessionStorage (no-op en SSR) */
function hydrateCarrito(): Map<string, DecisionItem> {
  if (typeof window === 'undefined') return new Map()
  try {
    const raw = sessionStorage.getItem(CARRITO_STORAGE_KEY)
    if (!raw) return new Map()
    const entries = JSON.parse(raw) as Array<[string, DecisionItem]>
    return new Map(entries)
  } catch {
    return new Map()
  }
}

/** Lee el carrito desde sessionStorage (helper para consumo externo) */
export function leerCarritoPersistido(): DecisionItem[] {
  return [...hydrateCarrito().values()]
}

// ════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════

export interface UseEfficiencyWorkspaceReturn {
  // Data fetch
  loading: boolean
  error: string | null
  data: DiagnosticData | null

  // Flow
  step: 'guardarrail' | 'hub'
  acceptGuardarrail: () => void
  /** Alterna inclusión manual de una gerencia originalmente excluida */
  toggleGerenciaExclusion: (departmentId: string) => void
  gerenciasExcluidas: Set<string>
  gerenciasCriticasL3: Array<{
    departmentId: string
    departmentName: string
    climaScale5: number
    pctPotencial: number
    usandoFallback: boolean
  }>

  // Navegación lentes
  activeLenteId: LenteId
  setActiveLenteId: (id: LenteId) => void
  lentesVisitados: Set<LenteId>
  lentesDisponibles: LenteId[]

  // Carrito
  carrito: Map<string, DecisionItem>
  upsertDecision: (item: DecisionItem) => void
  removeDecision: (key: string) => void
  clearLente: (lenteId: LenteId) => void
  clearCarrito: () => void

  // Derivados
  decisionesDelLenteActivo: DecisionItem[]
  resumenCarrito: ResumenCarrito
}

export function useEfficiencyWorkspace(): UseEfficiencyWorkspaceReturn {
  // ── State: fetch ────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DiagnosticData | null>(null)

  // ── State: flow ─────────────────────────────────────────────────
  const [step, setStep] = useState<'guardarrail' | 'hub'>('guardarrail')
  const [gerenciasExcluidas, setGerenciasExcluidas] = useState<Set<string>>(
    new Set()
  )

  // ── State: navegación ──────────────────────────────────────────
  const [activeLenteId, setActiveLenteIdState] = useState<LenteId>('l1_inercia')
  const [lentesVisitados, setLentesVisitados] = useState<Set<LenteId>>(
    new Set(['l1_inercia'])
  )

  // ── State: carrito (hidratado desde sessionStorage si existe) ──
  const [carrito, setCarrito] = useState<Map<string, DecisionItem>>(() =>
    hydrateCarrito()
  )

  // Persiste el carrito en sessionStorage en cada cambio
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(CARRITO_STORAGE_KEY, serializeCarrito(carrito))
    } catch {
      // quota exceeded u otro — ignorar, no romper la sesión
    }
  }, [carrito])

  // ── Effect: fetch diagnostic al montar ─────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/efficiency/diagnostic', {
          credentials: 'include',
        })
        const json: DiagnosticResponse = await res.json()
        if (cancelled) return
        if (!json.success || !json.data) {
          setError(json.error ?? 'No se pudo cargar el diagnóstico.')
          return
        }
        setData(json.data)

        // Inicializar gerenciasExcluidas desde L3 crítico
        const l3 = json.data.lentes.l3_adopcion
        if (l3?.hayData) {
          const ranking =
            ((l3.detalle as Record<string, unknown>)?.ranking as Array<
              Record<string, unknown>
            >) ?? []
          const iniciales = new Set<string>()
          for (const g of ranking) {
            const climaScale5 = (g.climaScale5 as number) ?? 5
            const deptId = g.departmentId as string | null
            if (climaScale5 < CLIMA_CRITICO_THRESHOLD && deptId) {
              iniciales.add(deptId)
            }
          }
          if (iniciales.size > 0) {
            setGerenciasExcluidas(iniciales)
            setStep('guardarrail')
          } else {
            setStep('hub')
          }
        } else {
          setStep('hub')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error de red')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // ── Callbacks: flow ────────────────────────────────────────────
  const acceptGuardarrail = useCallback(() => setStep('hub'), [])

  const toggleGerenciaExclusion = useCallback((departmentId: string) => {
    setGerenciasExcluidas(prev => {
      const next = new Set(prev)
      if (next.has(departmentId)) next.delete(departmentId)
      else next.add(departmentId)
      return next
    })
  }, [])

  // ── Callbacks: navegación ──────────────────────────────────────
  const setActiveLenteId = useCallback((id: LenteId) => {
    setActiveLenteIdState(id)
    setLentesVisitados(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  // ── Callbacks: carrito ─────────────────────────────────────────
  const upsertDecision = useCallback((item: DecisionItem) => {
    setCarrito(prev => {
      const next = new Map(prev)
      next.set(decisionKey(item), item)
      return next
    })
  }, [])

  const removeDecision = useCallback((key: string) => {
    setCarrito(prev => {
      if (!prev.has(key)) return prev
      const next = new Map(prev)
      next.delete(key)
      return next
    })
  }, [])

  const clearLente = useCallback((lenteId: LenteId) => {
    setCarrito(prev => {
      const next = new Map(prev)
      for (const [key, item] of prev) {
        if (item.lenteId === lenteId) next.delete(key)
      }
      return next
    })
  }, [])

  const clearCarrito = useCallback(() => setCarrito(new Map()), [])

  // ── Derivados memoizados ──────────────────────────────────────
  const gerenciasCriticasL3 = useMemo(() => {
    if (!data?.lentes.l3_adopcion?.hayData) return []
    const ranking =
      ((data.lentes.l3_adopcion.detalle as Record<string, unknown>)
        ?.ranking as Array<Record<string, unknown>>) ?? []
    return ranking
      .filter(g => (g.climaScale5 as number) < CLIMA_CRITICO_THRESHOLD)
      .map(g => ({
        departmentId: (g.departmentId as string) ?? '',
        departmentName: (g.departmentName as string) ?? 'Sin nombre',
        climaScale5: (g.climaScale5 as number) ?? 0,
        pctPotencial: (g.pctPotencial as number) ?? 0,
        usandoFallback: (g.usandoFallback as boolean) ?? false,
      }))
  }, [data])

  const decisionesDelLenteActivo = useMemo(
    () =>
      [...carrito.values()].filter(d => {
        // L7L8 se registra bajo l7_fuga en el rail; incluir ambos IDs en el filtro
        if (activeLenteId === 'l7_fuga') {
          return d.lenteId === 'l7_fuga' || d.lenteId === 'l8_retencion'
        }
        return d.lenteId === activeLenteId
      }),
    [carrito, activeLenteId]
  )

  const resumenCarrito = useMemo(
    () => calcularResumenCarrito([...carrito.values()]),
    [carrito]
  )

  // ── Return ─────────────────────────────────────────────────────
  return {
    loading,
    error,
    data,
    step,
    acceptGuardarrail,
    toggleGerenciaExclusion,
    gerenciasExcluidas,
    gerenciasCriticasL3,
    activeLenteId,
    setActiveLenteId,
    lentesVisitados,
    lentesDisponibles: LENTES_DISPONIBLES,
    carrito,
    upsertDecision,
    removeDecision,
    clearLente,
    clearCarrito,
    decisionesDelLenteActivo,
    resumenCarrito,
  }
}
