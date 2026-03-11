'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, AlertTriangle } from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface SearchedEmployee {
  id: string
  fullName: string
  position: string | null
  departmentName: string | null
  roleFitScore: number
  meetsThreshold: boolean
  alreadyNominated: boolean
}

interface EmployeeSearchInputProps {
  positionId?: string | null
  excludeEmployeeIds?: string[]
  onSelect: (employee: { id: string; fullName: string; roleFitScore: number; meetsThreshold: boolean }) => void
  onClear: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function EmployeeSearchInput({
  positionId,
  excludeEmployeeIds = [],
  onSelect,
  onClear,
}: EmployeeSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchedEmployee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selected, setSelected] = useState<SearchedEmployee | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Debounced search ──
  const searchEmployees = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(
        `/api/succession/employees/search?q=${encodeURIComponent(q)}${positionId ? `&positionId=${positionId}` : ''}&limit=10`
      )
      const json = await res.json()
      if (json.success) {
        const filtered = json.data.filter(
          (e: SearchedEmployee) => !excludeEmployeeIds.includes(e.id)
        )
        setResults(filtered)
        setShowDropdown(filtered.length > 0)
      }
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [positionId, excludeEmployeeIds])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (selected) return

    debounceRef.current = setTimeout(() => {
      searchEmployees(query)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, searchEmployees, selected])

  // ── Click outside to close dropdown ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(employee: SearchedEmployee) {
    setSelected(employee)
    setQuery('')
    setShowDropdown(false)
    setResults([])
    onSelect({
      id: employee.id,
      fullName: employee.fullName,
      roleFitScore: employee.roleFitScore,
      meetsThreshold: employee.meetsThreshold,
    })
  }

  function handleClear() {
    setSelected(null)
    setQuery('')
    setResults([])
    setShowDropdown(false)
    onClear()
  }

  // ── Selected chip ──
  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-slate-800/60 border border-cyan-500/30 rounded-lg px-3 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{formatDisplayName(selected.fullName, 'short')}</p>
          <p className="text-[10px] text-slate-500 truncate">
            {selected.position || 'Sin cargo'} · RoleFit {Math.round(selected.roleFitScore)}%
          </p>
        </div>
        <button
          onClick={handleClear}
          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // ── Search input + dropdown ──
  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre..."
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden max-h-[240px] overflow-y-auto">
          {results.map(emp => (
            <button
              key={emp.id}
              onClick={() => !emp.alreadyNominated && handleSelect(emp)}
              disabled={emp.alreadyNominated}
              className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors ${
                emp.alreadyNominated
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-slate-800/60 cursor-pointer'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{formatDisplayName(emp.fullName, 'short')}</p>
                <p className="text-[10px] text-slate-500 truncate">
                  {[emp.position, emp.departmentName].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!emp.meetsThreshold && (
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                )}
                <span className={`text-xs ${emp.meetsThreshold ? 'text-slate-400' : 'text-amber-400'}`}>
                  {Math.round(emp.roleFitScore)}%
                </span>
                {emp.alreadyNominated && (
                  <span className="text-[9px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">Ya nominado</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !isLoading && results.length === 0 && !showDropdown && (
        <p className="text-[10px] text-slate-600 mt-1">Sin resultados para &quot;{query}&quot;</p>
      )}
    </div>
  )
}
