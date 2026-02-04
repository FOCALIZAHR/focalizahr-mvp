// ════════════════════════════════════════════════════════════════════════════
// NINE BOX DRAWER - Panel Lateral Cinema FocalizaHR
// src/components/performance/NineBoxDrawer.tsx
// ════════════════════════════════════════════════════════════════════════════
// PATRON: Detail + Drawer (FILOSOFIA_DISENO_FOCALIZAHR_v1.md)
// INSPIRADO EN: dashboard/evaluaciones SpotlightCard + InsightCard
// NO: Modales sobre modales
// ════════════════════════════════════════════════════════════════════════════

'use client'

import { memo, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  X, User, Building2, ChevronRight, Search, Award, Target
} from 'lucide-react'
import {
  NineBoxPosition,
  getNineBoxPositionConfig
} from '@/config/performanceClassification'
import type { Employee9Box } from './NineBoxGrid'

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

interface NineBoxDrawerProps {
  isOpen: boolean
  position: NineBoxPosition | null
  employees: Employee9Box[]
  onClose: () => void
  onEmployeeSelect?: (employee: Employee9Box) => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════

export default memo(function NineBoxDrawer({
  isOpen,
  position,
  employees,
  onClose,
  onEmployeeSelect
}: NineBoxDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isOpen) setSearchTerm('')
  }, [isOpen])

  if (!position) return null

  const config = getNineBoxPositionConfig(position)

  const filteredEmployees = employees.filter(emp =>
    emp.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate averages
  const avgPerformance = employees.length > 0
    ? employees.reduce((sum, e) => sum + (e.finalScore ?? e.calculatedScore), 0) / employees.length
    : 0
  const avgPotential = employees.length > 0
    ? employees.reduce((sum, e) => sum + (e.potentialScore || 0), 0) / employees.length
    : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* CINEMA BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* DRAWER LATERAL - Glassmorphism */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 h-full w-full sm:w-[480px]',
              'bg-[#0F172A]/95 backdrop-blur-xl',
              'border-l border-slate-700/50',
              'shadow-2xl shadow-black/50',
              'z-50 flex flex-col'
            )}
          >
            {/* HEADER con Linea Tesla */}
            <div className="relative p-6 border-b border-slate-700/50">
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
                  boxShadow: `0 0 15px ${config.color}`
                }}
              />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar grande estilo SpotlightCard */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-2"
                      style={{
                        background: `linear-gradient(135deg, ${config.color}20, ${config.color}10)`,
                        borderColor: `${config.color}40`,
                        color: config.color
                      }}
                    >
                      {config.labelShort}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold" style={{ color: config.color }}>
                      {config.label}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {employees.length} {employees.length === 1 ? 'empleado' : 'empleados'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                {config.description}
              </p>
            </div>

            {/* MINI-CARDS INSIGHT (estilo InsightCard) */}
            <div className="p-4 border-b border-slate-800/50">
              <div className="grid grid-cols-2 gap-3">
                <MiniInsightCard
                  icon={<Award className="w-4 h-4" />}
                  label="Performance Promedio"
                  value={avgPerformance.toFixed(1)}
                  color={config.color}
                />
                <MiniInsightCard
                  icon={<Target className="w-4 h-4" />}
                  label="Potencial Promedio"
                  value={avgPotential.toFixed(1)}
                  color={config.color}
                />
              </div>
            </div>

            {/* SEARCH BAR */}
            <div className="p-4 border-b border-slate-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar empleado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
                    'bg-slate-800/50 backdrop-blur-sm border border-slate-700/50',
                    'text-slate-200 placeholder-slate-500',
                    'focus:outline-none focus:ring-2 focus:ring-cyan-500/30'
                  )}
                />
              </div>
            </div>

            {/* LISTA DE EMPLEADOS CON AVATARES */}
            <div className="flex-1 overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <EmptyState searchTerm={searchTerm} />
              ) : (
                <div className="p-4 space-y-3">
                  {filteredEmployees.map((employee) => (
                    <EmployeeCardCinema
                      key={employee.id}
                      employee={employee}
                      positionColor={config.color}
                      onClick={() => onEmployeeSelect?.(employee)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// MINI INSIGHT CARD (estilo InsightCard de evaluaciones)
// ════════════════════════════════════════════════════════════════════════════

interface MiniInsightCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}

const MiniInsightCard = memo(function MiniInsightCard({
  icon,
  label,
  value,
  color
}: MiniInsightCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 backdrop-blur-sm border border-slate-700/40">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-base font-semibold text-slate-200">{value}</p>
      </div>
    </div>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE CARD CINEMA (CON AVATAR estilo SpotlightCard)
// ════════════════════════════════════════════════════════════════════════════

interface EmployeeCardCinemaProps {
  employee: Employee9Box
  positionColor: string
  onClick: () => void
}

const EmployeeCardCinema = memo(function EmployeeCardCinema({
  employee,
  positionColor,
  onClick
}: EmployeeCardCinemaProps) {
  const effectiveScore = employee.finalScore ?? employee.calculatedScore

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full p-4 rounded-xl text-left transition-all',
        'bg-slate-800/40 backdrop-blur-sm border border-slate-700/40',
        'hover:bg-slate-800/60 hover:border-slate-600/60',
        'group'
      )}
    >
      <div className="flex items-center gap-3">
        {/* AVATAR CIRCULAR (estilo SpotlightCard) */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-sm font-bold text-slate-400 border border-slate-700">
            {getInitials(employee.employeeName)}
          </div>

          {/* Ring de potencial */}
          {employee.potentialScore && employee.potentialScore >= 4 && (
            <div className="absolute inset-[-3px] rounded-full border border-cyan-500/30 animate-pulse" />
          )}
        </div>

        {/* INFO */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-200 truncate group-hover:text-white transition-colors">
            {employee.employeeName}
          </h4>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {employee.employeePosition || 'Sin cargo'}
          </p>
          {employee.department && (
            <p className="text-[10px] text-slate-600 truncate mt-0.5 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {employee.department}
            </p>
          )}
        </div>

        {/* SCORES */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Perf:</span>
            <span className="text-sm font-semibold" style={{ color: positionColor }}>
              {effectiveScore.toFixed(1)}
            </span>
          </div>
          {employee.potentialScore && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Pot:</span>
              <span className="text-sm font-semibold text-cyan-400">
                {employee.potentialScore.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
      </div>
    </motion.button>
  )
})

// ════════════════════════════════════════════════════════════════════════════
// EMPTY STATE PREMIUM
// ════════════════════════════════════════════════════════════════════════════

const EmptyState = memo(function EmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      {/* Ilustracion */}
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center mb-6 border border-slate-700/50">
        <User className="w-12 h-12 text-slate-600" />
      </div>

      {/* Mensaje */}
      <h3 className="text-base font-medium text-slate-300 mb-2">
        {searchTerm ? 'No se encontraron empleados' : 'Sin empleados'}
      </h3>
      <p className="text-sm text-slate-500 max-w-xs">
        {searchTerm
          ? 'Intenta con otro termino de busqueda'
          : 'No hay empleados en esta posicion del 9-Box'}
      </p>

      {searchTerm && (
        <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
          <p className="text-xs text-slate-400">
            Buscando: <span className="text-cyan-400 font-medium">{searchTerm}</span>
          </p>
        </div>
      )}
    </div>
  )
})
