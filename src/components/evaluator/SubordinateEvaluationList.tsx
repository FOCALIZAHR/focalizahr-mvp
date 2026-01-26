'use client'

// ════════════════════════════════════════════════════════════════════════════
// SUBORDINATE EVALUATION LIST - Lista de subordinados a evaluar
// src/components/evaluator/SubordinateEvaluationList.tsx
// ════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, CheckCircle } from 'lucide-react'
import SubordinateEvaluationCard, { EvaluationAssignment } from './SubordinateEvaluationCard'

interface SubordinateEvaluationListProps {
  assignments: EvaluationAssignment[]
  onEvaluate: (assignmentId: string, token: string | null) => void
  onViewSummary: (assignmentId: string) => void
}

export default function SubordinateEvaluationList({
  assignments,
  onEvaluate,
  onViewSummary
}: SubordinateEvaluationListProps) {
  // Separar pendientes y completadas
  const { pendingAssignments, completedAssignments } = useMemo(() => {
    const pending: EvaluationAssignment[] = []
    const completed: EvaluationAssignment[] = []

    assignments.forEach(a => {
      if (a.status === 'completed') {
        completed.push(a)
      } else if (a.status === 'pending' || a.status === 'in_progress') {
        pending.push(a)
      }
    })

    return { pendingAssignments: pending, completedAssignments: completed }
  }, [assignments])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Sección: Pendientes */}
      {pendingAssignments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-medium text-slate-200">
              Evaluaciones Pendientes
            </h3>
            <span className="fhr-badge fhr-badge-active text-xs">
              {pendingAssignments.length}
            </span>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {pendingAssignments.map(assignment => (
              <SubordinateEvaluationCard
                key={assignment.id}
                assignment={assignment}
                onEvaluate={() => onEvaluate(assignment.id, assignment.participantToken)}
                onViewSummary={() => onViewSummary(assignment.id)}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Sección: Completadas */}
      {completedAssignments.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-medium text-slate-200">
              Evaluaciones Completadas
            </h3>
            <span className="fhr-badge fhr-badge-success text-xs">
              {completedAssignments.length}
            </span>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {completedAssignments.map(assignment => (
              <SubordinateEvaluationCard
                key={assignment.id}
                assignment={assignment}
                onEvaluate={() => onEvaluate(assignment.id, assignment.participantToken)}
                onViewSummary={() => onViewSummary(assignment.id)}
              />
            ))}
          </motion.div>
        </div>
      )}
    </div>
  )
}
