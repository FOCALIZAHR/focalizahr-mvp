/**
 * POST /api/job-classification/batch-assign
 *
 * Asignación masiva en transacción atómica Prisma.
 * Soporta DOS formatos:
 *
 * FORMATO A (nuevo, per-employee):
 * {
 *   classifications: [{ employeeId, performanceTrack, standardJobLevel }]
 *   accountId?: string  // solo FOCALIZAHR_ADMIN
 * }
 *
 * FORMATO B (legacy, per-position):
 * {
 *   assignments: [{ position, standardJobLevel }]
 *   accountId?: string  // solo FOCALIZAHR_ADMIN
 * }
 *
 * Roles: FOCALIZAHR_ADMIN, ACCOUNT_OWNER, HR_ADMIN, HR_MANAGER, CLIENT
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PositionAdapter } from '@/lib/services/PositionAdapter'
import {
  batchClassificationsSchema,
  batchAssignmentsSchema,
  deriveAcotadoGroup,
  derivePerformanceTrack
} from '@/lib/validations/job-classification'

const ALLOWED_ROLES = [
  'FOCALIZAHR_ADMIN',
  'ACCOUNT_OWNER',
  'HR_ADMIN',
  'HR_MANAGER',
  'CLIENT'
]

const CHUNK_SIZE = 20

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // ════════════════════════════════════════════════════════════════════════
    // 1. AUTH
    // ════════════════════════════════════════════════════════════════════════

    const headerAccountId = request.headers.get('x-account-id')
    const userRole = request.headers.get('x-user-role') || ''
    const userEmail = request.headers.get('x-user-email') || ''

    if (!headerAccountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos para clasificar cargos' },
        { status: 403 }
      )
    }

    // ════════════════════════════════════════════════════════════════════════
    // 2. PARSE BODY
    // ════════════════════════════════════════════════════════════════════════

    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Body JSON invalido' },
        { status: 400 }
      )
    }

    // RBAC: admin puede especificar otra cuenta
    const isFocalizahrAdmin = userRole === 'FOCALIZAHR_ADMIN'
    const targetAccountId = isFocalizahrAdmin
      ? ((body.accountId as string) || headerAccountId)
      : headerAccountId

    // ════════════════════════════════════════════════════════════════════════
    // 3. DETECT FORMAT & VALIDATE
    // ════════════════════════════════════════════════════════════════════════

    if (body.classifications) {
      // ── FORMAT A: Per-employee (new, from draft) ──
      return handleClassifications(body, targetAccountId, userEmail, startTime)
    } else if (body.assignments) {
      // ── FORMAT B: Per-position (legacy) ──
      return handleAssignments(body, targetAccountId, userEmail, startTime)
    } else {
      return NextResponse.json(
        { success: false, error: 'Body debe contener "classifications" o "assignments"' },
        { status: 400 }
      )
    }
  } catch (error: unknown) {
    const duration = Date.now() - startTime
    console.error(`[Batch Assign] Error (${duration}ms):`, error)

    // Prisma-specific error handling
    const prismaError = error as { code?: string }
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Uno o mas empleados no encontrados' },
        { status: 404 }
      )
    }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Conflicto de datos (registro duplicado)' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FORMAT A: Per-employee classifications (new, from useClassificationDraft)
// ══════════════════════════════════════════════════════════════════════════════

async function handleClassifications(
  body: Record<string, unknown>,
  targetAccountId: string,
  userEmail: string,
  startTime: number
) {
  // Validate with zod
  const validation = batchClassificationsSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Datos invalidos', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { classifications } = validation.data
  console.log(`[Batch Assign] Format A: ${classifications.length} employee classifications`)

  // Validate ownership: all employeeIds must belong to targetAccountId
  const employeeIds = classifications.map(c => c.employeeId)
  const employees = await prisma.employee.findMany({
    where: {
      id: { in: employeeIds },
      accountId: targetAccountId
    },
    select: { id: true, position: true }
  })

  const foundIds = new Set(employees.map(e => e.id))
  const missingIds = employeeIds.filter(id => !foundIds.has(id))

  if (missingIds.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `${missingIds.length} empleado(s) no encontrado(s) o sin acceso`,
        missingIds
      },
      { status: 400 }
    )
  }

  const employeeMap = new Map(employees.map(e => [e.id, e]))
  const now = new Date()

  // Chunked transactions to avoid P2028 timeout
  const chunks = chunk(classifications, CHUNK_SIZE)
  let totalUpdated = 0
  let totalHistoryCreated = 0
  const errors: Array<{ chunk: number; error: string }> = []

  for (let i = 0; i < chunks.length; i++) {
    const chunkItems = chunks[i]
    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update each employee in this chunk
        const updatePromises = chunkItems.map(c => {
          const acotadoGroup = deriveAcotadoGroup(c.standardJobLevel)
          return tx.employee.update({
            where: { id: c.employeeId },
            data: {
              standardJobLevel: c.standardJobLevel,
              acotadoGroup,
              performanceTrack: c.performanceTrack,
              jobLevelMethod: 'manual',
              jobLevelMappedAt: now,
              trackMappedAt: now,
              trackHasAnomaly: false,
              pendingReview: false
            }
          })
        })
        await Promise.all(updatePromises)

        // 2. Upsert JobMappingHistory (deduplicated by position within chunk)
        const uniquePositions = new Map<string, { position: string; standardJobLevel: string }>()
        for (const c of chunkItems) {
          const emp = employeeMap.get(c.employeeId)
          if (emp?.position) {
            const key = emp.position.toLowerCase().trim()
            uniquePositions.set(key, {
              position: emp.position,
              standardJobLevel: c.standardJobLevel
            })
          }
        }

        let historyCount = 0
        for (const [key, entry] of uniquePositions) {
          const acotadoGroup = deriveAcotadoGroup(entry.standardJobLevel) || 'profesionales'
          await tx.jobMappingHistory.upsert({
            where: {
              accountId_clientPositionTitle: {
                accountId: targetAccountId,
                clientPositionTitle: key
              }
            },
            create: {
              accountId: targetAccountId,
              clientPositionTitle: key,
              standardJobLevel: entry.standardJobLevel,
              acotadoGroup,
              mappingMethod: 'manual',
              correctedBy: userEmail || null
            },
            update: {
              standardJobLevel: entry.standardJobLevel,
              acotadoGroup,
              mappingMethod: 'manual',
              correctedBy: userEmail || null
            }
          })
          historyCount++
        }

        return { updated: chunkItems.length, historyCreated: historyCount }
      })

      totalUpdated += result.updated
      totalHistoryCreated += result.historyCreated
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      console.error(`[Batch Assign] Chunk ${i + 1}/${chunks.length} failed:`, msg)
      errors.push({ chunk: i + 1, error: msg })
    }
  }

  const duration = Date.now() - startTime
  console.log(`[Batch Assign] Format A completed in ${duration}ms: ${totalUpdated} updated, ${errors.length} chunk errors`)

  return NextResponse.json({
    success: errors.length === 0,
    updated: totalUpdated,
    failed: classifications.length - totalUpdated,
    historyCreated: totalHistoryCreated,
    errors
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// FORMAT B: Per-position assignments (legacy, from UnmappedPositionsDrawer)
// ══════════════════════════════════════════════════════════════════════════════

async function handleAssignments(
  body: Record<string, unknown>,
  targetAccountId: string,
  userEmail: string,
  startTime: number
) {
  // Validate with zod
  const validation = batchAssignmentsSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { success: false, error: 'Datos invalidos', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { assignments } = validation.data
  console.log(`[Batch Assign] Format B: ${assignments.length} position assignments`)

  const now = new Date()

  // Chunked transactions to avoid P2028 timeout
  const chunks = chunk(assignments, CHUNK_SIZE)
  const allResults: Array<{ position: string; standardJobLevel: string; updatedCount: number }> = []
  const errors: Array<{ chunk: number; error: string }> = []

  for (let i = 0; i < chunks.length; i++) {
    const chunkItems = chunks[i]
    try {
      const chunkResults = await prisma.$transaction(async (tx) => {
        const results: Array<{ position: string; standardJobLevel: string; updatedCount: number }> = []

        for (const item of chunkItems) {
          const acotadoGroup = PositionAdapter.getAcotadoGroup(item.standardJobLevel)
          const performanceTrack = derivePerformanceTrack(item.standardJobLevel)

          const updated = await tx.employee.updateMany({
            where: {
              accountId: targetAccountId,
              position: { equals: item.position, mode: 'insensitive' },
              status: 'ACTIVE'
            },
            data: {
              standardJobLevel: item.standardJobLevel,
              acotadoGroup,
              performanceTrack,
              jobLevelMethod: 'manual',
              jobLevelMappedAt: now,
              trackMappedAt: now,
              trackHasAnomaly: false
            }
          })

          results.push({
            position: item.position,
            standardJobLevel: item.standardJobLevel,
            updatedCount: updated.count
          })
        }

        // JobMappingHistory for this chunk
        for (const item of chunkItems) {
          const acotadoGroup = deriveAcotadoGroup(item.standardJobLevel) || 'profesionales'
          const key = item.position.toLowerCase().trim()

          await tx.jobMappingHistory.upsert({
            where: {
              accountId_clientPositionTitle: {
                accountId: targetAccountId,
                clientPositionTitle: key
              }
            },
            create: {
              accountId: targetAccountId,
              clientPositionTitle: key,
              standardJobLevel: item.standardJobLevel,
              acotadoGroup,
              mappingMethod: 'manual',
              correctedBy: userEmail || null
            },
            update: {
              standardJobLevel: item.standardJobLevel,
              acotadoGroup,
              mappingMethod: 'manual',
              correctedBy: userEmail || null
            }
          })
        }

        return results
      })

      allResults.push(...chunkResults)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      console.error(`[Batch Assign] Chunk ${i + 1}/${chunks.length} failed:`, msg)
      errors.push({ chunk: i + 1, error: msg })
    }
  }

  const totalUpdated = allResults.reduce((sum, r) => sum + r.updatedCount, 0)
  const duration = Date.now() - startTime
  console.log(`[Batch Assign] Format B completed in ${duration}ms: ${totalUpdated} employees, ${errors.length} chunk errors`)

  return NextResponse.json({
    success: errors.length === 0,
    updated: totalUpdated,
    failed: assignments.length - allResults.length,
    historyCreated: allResults.length,
    errors,
    results: allResults
  })
}
