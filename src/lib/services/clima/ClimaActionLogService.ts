// src/lib/services/clima/ClimaActionLogService.ts
// EX Clima Gate 5C — al aprobar un ActionPlan de clima:
//  1. Crea EAGER un ClimaActionLog por cada decisión no-rechazada (fila lista para
//     completar; "vacío = no ejecutó" es una fila real, requisito del cuadrante
//     Riesgo crítico).
//  2. Encola UN recordatorio (clima_action_reminder) por departamento — dedicado,
//     no-chase, dedup por (planId, departmentId). Destinatario resuelto FRESCO con
//     resolveDepartmentResponsable (Gate 1); scheduledAt diferido, drenado por el
//     dispatcher genérico (send-reports diario). Ver plan Gate 5C + DISEÑO §5.
//
// Degrade-safe: falla del encolado/creación NO revierte la aprobación (el caller
// envuelve en try/catch y esta función también). Idempotente (unique + skipDuplicates).

import { prisma } from '@/lib/prisma';
import { resolveDepartmentResponsable } from '@/lib/services/DepartmentResponsableService';
import type { ClimaDecisionItem } from '@/types/clima-planes';
import type { DriverImpact } from '@/lib/services/clima/PulseEngine';

// §5 fallback ("próximo ciclo general"): offset fijo desde la aprobación. Nombre
// propio para no colisionar con el REMINDER_OFFSET_DAYS de whatsapp-reminders (=3).
const CLIMA_REMINDER_OFFSET_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_MESSAGE_TYPE = 'clima_action_reminder';
const REMINDER_TEMPLATE_SLUG = 'clima-action-reminder';

interface ApprovedClimaPlan {
  id: string;
  accountId: string;
  decisiones: unknown; // Json — ClimaDecisionItem[]
  approvedAt: Date | null;
}

export interface OnClimaPlanApprovedResult {
  logsCreated: number;
  remindersEnqueued: number;
}

function isAccepted(item: ClimaDecisionItem): boolean {
  return item.ceoDecision === 'aceptar' || item.ceoDecision === 'modificar';
}

/** Fav del driver `category` dentro de un driverAnalysis persistido (o null). */
function favOf(driverAnalysis: unknown, category: string | null): number | null {
  if (!category || !Array.isArray(driverAnalysis)) return null;
  const d = (driverAnalysis as DriverImpact[]).find((x) => x?.driver === category);
  return d?.fav ?? null;
}

export class ClimaActionLogService {
  /**
   * Hook de la transición borrador→aprobado de un ActionPlan moduleType='clima'.
   * Llamar SOLO en esa transición (el caller ya la detecta).
   */
  static async onClimaPlanApproved(plan: ApprovedClimaPlan): Promise<OnClimaPlanApprovedResult> {
    const items: ClimaDecisionItem[] = Array.isArray(plan.decisiones)
      ? (plan.decisiones as ClimaDecisionItem[])
      : [];
    const accepted = items.filter(isAccepted);
    if (accepted.length === 0) return { logsCreated: 0, remindersEnqueued: 0 };

    // ── 1. Eager logs (idempotente por @@unique(actionPlanId, triggerRef)) ──
    const logRows = accepted.map((item) => ({
      accountId: plan.accountId,
      actionPlanId: plan.id,
      triggerRef: item.triggerRef,
      departmentId: item.departmentId,
      actionText: null,
      registeredAt: null,
    }));
    const created = await prisma.climaActionLog.createMany({
      data: logRows,
      skipDuplicates: true,
    });

    // ── 2. Recordatorio por departamento ──
    const deptIds = Array.from(new Set(accepted.map((i) => i.departmentId)));
    const focosByDept = new Map<string, string[]>();
    for (const item of accepted) {
      const arr = focosByDept.get(item.departmentId) ?? [];
      arr.push(item.category);
      focosByDept.set(item.departmentId, arr);
    }

    // Nombres de departamento + fortaleza (reconocimiento primero, DISEÑO §5.1)
    const [depts, insights] = await Promise.all([
      prisma.department.findMany({
        where: { id: { in: deptIds }, accountId: plan.accountId },
        select: { id: true, displayName: true },
      }),
      prisma.departmentClimaInsight.findMany({
        where: { accountId: plan.accountId, departmentId: { in: deptIds } },
        orderBy: { periodEnd: 'desc' },
        select: { departmentId: true, topStrength: true, driverAnalysis: true },
      }),
    ]);
    const nameByDept = new Map(depts.map((d) => [d.id, d.displayName]));
    const strengthByDept = new Map<string, { top: string | null; fav: number | null }>();
    for (const ins of insights) {
      if (strengthByDept.has(ins.departmentId)) continue; // primer = más reciente
      strengthByDept.set(ins.departmentId, {
        top: ins.topStrength ?? null,
        fav: favOf(ins.driverAnalysis, ins.topStrength ?? null),
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
    const scheduledAt = new Date(
      (plan.approvedAt ?? new Date()).getTime() + CLIMA_REMINDER_OFFSET_DAYS * DAY_MS
    );

    const messages = [];
    for (const deptId of deptIds) {
      const responsable = await resolveDepartmentResponsable({
        departmentId: deptId,
        accountId: plan.accountId,
      });
      // email deliverable: responsable con email, o su fallback (account_admin siempre tiene).
      const toEmail =
        responsable.source === 'responsable'
          ? responsable.email ?? null
          : responsable.email;
      if (!toEmail) continue; // sin canal → no encola (degrade-safe)

      const strength = strengthByDept.get(deptId);
      const focos = focosByDept.get(deptId) ?? [];
      // Frase de reconocimiento compuesta: se omite limpia si no hay fortaleza con
      // dato (evita "Hoy destacas en  (%)"). Studio IA reintroduce estilo en el copy final.
      const fortalezaFrase =
        strength?.top && strength.fav != null
          ? `Hoy destacas en ${strength.top} (${Math.round(strength.fav)}%) — tu equipo lo nota y vale la pena sostenerlo.`
          : '';
      messages.push({
        accountId: plan.accountId,
        channel: 'EMAIL' as const,
        templateSlug: REMINDER_TEMPLATE_SLUG,
        messageType: REMINDER_MESSAGE_TYPE,
        toEmail,
        scheduledAt,
        dedupKey: `${REMINDER_MESSAGE_TYPE}:${plan.id}:${deptId}`,
        variables: {
          gerencia: nameByDept.get(deptId) ?? 'tu equipo',
          nombre: responsable.name,
          fortaleza_frase: fortalezaFrase,
          dimensiones_focos: focos.join(' y '),
          action_url: `${baseUrl}/dashboard/clima`,
        },
      });
    }

    let remindersEnqueued = 0;
    if (messages.length > 0) {
      const res = await prisma.communicationMessage.createMany({
        data: messages,
        skipDuplicates: true, // dedupKey @unique → un solo envío
      });
      remindersEnqueued = res.count;
    }

    return { logsCreated: created.count, remindersEnqueued };
  }
}
