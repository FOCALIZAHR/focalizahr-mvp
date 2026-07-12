// prisma/scripts/reorder-experiencia-full-question-order.ts
// EX Clima — reordena el banco de experiencia-full: engagement_index PRIMERO
// (posiciones 1-5), antes de cualquier driver, para evitar el sesgo de anclaje
// (responder sobre problemas específicos antes de la pregunta general de compromiso
// contamina esa respuesta). Los 35 drivers se renumeran a 6-40; texto_libre queda 41-43.
//
// SEGURO (verificado read-only antes de escribir):
//  - Las respuestas se almacenan por questionId, NO por questionOrder → cero quiebre
//    histórico; la agregación agrupa por category/subcategory (nunca por orden).
//  - La ÚNICA dependencia de posición es SurveyConfiguration.conditionalRules
//    (modify_text: triggerQuestionOrder/targetQuestionOrder). Se actualiza en el MISMO
//    $transaction resolviendo trigger/target por questionId (robusto al reorden).
//  - conditionalLogic por-pregunta = null; validationRules = []; categoryConfigs.order y
//    uiSettings.breakAfterQuestions = inertes/cosméticos (el render es por questionOrder).
//
// IDEMPOTENTE: asigna por grupo ordenando por questionOrder ASC (preserva el orden
// relativo interno) → re-ejecutar cuando ya está reordenado es no-op.
// NO usa el seed (destructivo, desalineado). Mecanismo formal = script idempotente.
//
// Uso:  npx tsx prisma/scripts/reorder-experiencia-full-question-order.ts            (dry-run)
//       npx tsx prisma/scripts/reorder-experiencia-full-question-order.ts --commit   (aplica)

import { prisma } from '../../src/lib/prisma';
import { Prisma } from '@prisma/client';

const COMMIT = process.argv.includes('--commit');
const EI = 'engagement_index';
const TEXTO = 'texto_libre';

async function main() {
  console.log(`🔀 Reorden experiencia-full (engagement_index al frente) — ${COMMIT ? 'COMMIT' : 'DRY-RUN'}\n`);

  const ct = await prisma.campaignType.findFirst({ where: { slug: 'experiencia-full' } });
  if (!ct) throw new Error('No existe CampaignType experiencia-full');

  const qs = await prisma.question.findMany({
    where: { campaignTypeId: ct.id },
    orderBy: { questionOrder: 'asc' },
    select: { id: true, questionOrder: true, category: true, text: true },
  });

  // Grupos (cada uno ya viene ASC → orden relativo interno preservado)
  const ei = qs.filter((q) => q.category === EI);
  const texto = qs.filter((q) => q.category === TEXTO);
  const drivers = qs.filter((q) => q.category !== EI && q.category !== TEXTO);

  // Asignación idempotente: EI→1..N, drivers→N+1.., texto→final
  const newOrderById = new Map<string, number>();
  let n = 1;
  for (const q of ei) newOrderById.set(q.id, n++);
  for (const q of drivers) newOrderById.set(q.id, n++);
  for (const q of texto) newOrderById.set(q.id, n++);

  // Resolver reglas por questionId usando el orden ACTUAL (pre-reorden)
  const idByCurOrder = new Map(qs.map((q) => [q.questionOrder, q.id]));
  const cfg = await prisma.surveyConfiguration.findUnique({ where: { campaignTypeId: ct.id } });
  const rules = Array.isArray(cfg?.conditionalRules) ? (cfg!.conditionalRules as any[]) : [];
  const newRules = rules.map((r) => {
    const trigId = r?.triggerQuestionOrder != null ? idByCurOrder.get(r.triggerQuestionOrder) : undefined;
    const tgtId = r?.targetQuestionOrder != null ? idByCurOrder.get(r.targetQuestionOrder) : undefined;
    return {
      ...r,
      ...(trigId ? { triggerQuestionOrder: newOrderById.get(trigId) } : {}),
      ...(tgtId ? { targetQuestionOrder: newOrderById.get(tgtId) } : {}),
    };
  });

  // Reporte de cambios
  console.log(`Grupos: engagement_index=${ei.length} · drivers=${drivers.length} · texto_libre=${texto.length} (total ${qs.length})\n`);
  console.log('── Cambios de questionOrder ──');
  let changed = 0;
  for (const q of qs) {
    const nu = newOrderById.get(q.id)!;
    if (nu !== q.questionOrder) {
      changed++;
      console.log(`  ${String(q.questionOrder).padStart(2)} → ${String(nu).padStart(2)}  [${q.category}] ${q.text.slice(0, 40)}`);
    }
  }
  if (changed === 0) console.log('  (ninguno — ya reordenado)');

  console.log('\n── Cambios de conditionalRules ──');
  let rulesChanged = false;
  rules.forEach((r, i) => {
    const nr = newRules[i];
    if (r.triggerQuestionOrder !== nr.triggerQuestionOrder || r.targetQuestionOrder !== nr.targetQuestionOrder) {
      rulesChanged = true;
      console.log(`  ${r.type}: trigger ${r.triggerQuestionOrder}→${nr.triggerQuestionOrder} · target ${r.targetQuestionOrder}→${nr.targetQuestionOrder}`);
    }
  });
  if (!rulesChanged) console.log('  (ninguno — ya consistente)');

  if (changed === 0 && !rulesChanged) {
    console.log('\n✅ No-op: el banco ya está en el orden deseado.');
    return;
  }

  if (!COMMIT) {
    console.log('\n🟡 DRY-RUN — nada escrito. Re-ejecutar con --commit para aplicar.');
    return;
  }

  // Escritura atómica: questionOrder de todas + conditionalRules en un solo $transaction
  await prisma.$transaction([
    ...qs
      .filter((q) => newOrderById.get(q.id)! !== q.questionOrder)
      .map((q) =>
        prisma.question.update({
          where: { id: q.id },
          data: { questionOrder: newOrderById.get(q.id)! },
        })
      ),
    ...(rulesChanged
      ? [
          prisma.surveyConfiguration.update({
            where: { campaignTypeId: ct.id },
            data: { conditionalRules: newRules as unknown as Prisma.InputJsonValue },
          }),
        ]
      : []),
  ]);

  console.log('\n✅ Aplicado. Re-ejecutar (dry-run) debe reportar No-op (idempotencia).');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
