'use client'

// ════════════════════════════════════════════════════════════════════════════
// COMPETENCY LIBRARY MANAGER - Vista enfocada por categorías
// src/app/dashboard/admin/competencias/library/page.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  ArrowLeft,
  Save,
  X,
  Users,
  Briefcase,
  Target,
  Zap,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Home,
  ChevronRight
} from 'lucide-react'
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
  isActive: boolean
  isCustom: boolean
  sortOrder: number
}

type CategoryKey = 'ALL' | 'CORE' | 'LEADERSHIP' | 'STRATEGIC' | 'TECHNICAL'

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  CORE: { label: 'Core', icon: Users, color: 'cyan' },
  LEADERSHIP: { label: 'Liderazgo', icon: Briefcase, color: 'purple' },
  STRATEGIC: { label: 'Estrategico', icon: Target, color: 'amber' },
  TECHNICAL: { label: 'Tecnico', icon: Zap, color: 'green' }
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
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

export default function CompetencyLibraryPage() {
  const router = useRouter()

  // Account state
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)

  // Data state
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', category: 'CORE' as string })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Add new state
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', description: '', category: 'CORE' as string })

  // ════════════════════════════════════════════════════════════════════════
  // DATA LOADING
  // ════════════════════════════════════════════════════════════════════════

  const loadCompetencies = useCallback(async () => {
    if (!selectedAccountId) return
    try {
      setIsLoading(true)
      setError(null)
      const token = getToken()
      const res = await fetch(`/api/admin/competencies?accountId=${selectedAccountId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Error cargando competencias')
      const data = await res.json()
      setCompetencies(data.competencies || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedAccountId])

  useEffect(() => {
    loadCompetencies()
  }, [loadCompetencies])

  // ════════════════════════════════════════════════════════════════════════
  // FILTERS
  // ════════════════════════════════════════════════════════════════════════

  const filteredCompetencies = useMemo(() => {
    let filtered = competencies
    if (activeCategory !== 'ALL') {
      filtered = filtered.filter(c => c.category === activeCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      )
    }
    return filtered.sort((a, b) => a.sortOrder - b.sortOrder)
  }, [competencies, activeCategory, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: competencies.length }
    competencies.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1
    })
    return counts
  }, [competencies])

  // ════════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════════════════════

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      setActionLoading(id)
      const token = getToken()
      const res = await fetch(`/api/admin/competencies/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      })
      if (!res.ok) throw new Error('Error actualizando')
      await loadCompetencies()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta competencia?')) return
    try {
      setActionLoading(id)
      const token = getToken()
      const res = await fetch(`/api/admin/competencies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Error eliminando')
      await loadCompetencies()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    try {
      setActionLoading(editingId)
      const token = getToken()
      const res = await fetch(`/api/admin/competencies/${editingId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      if (!res.ok) throw new Error('Error guardando')
      setEditingId(null)
      await loadCompetencies()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddNew = async () => {
    if (!addForm.name.trim()) return
    try {
      setActionLoading('new')
      const token = getToken()
      const res = await fetch('/api/admin/competencies', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          accountId: selectedAccountId,
          isCustom: true
        })
      })
      if (!res.ok) throw new Error('Error creando')
      setShowAddForm(false)
      setAddForm({ name: '', description: '', category: 'CORE' })
      await loadCompetencies()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-slate-400">
        <button onClick={() => router.push('/dashboard/admin')} className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
          <Home className="w-3.5 h-3.5" />
          <span>Admin</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <button onClick={() => router.push('/dashboard/admin/competencias')} className="hover:text-cyan-400 transition-colors">
          Competencias
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-slate-200">Library Manager</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-slate-200 flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            <span className="fhr-title-gradient">Library Manager</span>
          </h1>
          <p className="text-slate-400 mt-1">Gestiona las competencias por categoria</p>
        </div>
        <div className="flex items-center gap-3">
          <AccountSelector
            value={selectedAccountId}
            onChange={(id: string, name: string) => {
              setSelectedAccountId(id)
            }}
            onOpenChange={setIsSelectorOpen}
          />
          <button
            onClick={() => setShowAddForm(true)}
            className="fhr-btn fhr-btn-primary flex items-center gap-2"
            disabled={!selectedAccountId}
          >
            <Plus className="w-4 h-4" />
            Nueva
          </button>
        </div>
      </div>

      {/* Search + Category Tabs */}
      <div className="fhr-card p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar competencia por nombre o codigo..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="fhr-input w-full pl-10"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'
            }`}
          >
            Todas <span className="ml-1 text-xs opacity-70">({categoryCounts.ALL || 0})</span>
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key as CategoryKey)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === key
                    ? `bg-${cfg.color}-500/20 text-${cfg.color}-400 border border-${cfg.color}-500/30`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cfg.label}
                <span className="text-xs opacity-70">({categoryCounts[key] || 0})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="fhr-card p-6 border-cyan-500/30"
          >
            <h3 className="text-base font-medium text-slate-200 mb-4">Nueva Competencia Custom</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nombre competencia"
                value={addForm.name}
                onChange={e => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                className="fhr-input"
              />
              <input
                type="text"
                placeholder="Descripcion (opcional)"
                value={addForm.description}
                onChange={e => setAddForm(prev => ({ ...prev, description: e.target.value }))}
                className="fhr-input"
              />
              <select
                value={addForm.category}
                onChange={e => setAddForm(prev => ({ ...prev, category: e.target.value }))}
                className="fhr-input"
              >
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setShowAddForm(false)} className="fhr-btn fhr-btn-ghost">
                Cancelar
              </button>
              <button
                onClick={handleAddNew}
                disabled={!addForm.name.trim() || actionLoading === 'new'}
                className="fhr-btn fhr-btn-primary flex items-center gap-2"
              >
                {actionLoading === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Crear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="fhr-card p-4 border-red-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* No account selected */}
      {!selectedAccountId && !isLoading && (
        <div className="fhr-card p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Selecciona una empresa para ver sus competencias</p>
        </div>
      )}

      {/* Competencies List */}
      {!isLoading && selectedAccountId && (
        <div className="space-y-2">
          {filteredCompetencies.length === 0 ? (
            <div className="fhr-card p-8 text-center">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">
                {searchQuery ? 'No se encontraron competencias' : 'No hay competencias en esta categoria'}
              </p>
            </div>
          ) : (
            filteredCompetencies.map((comp, idx) => {
              const catCfg = CATEGORY_CONFIG[comp.category]
              const isEditing = editingId === comp.id
              const isProcessing = actionLoading === comp.id

              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`fhr-card p-4 transition-all ${
                    !comp.isActive ? 'opacity-50' : ''
                  } ${isEditing ? 'border-cyan-500/50' : ''}`}
                >
                  {isEditing ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                          className="fhr-input"
                          placeholder="Nombre"
                        />
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="fhr-input"
                          placeholder="Descripcion"
                        />
                        <select
                          value={editForm.category}
                          onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                          className="fhr-input"
                        >
                          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                            <option key={key} value={key}>{cfg.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="fhr-btn fhr-btn-ghost text-sm">
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={isProcessing}
                          className="fhr-btn fhr-btn-primary text-sm flex items-center gap-1"
                        >
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="flex items-center gap-4">
                      {/* Category badge */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-${catCfg?.color || 'slate'}-500/20`}>
                        {catCfg && <catCfg.icon className={`w-5 h-5 text-${catCfg.color}-400`} />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-mono">{comp.code}</span>
                          <h3 className="text-sm font-medium text-slate-200 truncate">{comp.name}</h3>
                          {comp.isCustom && (
                            <span className="fhr-badge fhr-badge-premium text-xs">Custom</span>
                          )}
                          {!comp.isActive && (
                            <span className="fhr-badge fhr-badge-draft text-xs">Inactiva</span>
                          )}
                        </div>
                        {comp.description && (
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{comp.description}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggleActive(comp.id, comp.isActive)}
                          disabled={isProcessing}
                          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                          title={comp.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {comp.isActive ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(comp.id)
                            setEditForm({
                              name: comp.name,
                              description: comp.description || '',
                              category: comp.category
                            })
                          }}
                          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {comp.isCustom && (
                          <button
                            onClick={() => handleDelete(comp.id)}
                            disabled={isProcessing}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })
          )}
        </div>
      )}

      {/* Stats Footer */}
      {!isLoading && selectedAccountId && competencies.length > 0 && (
        <div className="fhr-card p-4">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Mostrando {filteredCompetencies.length} de {competencies.length} competencias
            </span>
            <span>
              {competencies.filter(c => c.isActive).length} activas · {competencies.filter(c => c.isCustom).length} custom
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
