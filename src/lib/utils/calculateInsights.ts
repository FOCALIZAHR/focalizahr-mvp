// src/lib/utils/calculateInsights.ts
// Dynamic insight calculation for Cinema Mode SpotlightCard

import { Calendar, TrendingUp, AlertTriangle, CheckCircle2, ClipboardList, Clock, Award } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Insight {
  type: 'tenure' | 'lastScore' | 'gap' | 'selfEval' | 'evaluationType' | 'dueDate' | 'completedAt' | 'category'
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
  if (scoreOn5 >= 4.5) return { label: 'Excepcional', variant: 'success' }
  if (scoreOn5 >= 4.0) return { label: 'Excelente', variant: 'success' }
  if (scoreOn5 >= 3.5) return { label: 'Competente', variant: 'default' }
  if (scoreOn5 >= 3.0) return { label: 'En Desarrollo', variant: 'warning' }
  return { label: 'Necesita Apoyo', variant: 'warning' }
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

  // Average score (only for completed) - convert from 0-100 to 1-5 scale
  if (employee.status === 'completed' && employee.avgScore != null) {
    const scoreOn5 = employee.avgScore / 20
    const category = getCategory(scoreOn5)

    insights.push({
      type: 'lastScore',
      icon: TrendingUp,
      label: 'Score Promedio',
      value: `${scoreOn5.toFixed(1)}/5`,
      variant: 'success'
    })

    insights.push({
      type: 'category',
      icon: Award,
      label: 'Categoria',
      value: category.label,
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
