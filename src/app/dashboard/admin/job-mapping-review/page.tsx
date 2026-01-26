'use client'

// ════════════════════════════════════════════════════════════════════════════
// JOB MAPPING REVIEW PAGE - Revisión de Mapeo de Cargos
// src/app/dashboard/admin/job-mapping-review/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Building2,
  Users,
  RefreshCcw,
  ChevronDown
} from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface UnmappedPosition {
  position: string
  participantCount: number
  accountId: string
  companyName: string
  suggestedLevel: string | null
  suggestedAcotado: string | null
}

interface Summary {
  totalUnmapped: number
  totalParticipants: number
  accountsAffected: number
}

interface JobLevel {
  value: string
  label: string
  order: number
  acotadoGroup: string
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS - Job Levels
// ════════════════════════════════════════════════════════════════════════════

const JOB_LEVELS: JobLevel[] = [
  { value: 'gerente_director', label: 'Gerentes/Directores', order: 1, acotadoGroup: 'alta_gerencia' },
  { value: 'subgerente_subdirector', label: 'Subgerentes/Subdirectores', order: 2, acotadoGroup: 'alta_gerencia' },
  { value: 'jefe', label: 'Jefes', order: 3, acotadoGroup: 'mandos_medios' },
  { value: 'supervisor_coordinador', label: 'Supervisores/Coordinadores', order: 4, acotadoGroup: 'mandos_medios' },
  { value: 'profesional_analista', label: 'Profesionales/Analistas', order: 5, acotadoGroup: 'profesionales' },
  { value: 'asistente_otros', label: 'Asistentes/Administrativos', order: 6, acotadoGroup: 'base_operativa' },
  { value: 'operativo_auxiliar', label: 'Operativos/Auxiliares', order: 7, acotadoGroup: 'base_operativa' }
]

const ACOTADO_LABELS: Record<string, string> = {
  'alta_gerencia': 'Alta Gerencia',
  'mandos_medios': 'Mandos Medios',
  'profesionales': 'Profesionales',
  'base_operativa': 'Base Operativa'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function JobMappingReviewPage() {
  const [unmappedPositions, setUnmappedPositions] = useState<UnmappedPosition[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH DATA
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchUnmappedPositions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('focalizahr_token')
      if (!token) {
        setError('No autorizado')
        return
      }

      const res = await fetch('/api/admin/job-mapping-review', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error(`Error ${res.status}`)
      }

      const data = await res.json()

      if (data.success) {
        setUnmappedPositions(data.data)
        setSummary(data.summary)
      } else {
        throw new Error(data.error || 'Error cargando datos')
      }
    } catch (err: any) {
      console.error('Error fetching unmapped positions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUnmappedPositions()
  }, [fetchUnmappedPositions])

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSIGN LEVEL
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAssignLevel = async (
    position: string,
    accountId: string,
    standardJobLevel: string
  ) => {
    const key = `${accountId}-${position}`
    setUpdating(key)

    try {
      const token = localStorage.getItem('focalizahr_token')
      if (!token) {
        setError('No autorizado')
        return
      }

      const res = await fetch('/api/admin/job-mapping-review', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ position, accountId, standardJobLevel })
      })

      const data = await res.json()

      if (data.success) {
        // Remover de la lista
        setUnmappedPositions(prev =>
          prev.filter(p => !(p.position.toLowerCase() === position.toLowerCase() && p.accountId === accountId))
        )

        // Actualizar summary
        if (summary) {
          const affectedItem = unmappedPositions.find(
            p => p.position.toLowerCase() === position.toLowerCase() && p.accountId === accountId
          )
          setSummary({
            ...summary,
            totalUnmapped: summary.totalUnmapped - 1,
            totalParticipants: summary.totalParticipants - (affectedItem?.participantCount || 0)
          })
        }
      } else {
        setError(data.error || 'Error actualizando')
      }
    } catch (err: any) {
      console.error('Error assigning level:', err)
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GET SUGGESTED LEVEL LABEL
  // ═══════════════════════════════════════════════════════════════════════════

  const getSuggestedLabel = (level: string | null): string => {
    if (!level) return '-'
    const found = JOB_LEVELS.find(l => l.value === level)
    return found?.label || level
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-200 flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-cyan-400" />
            Revisión de Mapeo de Cargos
          </h1>
          <p className="text-slate-400 mt-1">
            Asigna niveles jerárquicos a cargos que no fueron clasificados automáticamente
          </p>
        </div>

        <button
          onClick={fetchUnmappedPositions}
          disabled={loading}
          className="fhr-btn fhr-btn-secondary flex items-center gap-2"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fhr-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Sin Mapear</p>
                <p className="text-xl font-semibold text-white">{summary.totalUnmapped}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="fhr-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Participantes Afectados</p>
                <p className="text-xl font-semibold text-white">{summary.totalParticipants}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="fhr-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Empresas</p>
                <p className="text-xl font-semibold text-white">{summary.accountsAffected}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="fhr-card p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-4" />
          <p className="text-slate-400">Cargando cargos sin mapear...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="fhr-card p-8 text-center bg-red-500/5 border-red-500/30">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchUnmappedPositions}
            className="fhr-btn fhr-btn-secondary mt-2"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && unmappedPositions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fhr-card p-12 text-center bg-green-500/5 border-green-500/30"
        >
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-green-400 mb-2">
            Todos los cargos clasificados
          </h2>
          <p className="text-slate-400">
            No hay cargos pendientes de revisión en este momento.
          </p>
        </motion.div>
      )}

      {/* Table */}
      {!loading && !error && unmappedPositions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fhr-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 border-b border-slate-700/50">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-300">
                    Cargo Original
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-300">
                    Empresa
                  </th>
                  <th className="text-center p-4 text-sm font-medium text-slate-300">
                    Participantes
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-300">
                    Sugerencia
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-slate-300">
                    Asignar Nivel
                  </th>
                </tr>
              </thead>
              <tbody>
                {unmappedPositions.map((item, idx) => {
                  const key = `${item.accountId}-${item.position}`
                  const isUpdating = updating === key

                  return (
                    <tr
                      key={key}
                      className="border-t border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-medium text-white">
                          {item.position}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-400 text-sm">
                          {item.companyName}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="fhr-badge fhr-badge-active">
                          {item.participantCount}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.suggestedLevel ? (
                          <div>
                            <span className="text-cyan-400 text-sm">
                              {getSuggestedLabel(item.suggestedLevel)}
                            </span>
                            {item.suggestedAcotado && (
                              <span className="text-slate-500 text-xs block">
                                {ACOTADO_LABELS[item.suggestedAcotado]}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="relative">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignLevel(item.position, item.accountId, e.target.value)
                              }
                            }}
                            disabled={isUpdating}
                            defaultValue=""
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pr-8"
                          >
                            <option value="" disabled>
                              {isUpdating ? 'Guardando...' : 'Seleccionar nivel...'}
                            </option>
                            {JOB_LEVELS.map((level) => (
                              <option key={level.value} value={level.value}>
                                {level.label} ({ACOTADO_LABELS[level.acotadoGroup]})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Info Footer */}
      <div className="fhr-card p-4 bg-slate-800/30">
        <h3 className="text-sm font-medium text-slate-300 mb-2">
          Acerca de los Niveles Jerárquicos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {Object.entries(ACOTADO_LABELS).map(([key, label]) => (
            <div key={key} className="bg-slate-700/30 rounded-lg p-3">
              <p className="font-medium text-cyan-400 mb-1">{label}</p>
              <p className="text-slate-400">
                {JOB_LEVELS.filter(l => l.acotadoGroup === key)
                  .map(l => l.label)
                  .join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
