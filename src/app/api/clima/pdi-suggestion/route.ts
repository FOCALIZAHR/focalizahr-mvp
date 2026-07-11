// src/app/api/clima/pdi-suggestion/route.ts
// ════════════════════════════════════════════════════════════════════════════
// EX Clima Gate 5B-ii — CTA1 (PDI suave desde un hallazgo de clima).
//
// POST: dado un hallazgo de clima (driver + favorabilidad del equipo + brecha
// 360° opcional), genera un PDI (DevelopmentPlan DRAFT + DevelopmentGoal[]) con
// EVIDENCIA CRUZADA (climaEvidence por-goal). Reusa el motor sellado en 5B-i
// (buildClimaGapInput → generateSuggestions); NO recalcula nada.
//
// RBAC: clima:manage (se dispara desde el ActionPlan por HR/CEO). A diferencia de
// /api/pdi/generate-suggestion (ownership de jefe directo), acá NO se exige ser
// jefe directo — coherente con que el plan de clima lo gestiona RRHH.
//
// Coexistencia con Performance PDI: el DevelopmentPlan es único por
// (employeeId, cycleId); este endpoint refresca SOLO los goals de clima
// (climaEvidence != null) y preserva los de 360/RoleFit.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
} from '@/lib/services/AuthorizationService';
import { PDISuggestionEngine } from '@/lib/services/PDISuggestionEngine';
import type { PerformanceTrack } from '@/lib/types/pdi-suggestion';

const BodySchema = z.object({
  employeeId: z.string().min(1),
  cycleId: z.string().min(1),
  driver: z.string().min(1), // dimensión de clima (taxonomía real)
  teamFavorability: z.number().min(0).max(100),
  gap360: z.number().optional(),
});

function calculateTargetDate(weeks: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export async function POST(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      );
    }
    if (!hasPermission(userContext.role, 'clima:manage')) {
      return NextResponse.json(
        { success: false, error: 'Sin permisos' },
        { status: 403 }
      );
    }

    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Body inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { employeeId, cycleId, driver, teamFavorability, gap360 } = parsed.data;

    // Multi-tenant: el empleado debe pertenecer a la cuenta y estar activo.
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, accountId: userContext.accountId, isActive: true },
      select: { id: true, performanceTrack: true, managerId: true },
    });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Empleado no encontrado en la cuenta' },
        { status: 404 }
      );
    }

    const track = (employee.performanceTrack as PerformanceTrack | null) ?? 'COLABORADOR';

    // Motor 5B-i: hallazgo de clima → gap con climaContext → sugerencias con climaEvidence.
    const climaGap = PDISuggestionEngine.buildClimaGapInput(driver, teamFavorability, gap360);
    const suggestions = PDISuggestionEngine.generateSuggestions([climaGap], track);
    if (suggestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se generaron sugerencias para el hallazgo' },
        { status: 422 }
      );
    }

    // managerId del plan = jefe del empleado (quien acepta/rechaza el PDI). Fallback:
    // el propio empleado (plan sin jefe asignado todavía).
    const managerId = employee.managerId ?? employee.id;

    const goalsData: Prisma.DevelopmentGoalCreateWithoutPlanInput[] = suggestions.map(
      (s) => ({
        competencyCode: s.competencyCode,
        competencyName: s.competencyName,
        originalGap: s.originalGap,
        gapType: s.gapType,
        title: s.suggestion.title,
        description: s.suggestion.description,
        targetOutcome: s.suggestion.targetOutcome,
        priority: s.priority,
        category: s.suggestion.category,
        targetDate: calculateTargetDate(s.suggestion.estimatedWeeks || 8),
        suggestedResources: s.suggestion
          .suggestedResources as unknown as Prisma.InputJsonValue,
        aiGenerated: true,
        // Evidencia cruzada por-goal (Gate 5B-ii). Presente por construcción: todas
        // estas sugerencias vienen del climaGap. Se normaliza para JSON (sin undefined).
        climaEvidence: {
          driver,
          teamFavorability,
          ...(gap360 !== undefined ? { gap360 } : {}),
        } satisfies Prisma.InputJsonValue,
      })
    );

    const plan = await prisma.$transaction(async (tx) => {
      const existing = await tx.developmentPlan.findUnique({
        where: { employeeId_cycleId: { employeeId, cycleId } },
        select: { id: true },
      });

      if (existing) {
        // Idempotencia: borrar SOLO los goals de clima previos (filtrado en app para
        // evitar los bordes del filtro de Json-null de Prisma), preservando 360/RoleFit.
        const goals = await tx.developmentGoal.findMany({
          where: { planId: existing.id },
          select: { id: true, climaEvidence: true },
        });
        const climaGoalIds = goals
          .filter((g) => g.climaEvidence != null)
          .map((g) => g.id);
        if (climaGoalIds.length > 0) {
          await tx.developmentGoal.deleteMany({ where: { id: { in: climaGoalIds } } });
        }
        await tx.developmentPlan.update({
          where: { id: existing.id },
          data: { aiSuggestionsUsed: true, goals: { create: goalsData } },
        });
        return tx.developmentPlan.findUnique({
          where: { id: existing.id },
          include: { goals: true },
        });
      }

      return tx.developmentPlan.create({
        data: {
          accountId: userContext.accountId,
          employeeId,
          cycleId,
          managerId,
          status: 'DRAFT',
          aiSuggestionsUsed: true,
          goals: { create: goalsData },
        },
        include: { goals: true },
      });
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error: unknown) {
    console.error('[clima/pdi-suggestion] POST error:', error);
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
