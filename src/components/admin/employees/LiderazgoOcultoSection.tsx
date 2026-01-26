'use client'

// ════════════════════════════════════════════════════════════════════════════
// LIDERAZGO OCULTO SECTION - Hidden Managers Detection
// src/components/admin/employees/LiderazgoOcultoSection.tsx
// ════════════════════════════════════════════════════════════════════════════
// Sección CRÍTICA: Colaboradores con personas a cargo
// - Línea Tesla ROJA (alert)
// - Ordenado DESC por número de reportes
// - Acción masiva "Corregir Todos a Manager"
// ════════════════════════════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  Users,
  ArrowUpCircle,
  Loader2
} from 'lucide-react'
import { PrimaryButton, GhostButton } from '@/components/ui/PremiumButton'
import type { AnomalyEmployee, ResolutionAction } from '@/hooks/useInconsistencies'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface LiderazgoOcultoSectionProps {
  employees: AnomalyEmployee[]
  resolving: string | null
  onResolve: (employeeId: string, action: ResolutionAction) => Promise<boolean>
  onResolveAll: () => Promise<boolean>
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE CARD COMPONENT
// ════════════════════════════════════════════════════════════════════════════

interface EmployeeCardProps {
  employee: AnomalyEmployee
  isResolving: boolean
  onResolve: (employeeId: string, action: ResolutionAction) => Promise<boolean>
}

function EmployeeCard({ employee, isResolving, onResolve }: EmployeeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-red-500/30 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Employee Info - Badge debajo del nombre */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-sm font-medium text-red-300 shrink-0">
            {getInitials(employee.fullName)}
          </div>

          {/* Name, Position & Badge */}
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{employee.fullName}</p>
            <p className="text-sm text-slate-400 truncate">
              {employee.position || 'Sin cargo'}
              <span className="text-slate-600 mx-1">·</span>
              <span className="text-slate-500">{employee.companyName}</span>
            </p>
            {/* Badge pequeño debajo */}
            <span className="inline-flex items-center gap-1 text-xs text-amber-400 mt-1">
              <AlertTriangle className="w-3 h-3" />
              Gestiona {employee.directReportsCount} {employee.directReportsCount === 1 ? 'persona' : 'personas'}
            </span>
          </div>
        </div>

        {/* Acciones apiladas - contenedor fijo, fullWidth en botones */}
        <div className="flex flex-col gap-2 w-[200px] shrink-0">
          <PrimaryButton
            size="sm"
            fullWidth
            icon={ArrowUpCircle}
            isLoading={isResolving}
            onClick={() => onResolve(employee.id, 'PROMOTE')}
            disabled={isResolving}
          >
            Corregir a Manager
          </PrimaryButton>

          <GhostButton
            size="sm"
            fullWidth
            onClick={() => onResolve(employee.id, 'CONFIRM')}
            disabled={isResolving}
          >
            Mantener en Colaborador
          </GhostButton>
        </div>
      </div>
    </motion.div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function LiderazgoOcultoSection({
  employees,
  resolving,
  onResolve,
  onResolveAll
}: LiderazgoOcultoSectionProps) {
  const isBulkResolving = resolving === 'bulk'
  const count = employees.length

  // Empty state
  if (count === 0) {
    return null
  }

  return (
    <div id="liderazgo-oculto" className="fhr-card relative overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════════════
          LÍNEA TESLA ROJA (h-[2px] más visible)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              LIDERAZGO OCULTO
              <span className="text-base font-normal text-cyan-400">({count})</span>
            </h2>
            <p className="text-sm text-slate-400 font-light leading-relaxed mt-1 max-w-xl">
              Cargos clasificados como contribuidor individual, pero el sistema detectó personas a su cargo.
              Define qué evaluación de desempeño les corresponde.
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          EMPLOYEE LIST
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="p-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {employees.map(emp => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              isResolving={resolving === emp.id}
              onResolve={onResolve}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER: BULK ACTION
      ═══════════════════════════════════════════════════════════════════════ */}
      {count > 1 && (
        <div className="p-6 pt-0">
          <PrimaryButton
            size="lg"
            fullWidth
            icon={isBulkResolving ? undefined : Users}
            isLoading={isBulkResolving}
            onClick={onResolveAll}
            disabled={isBulkResolving}
          >
            {isBulkResolving
              ? 'Procesando...'
              : `Corregir Todos a Manager (${count})`
            }
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}
