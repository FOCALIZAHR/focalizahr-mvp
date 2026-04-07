'use client'

import { useState, useEffect, useCallback } from 'react'
import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import { useSidebar } from '@/hooks/useSidebar'
import DescriptoresPortada from '@/components/descriptores/DescriptoresPortada'
import DescriptoresRanking from '@/components/descriptores/DescriptoresRanking'
import type { PositionWithStatus, DescriptorSummary } from '@/lib/services/JobDescriptorService'

type View = 'portada' | 'ranking'

export default function DescriptoresPage() {
  const { isCollapsed } = useSidebar()
  const [view, setView] = useState<View>('portada')
  const [positions, setPositions] = useState<PositionWithStatus[]>([])
  const [summary, setSummary] = useState<DescriptorSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/descriptors')
      if (!res.ok) throw new Error('Error al cargar')
      const json = await res.json()
      if (json.success) {
        setPositions(json.data.positions)
        setSummary(json.data.summary)
      }
    } catch (e) {
      console.error('[Descriptores] fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <>
      <DashboardNavigation />
      <main className={`min-h-screen fhr-bg-main transition-all duration-300 ${
        isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
      }`}>
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 mx-auto border-2 border-slate-800 border-t-cyan-400 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Cargando descriptores...</p>
              </div>
            </div>
          ) : view === 'portada' && summary ? (
            <DescriptoresPortada
              summary={summary}
              onStart={() => setView('ranking')}
              onRefresh={fetchData}
            />
          ) : (
            <DescriptoresRanking
              positions={positions}
              summary={summary}
              onHome={() => setView('portada')}
              onRefresh={fetchData}
            />
          )}
        </div>
      </main>
    </>
  )
}
