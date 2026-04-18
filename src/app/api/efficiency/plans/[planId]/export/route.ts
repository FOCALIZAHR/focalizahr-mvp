// ════════════════════════════════════════════════════════════════════════════
// GET /api/efficiency/plans/[planId]/export — PDF Business Case
// src/app/api/efficiency/plans/[planId]/export/route.ts
// ════════════════════════════════════════════════════════════════════════════
// Exporta el plan como PDF para presentar al directorio.
// SIN nombres de personas (sensibilidad política — TASK requirement).
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService'
import { prisma } from '@/lib/prisma'
import { generateEfficiencyPlanPDF } from '@/lib/services/efficiency/EfficiencyPlanPDF'
import type { DecisionItem } from '@/lib/services/efficiency/EfficiencyCalculator'

interface RouteContext {
  params: Promise<{ planId: string }> | { planId: string }
}

async function resolveParams(params: RouteContext['params']) {
  return params instanceof Promise ? await params : params
}

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

    // Traer plan + nombre de la cuenta
    const plan = await prisma.efficiencyPlan.findFirst({
      where: { id: planId, accountId: userContext.accountId },
    })
    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan no encontrado' },
        { status: 404 }
      )
    }

    const account = await prisma.account.findUnique({
      where: { id: userContext.accountId },
      select: { companyName: true },
    })

    // Generar PDF
    const pdf = generateEfficiencyPlanPDF({
      planId: plan.id,
      nombre: plan.nombre,
      estado: plan.estado,
      tesisElegida: plan.tesisElegida,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      companyName: account?.companyName ?? 'Empresa',
      decisiones: (plan.decisiones as unknown) as DecisionItem[],
      narrativasEdit: (plan.narrativasEdit as unknown) as Record<string, string>,
      narrativaEjecEdit: plan.narrativaEjecEdit,
    })

    const filename = `plan-eficiencia-${plan.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || plan.id.slice(0, 8)}.pdf`

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    console.error('[efficiency/plans/[planId]/export] GET error:', error)
    const message = error instanceof Error ? error.message : 'Error interno'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
