'use client'

// ════════════════════════════════════════════════════════════════════════════
// GOAL STEP COVER - Portada Narrativa del Wizard (Patrón MomentCover)
// src/components/goals/wizard/GoalStepCover.tsx
// ════════════════════════════════════════════════════════════════════════════

import { memo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { formatDisplayName } from '@/lib/utils/formatName'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

interface AssignmentStatus {
  totalWeight: number
  goalCount: number
  maxGoals: number
  status: 'EMPTY' | 'INCOMPLETE' | 'READY' | 'EXCEEDED'
  isComplete: boolean
}

interface GoalStepCoverProps {
  employeeName: string
  assignmentStatus: AssignmentStatus
  onEnter: () => void
}

// ════════════════════════════════════════════════════════════════════════════
// NARRATIVA DINÁMICA
// ════════════════════════════════════════════════════════════════════════════

function getNarrative(firstName: string, status: AssignmentStatus): ReactNode {
  const availableWeight = 100 - status.totalWeight

  if (status.status === 'EMPTY') {
    return (
      <>
        <span className="text-cyan-400 font-medium">{firstName}</span>
        {' aún no tiene metas asignadas. Comencemos a definir sus objetivos.'}
      </>
    )
  }

  if (status.status === 'READY') {
    return (
      <>
        <span className="text-cyan-400 font-medium">{firstName}</span>
        {' ya tiene su plan completo. ¿Deseas agregar una meta adicional?'}
      </>
    )
  }

  // INCOMPLETE
  return (
    <>
      {'A '}
      <span className="text-cyan-400 font-medium">{firstName}</span>
      {' le falta un '}
      <span className="text-purple-400 font-medium">{availableWeight}%</span>
      {' para completar su plan de Metas.'}
    </>
  )
}

function getSubtitle(status: AssignmentStatus): string {
  if (status.status === 'EMPTY') {
    return 'Define su primera meta para este período.'
  }
  if (status.status === 'READY') {
    return 'Tendrás que ajustar los pesos existentes.'
  }
  return 'Definamos su próximo enfoque objetivo.'
}

function getCTA(status: AssignmentStatus): string {
  if (status.status === 'EMPTY') {
    return 'Definir Primera Meta'
  }
  if (status.status === 'READY') {
    return 'Agregar Meta Adicional'
  }
  return 'Definir Meta'
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTE
// ════════════════════════════════════════════════════════════════════════════

export default memo(function GoalStepCover({
  employeeName,
  assignmentStatus,
  onEnter
}: GoalStepCoverProps) {

  const firstName = formatDisplayName(employeeName, 'short').split(' ')[0]

  const narrative = getNarrative(firstName, assignmentStatus)
  const subtitle = getSubtitle(assignmentStatus)
  const ctaText = getCTA(assignmentStatus)

  return (
    <div className="flex flex-col h-full min-h-[60vh] justify-center items-center text-center px-6">

      {/* Narrativa Principal */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl md:text-3xl font-light text-white leading-relaxed max-w-xl mb-6"
      >
        {narrative}
      </motion.h1>

      {/* Subtítulo */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-lg text-slate-400 mb-10"
      >
        {subtitle}
      </motion.p>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={onEnter}
        className="flex items-center gap-3 px-8 py-3 rounded-xl font-medium text-base transition-all"
        style={{
          background: 'linear-gradient(135deg, #22D3EE, #22D3EEDD)',
          color: '#0F172A',
          boxShadow: '0 8px 24px -6px rgba(34, 211, 238, 0.4)'
        }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>{ctaText}</span>
        <ArrowRight className="w-4 h-4" />
      </motion.button>

      {/* Stats discretos */}
      {assignmentStatus.status !== 'EMPTY' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 flex items-center gap-6 text-sm text-slate-500"
        >
          <span>Metas: {assignmentStatus.goalCount} de {assignmentStatus.maxGoals}</span>
          <span className="w-1 h-1 rounded-full bg-slate-600" />
          <span>Peso asignado: {assignmentStatus.totalWeight}%</span>
        </motion.div>
      )}

    </div>
  )
})
