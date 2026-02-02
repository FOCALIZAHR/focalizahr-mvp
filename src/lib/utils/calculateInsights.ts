// src/lib/utils/calculateInsights.ts
// Dynamic insight calculation for Cinema Mode SpotlightCard

import { Calendar, AlertTriangle, CheckCircle2, ClipboardList, Clock, Award } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getPerformanceClassification, PerformanceLevel } from '@/config/performanceClassification'

export interface Insight {
  type: 'tenure' | 'resultado' | 'gap' | 'selfEval' | 'evaluationType' | 'dueDate' | 'completedAt'
  icon: LucideIcon
  label: string
  value: string
  variant: 'default' | 'warning' | 'success'
}

interface EmployeeData {
  tenure: string
  status?: string
  evaluationType?: string
  dueDate?: string
  completedAt?: string
  avgScore?: number | null
  lastScore?: string | null
  gap?: string | null
  selfEvalStatus?: string | null
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

function isUrgent(dateStr: string): boolean {
  try {
    const diff = new Date(dateStr).getTime() - Date.now()
    return diff < 3 * 24 * 60 * 60 * 1000 // less than 3 days
  } catch {
    return false
  }
}

function getCategory(scoreOn5: number): { label: string; variant: 'default' | 'warning' | 'success' } {
  const classification = getPerformanceClassification(scoreOn5)
  const level = classification.level
  if (level === PerformanceLevel.EXCEPTIONAL || level === PerformanceLevel.EXCEEDS) {
    return { label: classification.label, variant: 'success' }
  }
  if (level === PerformanceLevel.MEETS) {
    return { label: classification.label, variant: 'default' }
  }
  return { label: classification.label, variant: 'warning' }
}

export function calculateInsights(employee: EmployeeData): Insight[] {
  const insights: Insight[] = []

  // Always: tenure
  insights.push({
    type: 'tenure',
    icon: Calendar,
    label: 'Antiguedad',
    value: employee.tenure || 'Sin datos',
    variant: 'default'
  })

  // Evaluation type
  if (employee.evaluationType) {
    insights.push({
      type: 'evaluationType',
      icon: ClipboardList,
      label: 'Tipo',
      value: employee.evaluationType,
      variant: 'default'
    })
  }

  // Due date (only if not completed)
  if (employee.status !== 'completed' && employee.dueDate) {
    insights.push({
      type: 'dueDate',
      icon: Clock,
      label: 'Fecha Limite',
      value: formatDate(employee.dueDate),
      variant: isUrgent(employee.dueDate) ? 'warning' : 'default'
    })
  }

  // Result: score + classification combined (only for completed)
  if (employee.status === 'completed' && employee.avgScore != null) {
    const scoreOn5 = employee.avgScore / 20
    const category = getCategory(scoreOn5)

    insights.push({
      type: 'resultado',
      icon: Award,
      label: 'Resultado',
      value: `${scoreOn5.toFixed(1)}/5 · ${category.label}`,
      variant: category.variant
    })
  }

  // Completed date
  if (employee.status === 'completed' && employee.completedAt) {
    insights.push({
      type: 'completedAt',
      icon: CheckCircle2,
      label: 'Completada',
      value: formatDate(employee.completedAt),
      variant: 'success'
    })
  }

  // If has detected gap (future feature)
  if (employee.gap) {
    insights.push({
      type: 'gap',
      icon: AlertTriangle,
      label: 'Foco Detectado',
      value: `Se recomienda observar: ${employee.gap}`,
      variant: 'warning'
    })
  }

  // Self-evaluation status
  if (employee.selfEvalStatus === 'completed') {
    insights.push({
      type: 'selfEval',
      icon: CheckCircle2,
      label: 'Autoevaluacion',
      value: 'Completada',
      variant: 'success'
    })
  }

  return insights
}
