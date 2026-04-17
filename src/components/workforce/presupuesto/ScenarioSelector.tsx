'use client'

import { useEffect, useState } from 'react'
import { FolderOpen, Plus, Loader2, Clock } from 'lucide-react'

interface ScenarioSummary {
  id: string
  name: string
  year: number
  status: string
  createdBy: string
  headcountAlGuardar: number
  createdAt: string
  updatedAt: string
}

interface ScenarioSelectorProps {
  onNew: () => void
  onLoad: (id: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

export default function ScenarioSelector({ onNew, onLoad }: ScenarioSelectorProps) {
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch('/api/workforce/presupuesto/scenarios', { credentials: 'include' })
        const json = await res.json()
        if (active && json.success) setScenarios(json.data)
      } catch { /* silent */ }
      if (active) setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  if (loading) {
    return (
      <div className="py-10 flex flex-col items-center gap-3">
        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        <p className="text-xs text-slate-500 font-light">Cargando escenarios...</p>
      </div>
    )
  }

  if (scenarios.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
          Escenarios guardados
        </p>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-light transition-colors"
        >
          <Plus className="w-3 h-3" />
          Nuevo escenario
        </button>
      </div>

      <div className="space-y-2">
        {scenarios.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => onLoad(s.id)}
            className="w-full text-left px-4 py-3 rounded-xl bg-slate-900/40 border border-slate-700/40 hover:border-cyan-500/30 transition-colors group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FolderOpen className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-200 font-light truncate">{s.name}</p>
                  <p className="text-[11px] text-slate-500 font-light">
                    {s.headcountAlGuardar} personas · {s.year}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-light flex-shrink-0">
                <Clock className="w-3 h-3" />
                {timeAgo(s.updatedAt)}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
