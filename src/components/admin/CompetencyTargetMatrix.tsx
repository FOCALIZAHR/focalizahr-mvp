'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Check, AlertTriangle, Download } from 'lucide-react'

interface CompetencyTargetMatrixProps {
  onRatified?: () => void
}

interface JobLevel {
  level: string
  label: string
}

interface CompetencyInfo {
  code: string
  name: string
  category: string
}

interface Target {
  id: string
  competencyCode: string
  standardJobLevel: string
  targetScore: number | null
  isDefault: boolean
  ratifiedAt: string | null
}

export default function CompetencyTargetMatrix({ onRatified }: CompetencyTargetMatrixProps) {
  const [targets, setTargets] = useState<Target[]>([])
  const [competencies, setCompetencies] = useState<CompetencyInfo[]>([])
  const [jobLevels, setJobLevels] = useState<JobLevel[]>([])
  const [isRatified, setIsRatified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    fetch('/api/admin/competency-targets')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setTargets(json.data.targets)
          setCompetencies(json.data.competencies)
          setJobLevels(json.data.standardJobLevels)
          setIsRatified(json.data.isRatified)
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const getTargetValue = useCallback((compCode: string, level: string): number | null => {
    const target = targets.find(
      t => t.competencyCode === compCode && t.standardJobLevel === level
    )
    return target?.targetScore ?? null
  }, [targets])

  const handleCellChange = useCallback(async (competencyCode: string, standardJobLevel: string, value: string) => {
    const numValue = value === '' || value === '--' ? null : parseFloat(value)

    // Optimistic update
    setTargets(prev => {
      const existing = prev.find(
        t => t.competencyCode === competencyCode && t.standardJobLevel === standardJobLevel
      )
      if (existing) {
        return prev.map(t =>
          t.competencyCode === competencyCode && t.standardJobLevel === standardJobLevel
            ? { ...t, targetScore: numValue, isDefault: false }
            : t
        )
      }
      return [...prev, {
        id: `temp-${competencyCode}-${standardJobLevel}`,
        competencyCode,
        standardJobLevel,
        targetScore: numValue,
        isDefault: false,
        ratifiedAt: null
      }]
    })

    // Persist
    await fetch('/api/admin/competency-targets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competencyCode, standardJobLevel, targetScore: numValue })
    })
  }, [])

  const handleRatify = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/admin/competency-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ratify' })
      })
      const json = await res.json()
      if (json.success) {
        setIsRatified(true)
        onRatified?.()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSeedDefaults = async () => {
    setIsSeeding(true)
    try {
      const res = await fetch('/api/admin/competency-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_defaults' })
      })
      const json = await res.json()
      if (json.success) {
        // Reload data
        const reloadRes = await fetch('/api/admin/competency-targets')
        const reloadJson = await reloadRes.json()
        if (reloadJson.success) {
          setTargets(reloadJson.data.targets)
        }
      }
    } finally {
      setIsSeeding(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Group competencies by category
  const categories = [...new Set(competencies.map(c => c.category))]

  const CATEGORY_LABELS: Record<string, string> = {
    'STRATEGIC': 'Estratégicas',
    'LEADERSHIP': 'Liderazgo',
    'CORE': 'Core',
    'TECHNICAL': 'Técnicas'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Niveles Esperados por Cargo</h2>
          <p className="text-sm text-slate-400 mt-1">
            Define el nivel de competencia esperado para cada cargo (escala 1-5)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {targets.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isSeeding ? 'Cargando...' : 'Cargar Defaults'}
            </button>
          )}

          {!isRatified && targets.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400">Pendiente de ratificación</span>
            </div>
          )}

          {isRatified && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">Ratificado</span>
            </div>
          )}
        </div>
      </div>

      {/* Matriz */}
      {targets.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-700/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium sticky left-0 bg-slate-800/90 backdrop-blur z-10 min-w-[200px]">
                  Competencia
                </th>
                {jobLevels.map((job) => (
                  <th key={job.level} className="text-center py-3 px-2 text-slate-400 font-medium min-w-[90px]">
                    <span className="text-[11px] leading-tight block">{job.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <>
                  {/* Category header */}
                  <tr key={`cat-${category}`} className="bg-slate-800/30">
                    <td
                      colSpan={jobLevels.length + 1}
                      className="py-2 px-4 text-xs font-bold uppercase tracking-wider text-cyan-400"
                    >
                      {CATEGORY_LABELS[category] || category}
                    </td>
                  </tr>
                  {/* Competency rows */}
                  {competencies.filter(c => c.category === category).map((comp) => (
                    <tr key={comp.code} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="py-2 px-4 text-slate-300 font-medium sticky left-0 bg-[#0F172A]/90 backdrop-blur z-10">
                        <span className="text-slate-500 text-xs mr-2">{comp.code}</span>
                        {comp.name}
                      </td>
                      {jobLevels.map((job) => {
                        const value = getTargetValue(comp.code, job.level)

                        return (
                          <td key={job.level} className="py-1 px-2 text-center">
                            <select
                              value={value ?? ''}
                              onChange={(e) => handleCellChange(comp.code, job.level, e.target.value)}
                              className={`w-16 px-2 py-1 rounded text-center text-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors ${
                                value === null
                                  ? 'bg-slate-800/50 border border-slate-700/50 text-slate-600'
                                  : value >= 4
                                    ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300'
                                    : value >= 3
                                      ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300'
                                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                              }`}
                            >
                              <option value="">--</option>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/30">
          <p className="text-slate-400 mb-4">No hay niveles configurados aún</p>
          <p className="text-slate-500 text-sm mb-6">
            Carga los valores por defecto basados en mejores prácticas LATAM
          </p>
          <button
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isSeeding ? 'Cargando...' : 'Cargar Defaults LATAM'}
          </button>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex items-center gap-6 text-xs text-slate-500">
        <span>-- = No aplica</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
          1-2 Básico
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-cyan-500/10 border border-cyan-500/30" />
          3 Competente
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple-500/10 border border-purple-500/30" />
          4-5 Avanzado/Experto
        </span>
      </div>

      {/* Botón Ratificar */}
      {!isRatified && targets.length > 0 && (
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleRatify}
          disabled={isSaving}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Check className="w-5 h-5" />
          {isSaving ? 'Guardando...' : 'Confirmar y Ratificar Niveles'}
        </motion.button>
      )}
    </div>
  )
}
