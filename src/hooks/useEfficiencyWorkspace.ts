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
import {
  LENTES_META,
  type LenteId,
  type FamiliaId,
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

/**
 * Lentes agrupados por familia en orden canónico — usado para prev/next
 * navegación dentro de una familia (el CEO puede avanzar linealmente por
 * los lentes de la familia seleccionada).
 */
export const LENTES_POR_FAMILIA: Record<FamiliaId, LenteId[]> = {
  choque_tecnologico: ['l1_inercia', 'l2_zombie'],
  grasa_organizacional: ['l4_fantasma', 'l5_brecha'],
  riesgo_financiero: ['l7_fuga', 'l9_pasivo'],
}

const FAMILIA_ORDEN: FamiliaId[] = [
  'choque_tecnologico',
  'grasa_organizacional',
  'riesgo_financiero',
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
  /** null = estado lobby (shock global). LenteId = lente activo en portada */
  activeLenteId: LenteId | null
  /**
   * Familia activa — state INDEPENDIENTE de activeLenteId.
   *   · null + null → lobby (shock global)
   *   · FamiliaId + null → briefing (Nivel 2)
   *   · FamiliaId + LenteId → lente activo (Nivel 3)
   */
  activeFamiliaId: FamiliaId | null
  /** Vista actual del hub — derivada de activeFamiliaId + activeLenteId */
  hubView: 'lobby' | 'briefing' | 'lente'
  setActiveLenteId: (id: LenteId) => void
  /** Selecciona una familia → pasa a briefing de esa familia */
  selectFamilia: (familia: FamiliaId) => void
  /** Selecciona un lente específico desde el briefing */
  selectLente: (id: LenteId) => void
  /** Vuelve del lente al briefing de su familia (mantiene activeFamiliaId) */
  returnToBriefing: () => void
  /** Vuelve al lobby (borra activeFamiliaId + activeLenteId; shock global) */
  returnToLobby: () => void
  /** Avanza al siguiente lente dentro de la familia activa (cíclico) */
  nextLenteInFamilia: () => void
  /** Retrocede al anterior lente dentro de la familia activa (cíclico) */
  prevLenteInFamilia: () => void
  /** Índice del lente activo dentro de su familia (0-based); null si lobby */
  lenteIndexInFamilia: number | null
  /** Cantidad de lentes en la familia activa; null si lobby */
  lentesCountInFamilia: number | null
  lentesVisitados: Set<LenteId>
  familiasVisitadas: Set<FamiliaId>
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
  /**
   * Shock Global: L1.totalMonthly + L5.total (ambos flujo mensual CLP).
   * El número protagonista del estado lobby.
   */
  shockGlobalMonthly: number
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
  // activeFamiliaId + activeLenteId combinan 3 vistas:
  //   null + null           → lobby (shock global)
  //   FamiliaId + null      → briefing (Nivel 2)
  //   FamiliaId + LenteId   → lente (Nivel 3)
  const [activeFamiliaId, setActiveFamiliaIdState] = useState<FamiliaId | null>(null)
  const [activeLenteId, setActiveLenteIdState] = useState<LenteId | null>(null)
  const [lentesVisitados, setLentesVisitados] = useState<Set<LenteId>>(new Set())
  const [familiasVisitadas, setFamiliasVisitadas] = useState<Set<FamiliaId>>(
    new Set()
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
  const markFamiliaVisitada = useCallback((fam: FamiliaId) => {
    setFamiliasVisitadas(prev => {
      if (prev.has(fam)) return prev
      const next = new Set(prev)
      next.add(fam)
      return next
    })
  }, [])

  const setActiveLenteId = useCallback(
    (id: LenteId) => {
      const fam = LENTES_META[id]?.familia
      setActiveFamiliaIdState(fam ?? null)
      setActiveLenteIdState(id)
      setLentesVisitados(prev => {
        if (prev.has(id)) return prev
        const next = new Set(prev)
        next.add(id)
        return next
      })
      if (fam) markFamiliaVisitada(fam)
    },
    [markFamiliaVisitada]
  )

  /**
   * Selecciona una familia → entra al briefing (Nivel 2).
   * NO selecciona lente automáticamente — el CEO decide desde el briefing.
   */
  const selectFamilia = useCallback(
    (familia: FamiliaId) => {
      setActiveFamiliaIdState(familia)
      setActiveLenteIdState(null)
      markFamiliaVisitada(familia)
    },
    [markFamiliaVisitada]
  )

  /** Alias de setActiveLenteId con semántica de "elegir lente desde briefing". */
  const selectLente = setActiveLenteId

  /** Vuelve del lente al briefing (preserva activeFamiliaId). */
  const returnToBriefing = useCallback(() => {
    setActiveLenteIdState(null)
  }, [])

  /** Vuelve al lobby — borra familia y lente. */
  const returnToLobby = useCallback(() => {
    setActiveFamiliaIdState(null)
    setActiveLenteIdState(null)
  }, [])

  const nextLenteInFamilia = useCallback(() => {
    setActiveLenteIdState(current => {
      if (!current) return current
      const fam = LENTES_META[current]?.familia
      if (!fam) return current
      const lentesFam = LENTES_POR_FAMILIA[fam] ?? []
      const idx = lentesFam.indexOf(current)
      if (idx < 0 || lentesFam.length < 2) return current
      return lentesFam[(idx + 1) % lentesFam.length]
    })
  }, [])

  const prevLenteInFamilia = useCallback(() => {
    setActiveLenteIdState(current => {
      if (!current) return current
      const fam = LENTES_META[current]?.familia
      if (!fam) return current
      const lentesFam = LENTES_POR_FAMILIA[fam] ?? []
      const idx = lentesFam.indexOf(current)
      if (idx < 0 || lentesFam.length < 2) return current
      return lentesFam[(idx - 1 + lentesFam.length) % lentesFam.length]
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

  const decisionesDelLenteActivo = useMemo(() => {
    if (!activeLenteId) return []
    return [...carrito.values()].filter(d => {
      // L7L8 se registra bajo l7_fuga en el rail; incluir ambos IDs en el filtro
      if (activeLenteId === 'l7_fuga') {
        return d.lenteId === 'l7_fuga' || d.lenteId === 'l8_retencion'
      }
      return d.lenteId === activeLenteId
    })
  }, [carrito, activeLenteId])

  const resumenCarrito = useMemo(
    () => calcularResumenCarrito([...carrito.values()]),
    [carrito]
  )

  // ── Derivados de navegación dentro de familia ────────────────
  const hubView: 'lobby' | 'briefing' | 'lente' = activeLenteId
    ? 'lente'
    : activeFamiliaId
      ? 'briefing'
      : 'lobby'

  const lenteIndexInFamilia = useMemo(() => {
    if (!activeLenteId || !activeFamiliaId) return null
    const lentes = LENTES_POR_FAMILIA[activeFamiliaId] ?? []
    const idx = lentes.indexOf(activeLenteId)
    return idx >= 0 ? idx : null
  }, [activeLenteId, activeFamiliaId])

  const lentesCountInFamilia = activeFamiliaId
    ? LENTES_POR_FAMILIA[activeFamiliaId]?.length ?? null
    : null

  // ── Shock Global — L1.totalMonthly + L5.total (mensual puro) ──
  const shockGlobalMonthly = useMemo(() => {
    if (!data) return 0
    const l1Detalle = data.lentes.l1_inercia?.detalle as
      | { totalMonthly?: number }
      | null
    const l5Detalle = data.lentes.l5_brecha?.detalle as
      | { total?: number }
      | null
    const l1 = l1Detalle?.totalMonthly ?? 0
    const l5 = l5Detalle?.total ?? 0
    return l1 + l5
  }, [data])

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
    activeFamiliaId,
    hubView,
    setActiveLenteId,
    selectFamilia,
    selectLente,
    returnToBriefing,
    returnToLobby,
    nextLenteInFamilia,
    prevLenteInFamilia,
    lenteIndexInFamilia,
    lentesCountInFamilia,
    lentesVisitados,
    familiasVisitadas,
    lentesDisponibles: LENTES_DISPONIBLES,
    carrito,
    upsertDecision,
    removeDecision,
    clearLente,
    clearCarrito,
    decisionesDelLenteActivo,
    resumenCarrito,
    shockGlobalMonthly,
  }
}
