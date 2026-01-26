'use client'

// ════════════════════════════════════════════════════════════════════════════
// QUARANTINE REVIEW PAGE - Revisión de Inconsistencias (Split View)
// src/app/dashboard/admin/employees/quarantine/page.tsx
// ════════════════════════════════════════════════════════════════════════════
// Filosofía FocalizaHR: Limpieza, Claridad Semántica y Control Humano
//
// SPLIT VIEW con dos secciones jerárquicas:
// 1. LIDERAZGO OCULTO (CRÍTICO) - Colaboradores con personas a cargo
// 2. CARGOS NUEVOS (VOLUMEN) - Cargos no reconocidos, agrupados
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Building2,
  Briefcase,
  Users,
  FileQuestion
} from 'lucide-react'
import AccountSelector from '@/components/admin/AccountSelector'
import { GhostButton } from '@/components/ui/PremiumButton'
import LiderazgoOcultoSection from '@/components/admin/employees/LiderazgoOcultoSection'
import CargosNuevosSection from '@/components/admin/employees/CargosNuevosSection'
import useInconsistencies from '@/hooks/useInconsistencies'

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function QuarantineReviewPage() {
  const {
    // Data
    liderazgoOculto,
    cargosNuevos,
    cargosAgrupados,
    counts,

    // State
    loading,
    error,
    resolving,

    // Filter
    selectedAccountId,
    selectedAccountName,

    // Actions
    fetchAnomalies,
    handleAccountChange,
    handleClearFilter,
    resolveAnomaly,
    resolveMultiple,
    resolveCargoGroup
  } = useInconsistencies()

  // Handler para resolver todos los hidden managers
  const handleResolveAllHiddenManagers = async () => {
    const ids = liderazgoOculto.map(e => e.id)
    return resolveMultiple(ids, 'PROMOTE')
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-8">
      {/* ══════════════════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Título y Acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-light text-slate-200 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              Revisión de Inconsistencias
            </h1>
            <p className="text-slate-400 mt-1">
              Valida los roles antes de activar evaluaciones de desempeño. Confirma qué track corresponde a cada empleado.
            </p>
          </div>

          <GhostButton
            icon={RefreshCw}
            size="sm"
            onClick={() => fetchAnomalies(selectedAccountId || undefined)}
            disabled={loading}
            isLoading={loading}
          >
            Actualizar
          </GhostButton>
        </div>

        {/* Selector de Cuenta */}
        <div className="fhr-card p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 shrink-0">
              <Building2 className="w-4 h-4" />
              <span>Filtrar por empresa:</span>
            </div>
            <div className="flex-1 min-w-0 relative z-50">
              <AccountSelector
                value={selectedAccountId}
                onChange={handleAccountChange}
                placeholder="Todas las empresas (buscar por nombre o email)"
                className="w-full"
              />
            </div>
            {selectedAccountId && (
              <button
                onClick={handleClearFilter}
                className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 shrink-0"
              >
                <span>×</span> Limpiar filtro
              </button>
            )}
          </div>
          {selectedAccountName && (
            <p className="text-xs text-cyan-400/70 mt-2 pl-6">
              Mostrando inconsistencias de: <span className="font-medium text-cyan-400">{selectedAccountName}</span>
            </p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SUMMARY CARDS
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card: Total Pendientes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fhr-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Pendientes</p>
              <p className="text-xl font-semibold text-white">
                {loading ? '...' : counts.total}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card: Liderazgo Oculto - Clickeable */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => counts.liderazgoOculto > 0 && document.getElementById('liderazgo-oculto')?.scrollIntoView({ behavior: 'smooth' })}
          className={`fhr-card p-4 border-red-500/20 transition-all ${
            counts.liderazgoOculto > 0 ? 'cursor-pointer hover:border-red-500/40 hover:bg-slate-800/80' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Liderazgo Oculto</p>
              <p className="text-xl font-semibold text-red-400">
                {loading ? '...' : counts.liderazgoOculto}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card: Cargos Nuevos - Clickeable */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => counts.cargosNuevos > 0 && document.getElementById('cargos-nuevos')?.scrollIntoView({ behavior: 'smooth' })}
          className={`fhr-card p-4 border-cyan-500/20 transition-all ${
            counts.cargosNuevos > 0 ? 'cursor-pointer hover:border-cyan-500/40 hover:bg-slate-800/80' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <FileQuestion className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Cargos Nuevos</p>
              <p className="text-xl font-semibold text-cyan-400">
                {loading ? '...' : counts.cargosNuevos}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LOADING STATE
      ══════════════════════════════════════════════════════════════════ */}
      {loading && (
        <div className="fhr-card p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400 mb-4" />
          <p className="text-slate-400">Cargando inconsistencias...</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ERROR STATE
      ══════════════════════════════════════════════════════════════════ */}
      {error && !loading && (
        <div className="fhr-card p-8 text-center bg-red-500/5 border-red-500/30">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-2">{error}</p>
          <GhostButton
            onClick={() => fetchAnomalies(selectedAccountId || undefined)}
            size="sm"
          >
            Reintentar
          </GhostButton>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          EMPTY STATE
      ══════════════════════════════════════════════════════════════════ */}
      {!loading && !error && counts.total === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fhr-card p-12 text-center bg-green-500/5 border-green-500/30"
        >
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-green-400 mb-2">
            Sin inconsistencias pendientes
          </h2>
          <p className="text-slate-400">
            Todos los roles han sido revisados y validados correctamente.
          </p>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SPLIT VIEW: SECCIÓN A - LIDERAZGO OCULTO
      ══════════════════════════════════════════════════════════════════ */}
      {!loading && !error && counts.liderazgoOculto > 0 && (
        <LiderazgoOcultoSection
          employees={liderazgoOculto}
          resolving={resolving}
          onResolve={resolveAnomaly}
          onResolveAll={handleResolveAllHiddenManagers}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SPLIT VIEW: SECCIÓN B - CARGOS NUEVOS
      ══════════════════════════════════════════════════════════════════ */}
      {!loading && !error && counts.cargosNuevos > 0 && (
        <CargosNuevosSection
          cargosAgrupados={cargosAgrupados}
          totalEmpleados={counts.cargosNuevos}
          resolving={resolving}
          onResolveGroup={resolveCargoGroup}
        />
      )}

    </div>
  )
}
