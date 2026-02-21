'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Building2, Briefcase, Calendar, Users, Check, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface AvatarInfoModalProps {
  isOpen: boolean
  onClose: () => void
  employee: {
    displayName: string
    position: string
    department: string
    tenure?: string
    status: string
    avgScore: number | null
    potentialScore: number | null
    potentialLevel: string | null
  }
}

export default memo(function AvatarInfoModal({
  isOpen,
  onClose,
  employee
}: AvatarInfoModalProps) {

  const initials = employee.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const hasED = employee.status === 'completed'
  const hasPT = employee.potentialScore !== null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

              {/* Tesla line */}
              <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

              {/* Header */}
              <div className="relative pt-8 pb-6 px-6 text-center bg-gradient-to-b from-slate-800/50 to-transparent">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>

                {/* Avatar */}
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-2xl font-bold text-slate-300 border-2 border-slate-600 mb-4">
                  {initials}
                </div>

                <h2 className="text-xl font-bold text-white mb-1">
                  {employee.displayName}
                </h2>
                <p className="text-sm text-slate-400">
                  {employee.position}
                </p>
              </div>

              {/* Info */}
              <div className="px-6 pb-4 space-y-1">
                <InfoRow icon={Building2} label="Departamento" value={employee.department} />
                <InfoRow icon={Briefcase} label="Cargo" value={employee.position} />
                <InfoRow icon={Calendar} label="Antigüedad" value={employee.tenure || 'No disponible'} />
                <InfoRow icon={Users} label="Tipo" value="Evaluación del Jefe" />
              </div>

              {/* Separador */}
              <div className="mx-6 h-px bg-slate-800" />

              {/* Estado de evaluación */}
              <div className="px-6 py-4 space-y-3">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Estado de Evaluación
                </p>

                <div className="space-y-2">
                  <StatusRow
                    label="Desempeño"
                    done={hasED}
                    value={hasED ? `${employee.avgScore?.toFixed(1) || '-'} · Completado` : 'Pendiente'}
                  />
                  <StatusRow
                    label="Potencial"
                    done={hasPT}
                    value={hasPT ? `${employee.potentialScore?.toFixed(1)} · ${employee.potentialLevel}` : 'Pendiente'}
                  />
                  <StatusRow
                    label="PDI"
                    done={false}
                    value="Pendiente"
                  />
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
})

function InfoRow({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 flex justify-between items-center">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-sm text-white font-medium">{value}</span>
      </div>
    </div>
  )
}

function StatusRow({
  label,
  done,
  value
}: {
  label: string
  done: boolean
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {done ? (
          <Check className="w-4 h-4 text-purple-400" />
        ) : (
          <Clock className="w-4 h-4 text-slate-600" />
        )}
        <span className={cn(
          "text-sm",
          done ? "text-slate-200" : "text-slate-500"
        )}>
          {label}
        </span>
      </div>
      <span className={cn(
        "text-xs font-medium",
        done ? "text-purple-400" : "text-slate-600"
      )}>
        {value}
      </span>
    </div>
  )
}
