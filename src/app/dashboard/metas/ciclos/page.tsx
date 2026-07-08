// src/app/dashboard/metas/ciclos/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Ciclos de Metas — lista read-only de los GoalCycle de la cuenta. Gate D.2.
//
// Superficie de gestión del producto Metas (NO /dashboard/admin — decisión
// Victor, Decisión #2 corregida en SPEC_GOALCYCLE_v4). Sin mutaciones acá:
// crear/activar/cerrar llegan en D.3/D.4/D.5-UI.
//
// GUARD DE PÁGINA obligatorio: middleware.ts permite a EVALUATOR todo
// startsWith('/dashboard/metas') — el middleware NO frena esta ruta. La página
// gatea con GOAL_CYCLE_MANAGER_ROLES (decoración UI); la seguridad real vive
// en la API: GET /api/goals/cycles exige hasPermission('goals:cycles:manage').
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  AlertTriangle,
  CalendarRange,
  Lock,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { canManageGoalCycles } from '@/lib/constants/goalCycleRoles'
import { SecondaryButton, GhostButton, PrimaryButton } from '@/components/ui/PremiumButton'
import CreateCycleModal from '@/components/goals/cycles/CreateCycleModal'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

type GoalCycleStatus = 'PLANNING' | 'ASSIGNING' | 'ACTIVE' | 'CLOSING' | 'CLOSED'
type GoalPeriodType = 'ANNUAL' | 'QUARTERLY' | 'SEMESTER'

interface GoalCycleRow {
  id: string
  name: string
  periodType: GoalPeriodType
  year: number
  quarter: number
  semester: number
  status: GoalCycleStatus
  assignmentWindow: string
  trackingWindow: string
  closureWindow: string
  closedAt: string | null
}

interface CyclesResponse {
  success: boolean
  data: GoalCycleRow[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

// ════════════════════════════════════════════════════════════════════════════
// PRESENTACIÓN — labels y badges por estado (color protagonista en el badge,
// chrome de card uniforme: sin bordes/fondos semánticos por fila)
// ════════════════════════════════════════════════════════════════════════════

const STATUS_META: Record<GoalCycleStatus, { label: string; badgeClass: string }> = {
  PLANNING: { label: 'Planificación', badgeClass: 'fhr-badge-draft' },
  ASSIGNING: { label: 'Asignación', badgeClass: 'fhr-badge-purple' },
  ACTIVE: { label: 'Activo', badgeClass: 'fhr-badge-cyan' },
  CLOSING: { label: 'En cierre', badgeClass: 'fhr-badge-warning' },
  CLOSED: { label: 'Cerrado', badgeClass: 'fhr-badge-default' },
}

function periodLabel(cycle: GoalCycleRow): string {
  if (cycle.periodType === 'QUARTERLY') return `Q${cycle.quarter} · ${cycle.year}`
  if (cycle.periodType === 'SEMESTER') return `S${cycle.semester} · ${cycle.year}`
  return `Anual · ${cycle.year}`
}

function formatWindow(iso: string): string {
  return format(new Date(iso), 'dd MMM yyyy', { locale: es })
}

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('focalizahr_token')
    : null

  const res = await fetch(url, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`Error ${res.status}`)
  }

  return res.json()
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE: fila/card de ciclo (flex-col en 320px, fila en md:)
// ════════════════════════════════════════════════════════════════════════════

function CycleRow({ cycle }: { cycle: GoalCycleRow }) {
  const meta = STATUS_META[cycle.status]

  return (
    <div className="px-4 py-5 md:px-6 flex flex-col md:flex-row md:items-center gap-4">
      {/* Identidad del ciclo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-base font-light text-white truncate">{cycle.name}</p>
          <span className={`fhr-badge ${meta.badgeClass} text-xs`}>{meta.label}</span>
        </div>
        <p className="text-sm font-light text-slate-500 mt-1">
          {periodLabel(cycle)}
          {cycle.status === 'CLOSED' && cycle.closedAt && (
            <span className="ml-2 text-slate-600">
              · cerrado el {formatWindow(cycle.closedAt)}
            </span>
          )}
        </p>
      </div>

      {/* Ventanas del ciclo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-6 text-sm font-light">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Asignación</p>
          <p className="text-slate-300 tabular-nums">{formatWindow(cycle.assignmentWindow)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Seguimiento</p>
          <p className="text-slate-300 tabular-nums">{formatWindow(cycle.trackingWindow)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Cierre</p>
          <p className="text-slate-300 tabular-nums">{formatWindow(cycle.closureWindow)}</p>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PÁGINA
// ════════════════════════════════════════════════════════════════════════════

export default function CiclosMetasPage() {
  const router = useRouter()

  // Guard de rol: null = verificando (evita flash), luego boolean
  const [canManage, setCanManage] = useState<boolean | null>(null)

  // Modal de creación (Gate D.3) — solo se abre desde la ruta canManage===true
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    // Sub-usuarios (tabla users) traen userRole en el token; cuentas legacy
    // traen role. Mismo fallback que /dashboard/metas/page.tsx:19.
    const user = getCurrentUser() as ({ userRole?: string; role?: string } | null)
    setCanManage(canManageGoalCycles(user?.userRole ?? user?.role))
  }, [])

  const { data, error, isLoading, mutate } = useSWR<CyclesResponse>(
    canManage ? '/api/goals/cycles?limit=50' : null,
    fetcher
  )

  const cycles = data?.data ?? []

  // ── Sin acceso (EVALUATOR/CEO/etc. llegan por prefijo /dashboard/metas) ──
  if (canManage === false) {
    return (
      <div className="fhr-bg-main min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
          <div className="fhr-card text-center py-16 px-4">
            <Lock className="w-8 h-8 text-slate-500 mx-auto mb-4" />
            <h3 className="fhr-title-card text-slate-300 mb-2">Sección de gestión de ciclos</h3>
            <p className="fhr-text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              La administración de ciclos de metas está reservada a los roles que
              gestionan el período. Tus metas y su ciclo vigente viven en Metas.
            </p>
            <SecondaryButton icon={ArrowLeft} onClick={() => router.push('/dashboard')}>
              Volver al Dashboard
            </SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fhr-bg-main min-h-screen">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver al Dashboard</span>
          </button>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                <CalendarRange className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="fhr-hero-title text-2xl md:text-3xl">
                  Ciclos de{' '}
                  <span className="fhr-title-gradient">Metas</span>
                </h1>
                <p className="text-slate-400 text-sm">
                  Los períodos que ordenan las metas de la organización
                </p>
              </div>
            </div>

            {/* CTA crear — solo con permiso confirmado (evita flash en null) */}
            {canManage === true && (
              <PrimaryButton icon={Plus} onClick={() => setShowCreate(true)}>
                Crear ciclo
              </PrimaryButton>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="fhr-divider mb-8" />

        {/* ── Contenido ── */}
        {canManage === null || isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="fhr-skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="fhr-card text-center py-12">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-4" />
            <p className="fhr-text text-slate-300 mb-4">
              No pudimos cargar los ciclos de metas.
            </p>
            <GhostButton icon={RefreshCw} onClick={() => mutate()}>
              Reintentar
            </GhostButton>
          </div>
        ) : cycles.length === 0 ? (
          <div className="fhr-card text-center py-16 px-4">
            <CalendarRange className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="fhr-title-card text-slate-300 mb-2">
              Aún no hay ciclos de metas
            </h3>
            <p className="fhr-text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Creá el primer ciclo para ordenar las metas de la organización por
              período, con sus ventanas y su estado.
            </p>
            <div className="flex justify-center">
              <PrimaryButton icon={Plus} onClick={() => setShowCreate(true)}>
                Crear primer ciclo
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="fhr-card relative overflow-hidden p-0">
            {/* Línea Tesla */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: 'linear-gradient(90deg, transparent, #22D3EE, #A78BFA, transparent)',
                opacity: 0.7,
              }}
            />
            <div className="divide-y divide-slate-800/40">
              {cycles.map(cycle => (
                <CycleRow key={cycle.id} cycle={cycle} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de creación (Gate D.3) */}
      <CreateCycleModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => mutate()}
      />
    </div>
  )
}
