// ════════════════════════════════════════════════════════════════════════════
// GET/PUT/DELETE /api/efficiency/plans/[planId] — Detail, autosave, archive
// src/app/api/efficiency/plans/[planId]/route.ts
// ════════════════════════════════════════════════════════════════════════════
// GET     → detalle completo (incluye decisiones + narrativas)
// PUT     → autosave body parcial (cualquier subset de campos editables)
// DELETE  → soft delete (estado = 'archivado')
//
// RBAC: efficiency:view + validación de ownership por accountId.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

interface RouteContext {
  params: Promise<{ planId: string }> | { planId: string }
}

async function resolveParams(params: RouteContext['params']) {
  return params instanceof Promise ? await params : params
}

// ════════════════════════════════════════════════════════════════════════════
// GET — detalle completo
// ════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest, ctx: RouteContext) {
  try {
    const { planId } = await resolveParams(ctx.params)
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

    const plan = await prisma.efficiencyPlan.findFirst({
      where: { id: planId, accountId: userContext.accountId },
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: plan })
  } catch (error: unknown) {
    console.error('[efficiency/plans/[planId]] GET error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// PUT — autosave body parcial
// ════════════════════════════════════════════════════════════════════════════

interface UpdatePlanBody {
  nombre?: string
  estado?: 'borrador' | 'aprobado' | 'archivado'
  tesisElegida?: string
  lentesActivos?: string[]
  decisiones?: unknown
  narrativasEdit?: Record<string, string>
  narrativaEjecEdit?: string | null
  resumenSnap?: unknown
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  try {
    const { planId } = await resolveParams(ctx.params)
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

    // Verificar ownership
    const existing = await prisma.efficiencyPlan.findFirst({
      where: { id: planId, accountId: userContext.accountId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    const body = (await request.json()) as UpdatePlanBody

    // Construir update sólo con campos presentes (autosave parcial)
    const data: Prisma.EfficiencyPlanUpdateInput = {}
    if (body.nombre !== undefined) data.nombre = body.nombre.trim() || 'Plan sin nombre'
    if (body.estado !== undefined) data.estado = body.estado
    if (body.tesisElegida !== undefined) data.tesisElegida = body.tesisElegida
    if (body.lentesActivos !== undefined) data.lentesActivos = body.lentesActivos
    if (body.decisiones !== undefined) data.decisiones = body.decisiones as Prisma.InputJsonValue
    if (body.narrativasEdit !== undefined)
      data.narrativasEdit = body.narrativasEdit as Prisma.InputJsonValue
    if (body.narrativaEjecEdit !== undefined)
      data.narrativaEjecEdit = body.narrativaEjecEdit
    if (body.resumenSnap !== undefined)
      data.resumenSnap = body.resumenSnap as Prisma.InputJsonValue

    const updated = await prisma.efficiencyPlan.update({
      where: { id: planId },
      data,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: unknown) {
    console.error('[efficiency/plans/[planId]] PUT error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}

// ════════════════════════════════════════════════════════════════════════════
// DELETE — soft delete (archivar)
// ════════════════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  try {
    const { planId } = await resolveParams(ctx.params)
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

    const existing = await prisma.efficiencyPlan.findFirst({
      where: { id: planId, accountId: userContext.accountId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    const archived = await prisma.efficiencyPlan.update({
      where: { id: planId },
      data: { estado: 'archivado' },
    })

    return NextResponse.json({ success: true, data: archived })
  } catch (error: unknown) {
    console.error('[efficiency/plans/[planId]] DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
