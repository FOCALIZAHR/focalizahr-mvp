// ════════════════════════════════════════════════════════════════════════════
// NINE BOX PAGE - Dashboard Cinema FocalizaHR
// src/app/dashboard/performance/nine-box/page.tsx
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { RefreshCw, Users, Star, Target, AlertTriangle, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

import NineBoxGrid, { type Employee9Box, type GridCell } from '@/components/performance/NineBoxGrid'
import NineBoxDrawer from '@/components/performance/NineBoxDrawer'
import { NineBoxPosition } from '@/config/performanceClassification'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Cycle {
  id: string
  name: string
  status: string
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function NineBoxPage() {
  const searchParams = useSearchParams()
  const cycleIdFromUrl = searchParams.get('cycleId')

  const [cycles, setCycles] = useState<Cycle[]>([])
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(cycleIdFromUrl)
  const [gridData, setGridData] = useState<GridCell[]>([])
  const [totalInGrid, setTotalInGrid] = useState(0)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<NineBoxPosition | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<Employee9Box[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch cycles
  useEffect(() => {
    fetch('/api/admin/performance-cycles')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setCycles(json.data || [])
          // Si no hay cycleId en la URL, usar el primero completado
          if (!cycleIdFromUrl) {
            const completed = json.data?.find((c: Cycle) => c.status === 'COMPLETED')
            if (completed) setSelectedCycleId(completed.id)
          }
        }
      })
      .catch(err => console.error('Error fetching cycles:', err))
  }, [cycleIdFromUrl])

  // Fetch 9-box data
  const fetchData = useCallback(async () => {
    if (!selectedCycleId) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/performance-ratings/nine-box?cycleId=${selectedCycleId}`)
      const json = await res.json()
      if (json.success) {
        setGridData(json.data.grid)
        setTotalInGrid(json.data.totalInGrid)
      }
    } catch (err) {
      console.error('Error fetching 9-box data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [selectedCycleId])

  useEffect(() => { fetchData() }, [fetchData])

  // Handlers
  const handleCellSelect = (position: NineBoxPosition, employees: Employee9Box[]) => {
    setSelectedPosition(position)
    setSelectedEmployees(employees)
    setDrawerOpen(true)
  }

  // Stats
  const stars = gridData.find(g => g.position === NineBoxPosition.STAR)?.count || 0
  const core = gridData.find(g => g.position === NineBoxPosition.CORE_PLAYER)?.count || 0
  const attention = gridData.find(g => g.position === NineBoxPosition.UNDERPERFORMER)?.count || 0

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            {/* Botón Volver */}
            <Link
              href={selectedCycleId
                ? `/dashboard/performance/cycles/${selectedCycleId}/ratings`
                : '/dashboard/performance/cycles'
              }
              className="group p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>

            <div>
              <h1 className="text-2xl md:text-3xl font-light text-white">
                Matriz <span className="font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">9-Box</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">Mapeo de talento: Desempeno vs Potencial</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCycleId || ''}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              <option value="" disabled>Seleccionar ciclo</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </motion.div>

        {/* STATS - SECUNDARIAS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <StatCard icon={<Users />} label="En Matriz" value={totalInGrid} />
          <StatCard icon={<Star />} label="Estrellas" value={stars} color="emerald" />
          <StatCard icon={<Target />} label="Core" value={core} color="cyan" />
          <StatCard icon={<AlertTriangle />} label="Atencion" value={attention} color="red" />
        </motion.div>

        {/* PROTAGONISTA: GRID 9-BOX */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative p-6 md:p-8 rounded-[24px] bg-[#0F172A]/90 backdrop-blur-2xl border border-slate-800"
        >
          {/* Linea Tesla */}
          <div
            className="absolute top-0 left-0 right-0 h-[1px] z-10 rounded-t-[24px]"
            style={{
              background: 'linear-gradient(90deg, transparent, #22D3EE, transparent)',
              boxShadow: '0 0 15px #22D3EE'
            }}
          />

          {!selectedCycleId ? (
            <EmptyStateContainer
              icon={<Users />}
              message="Selecciona un ciclo de evaluacion"
            />
          ) : isLoading ? (
            <EmptyStateContainer
              icon={<RefreshCw className="animate-spin" />}
              message="Cargando matriz..."
            />
          ) : totalInGrid === 0 ? (
            <EmptyStateContainer
              icon={<Users />}
              title="Sin datos de potencial"
              message="Asigna ratings de potencial a los empleados para visualizar la matriz 9-Box"
            />
          ) : (
            <NineBoxGrid
              data={gridData}
              onCellSelect={handleCellSelect}
            />
          )}
        </motion.div>

        {/* DRAWER LATERAL - Cinema Focus */}
        <NineBoxDrawer
          isOpen={drawerOpen}
          position={selectedPosition}
          employees={selectedEmployees}
          onClose={() => setDrawerOpen(false)}
          onEmployeeSelect={(emp) => {
            console.log('Navegar a empleado:', emp)
            // TODO: router.push(`/dashboard/evaluaciones/${emp.employeeId}`)
          }}
        />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// STAT CARD (secundaria)
// ════════════════════════════════════════════════════════════════════════════

function StatCard({
  icon,
  label,
  value,
  color = 'slate'
}: {
  icon: React.ReactNode
  label: string
  value: number
  color?: string
}) {
  const colorMap: Record<string, string> = {
    slate: 'text-slate-400',
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    red: 'text-red-400'
  }

  return (
    <div className="p-4 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-700/30 hover:bg-slate-800/40 transition-colors">
      <div className="flex items-center gap-3">
        <span className={cn('w-5 h-5', colorMap[color])}>{icon}</span>
        <div>
          <div className={cn('text-xl font-semibold', colorMap[color])}>
            {value}
          </div>
          <div className="text-[11px] text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EMPTY STATE CONTAINER
// ════════════════════════════════════════════════════════════════════════════

function EmptyStateContainer({
  icon,
  title,
  message
}: {
  icon: React.ReactNode
  title?: string
  message: string
}) {
  return (
    <div className="py-16 text-center text-slate-500">
      <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
        <span className="w-8 h-8">{icon}</span>
      </div>
      {title && (
        <p className="font-medium text-slate-300 mb-2">{title}</p>
      )}
      <p className="text-sm">{message}</p>
    </div>
  )
}
