// ════════════════════════════════════════════════════════════════════════════
// MIS PLANES — Dropdown para listar/elegir/archivar planes del account
// src/components/efficiency/MisPlanesBtn.tsx
// ════════════════════════════════════════════════════════════════════════════
// Botón "Mis planes" en el Hub header que abre un popover con:
//   · Lista de planes del account (GET /api/efficiency/plans)
//   · Por plan: nombre, updatedAt, resumen (N decisiones, ahorro/mes)
//   · Acciones: Abrir · Archivar (DELETE soft)
//   · CTA para crear plan nuevo si no hay ninguno
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  ChevronDown,
  Archive,
  Plus,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { formatCLP } from '@/lib/services/efficiency/EfficiencyNarrativeEngine'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface PlanListItem {
  id: string
  nombre: string
  estado: string
  tesisElegida: string
  lentesActivos: string[]
  resumenSnap: {
    decisiones?: number
    fteLiberados?: number
    ahorroMensual?: number
    paybackMeses?: number | null
  } | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export function MisPlanesBtn() {
  const [open, setOpen] = useState(false)
  const [planes, setPlanes] = useState<PlanListItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const fetchPlanes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/efficiency/plans?estado=borrador', {
        credentials: 'include',
      })
      const json = (await res.json()) as {
        success: boolean
        data?: PlanListItem[]
        error?: string
      }
      if (!json.success) throw new Error(json.error ?? 'Error')
      setPlanes(json.data ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch al abrir el dropdown
  useEffect(() => {
    if (open && planes === null) fetchPlanes()
  }, [open, planes, fetchPlanes])

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const handleArchivar = useCallback(
    async (id: string) => {
      if (
        typeof window !== 'undefined' &&
        !window.confirm(
          '¿Archivar este plan? Queda guardado pero ya no aparece en la lista activa.'
        )
      ) {
        return
      }
      setArchivingId(id)
      try {
        const res = await fetch(`/api/efficiency/plans/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `HTTP ${res.status}`)
        }
        // Quitar de la lista localmente
        setPlanes(prev => (prev ?? []).filter(p => p.id !== id))
      } catch (e) {
        if (typeof window !== 'undefined') {
          window.alert(e instanceof Error ? e.message : 'Error al archivar')
        }
      } finally {
        setArchivingId(null)
      }
    },
    []
  )

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        Mis planes
        <ChevronDown
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] rounded-xl bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl z-50"
          style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
        >
          {/* Tesla line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
            style={{
              background:
                'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
            }}
            aria-hidden
          />

          <div className="p-4">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                Planes de eficiencia
              </p>
              {planes && (
                <p className="text-[10px] text-slate-500 font-light">
                  {planes.length} {planes.length === 1 ? 'activo' : 'activos'}
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-6 justify-center">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-xs text-slate-400 font-light">
                  Cargando…
                </span>
              </div>
            ) : error ? (
              <div className="py-4 text-center">
                <p className="text-xs text-red-300 font-light">{error}</p>
              </div>
            ) : planes && planes.length > 0 ? (
              <>
                <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {planes.map(p => (
                    <PlanRow
                      key={p.id}
                      plan={p}
                      archiving={archivingId === p.id}
                      onArchivar={() => handleArchivar(p.id)}
                      onOpen={() => setOpen(false)}
                    />
                  ))}
                </div>

                <div className="border-t border-slate-800/60 pt-3 mt-3">
                  <Link
                    href="/dashboard/efficiency/plan/nuevo"
                    onClick={() => setOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 text-xs font-medium px-4 py-2 rounded-md border border-cyan-400/50 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 text-cyan-200 hover:text-white hover:border-cyan-300 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear plan nuevo
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-6 text-center">
                <FileText className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-light mb-3">
                  Aún no tenés planes guardados.
                </p>
                <Link
                  href="/dashboard/efficiency/plan/nuevo"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-md border border-cyan-400/50 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 text-cyan-200 hover:text-white hover:border-cyan-300 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear el primero
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PLAN ROW
// ════════════════════════════════════════════════════════════════════════════

function PlanRow({
  plan,
  archiving,
  onArchivar,
  onOpen,
}: {
  plan: PlanListItem
  archiving: boolean
  onArchivar: () => void
  onOpen: () => void
}) {
  const snap = plan.resumenSnap ?? {}
  const decisiones = snap.decisiones ?? 0
  const ahorro = snap.ahorroMensual ?? 0
  const fechaUpdate = new Date(plan.updatedAt).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div className="p-3 rounded-md bg-slate-900/60 border border-slate-800/60 hover:border-slate-700 transition-colors group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate" title={plan.nombre}>
            {plan.nombre}
          </p>
          <p className="text-[10px] text-slate-500 font-light mt-0.5">
            {fechaUpdate} · {plan.tesisElegida}
          </p>
        </div>
        {plan.estado === 'aprobado' && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        )}
      </div>

      {decisiones > 0 && (
        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-light mb-2">
          <span>
            {decisiones} {decisiones === 1 ? 'decisión' : 'decisiones'}
          </span>
          {ahorro > 0 && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-emerald-300">{formatCLP(ahorro)}/mes</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/dashboard/efficiency/plan/${plan.id}`}
          onClick={onOpen}
          className="text-[11px] font-medium text-cyan-300 hover:text-white transition-colors"
        >
          Abrir →
        </Link>
        <button
          onClick={onArchivar}
          disabled={archiving}
          className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-amber-300 transition-colors disabled:opacity-50"
        >
          {archiving ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Archive className="w-3 h-3" />
          )}
          Archivar
        </button>
      </div>
    </div>
  )
}
