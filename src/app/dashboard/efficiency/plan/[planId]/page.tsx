// ════════════════════════════════════════════════════════════════════════════
// PLAN DOCUMENTO — Ruta dinámica /dashboard/efficiency/plan/[planId]
// src/app/dashboard/efficiency/plan/[planId]/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Sesión 4 — persistencia server + export PDF:
//  · planId === 'nuevo'  → lee carrito de sessionStorage;
//                          "Guardar borrador" hace POST /api/efficiency/plans
//                          y redirige a /plan/<realId>
//  · planId real (cuid)  → fetch GET /api/efficiency/plans/[planId];
//                          autosave PUT con debounce 1.5s
//  · "Generar Business Case" → GET /api/efficiency/plans/[planId]/export (PDF)
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  PlanDocument,
  type Tesis,
} from '@/components/efficiency/plan/PlanDocument'
import { CarritoBar } from '@/components/efficiency/carrito/CarritoBar'
import {
  calcularResumenCarrito,
  decisionKey,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import { leerCarritoPersistido } from '@/hooks/useEfficiencyWorkspace'
import type { LenteId } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// PERSISTENCIA LOCAL — sessionStorage solo para planId='nuevo'
// ════════════════════════════════════════════════════════════════════════════

const PLAN_DRAFT_KEY = 'efficiency_plan_draft_v1'

interface PlanDraft {
  decisiones: DecisionItem[]
  narrativasEditadas: Record<string, string>
  narrativaEjecutivaEditada: string | null
  tesis: Tesis
  planNombre: string
}

function loadDraft(): PlanDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(PLAN_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PlanDraft
  } catch {
    return null
  }
}

function saveDraft(draft: PlanDraft) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(PLAN_DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // quota exceeded — ignorar
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(PLAN_DRAFT_KEY)
  } catch {
    // ignorar
  }
}

// ════════════════════════════════════════════════════════════════════════════
// API SHAPE
// ════════════════════════════════════════════════════════════════════════════

interface PlanAPIResponse {
  id: string
  accountId: string
  nombre: string
  estado: string
  tesisElegida: string
  lentesActivos: string[]
  decisiones: DecisionItem[]
  narrativasEdit: Record<string, string>
  narrativaEjecEdit: string | null
  resumenSnap: unknown
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function PlanDocumentoPage() {
  const params = useParams()
  const router = useRouter()
  const planId = (params?.planId as string) ?? 'nuevo'
  const esPlanNuevo = planId === 'nuevo'

  // ── Estado del plan ────────────────────────────────────────────
  const [hydrated, setHydrated] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [decisiones, setDecisiones] = useState<DecisionItem[]>([])
  const [narrativasEditadas, setNarrativasEditadas] = useState<Record<string, string>>({})
  const [narrativaEjecutivaEditada, setNarrativaEjecutivaEditada] = useState<
    string | null
  >(null)
  const [tesis, setTesis] = useState<Tesis>('eficiencia')
  const [planNombre, setPlanNombre] = useState('Plan sin nombre')

  // ── Hidratación inicial ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      if (esPlanNuevo) {
        // Plan nuevo: leer sessionStorage draft o inicializar desde carrito
        const draft = loadDraft()
        if (draft && draft.decisiones.length > 0) {
          setDecisiones(draft.decisiones)
          setNarrativasEditadas(draft.narrativasEditadas ?? {})
          setNarrativaEjecutivaEditada(draft.narrativaEjecutivaEditada ?? null)
          setTesis(draft.tesis ?? 'eficiencia')
          setPlanNombre(draft.planNombre ?? 'Plan sin nombre')
        } else {
          const carrito = leerCarritoPersistido()
          setDecisiones(carrito)
        }
        setHydrated(true)
        return
      }

      // Plan existente: fetch desde server
      try {
        const res = await fetch(`/api/efficiency/plans/${planId}`, {
          credentials: 'include',
        })
        const json = (await res.json()) as {
          success: boolean
          data?: PlanAPIResponse
          error?: string
        }
        if (cancelled) return
        if (!json.success || !json.data) {
          setLoadError(json.error ?? 'No se pudo cargar el plan.')
          setHydrated(true)
          return
        }
        const p = json.data
        setDecisiones((p.decisiones ?? []) as DecisionItem[])
        setNarrativasEditadas(p.narrativasEdit ?? {})
        setNarrativaEjecutivaEditada(p.narrativaEjecEdit)
        setTesis((p.tesisElegida as Tesis) ?? 'eficiencia')
        setPlanNombre(p.nombre ?? 'Plan sin nombre')
        setHydrated(true)
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Error de red')
          setHydrated(true)
        }
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [planId, esPlanNuevo])

  // ── Persistencia local para planes nuevos (draft sessionStorage) ──
  useEffect(() => {
    if (!hydrated || !esPlanNuevo) return
    saveDraft({
      decisiones,
      narrativasEditadas,
      narrativaEjecutivaEditada,
      tesis,
      planNombre,
    })
  }, [
    hydrated,
    esPlanNuevo,
    decisiones,
    narrativasEditadas,
    narrativaEjecutivaEditada,
    tesis,
    planNombre,
  ])

  // ── Autosave server (debounce 1.5s) para planes existentes ────
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autosaveState, setAutosaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')

  useEffect(() => {
    if (!hydrated || esPlanNuevo) return
    setAutosaveState('saving')
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(async () => {
      try {
        const lentesActivos = Array.from(
          new Set(decisiones.map(d => d.lenteId as LenteId))
        )
        const resumenSnap = calcularResumenCarrito(decisiones)
        const res = await fetch(`/api/efficiency/plans/${planId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: planNombre,
            tesisElegida: tesis,
            lentesActivos,
            decisiones,
            narrativasEdit: narrativasEditadas,
            narrativaEjecEdit: narrativaEjecutivaEditada,
            resumenSnap,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        setAutosaveState('saved')
        setTimeout(
          () => setAutosaveState(prev => (prev === 'saved' ? 'idle' : prev)),
          1200
        )
      } catch {
        setAutosaveState('error')
      }
    }, 1500)
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hydrated,
    esPlanNuevo,
    decisiones,
    narrativasEditadas,
    narrativaEjecutivaEditada,
    tesis,
    planNombre,
  ])

  // ── Handlers ──────────────────────────────────────────────────
  const handleNarrativaChange = useCallback((key: string, texto: string) => {
    setNarrativasEditadas(prev => ({ ...prev, [key]: texto }))
  }, [])

  const handleNarrativaEjecutivaChange = useCallback((texto: string) => {
    setNarrativaEjecutivaEditada(texto)
  }, [])

  const handleApprove = useCallback((key: string) => {
    setDecisiones(prev =>
      prev.map(d => (decisionKey(d) === key ? { ...d, aprobado: true } : d))
    )
  }, [])

  const handleRevoke = useCallback((key: string) => {
    setDecisiones(prev =>
      prev.map(d => (decisionKey(d) === key ? { ...d, aprobado: false } : d))
    )
  }, [])

  const handleRemove = useCallback((key: string) => {
    setDecisiones(prev => prev.filter(d => decisionKey(d) !== key))
    setNarrativasEditadas(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const handleClearCarrito = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('¿Vaciar todo el plan? Esta acción no se puede deshacer.')
    ) {
      return
    }
    setDecisiones([])
    setNarrativasEditadas({})
    setNarrativaEjecutivaEditada(null)
  }, [])

  // ── Guardar borrador (POST para nuevos, PUT para existentes) ──
  const [guardando, setGuardando] = useState(false)
  const handleGuardarBorrador = useCallback(async () => {
    setGuardando(true)
    try {
      const lentesActivos = Array.from(
        new Set(decisiones.map(d => d.lenteId as LenteId))
      )
      const resumenSnap = calcularResumenCarrito(decisiones)

      if (esPlanNuevo) {
        // Crear
        const res = await fetch('/api/efficiency/plans', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: planNombre,
            tesisElegida: tesis,
            lentesActivos,
            decisiones,
            narrativasEdit: narrativasEditadas,
            narrativaEjecEdit: narrativaEjecutivaEditada,
            resumenSnap,
          }),
        })
        const json = (await res.json()) as {
          success: boolean
          data?: { id: string }
          error?: string
        }
        if (!json.success || !json.data) {
          throw new Error(json.error ?? 'Error al guardar')
        }
        clearDraft()
        router.replace(`/dashboard/efficiency/plan/${json.data.id}`)
      } else {
        // Existente: forzar un PUT inmediato (el autosave puede estar pendiente)
        await fetch(`/api/efficiency/plans/${planId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: planNombre,
            tesisElegida: tesis,
            lentesActivos,
            decisiones,
            narrativasEdit: narrativasEditadas,
            narrativaEjecEdit: narrativaEjecutivaEditada,
            resumenSnap,
          }),
        })
        setAutosaveState('saved')
        setTimeout(() => setAutosaveState('idle'), 1200)
      }
    } catch (e) {
      if (typeof window !== 'undefined') {
        window.alert(
          e instanceof Error ? e.message : 'Error al guardar el plan'
        )
      }
    } finally {
      setGuardando(false)
    }
  }, [
    esPlanNuevo,
    planId,
    planNombre,
    tesis,
    decisiones,
    narrativasEditadas,
    narrativaEjecutivaEditada,
    router,
  ])

  // ── Generar Business Case (PDF download) ──────────────────────
  const [exportando, setExportando] = useState(false)
  const handleGenerarBusinessCase = useCallback(async () => {
    if (esPlanNuevo) {
      if (typeof window !== 'undefined') {
        window.alert(
          'Guarda el plan primero — el Business Case se genera desde el plan persistido.'
        )
      }
      return
    }
    setExportando(true)
    try {
      const res = await fetch(
        `/api/efficiency/plans/${planId}/export`,
        { credentials: 'include' }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safe = planNombre
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40)
      a.download = `plan-eficiencia-${safe || planId.slice(0, 8)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      if (typeof window !== 'undefined') {
        window.alert(e instanceof Error ? e.message : 'Error al generar PDF')
      }
    } finally {
      setExportando(false)
    }
  }, [esPlanNuevo, planId, planNombre])

  // ── Render ────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-400 font-light">Cargando plan…</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center px-6">
        <div className="fhr-card p-8 max-w-md text-center">
          <h2 className="text-xl font-light text-white mb-2">
            No pudimos cargar el plan
          </h2>
          <p className="text-sm text-slate-400 font-light">{loadError}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <PlanDocument
        decisiones={decisiones}
        narrativasEditadas={narrativasEditadas}
        narrativaEjecutivaEditada={narrativaEjecutivaEditada}
        tesis={tesis}
        planNombre={planNombre}
        onNarrativaChange={handleNarrativaChange}
        onNarrativaEjecutivaChange={handleNarrativaEjecutivaChange}
        onApprove={handleApprove}
        onRevoke={handleRevoke}
        onRemove={handleRemove}
        onTesisChange={setTesis}
        onPlanNombreChange={setPlanNombre}
        onGuardarBorrador={handleGuardarBorrador}
        onGenerarBusinessCase={handleGenerarBusinessCase}
      />

      {/* Indicador autosave flotante (solo planes existentes) */}
      {!esPlanNuevo && autosaveState !== 'idle' && (
        <div
          className="fixed bottom-20 right-6 z-40 inline-flex items-center gap-2 text-xs font-light px-3 py-1.5 rounded-md border backdrop-blur-xl"
          style={{
            backgroundColor:
              autosaveState === 'error'
                ? 'rgba(239, 68, 68, 0.12)'
                : autosaveState === 'saved'
                ? 'rgba(16, 185, 129, 0.12)'
                : 'rgba(30, 41, 59, 0.85)',
            borderColor:
              autosaveState === 'error'
                ? 'rgba(239, 68, 68, 0.4)'
                : autosaveState === 'saved'
                ? 'rgba(16, 185, 129, 0.4)'
                : 'rgba(100, 116, 139, 0.4)',
            color:
              autosaveState === 'error'
                ? '#fca5a5'
                : autosaveState === 'saved'
                ? '#6ee7b7'
                : '#94a3b8',
          }}
        >
          {autosaveState === 'saving' && 'guardando…'}
          {autosaveState === 'saved' && '✓ guardado'}
          {autosaveState === 'error' && '⚠ error al guardar'}
        </div>
      )}

      {/* Indicador de export/guardado activo */}
      {(guardando || exportando) && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="fhr-card px-6 py-4">
            <p className="text-sm text-slate-200 font-light">
              {guardando ? 'Guardando plan…' : 'Generando Business Case…'}
            </p>
          </div>
        </div>
      )}

      {/* CarritoBar siempre visible — muestra totales del plan actual */}
      <CarritoBar decisiones={decisiones} onClear={handleClearCarrito} />
    </>
  )
}
