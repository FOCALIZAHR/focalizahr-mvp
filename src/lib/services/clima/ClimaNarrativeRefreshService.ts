// src/lib/services/clima/ClimaNarrativeRefreshService.ts
// ════════════════════════════════════════════════════════════════════════════
// H3b — refresco de la narrativa ejecutiva. Lo invoca el CRON, nadie más.
//
// ⛔ LA NARRATIVA NO SE GENERA NI AL ESCRIBIR NI AL MIRAR (decisión de Victor,
// 2026-08-07). Generarla en cada visita costaría 15 s de espera y una llamada a
// Sonnet por cada persona que abre la pantalla; con 90 jefes eso es cientos de
// llamadas para leer siempre lo mismo. Y una caché en memoria no sirve: en
// serverless cada instancia tiene la suya, así que el ahorro es ficticio.
//
// El flujo real:
//   1. El jefe escribe → el POST guarda la entrada → Haiku clasifica.
//   2. El cron pasa 1x/día → ¿cambió el hash de las clasificaciones?
//        no  → no hace NADA. Ni una llamada al modelo.
//        sí  → Sonnet regenera y se persiste con el hash nuevo.
//   3. El CEO entra → lee la fila ya escrita. Instantáneo.
//
// ⚠️ EL CRITERIO ES EL HASH, NO EL CONTEO. Si alguien reclasifica sin agregar
// entradas —un modelo nuevo, un prompt corregido— el conteo no se mueve pero la
// narrativa queda afirmando algo sobre una lectura que ya no existe.
//
// UNA SOLA FILA GLOBAL POR PLAN. Todos leen la misma: CEO, RRHH y AREA_MANAGER.
// ════════════════════════════════════════════════════════════════════════════

import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  ClimaFindingNarrativeService,
  type NarrativeInputEntry,
} from './ClimaFindingNarrativeService';
import type { ClimaActionLogAnalysis } from '@/types/clima-text-analysis';
import type { ClimaDecisionItem } from '@/types/clima-planes';

/** Scope único por ahora. La columna existe para no cerrar la puerta a por-gerencia. */
const SCOPE_GLOBAL = 'GLOBAL';

/** Días que se reintenta una narrativa descartada por la validación, antes de
 *  darla por perdida y dejar la pantalla con el template. Con un cron diario, son
 *  tres días — suficiente para que el azar de la redacción deje de mandar. */
const MAX_RETRIES = 3;

export interface RefreshResult {
  actionPlanId: string;
  /** `skipped` = el hash no cambió, no se llamó al modelo. */
  outcome: 'skipped' | 'generated' | 'no-pattern' | 'failed';
  entryCount: number;
  detail?: string;
}

/**
 * Huella de las clasificaciones vigentes.
 *
 * Se ordena por `entryId` ANTES de hashear: sin eso, el orden que devuelva
 * Postgres cambiaría el hash sin que haya cambiado un solo dato, y el cron
 * regeneraría la narrativa todos los días para nada.
 *
 * Entra `score` además de `verbMode` porque una reclasificación puede mover la
 * densidad sin mover el verbo, y eso ya cambia lo que la narrativa puede afirmar.
 */
export function classificationHash(
  items: Array<{ entryId: string; verbMode: string; score: number }>
): string {
  const canonical = [...items]
    .sort((a, b) => a.entryId.localeCompare(b.entryId))
    .map((i) => `${i.entryId}:${i.verbMode}:${i.score}`)
    .join('|');
  return createHash('sha256').update(canonical).digest('hex');
}

export class ClimaNarrativeRefreshService {
  /**
   * Revisa UN plan y regenera su narrativa si hace falta. Idempotente: llamarlo
   * dos veces seguidas hace trabajo la primera vez y nada la segunda.
   */
  static async refreshPlan(params: {
    accountId: string;
    campaignId: string;
    actionPlanId: string;
    decisiones: ClimaDecisionItem[];
  }): Promise<RefreshResult> {
    const { accountId, campaignId, actionPlanId, decisiones } = params;

    const logs = await prisma.climaActionLog.findMany({
      where: { accountId, actionPlanId },
      select: {
        triggerRef: true,
        llmClassification: true,
        entries: { select: { id: true, text: true }, orderBy: { createdAt: 'asc' } },
      },
    });

    const decisionByRef = new Map(decisiones.map((d) => [d.triggerRef, d]));
    const input: NarrativeInputEntry[] = [];
    const huella: Array<{ entryId: string; verbMode: string; score: number }> = [];

    for (const l of logs) {
      const a = l.llmClassification as unknown as ClimaActionLogAnalysis | null;
      if (!a || !Array.isArray(a.entries)) continue;
      const byId = new Map(a.entries.map((c) => [c.entryId, c]));
      const d = decisionByRef.get(l.triggerRef);
      for (const e of l.entries) {
        const c = byId.get(e.id);
        if (!c) continue;
        input.push({
          text: e.text,
          verbMode: c.verbMode,
          dimension: d?.category ?? null,
          planSteps: d?.intervention?.steps ?? [],
        });
        huella.push({ entryId: e.id, verbMode: c.verbMode, score: c.signal?.score ?? 0 });
      }
    }

    // Menos de 2 registros no da patrón transversal: un patrón sobre un caso es el
    // caso. Ni se crea la fila — no hay nada que invalidar después.
    if (input.length < 2) {
      return { actionPlanId, outcome: 'skipped', entryCount: input.length, detail: 'menos de 2 registros' };
    }

    const hash = classificationHash(huella);
    const existente = await prisma.climaEffectivenessNarrative.findUnique({
      where: { actionPlanId_scope: { actionPlanId, scope: SCOPE_GLOBAL } },
      select: { id: true, classificationHash: true, status: true, retryCount: true },
    });

    // EL CORTE. Si el hash coincide y la fila está completa, el cron termina acá:
    // cero llamadas al modelo. Es lo que hace que correr todos los días sea barato.
    if (existente && existente.classificationHash === hash && existente.status === 'COMPLETED') {
      return { actionPlanId, outcome: 'skipped', entryCount: input.length, detail: 'hash sin cambios' };
    }

    // Se marca RUNNING antes de llamar al modelo: si el proceso muere a mitad, la
    // fila queda en RUNNING y se ve. Sin esto, un job colgado es indistinguible de
    // uno que nunca arrancó.
    const fila = await prisma.climaEffectivenessNarrative.upsert({
      where: { actionPlanId_scope: { actionPlanId, scope: SCOPE_GLOBAL } },
      create: {
        accountId,
        campaignId,
        actionPlanId,
        scope: SCOPE_GLOBAL,
        status: 'RUNNING',
        classificationHash: hash,
        entryCount: input.length,
        startedAt: new Date(),
      },
      update: {
        status: 'RUNNING',
        startedAt: new Date(),
        errorMessage: null,
      },
      select: { id: true, retryCount: true },
    });

    // UN reintento inmediato. El descarte suele venir de una redacción que tropezó
    // con la validación —un absoluto sin citar, una cifra que no cuadra—, no de que
    // no haya patrón: sobre las mismas entradas, la corrida siguiente normalmente
    // pasa. Medido: ~1 de cada 3 se descarta; reintentar una vez lo baja a ~1 de 9.
    let narrativa = await ClimaFindingNarrativeService.generate(input);
    let motivo = ClimaFindingNarrativeService.lastRejection;
    if (!narrativa) {
      narrativa = await ClimaFindingNarrativeService.generate(input);
      motivo = ClimaFindingNarrativeService.lastRejection;
    }

    if (!narrativa) {
      // ⚠️ NO TODOS LOS "SIN NARRATIVA" SON IGUALES, y tratarlos igual congela un
      // error transitorio:
      //   · el modelo dijo que no hay patrón → es una RESPUESTA. Se cierra
      //     COMPLETED y no se reintenta: mañana, con los mismos datos, va a decir
      //     lo mismo.
      //   · la validación lo descartó → es un TROPIEZO de redacción. Se deja en
      //     PENDING para que el tick de mañana lo reintente, hasta MAX_RETRIES.
      // Sin esta distinción, una sola tirada mala dejaba al CEO con el template
      // hasta que alguien escribiera una entrada nueva. Con un cron diario, eso
      // pueden ser semanas.
      const razon = motivo ?? 'sin patrón';
      const esRechazoDeValidacion = !razon.startsWith('el modelo declaró que no hay patrón');
      const reintentos = (existente?.retryCount ?? 0) + 1;
      const agotado = reintentos >= MAX_RETRIES;
      const reintentable = esRechazoDeValidacion && !agotado;

      await prisma.climaEffectivenessNarrative.update({
        where: { id: fila.id },
        data: {
          // PENDING = el tick de mañana lo vuelve a tomar (el corte por hash exige
          // status COMPLETED para saltear).
          status: reintentable ? 'PENDING' : 'COMPLETED',
          classificationHash: hash,
          entryCount: input.length,
          retryCount: reintentos,
          headline: null,
          soporte: null,
          patron: null,
          evidencia: [],
          model: null,
          completedAt: reintentable ? null : new Date(),
          errorMessage: razon,
        },
      });
      return {
        actionPlanId,
        outcome: 'no-pattern',
        entryCount: input.length,
        detail: `${razon}${reintentable ? ` · reintenta mañana (${reintentos}/${MAX_RETRIES})` : ''}`,
      };
    }

    await prisma.climaEffectivenessNarrative.update({
      where: { id: fila.id },
      data: {
        status: 'COMPLETED',
        classificationHash: hash,
        entryCount: input.length,
        headline: narrativa.headline,
        soporte: narrativa.soporte,
        patron: narrativa.patron,
        evidencia: narrativa.evidencia,
        model: narrativa.model,
        completedAt: new Date(),
        errorMessage: null,
        // Se resetea: los intentos gastados eran de una redacción que ya salió bien.
        retryCount: 0,
      },
    });

    return { actionPlanId, outcome: 'generated', entryCount: input.length, detail: narrativa.patron };
  }
}
