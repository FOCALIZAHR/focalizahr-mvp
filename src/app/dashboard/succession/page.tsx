'use client'

import { useState, useEffect, useCallback } from 'react'
import SuccessionOrchestrator from '@/components/succession/cinema/SuccessionOrchestrator'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface SuccessionDashboard {
  summary: {
    coverage: number
    coveredRoles: number
    totalRoles: number
    uncoveredRoles: Array<{
      role: string
      bestCandidate: { name: string; readiness: string; readinessLabel: string } | null
    }>
    bench: { readyNow: number; ready1to2Years: number; notReady: number }
    hasData: boolean
  }
  positions: {
    total: number
    byBenchStrength: Record<string, number>
  }
  cycleId: string
}

interface CriticalPosition {
  id: string
  positionTitle: string
  standardJobLevel: string
  benchStrength: string
  incumbentFlightRisk: string | null
  incumbentRetirementDate: string | null
  department: { displayName: string } | null
  incumbent: { id: string; fullName: string; position: string } | null
  candidates?: Array<{
    readinessLevel: string
    readinessOverride: string | null
    matchPercent: number
    employee: { fullName: string }
  }>
  _count: { candidates: number }
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SuccessionPage() {
  const [dashboard, setDashboard] = useState<SuccessionDashboard | null>(null)
  const [positions, setPositions] = useState<CriticalPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [canManage, setCanManage] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, posRes] = await Promise.all([
        fetch('/api/succession/dashboard'),
        fetch('/api/succession/critical-positions'),
      ])

      if (dashRes.ok) {
        const dashData = await dashRes.json()
        if (dashData.success) setDashboard(dashData.data)
      }

      if (posRes.ok) {
        const posData = await posRes.json()
        if (posData.success) {
          setPositions(posData.data)
          setCanManage(posData.permissions?.canManage || false)
        }
      }
    } catch (err) {
      console.error('[Succession] Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Cargando sucesion...</div>
      </div>
    )
  }

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 -mb-8" style={{ height: 'calc(100vh - 4rem)' }}>
      <SuccessionOrchestrator
        initialPositions={positions}
        dashboardStats={dashboard}
        canManage={canManage}
        onRefresh={fetchData}
      />
    </div>
  )
}
