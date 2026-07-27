// src/app/api/clima/action-plan/reactives/route.ts
// EX Clima — Gate 5D Fase 3: detalle REACTIVO de un departamento para la pantalla de
// "Fijar meta sobre reactivo" (SPEC_UI §1). Devuelve los reactivos BAJO TIER de un depto
// con { reactive, category, mean, tier, questionText }.
//
// POR QUÉ EXISTE (endpoint aparte, decisión Victor 2026-07-25): Tab 2 (by-person) es
// dimensión-only a propósito (no expone el slug del reactivo). La pantalla del slider SÍ
// necesita el detalle reactivo (slug + mean + Question.text). Endpoint dedicado: Tab 2 queda
// intacto; el slider fetchea lo suyo. Resuelve los 2 desvíos de datos del Gate 0.
//
// RBAC: clima:view (cómputo read-only). Filtrado jerárquico AREA_MANAGER (patrón by-person).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractUserContext,
  hasPermission,
  getChildDepartmentIds,
} from '@/lib/services/AuthorizationService';
import type { ReactiveImpact } from '@/lib/services/clima/PulseEngine';
import { belowTierReactives, type Tab2ReactiveRow } from '@/lib/services/clima/climaTab2Routing';
import { reactiveMeanTarget } from '@/lib/services/clima/climaThresholds';

export async function GET(request: NextRequest) {
  try {
    const userContext = extractUserContext(request);
    if (!userContext.accountId) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    if (!hasPermission(userContext.role, 'clima:view')) {
      return NextResponse.json({ success: false, error: 'Sin permisos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const departmentId = searchParams.get('departmentId');
    if (!campaignId || !departmentId) {
      return NextResponse.json(
        { success: false, error: 'campaignId y departmentId requeridos' },
        { status: 400 }
      );
    }

    // Guard multi-tenant: la campaña pertenece a la cuenta (+ trae campaignTypeId para el join).
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, accountId: userContext.accountId },
      select: { id: true, campaignTypeId: true },
    });
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 });
    }

    // Filtrado jerárquico AREA_MANAGER (patrón by-person): el depto debe estar en su subárbol.
    if (userContext.role === 'AREA_MANAGER') {
      if (!userContext.departmentId) {
        return NextResponse.json(
          { success: false, error: 'AREA_MANAGER sin departamento asignado' },
          { status: 403 }
        );
      }
      const children = await getChildDepartmentIds(userContext.departmentId);
      const visible = new Set([userContext.departmentId, ...children]);
      if (!visible.has(departmentId)) {
        return NextResponse.json({ success: false, error: 'Sin acceso a ese departamento' }, { status: 403 });
      }
    }

    const insight = await prisma.departmentClimaInsight.findFirst({
      where: { accountId: userContext.accountId, campaignId, departmentId },
      select: { reactiveAnalysis: true },
    });

    const reactives: Tab2ReactiveRow[] = (
      (insight?.reactiveAnalysis as unknown as ReactiveImpact[] | null) ?? []
    ).map((x) => ({ reactive: x.reactive, category: x.category, mean: x.mean }));

    // Fuente única del filtro (misma que routeDepartmentTab2): medido ∧ cuenta ∧ gapMean<0.
    const below = belowTierReactives(reactives);

    // Join a Question por subcategory → texto real de la pregunta (Question.text). El pipeline
    // de clima nunca lo resuelve (ClimaAggregationService no selecciona text) → se trae acá.
    const slugs = below.map((r) => r.reactive);
    const questions = slugs.length
      ? await prisma.question.findMany({
          where: { campaignTypeId: campaign.campaignTypeId, subcategory: { in: slugs } },
          select: { subcategory: true, text: true },
        })
      : [];
    const textBySlug = new Map(questions.map((q) => [q.subcategory, q.text]));

    const data = below.map((r) => ({
      reactive: r.reactive,
      category: r.category,
      mean: r.mean,
      tier: reactiveMeanTarget(r.reactive), // vara del reactivo (mean objetivo por subcategoría)
      questionText: textBySlug.get(r.reactive) ?? null,
    }));

    return NextResponse.json({ success: true, data: { reactives: data } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error obteniendo el detalle reactivo' },
      { status: 500 }
    );
  }
}
