// ════════════════════════════════════════════════════════════════════════════
// PLAN DOCUMENTO — Ruta dinámica /dashboard/efficiency/plan/[planId]
// src/app/dashboard/efficiency/plan/[planId]/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Sesión 3 — MVP sin persistencia server:
//  · planId === 'nuevo'  → lee carrito desde sessionStorage + plan draft local
//  · Otros planId         → Sesión 4 agregará fetch /api/efficiency/plans/[id]
//
// Estado local del plan (persistido en sessionStorage):
//  · decisiones (con aprobado flag)
//  · narrativasEditadas (por decisión)
//  · narrativaEjecutivaEditada (override global)
//  · tesis, planNombre
//
// El CarritoBar fixed bottom se renderiza acá también (TASK: "visible en
// HUB, en organigrama, en Plan Documento").
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  PlanDocument,
  type Tesis,
} from '@/components/efficiency/plan/PlanDocument'
import { CarritoBar } from '@/components/efficiency/carrito/CarritoBar'
import {
  decisionKey,
  type DecisionItem,
} from '@/lib/services/efficiency/EfficiencyCalculator'
import { leerCarritoPersistido } from '@/hooks/useEfficiencyWorkspace'

// ════════════════════════════════════════════════════════════════════════════
// PERSISTENCIA — sessionStorage del plan draft
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

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default function PlanDocumentoPage() {
  const params = useParams()
  const planId = (params?.planId as string) ?? 'nuevo'

  // Estado del plan — hidratado en useEffect (evita mismatch SSR)
  const [hydrated, setHydrated] = useState(false)
  const [decisiones, setDecisiones] = useState<DecisionItem[]>([])
  const [narrativasEditadas, setNarrativasEditadas] = useState<Record<string, string>>({})
  const [narrativaEjecutivaEditada, setNarrativaEjecutivaEditada] = useState<
    string | null
  >(null)
  const [tesis, setTesis] = useState<Tesis>('eficiencia')
  const [planNombre, setPlanNombre] = useState('Plan sin nombre')

  // ── Hidratación inicial ────────────────────────────────────────
  useEffect(() => {
    if (planId !== 'nuevo') {
      // Sesión 4: fetch /api/efficiency/plans/[planId]
      // Por ahora, mostrar fallback
      setHydrated(true)
      return
    }

    const draft = loadDraft()
    if (draft && draft.decisiones.length > 0) {
      setDecisiones(draft.decisiones)
      setNarrativasEditadas(draft.narrativasEditadas ?? {})
      setNarrativaEjecutivaEditada(draft.narrativaEjecutivaEditada ?? null)
      setTesis(draft.tesis ?? 'eficiencia')
      setPlanNombre(draft.planNombre ?? 'Plan sin nombre')
    } else {
      // Inicializar desde carrito del Hub
      const carrito = leerCarritoPersistido()
      setDecisiones(carrito)
    }
    setHydrated(true)
  }, [planId])

  // ── Persiste draft en cada cambio ──────────────────────────────
  useEffect(() => {
    if (!hydrated) return
    saveDraft({
      decisiones,
      narrativasEditadas,
      narrativaEjecutivaEditada,
      tesis,
      planNombre,
    })
  }, [
    hydrated,
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

  const handleGuardarBorrador = useCallback(() => {
    // El draft ya se guarda en cada cambio; esto solo da feedback
    if (typeof window !== 'undefined') {
      window.alert('Borrador guardado localmente. La persistencia en servidor se habilita con el módulo de planes (próxima entrega).')
    }
  }, [])

  const handleGenerarBusinessCase = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.alert('Export PDF del Business Case se habilita con el módulo de planes (próxima entrega).')
    }
  }, [])

  // ── Render ────────────────────────────────────────────────────
  if (!hydrated) {
    return (
      <div className="fhr-bg-main min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-400 font-light">Cargando plan…</p>
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

      {/* CarritoBar siempre visible — muestra totales del plan actual */}
      <CarritoBar decisiones={decisiones} onClear={handleClearCarrito} />
    </>
  )
}
