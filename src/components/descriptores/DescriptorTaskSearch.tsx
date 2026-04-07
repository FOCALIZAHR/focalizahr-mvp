'use client'

// ════════════════════════════════════════════════════════════════════════════
// DESCRIPTOR TASK SEARCH — Buscador "+ Agregar responsabilidades de otra área"
// Busca en OnetTask por texto, excluye SOC code actual.
// ════════════════════════════════════════════════════════════════════════════

import { memo, useState, useCallback } from 'react'
import { X, Plus, Search } from 'lucide-react'
import type { ProposedTask } from '@/lib/services/JobDescriptorService'

interface DescriptorTaskSearchProps {
  excludeSocCode?: string
  onAdd: (task: ProposedTask) => void
  onClose: () => void
  showClose?: boolean
}

interface SearchResult {
  taskId: string
  description: string
  socCode: string
  occupationTitle: string
  importance: number
  betaScore: number | null
  isAutomated: boolean
}

export default memo(function DescriptorTaskSearch({
  excludeSocCode,
  onAdd,
  onClose,
  showClose = true,
}: DescriptorTaskSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (q.length < 3) {
      setResults([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ query: q })
      if (excludeSocCode) params.set('excludeSocCode', excludeSocCode)

      const res = await fetch(`/api/descriptors/search-tasks?${params}`)
      if (res.ok) {
        const json = await res.json()
        setResults(json.data ?? [])
      }
    } catch {
      // Silencioso
    } finally {
      setLoading(false)
    }
  }, [excludeSocCode])

  return (
    <div className="fhr-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 font-light">Buscar tareas de otra área</p>
        {showClose && (
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Ej: reclutamiento, presupuesto, análisis..."
          className="w-full fhr-input bg-slate-900/60 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-300 font-light placeholder:text-slate-600 focus:border-cyan-500/30 focus:outline-none"
        />
      </div>

      {/* Resultados */}
      {loading && (
        <p className="text-xs text-slate-600 text-center py-2">Buscando...</p>
      )}

      {results.length > 0 && (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {results.map(r => (
            <div
              key={r.taskId}
              className="flex items-start gap-3 rounded-lg border border-slate-800/30 p-3 hover:border-slate-700/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-light text-slate-300 leading-relaxed">
                  {r.description}
                </p>
                <p className="text-[9px] text-slate-600 mt-1">
                  {r.occupationTitle}
                </p>
              </div>
              <button
                onClick={() =>
                  onAdd({
                    taskId: r.taskId,
                    description: r.description,
                    importance: r.importance,
                    betaScore: r.betaScore,
                    isAutomated: r.isAutomated,
                    isActive: true,
                    isFromOnet: true,
                  })
                }
                className="text-cyan-400/60 hover:text-cyan-300 transition-colors flex-shrink-0 mt-0.5"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {query.length >= 3 && results.length === 0 && !loading && (
        <p className="text-xs text-slate-600 text-center py-2">
          Sin resultados para &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  )
})
