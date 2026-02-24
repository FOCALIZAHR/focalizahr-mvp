// src/app/api/config/goal-eligibility/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractUserContext, hasPermission } from '@/lib/services/AuthorizationService'
import { z } from 'zod'

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES - Niveles de cargo estándar
// ════════════════════════════════════════════════════════════════════════════

const STANDARD_JOB_LEVELS = [
  'gerente_director',
  'subgerente_subdirector',
  'jefe',
  'supervisor_coordinador',
  'profesional_analista',
  'asistente_otros',
  'operativo_auxiliar',
] as const

const JOB_LEVEL_LABELS: Record<string, string> = {
  gerente_director: 'Gerente / Director',
  subgerente_subdirector: 'Subgerente / Subdirector',
  jefe: 'Jefe',
  supervisor_coordinador: 'Supervisor / Coordinador',
  profesional_analista: 'Profesional / Analista',
  asistente_otros: 'Asistente / Otros',
  operativo_auxiliar: 'Operativo / Auxiliar',
}

// ════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN
// ════════════════════════════════════════════════════════════════════════════

const updateSchema = z.object({
  configs: z.array(z.object({
    standardJobLevel: z.string(),
    hasGoals: z.boolean(),
    goalGroupId: z.string().nullable().optional(),
  }))
})

// ════════════════════════════════════════════════════════════════════════════
// GET - Obtener configuración de elegibilidad por nivel de cargo
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener configs existentes
    const configs = await prisma.goalJobConfig.findMany({
      where: { accountId: context.accountId },
      include: {
        goalGroup: { select: { id: true, name: true, code: true } },
      },
      orderBy: { standardJobLevel: 'asc' },
    })

    // Contar empleados por nivel
    const employeeCounts = await prisma.employee.groupBy({
      by: ['standardJobLevel'],
      where: {
        accountId: context.accountId,
        status: 'ACTIVE',
        standardJobLevel: { not: null },
      },
      _count: { id: true },
    })

    const countMap: Record<string, number> = {}
    for (const ec of employeeCounts) {
      if (ec.standardJobLevel) {
        countMap[ec.standardJobLevel] = ec._count.id
      }
    }

    // Obtener goal groups disponibles
    const goalGroups = await prisma.goalGroup.findMany({
      where: { accountId: context.accountId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    })

    // Generar lista completa (todos los niveles, con o sin config)
    const configMap = new Map(configs.map(c => [c.standardJobLevel, c]))
    const fullList = STANDARD_JOB_LEVELS.map(level => {
      const existing = configMap.get(level)
      return {
        standardJobLevel: level,
        label: JOB_LEVEL_LABELS[level] || level,
        hasGoals: existing?.hasGoals ?? false,
        goalGroupId: existing?.goalGroupId ?? null,
        goalGroup: existing?.goalGroup ?? null,
        employeeCount: countMap[level] ?? 0,
        id: existing?.id ?? null,
      }
    })

    return NextResponse.json({
      success: true,
      data: fullList,
      goalGroups,
    })
  } catch (error) {
    console.error('[API Goal Eligibility GET]:', error)
    return NextResponse.json(
      { error: 'Error obteniendo configuración', success: false },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PATCH - Actualizar configuración masiva
// ════════════════════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest) {
  try {
    const context = extractUserContext(request)
    if (!context.accountId || !hasPermission(context.role, 'goals:config')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten(), success: false },
        { status: 400 }
      )
    }

    const { configs } = validation.data

    // Upsert cada config
    const results = await prisma.$transaction(
      configs.map(c =>
        prisma.goalJobConfig.upsert({
          where: {
            accountId_standardJobLevel: {
              accountId: context.accountId,
              standardJobLevel: c.standardJobLevel,
            },
          },
          update: {
            hasGoals: c.hasGoals,
            goalGroupId: c.goalGroupId ?? null,
          },
          create: {
            accountId: context.accountId,
            standardJobLevel: c.standardJobLevel,
            hasGoals: c.hasGoals,
            goalGroupId: c.goalGroupId ?? null,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      data: results,
      message: `${results.length} niveles actualizados`,
    })
  } catch (error) {
    console.error('[API Goal Eligibility PATCH]:', error)
    return NextResponse.json(
      { error: 'Error actualizando configuración', success: false },
      { status: 500 }
    )
  }
}
