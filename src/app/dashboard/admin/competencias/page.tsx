'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY LIBRARY - Página de Administración
// src/app/dashboard/admin/competencias/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Filosofía FocalizaHR: Biblioteca personalizable de competencias
// Features: Ver, editar, activar/desactivar, crear custom, inicializar desde template
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Users,
  Briefcase,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  Save,
  Building2,
  Database
} from 'lucide-react'
import { toast } from 'sonner'
import AccountSelector from '@/components/admin/AccountSelector'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface Competency {
  id: string
  code: string
  name: string
  description: string | null
  category: 'CORE' | 'LEADERSHIP' | 'STRATEGIC' | 'TECHNICAL'
  behaviors: string[] | null
  audienceRule: { minTrack?: string } | null
  isActive: boolean
  isCustom: boolean
  sourceTemplate: string | null
  sortOrder: number
  dimensionCode: string | null
  subdimensionCode: string | null
}

interface CompetencyStats {
  total: number
  active: number
  custom: number
  byCategory: Record<string, number>
  sourceTemplate: string | null
}

interface Template {
  id: string
  name: string
  description: string
  competencyCount: number
  categories: string[]
  byCategory: Record<string, number>
  preview: Array<{ code: string; name: string; category: string }>
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

const CATEGORY_CONFIG = {
  CORE: {
    label: 'Core',
    description: 'Todos los empleados',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    icon: Users
  },
  LEADERSHIP: {
    label: 'Liderazgo',
    description: 'Managers + Ejecutivos',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: Briefcase
  },
  STRATEGIC: {
    label: 'Estratégico',
    description: 'Solo Ejecutivos',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: Target
  },
  TECHNICAL: {
    label: 'Técnico',
    description: 'Por área/departamento',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: Zap
  }
}

const TRACK_LABELS: Record<string, string> = {
  COLABORADOR: 'Colaboradores',
  MANAGER: 'Managers+',
  EJECUTIVO: 'Ejecutivos'
}

// ════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('focalizahr_token')
  }
  return null
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function CompetenciasPage() {
  // ══════════════════════════════════════════════════════════════════════════
  // STATE: Account Selector (patrón admin)
  // ══════════════════════════════════════════════════════════════════════════
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [selectedAccountName, setSelectedAccountName] = useState<string>('')
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)

  // ══════════════════════════════════════════════════════════════════════════
  // STATE: Competencies
  // ══════════════════════════════════════════════════════════════════════════

  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [stats, setStats] = useState<CompetencyStats | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [hasCompetencies, setHasCompetencies] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['CORE', 'LEADERSHIP', 'STRATEGIC', 'TECHNICAL'])
  )

  // Modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null)
  const [templateModalOpen, setTemplateModalOpen] = useState(false)

  // ══════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ══════════════════════════════════════════════════════════════════════════

  const fetchCompetencies = useCallback(async (accountId: string) => {
    const token = getToken()
    if (!token || !accountId) return

    try {
      setLoading(true)
      const url = `/api/admin/competencies?accountId=${accountId}&activeOnly=${!showInactive}`

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()

      if (data.success) {
        setCompetencies(data.data)
        setStats(data.stats)
        setHasCompetencies(data.data.length > 0)
      } else {
        toast.error(data.error || 'Error cargando competencias')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [showInactive])

  const fetchTemplates = useCallback(async (accountId: string) => {
    const token = getToken()
    if (!token || !accountId) return

    try {
      const res = await fetch(`/api/admin/competencies/templates?accountId=${accountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()

      if (data.success) {
        setTemplates(data.data)
        setHasCompetencies(!data.meta.canInitialize)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }, [])

  useEffect(() => {
    if (selectedAccountId) {
      fetchCompetencies(selectedAccountId)
      fetchTemplates(selectedAccountId)
    } else {
      // Reset state cuando no hay cuenta seleccionada
      setCompetencies([])
      setStats(null)
      setHasCompetencies(false)
    }
  }, [selectedAccountId, fetchCompetencies, fetchTemplates])

  // Handler para cambio de cuenta
  const handleAccountChange = (accountId: string, accountName: string) => {
    setSelectedAccountId(accountId)
    setSelectedAccountName(accountName)
  }

  // Handler para abrir el selector
  const handleOpenSelector = () => {
    const input = document.querySelector<HTMLInputElement>('[placeholder*="Buscar empresa"]')
    if (input) {
      input.focus()
      input.click()
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ══════════════════════════════════════════════════════════════════════════

  const handleToggleActive = async (competency: Competency) => {
    const token = getToken()
    if (!token || !selectedAccountId) return

    setActionLoading(competency.id)

    try {
      const res = await fetch(`/api/admin/competencies/${competency.id}?accountId=${selectedAccountId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !competency.isActive })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(competency.isActive ? 'Competencia desactivada' : 'Competencia activada')
        fetchCompetencies(selectedAccountId)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al actualizar')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (competency: Competency) => {
    if (!competency.isCustom) {
      toast.error('Solo puedes eliminar competencias personalizadas')
      return
    }

    if (!confirm(`¿Eliminar la competencia "${competency.name}"?`)) return

    const token = getToken()
    if (!token || !selectedAccountId) return

    setActionLoading(competency.id)

    try {
      const res = await fetch(`/api/admin/competencies/${competency.id}?accountId=${selectedAccountId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Competencia eliminada')
        fetchCompetencies(selectedAccountId)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al eliminar')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveEdit = async (updates: Partial<Competency>) => {
    if (!editingCompetency) return

    const token = getToken()
    if (!token || !selectedAccountId) return

    setActionLoading(editingCompetency.id)

    try {
      const res = await fetch(`/api/admin/competencies/${editingCompetency.id}?accountId=${selectedAccountId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })

      const data = await res.json()

      if (data.success) {
        toast.success('Competencia actualizada')
        setEditModalOpen(false)
        setEditingCompetency(null)
        fetchCompetencies(selectedAccountId)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setActionLoading(null)
    }
  }

  const handleInitializeTemplate = async (templateId: string) => {
    const token = getToken()
    if (!token || !selectedAccountId) return

    setActionLoading(templateId)

    try {
      const res = await fetch(`/api/admin/competencies/initialize?accountId=${selectedAccountId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ templateId, accountId: selectedAccountId })
      })

      const data = await res.json()

      if (data.success) {
        toast.success(`Biblioteca inicializada con ${data.data.created} competencias`)
        setTemplateModalOpen(false)
        fetchCompetencies(selectedAccountId)
        fetchTemplates(selectedAccountId)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Error al inicializar')
    } finally {
      setActionLoading(null)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FILTERED DATA
  // ══════════════════════════════════════════════════════════════════════════

  const filteredCompetencies = competencies.filter(c => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false
    return true
  })

  const groupedByCategory = filteredCompetencies.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = []
    acc[c.category].push(c)
    return acc
  }, {} as Record<string, Competency[]>)

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="fhr-bg-main min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ════════════════════════════════════════════════════════════════════
            HEADER
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
            <BookOpen className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="fhr-title-gradient text-3xl">
              Biblioteca de Competencias
            </h1>
            <p className="text-slate-400 mt-1">
              Servicio Concierge - Administra competencias por cliente
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            ACCOUNT SELECTOR
        ════════════════════════════════════════════════════════════════════ */}
        <div className="fhr-card mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">
              Seleccionar Empresa Cliente
            </h2>
          </div>

          <AccountSelector
            value={selectedAccountId}
            onChange={handleAccountChange}
            placeholder="Buscar empresa por nombre o email..."
            onOpenChange={setIsSelectorOpen}
          />

          {selectedAccountId && (
            <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <p className="text-sm text-cyan-300">
                Gestionando competencias de: <span className="font-semibold">{selectedAccountName}</span>
              </p>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            CONTENIDO CONDICIONAL
        ════════════════════════════════════════════════════════════════════ */}
        {!selectedAccountId ? (
          // Empty State - No hay cuenta seleccionada
          !isSelectorOpen && (
            <div
              className="fhr-card text-center py-16 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-200"
              onClick={handleOpenSelector}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleOpenSelector()
                }
              }}
            >
              <Database className="w-20 h-20 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg mb-2 font-semibold">
                Haz clic aquí para seleccionar una empresa
              </p>
              <p className="text-slate-500 text-sm">
                O usa el buscador de arriba
              </p>

              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-400 text-sm">Seleccionar empresa</span>
              </div>
            </div>
          )
        ) : loading ? (
          // Loading state
          <div className="fhr-card p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-slate-400">Cargando competencias...</p>
          </div>
        ) : !hasCompetencies ? (
          // Empty State - Sin competencias (mostrar templates)
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fhr-card p-12 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-cyan-400" />
            </div>
            <h2 className="text-xl font-medium text-slate-200 mb-2">
              Inicializa la Biblioteca de {selectedAccountName}
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Selecciona un modelo de competencias basado en mejores prácticas internacionales.
              El cliente podrá personalizarlo según sus necesidades.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {templates.map(template => (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleInitializeTemplate(template.id)}
                  disabled={actionLoading !== null}
                  className="fhr-card p-6 text-left hover:border-cyan-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-cyan-400" />
                    </div>
                    {actionLoading === template.id && (
                      <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                    )}
                  </div>
                  <h3 className="font-medium text-slate-200 mb-1 group-hover:text-cyan-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="fhr-badge fhr-badge-active">
                      {template.competencyCount} competencias
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          // Main content - Competencias existentes
          <div className="space-y-6">
      {/* ════════════════════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-slate-200 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            Biblioteca de Competencias
          </h1>
          <p className="text-slate-400 mt-1">
            {stats?.total || 0} competencias | {stats?.active || 0} activas
            {stats?.sourceTemplate && (
              <span className="text-cyan-400/70"> | Modelo: {stats.sourceTemplate}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCompetencies(selectedAccountId)}
            disabled={loading}
            className="fhr-btn fhr-btn-ghost"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingCompetency(null)
              setEditModalOpen(true)
            }}
            className="fhr-btn fhr-btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Competencia
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STATS CARDS
      ════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['CORE', 'LEADERSHIP', 'STRATEGIC', 'TECHNICAL'] as const).map(cat => {
          const config = CATEGORY_CONFIG[cat]
          const Icon = config.icon
          const count = stats?.byCategory[cat] || 0

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="fhr-card p-4 cursor-pointer hover:border-slate-600 transition-all"
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{config.label}</p>
                  <p className="text-xl font-semibold text-white">{count}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          FILTERS
      ════════════════════════════════════════════════════════════════════ */}
      <div className="fhr-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Categoría:</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="fhr-input py-1.5 px-3 text-sm"
            >
              <option value="all">Todas</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-cyan-500"
            />
            Mostrar inactivas
          </label>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          LOADING
      ════════════════════════════════════════════════════════════════════ */}
      {loading && (
        <div className="fhr-card p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-4" />
          <p className="text-slate-400">Cargando competencias...</p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          COMPETENCY LIST BY CATEGORY
      ════════════════════════════════════════════════════════════════════ */}
      {!loading && (
        <div className="space-y-4">
          {(['CORE', 'LEADERSHIP', 'STRATEGIC', 'TECHNICAL'] as const).map(category => {
            const config = CATEGORY_CONFIG[category]
            const categoryCompetencies = groupedByCategory[category] || []

            if (categoryFilter !== 'all' && categoryFilter !== category) return null
            if (categoryCompetencies.length === 0) return null

            const isExpanded = expandedCategories.has(category)
            const Icon = config.icon

            return (
              <div key={category} className="fhr-card overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-slate-200">
                        {config.label}
                        <span className="ml-2 text-sm text-slate-500">
                          ({categoryCompetencies.length})
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">{config.description}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* Competencies List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-700/50"
                    >
                      {categoryCompetencies.map(comp => (
                        <div
                          key={comp.id}
                          className={`p-4 border-b border-slate-700/30 last:border-b-0 ${
                            !comp.isActive ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs text-slate-500">
                                  {comp.code}
                                </span>
                                {comp.isCustom && (
                                  <span className="fhr-badge fhr-badge-premium text-xs">
                                    Custom
                                  </span>
                                )}
                                {!comp.isActive && (
                                  <span className="fhr-badge fhr-badge-draft text-xs">
                                    Inactiva
                                  </span>
                                )}
                                {comp.audienceRule?.minTrack && (
                                  <span className="text-xs text-slate-500">
                                    {TRACK_LABELS[comp.audienceRule.minTrack]}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-slate-200">{comp.name}</h4>
                              {comp.description && (
                                <p className="text-sm text-slate-400 mt-1">{comp.description}</p>
                              )}
                              {comp.behaviors && comp.behaviors.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {comp.behaviors.slice(0, 3).map((b, i) => (
                                    <span key={i} className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                      {b}
                                    </span>
                                  ))}
                                  {comp.behaviors.length > 3 && (
                                    <span className="text-xs text-slate-500">
                                      +{comp.behaviors.length - 3} más
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleToggleActive(comp)}
                                disabled={actionLoading === comp.id}
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                                title={comp.isActive ? 'Desactivar' : 'Activar'}
                              >
                                {actionLoading === comp.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                ) : comp.isActive ? (
                                  <ToggleRight className="w-5 h-5 text-cyan-400" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-slate-500" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCompetency(comp)
                                  setEditModalOpen(true)
                                }}
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-4 h-4 text-slate-400" />
                              </button>
                              {comp.isCustom && (
                                <button
                                  onClick={() => handleDelete(comp)}
                                  disabled={actionLoading === comp.id}
                                  className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

            {/* ════════════════════════════════════════════════════════════════════
                EDIT MODAL
            ════════════════════════════════════════════════════════════════════ */}
            <AnimatePresence>
              {editModalOpen && (
                <CompetencyEditModal
                  competency={editingCompetency}
                  onClose={() => {
                    setEditModalOpen(false)
                    setEditingCompetency(null)
                  }}
                  onSave={handleSaveEdit}
                  loading={actionLoading !== null}
                  accountId={selectedAccountId}
                />
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EDIT MODAL COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface EditModalProps {
  competency: Competency | null
  onClose: () => void
  onSave: (updates: Partial<Competency>) => void
  loading: boolean
  accountId: string  // Para crear competencias con el accountId correcto
}

function CompetencyEditModal({ competency, onClose, onSave, loading, accountId }: EditModalProps) {
  const isNew = !competency

  const [formData, setFormData] = useState<{
    code: string
    name: string
    description: string
    category: 'CORE' | 'LEADERSHIP' | 'STRATEGIC' | 'TECHNICAL'
    behaviorsText: string
    minTrack: string
  }>({
    code: competency?.code || '',
    name: competency?.name || '',
    description: competency?.description || '',
    category: competency?.category || 'CORE',
    behaviorsText: (competency?.behaviors || []).join('\n'),
    minTrack: competency?.audienceRule?.minTrack || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const behaviors = formData.behaviorsText
      .split('\n')
      .map(b => b.trim())
      .filter(b => b.length > 0)

    const audienceRule = formData.minTrack
      ? { minTrack: formData.minTrack }
      : null

    if (isNew) {
      // Create new - need to call different endpoint
      createCompetency({
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category as Competency['category'],
        behaviors,
        audienceRule
      })
    } else {
      onSave({
        name: formData.name,
        description: formData.description || undefined,
        behaviors
      })
    }
  }

  const createCompetency = async (data: any) => {
    const token = localStorage.getItem('focalizahr_token')
    if (!token || !accountId) return

    try {
      const res = await fetch(`/api/admin/competencies?accountId=${accountId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, accountId })
      })

      const result = await res.json()

      if (result.success) {
        toast.success('Competencia creada')
        onClose()
        window.location.reload()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Error al crear')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="fhr-card w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-200">
              {isNew ? 'Nueva Competencia' : 'Editar Competencia'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-700/50 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isNew && (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Código *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="CUSTOM-001"
                  required
                  className="fhr-input w-full font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">Identificador único (se convertirá a mayúsculas)</p>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Categoría *</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({
                    ...formData,
                    category: e.target.value as 'CORE' | 'LEADERSHIP' | 'STRATEGIC' | 'TECHNICAL'
                  })}
                  className="fhr-input w-full"
                >
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Aplica a</label>
                <select
                  value={formData.minTrack}
                  onChange={e => setFormData({ ...formData, minTrack: e.target.value })}
                  className="fhr-input w-full"
                >
                  <option value="">Todos (sin filtro)</option>
                  <option value="MANAGER">Managers y Ejecutivos</option>
                  <option value="EJECUTIVO">Solo Ejecutivos</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre de la competencia"
              required
              className="fhr-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción detallada de la competencia"
              rows={2}
              className="fhr-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Comportamientos observables
            </label>
            <textarea
              value={formData.behaviorsText}
              onChange={e => setFormData({ ...formData, behaviorsText: e.target.value })}
              placeholder="Un comportamiento por línea..."
              rows={5}
              className="fhr-input w-full"
            />
            <p className="text-xs text-slate-500 mt-1">
              Un comportamiento por línea. Ej: "Escucha activamente antes de responder"
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="fhr-btn fhr-btn-ghost">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="fhr-btn fhr-btn-primary">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isNew ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
