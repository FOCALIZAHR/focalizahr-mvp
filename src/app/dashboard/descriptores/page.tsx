'use client'

import { useState, useEffect, useCallback } from 'react'
import DescriptoresPortada from '@/components/descriptores/DescriptoresPortada'
import type { PositionWithStatus, DescriptorSummary } from '@/lib/services/JobDescriptorService'

export default function DescriptoresPage() {
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

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0F172A] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-2 border-slate-800 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Cargando descriptores...</p>
        </div>
      </div>
    )
  }

  if (!summary) return null

  return (
    <DescriptoresPortada
      summary={summary}
      positions={positions}
      onRefresh={fetchData}
    />
  )
}
