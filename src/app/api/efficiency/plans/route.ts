// ════════════════════════════════════════════════════════════════════════════
// GET/POST /api/efficiency/plans — Listado y creación de planes de eficiencia
// src/app/api/efficiency/plans/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET   → lista planes del account ordenados por updatedAt desc
// POST  → crea plan nuevo con decisiones, narrativas, tesis, snapshot
//
// RBAC: efficiency:view (ver planes de su cuenta).
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// ════════════════════════════════════════════════════════════════════════════
// GET — list planes del account
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    if (!hasPermission(userContext.role, 'efficiency:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado') // borrador | aprobado | archivado
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '50'),
      100
    )

    const where: Prisma.EfficiencyPlanWhereInput = {
      accountId: userContext.accountId,
    }
    if (estado) where.estado = estado

    const planes = await prisma.efficiencyPlan.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        nombre: true,
        estado: true,
        tesisElegida: true,
        lentesActivos: true,
        resumenSnap: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        // decisiones + narrativasEdit + narrativaEjecEdit se omiten en list
        // (payload grande; GET detail las trae completas).
      },
    })

    return NextResponse.json({ success: true, data: planes })
  } catch (error: unknown) {
    console.error('[efficiency/plans] GET error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// POST — crear plan
// ════════════════════════════════════════════════════════════════════════════

interface CreatePlanBody {
  nombre?: string
  tesisElegida?: string
  lentesActivos?: string[]
  decisiones?: unknown
  narrativasEdit?: Record<string, string>
  narrativaEjecEdit?: string | null
  resumenSnap?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request)
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    if (!hasPermission(userContext.role, 'efficiency:view')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      )
    }

    const body = (await request.json()) as CreatePlanBody
    const userEmail = request.headers.get('x-user-email') ?? 'unknown'

    const plan = await prisma.efficiencyPlan.create({
      data: {
        accountId: userContext.accountId,
        createdBy: userEmail,
        nombre: body.nombre?.trim() || 'Plan sin nombre',
        estado: 'borrador',
        tesisElegida: body.tesisElegida || 'eficiencia',
        lentesActivos: body.lentesActivos ?? [],
        decisiones: (body.decisiones ?? []) as Prisma.InputJsonValue,
        narrativasEdit: (body.narrativasEdit ?? {}) as Prisma.InputJsonValue,
        narrativaEjecEdit: body.narrativaEjecEdit ?? null,
        resumenSnap: (body.resumenSnap ?? {}) as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json({ success: true, data: plan })
  } catch (error: unknown) {
    console.error('[efficiency/plans] POST error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
