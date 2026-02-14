// ============================================================================
// JOB CLASSIFICATION - Zod Validation Schemas
// src/lib/validations/job-classification.ts
// ============================================================================

import { z } from 'zod'

// ══════════════════════════════════════════════════════════════════════════
// ENUMS
// ══════════════════════════════════════════════════════════════════════════

export const performanceTrackSchema = z.enum(['COLABORADOR', 'MANAGER', 'EJECUTIVO'])

export const standardJobLevelSchema = z.enum([
  'gerente_director',
  'subgerente_subdirector',
  'jefe',
  'supervisor_coordinador',
  'profesional_analista',
  'asistente_otros',
  'operativo_auxiliar'
])

// ══════════════════════════════════════════════════════════════════════════
// CLASSIFICATION ITEM (employee-based, new format)
// ══════════════════════════════════════════════════════════════════════════

export const classificationItemSchema = z.object({
  employeeId: z.string().min(1, 'ID de empleado requerido'),
  performanceTrack: performanceTrackSchema,
  standardJobLevel: standardJobLevelSchema
})

export type ClassificationItem = z.infer<typeof classificationItemSchema>

// ══════════════════════════════════════════════════════════════════════════
// ASSIGNMENT ITEM (position-based, legacy format)
// ══════════════════════════════════════════════════════════════════════════

export const assignmentItemSchema = z.object({
  position: z.string().min(1, 'Position requerida'),
  standardJobLevel: standardJobLevelSchema
})

export type AssignmentItem = z.infer<typeof assignmentItemSchema>

// ══════════════════════════════════════════════════════════════════════════
// BATCH REQUEST SCHEMAS
// ══════════════════════════════════════════════════════════════════════════

/** New format: per-employee classifications from draft */
export const batchClassificationsSchema = z.object({
  classifications: z
    .array(classificationItemSchema)
    .min(1, 'Debe incluir al menos 1 clasificación')
    .max(500, 'Máximo 500 clasificaciones por batch'),
  accountId: z.string().optional()
})

export type BatchClassificationsRequest = z.infer<typeof batchClassificationsSchema>

/** Legacy format: per-position assignments */
export const batchAssignmentsSchema = z.object({
  assignments: z
    .array(assignmentItemSchema)
    .min(1, 'Debe incluir al menos 1 asignación')
    .max(100, 'Máximo 100 asignaciones por batch'),
  accountId: z.string().optional()
})

export type BatchAssignmentsRequest = z.infer<typeof batchAssignmentsSchema>

// ══════════════════════════════════════════════════════════════════════════
// RESPONSE
// ══════════════════════════════════════════════════════════════════════════

export interface BatchAssignResponse {
  success: boolean
  updated: number
  historyCreated: number
  errors?: Array<{
    employeeId?: string
    position?: string
    error: string
  }>
}

// ══════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════

const ACOTADO_MAPPING: Record<string, string> = {
  'gerente_director': 'alta_gerencia',
  'subgerente_subdirector': 'alta_gerencia',
  'jefe': 'mandos_medios',
  'supervisor_coordinador': 'mandos_medios',
  'profesional_analista': 'profesionales',
  'asistente_otros': 'base_operativa',
  'operativo_auxiliar': 'base_operativa'
}

const TRACK_MAPPING: Record<string, string> = {
  'gerente_director': 'EJECUTIVO',
  'subgerente_subdirector': 'EJECUTIVO',
  'jefe': 'MANAGER',
  'supervisor_coordinador': 'MANAGER',
  'profesional_analista': 'COLABORADOR',
  'asistente_otros': 'COLABORADOR',
  'operativo_auxiliar': 'COLABORADOR'
}

/** Derive acotadoGroup from standardJobLevel */
export function deriveAcotadoGroup(standardJobLevel: string): string | null {
  return ACOTADO_MAPPING[standardJobLevel] || null
}

/** Derive performanceTrack from standardJobLevel */
export function derivePerformanceTrack(standardJobLevel: string): string {
  return TRACK_MAPPING[standardJobLevel] || 'COLABORADOR'
}
