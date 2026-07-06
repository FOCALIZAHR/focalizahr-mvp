// prisma/scripts/seed-clima-gate1.ts
// EX Clima Gate 1 (MAESTRO v3.4 §1B): seed idempotente del banco de preguntas.
//
// Qué hace por cada CampaignType (pulso-express, experiencia-full):
//   1. questionTier='CORE' en todas las preguntas existentes sin tier
//   2. Crea 5 preguntas Engagement Index (EI-2 como nps_scale 0-10)
//   3. Crea 1 follow-up text_open (texto dinámico vía modify_text) + 2 text_open generales
//   4. Actualiza CampaignType.questionCount + estimatedDuration
//   5. Upsert SurveyConfiguration: agrega regla modify_text (EI-1 → follow-up)
//      y entradas categoryConfigs para engagement_index / texto_libre
//
// Idempotente: re-ejecutar = no-op (skip por texto existente, updateMany con
// filtro null, merge sin pisar claves existentes).
//
// GUARD: las preguntas se cargan EN VIVO del CampaignType — agregar preguntas
// afecta campañas ACTIVAS en curso. Si hay campañas activas de estos tipos,
// aborta salvo --allow-active.
//
// Uso:
//   npm run migrate:clima-gate1                      # dry-run (reporta, no escribe)
//   npm run migrate:clima-gate1 -- --apply           # aplica
//   npm run migrate:clima-gate1 -- --apply --allow-active

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLUGS = ['pulso-express', 'experiencia-full'] as const;

interface TypeTargets {
  expectedExisting: number;
  estimatedDuration: number; // minutos, instrumento completo post-Gate 1
}

const TARGETS: Record<(typeof SLUGS)[number], TypeTargets> = {
  'pulso-express': { expectedExisting: 12, estimatedDuration: 8 },
  'experiencia-full': { expectedExisting: 35, estimatedDuration: 18 },
};

const RATING_DEFAULTS = {
  responseType: 'rating_scale',
  minValue: 1,
  maxValue: 5,
  minLabel: 'Muy en desacuerdo',
  maxLabel: 'Muy de acuerdo',
  isRequired: true,
};

// Textos EXACTOS del MAESTRO v3.4 §1B
const EI_QUESTIONS = [
  { text: 'Me siento motivado/a por el trabajo que hago aquí', isDriverCore: true, nps: false },
  { text: 'Recomendaría esta empresa como buen lugar para trabajar', isDriverCore: false, nps: true },
  { text: 'Me siento orgulloso/a de trabajar aquí', isDriverCore: false, nps: false },
  { text: 'Me veo trabajando aquí dentro de 2 años', isDriverCore: false, nps: false },
  { text: 'Rara vez pienso en buscar trabajo en otra empresa', isDriverCore: false, nps: false },
];

// COPY PROVISIONAL — Victor revisa (editable en BD sin código)
const FOLLOW_UP_TEXT = 'Cuéntanos más sobre tu respuesta anterior';
const TEXT_OPEN_QUESTIONS = [
  '¿Qué es lo primero que mejorarías de trabajar aquí?',
  '¿Qué es lo que más valoras de trabajar aquí y no deberíamos perder?',
];

// COPY PROVISIONAL — Victor revisa
const FOLLOW_UP_TEXT_MAPPING: Record<string, string> = {
  '1': '¿Qué aspecto específico afecta más tu motivación hoy?',
  '2': '¿Qué aspecto específico afecta más tu motivación hoy?',
  '3': "¿Qué haría que tu motivación pasara de 'más o menos' a 'alta'?",
  '4': '¿Qué es lo que más contribuye a tu motivación? Cuéntanos qué destacarías',
  '5': '¿Qué es lo que más contribuye a tu motivación? Cuéntanos qué destacarías',
};

// COPY PROVISIONAL — Victor revisa
const CATEGORY_CONFIGS_NEW: Record<string, unknown> = {
  engagement_index: {
    displayName: 'Compromiso',
    icon: 'Heart',
    color: 'gradient',
    description: 'Tu conexión con la empresa',
    motivationalText: 'Tus respuestas dibujan el pulso real del equipo',
    order: 90,
  },
  texto_libre: {
    displayName: 'En tus palabras',
    icon: 'MessageSquare',
    color: 'cyan',
    description: 'Espacio abierto para lo que quieras decir',
    motivationalText: 'Aquí mandan tus palabras, no las escalas',
    order: 95,
  },
};

interface ActionRow {
  slug: string;
  step: string;
  action: 'create' | 'update' | 'no-op' | 'WARN';
  detail: string;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const allowActive = process.argv.includes('--allow-active');
  console.log(`🌡️  EX Clima Gate 1 — seed banco de preguntas (${apply ? 'APPLY' : 'DRY-RUN'})`);
  console.log('');

  const rows: ActionRow[] = [];

  // ── GUARD: campañas activas de estos tipos ──────────────────────────────
  const activeCampaigns = await prisma.campaign.findMany({
    where: { status: 'active', campaignType: { slug: { in: [...SLUGS] } } },
    select: { id: true, name: true, campaignType: { select: { slug: true } } },
  });
  if (activeCampaigns.length > 0) {
    console.log(`⚠️  ${activeCampaigns.length} campaña(s) ACTIVA(s) de estos tipos (las preguntas se cargan en vivo):`);
    for (const c of activeCampaigns) {
      console.log(`   - [${c.campaignType.slug}] ${c.name} (${c.id})`);
    }
    if (!allowActive) {
      console.log('');
      console.log('🛑 Abortado. Re-ejecutar con --allow-active para proceder de todos modos.');
      return;
    }
    console.log('   → --allow-active presente, continuando.');
    console.log('');
  }

  for (const slug of SLUGS) {
    const targets = TARGETS[slug];
    const campaignType = await prisma.campaignType.findUnique({
      where: { slug },
      select: { id: true, questionCount: true, estimatedDuration: true },
    });
    if (!campaignType) {
      rows.push({ slug, step: 'campaignType', action: 'WARN', detail: 'CampaignType no existe — slug omitido' });
      continue;
    }

    // ── 1. updateMany questionTier='CORE' en existentes sin tier ──────────
    const untiered = await prisma.question.count({
      where: { campaignTypeId: campaignType.id, questionTier: null },
    });
    if (untiered > 0) {
      if (apply) {
        await prisma.question.updateMany({
          where: { campaignTypeId: campaignType.id, questionTier: null },
          data: { questionTier: 'CORE' },
        });
      }
      rows.push({ slug, step: 'tier CORE', action: 'update', detail: `${untiered} preguntas → questionTier='CORE'` });
    } else {
      rows.push({ slug, step: 'tier CORE', action: 'no-op', detail: 'todas las preguntas ya tienen tier' });
    }

    // ── base de questionOrder: dinámica con verificación de expectativa ───
    const agg = await prisma.question.aggregate({
      where: { campaignTypeId: campaignType.id },
      _max: { questionOrder: true },
      _count: { _all: true },
    });
    const maxOrder = agg._max.questionOrder ?? 0;
    const existingCount = agg._count._all;
    if (maxOrder !== targets.expectedExisting && existingCount === targets.expectedExisting) {
      rows.push({ slug, step: 'orden base', action: 'WARN', detail: `maxOrder=${maxOrder} ≠ esperado ${targets.expectedExisting}; se usa maxOrder+1` });
    }

    // ── 2+3. crear preguntas nuevas (idempotente por texto) ───────────────
    const newQuestions = [
      ...EI_QUESTIONS.map((q, i) => ({
        text: q.text,
        category: 'engagement_index',
        questionTier: 'ENGAGEMENT_INDEX',
        isDriverCore: q.isDriverCore,
        isBenchmarkable: true,
        isRequired: true,
        responseType: q.nps ? 'nps_scale' : RATING_DEFAULTS.responseType,
        minValue: q.nps ? 0 : RATING_DEFAULTS.minValue,
        maxValue: q.nps ? 10 : RATING_DEFAULTS.maxValue,
        minLabel: q.nps ? 'Nada probable' : RATING_DEFAULTS.minLabel,
        maxLabel: q.nps ? 'Extremadamente probable' : RATING_DEFAULTS.maxLabel,
        orderOffset: i, // EI: offset 0-4
      })),
      {
        text: FOLLOW_UP_TEXT,
        category: 'texto_libre',
        questionTier: 'CORE',
        isDriverCore: false,
        isBenchmarkable: false,
        isRequired: false,
        responseType: 'text_open',
        minValue: 1,
        maxValue: 5,
        minLabel: null as string | null,
        maxLabel: null as string | null,
        orderOffset: 5, // follow-up
      },
      ...TEXT_OPEN_QUESTIONS.map((text, i) => ({
        text,
        category: 'texto_libre',
        questionTier: 'CORE',
        isDriverCore: false,
        isBenchmarkable: false,
        isRequired: false,
        responseType: 'text_open',
        minValue: 1,
        maxValue: 5,
        minLabel: null as string | null,
        maxLabel: null as string | null,
        orderOffset: 6 + i, // generales
      })),
    ];

    let createdCount = 0;
    let followUpOrder: number | null = null;
    const eiAnchorOrder = maxOrder + 1; // EI-1

    for (const q of newQuestions) {
      const existing = await prisma.question.findFirst({
        where: { campaignTypeId: campaignType.id, text: q.text },
        select: { id: true, questionOrder: true },
      });
      const targetOrder = maxOrder + 1 + q.orderOffset;
      if (q.text === FOLLOW_UP_TEXT) {
        followUpOrder = existing?.questionOrder ?? targetOrder;
      }
      if (existing) {
        rows.push({ slug, step: `pregunta o${existing.questionOrder}`, action: 'no-op', detail: `ya existe: "${q.text.slice(0, 50)}..."` });
        continue;
      }
      if (apply) {
        await prisma.question.create({
          data: {
            campaignTypeId: campaignType.id,
            text: q.text,
            category: q.category,
            questionOrder: targetOrder,
            responseType: q.responseType,
            questionTier: q.questionTier,
            isDriverCore: q.isDriverCore,
            isBenchmarkable: q.isBenchmarkable,
            isRequired: q.isRequired,
            minValue: q.minValue,
            maxValue: q.maxValue,
            minLabel: q.minLabel,
            maxLabel: q.maxLabel,
            methodologyReference: 'Engagement Index FocalizaHR',
          },
        });
      }
      createdCount++;
      rows.push({ slug, step: `pregunta o${targetOrder}`, action: 'create', detail: `[${q.responseType}/${q.questionTier}] "${q.text.slice(0, 50)}..."` });
    }

    // ── 4. questionCount + estimatedDuration ──────────────────────────────
    const finalCount = existingCount + createdCount;
    const needsTypeUpdate =
      campaignType.questionCount !== finalCount ||
      campaignType.estimatedDuration !== targets.estimatedDuration;
    if (needsTypeUpdate) {
      if (apply) {
        await prisma.campaignType.update({
          where: { id: campaignType.id },
          data: { questionCount: finalCount, estimatedDuration: targets.estimatedDuration },
        });
      }
      rows.push({
        slug,
        step: 'campaignType',
        action: 'update',
        detail: `questionCount ${campaignType.questionCount}→${finalCount} · duración ${campaignType.estimatedDuration}→${targets.estimatedDuration} min`,
      });
    } else {
      rows.push({ slug, step: 'campaignType', action: 'no-op', detail: 'questionCount y duración ya correctos' });
    }

    // ── 5. SurveyConfiguration: regla modify_text + categoryConfigs ───────
    const config = await prisma.surveyConfiguration.findUnique({
      where: { campaignTypeId: campaignType.id },
      select: { id: true, conditionalRules: true, categoryConfigs: true },
    });

    const existingRules: unknown[] = Array.isArray(config?.conditionalRules)
      ? (config!.conditionalRules as unknown[])
      : [];
    const hasFollowUpRule = existingRules.some(
      (r) =>
        typeof r === 'object' && r !== null &&
        (r as Record<string, unknown>).type === 'modify_text' &&
        (r as Record<string, unknown>).targetQuestionOrder === followUpOrder,
    );
    const newRule = {
      triggerQuestionOrder: eiAnchorOrder,
      targetQuestionOrder: followUpOrder,
      type: 'modify_text',
      textMapping: FOLLOW_UP_TEXT_MAPPING,
    };

    const existingCatConfigs: Record<string, unknown> =
      config?.categoryConfigs && typeof config.categoryConfigs === 'object' && !Array.isArray(config.categoryConfigs)
        ? (config.categoryConfigs as Record<string, unknown>)
        : {};
    const missingCatKeys = Object.keys(CATEGORY_CONFIGS_NEW).filter((k) => !(k in existingCatConfigs));

    if (!hasFollowUpRule || missingCatKeys.length > 0) {
      const mergedRules = hasFollowUpRule ? existingRules : [...existingRules, newRule];
      const mergedCats = { ...existingCatConfigs };
      for (const k of missingCatKeys) mergedCats[k] = CATEGORY_CONFIGS_NEW[k];

      if (apply) {
        await prisma.surveyConfiguration.upsert({
          where: { campaignTypeId: campaignType.id },
          create: {
            campaignTypeId: campaignType.id,
            conditionalRules: mergedRules as object[],
            categoryConfigs: mergedCats as object,
          },
          update: {
            conditionalRules: mergedRules as object[],
            categoryConfigs: mergedCats as object,
          },
        });
      }
      rows.push({
        slug,
        step: 'surveyConfig',
        action: config ? 'update' : 'create',
        detail: `${hasFollowUpRule ? '' : `+regla modify_text (EI-1 o${eiAnchorOrder} → follow-up o${followUpOrder}) `}${missingCatKeys.length ? `+categoryConfigs: ${missingCatKeys.join(', ')}` : ''}`,
      });
    } else {
      rows.push({ slug, step: 'surveyConfig', action: 'no-op', detail: 'regla y categoryConfigs ya presentes' });
    }
  }

  // ── Reporte ───────────────────────────────────────────────────────────
  console.log('');
  console.log('📋 Resumen de acciones:');
  for (const r of rows) {
    const emoji = r.action === 'create' ? '🆕' : r.action === 'update' ? '🔄' : r.action === 'WARN' ? '⚠️ ' : '✅';
    console.log(`   ${emoji} [${r.slug}] ${r.step}: ${r.detail}`);
  }
  console.log('');
  console.log(apply ? '🎉 Cambios APLICADOS.' : '🔍 DRY-RUN — nada escrito. Ejecutar con --apply para aplicar.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
