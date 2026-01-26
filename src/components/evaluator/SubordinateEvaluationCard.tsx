'use client'

// ════════════════════════════════════════════════════════════════════════════
// SUBORDINATE EVALUATION CARD - Card individual de subordinado
// src/components/evaluator/SubordinateEvaluationCard.tsx
// ════════════════════════════════════════════════════════════════════════════

import { motion } from 'framer-motion'
import { User, CheckCircle, Clock, ArrowRight, Eye, Briefcase, Building2 } from 'lucide-react'

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface EvaluationAssignment {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'expired' | 'cancelled'
  completedAt?: string
  dueDate?: string
  evaluationType: string
  evaluatee: {
    id: string
    fullName: string
    position: string | null
    departmentName: string
    tenure: string
    avatarUrl?: string
  }
  participantToken: string | null
  surveyUrl?: string | null
}

interface SubordinateEvaluationCardProps {
  assignment: EvaluationAssignment
  onEvaluate: () => void
  onViewSummary: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════════════════

export default function SubordinateEvaluationCard({
  assignment,
  onEvaluate,
  onViewSummary
}: SubordinateEvaluationCardProps) {
  const isCompleted = assignment.status === 'completed'
  const isPending = assignment.status === 'pending' || assignment.status === 'in_progress'

  // Formatear fecha de completado
  const formatCompletedDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short'
    })
  }

  // Obtener iniciales para avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  // Etiqueta del tipo de evaluación
  const getEvaluationTypeLabel = (type: string) => {
    switch (type) {
      case 'MANAGER': return 'Evaluación de Jefe'
      case 'SELF': return 'Autoevaluación'
      case 'PEER': return 'Evaluación de Par'
      case 'UPWARD': return 'Evaluación Ascendente'
      default: return 'Evaluación'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        fhr-card p-4 transition-all
        ${isCompleted ? 'bg-green-500/5 border-green-500/30' : 'hover:border-cyan-500/30'}
      `}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={`
          w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
          ${isCompleted
            ? 'bg-green-500/20 border-2 border-green-500/50'
            : 'bg-slate-800 border-2 border-slate-700'
          }
        `}>
          {isCompleted ? (
            <CheckCircle className="w-6 h-6 text-green-400" />
          ) : assignment.evaluatee.avatarUrl ? (
            <img
              src={assignment.evaluatee.avatarUrl}
              alt={assignment.evaluatee.fullName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-lg font-medium text-slate-400">
              {getInitials(assignment.evaluatee.fullName)}
            </span>
          )}
        </div>

        {/* Info del Evaluado */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-slate-200 truncate">
              {assignment.evaluatee.fullName}
            </h3>
            {/* Badge de estado */}
            {isCompleted ? (
              <span className="fhr-badge bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                Completada
              </span>
            ) : (
              <span className="fhr-badge bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                Pendiente
              </span>
            )}
          </div>

          {/* Cargo */}
          <div className="flex items-center gap-1 text-sm text-slate-400 mb-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span className="truncate">
              {assignment.evaluatee.position || 'Sin cargo asignado'}
            </span>
          </div>

          {/* Departamento y Antigüedad */}
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>{assignment.evaluatee.departmentName}</span>
            </div>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{assignment.evaluatee.tenure}</span>
            </div>
          </div>

          {/* Fecha de completado si aplica */}
          {isCompleted && assignment.completedAt && (
            <div className="text-xs text-green-400/70 mt-1">
              Completada el {formatCompletedDate(assignment.completedAt)}
            </div>
          )}
        </div>

        {/* Botón de Acción */}
        <div className="flex-shrink-0">
          {isPending ? (
            <button
              onClick={onEvaluate}
              className="fhr-btn fhr-btn-primary flex items-center gap-2"
            >
              <span>Evaluar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : isCompleted ? (
            <button
              onClick={onViewSummary}
              className="fhr-btn fhr-btn-ghost flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Resumen</span>
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}
