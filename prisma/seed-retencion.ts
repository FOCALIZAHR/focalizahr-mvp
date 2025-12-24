// prisma/seed-retencion.ts
// FocalizaHR Retención Predictiva - Seed v2.0 UPSERT
// ✅ Estrategia: Upsert Lógico (UPDATE P1-P7, CREATE P8)
// 🛡️ Safety Net: Preserva IDs, mantiene responses existentes
// Ejecutar: npm run db:seed:retencion

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedRetencionPredictiva() {
  console.log('🎯 Seeding FocalizaHR Retención Predictiva v2.0 (Upsert)...');
  console.log('📊 Estrategia: UPDATE existentes + CREATE faltantes');
  console.log('');

  try {
    // ════════════════════════════════════════════════════════════════
    // PASO 1: Buscar CampaignType existente
    // ════════════════════════════════════════════════════════════════
    
    console.log('📋 Buscando CampaignType existente...');
    
    let campaignType = await prisma.campaignType.findUnique({
      where: { slug: 'retencion-predictiva' }
    });

    if (!campaignType) {
      console.log('⚠️  CampaignType no existe. Creando...');
      campaignType = await prisma.campaignType.create({
        data: {
          name: 'FocalizaHR Retención Predictiva',
          slug: 'retencion-predictiva',
          description: 'Instrumento estratégico para identificar y predecir las causas de la rotación de talento.',
          questionCount: 8,
          estimatedDuration: 12,
          methodology: 'Exit Interview Scientific Framework + Predictive Analytics + Conditional Logic',
          category: 'retencion',
          isActive: true,
          sortOrder: 3,
          isPermanent: true  // ← Marcar como permanente
        }
      });
      console.log('✅ CampaignType creado:', campaignType.id);
    } else {
      // Actualizar questionCount si es necesario
      if (campaignType.questionCount !== 8) {
        await prisma.campaignType.update({
          where: { id: campaignType.id },
          data: { 
            questionCount: 8,
            isPermanent: true  // ← Asegurar isPermanent
          }
        });
        console.log('✅ CampaignType actualizado: questionCount = 8');
      } else {
        console.log('✅ CampaignType encontrado:', campaignType.id);
      }
    }
    
    console.log('');
    
    // ════════════════════════════════════════════════════════════════
    // PASO 2: Definir las 8 preguntas (P1-P7 existentes + P8 nueva)
    // ════════════════════════════════════════════════════════════════
    
    console.log('📋 Procesando 8 preguntas (UPDATE + CREATE)...');
    console.log('');
    
    const questionsDefinition = [
      {
        questionOrder: 1,
        text: 'Si tuvieras que resumir en una frase la razón principal que te llevó a tomar la decisión de buscar una nueva oportunidad, ¿cuál sería?',
        category: 'causa_raiz',
        responseType: 'text_open',
        choiceOptions: undefined,
        conditionalLogic: undefined,
        minValue: undefined,
        maxValue: undefined
      },
      {
        questionOrder: 2,
        text: 'De la siguiente lista, por favor selecciona los 3 aspectos que MÁS VALORAS o habrías valorado para tu desarrollo y permanencia en la empresa.',
        category: 'valoracion_aspectos',
        responseType: 'multiple_choice',
        choiceOptions: [
          "Oportunidades de Crecimiento",
          "Flexibilidad y Equilibrio", 
          "Autonomía y Confianza",
          "Reconocimiento y Valoración",
          "Liderazgo de Apoyo",
          "Compensación y Beneficios"
        ],
        conditionalLogic: undefined,
        minValue: undefined,
        maxValue: undefined
      },
      {
        questionOrder: 3,
        text: 'Ahora, para los 3 aspectos que seleccionaste, ¿cómo calificarías la calidad con la que la empresa los entregó?',
        category: 'calidad_entrega',
        responseType: 'rating_matrix_conditional',
        choiceOptions: undefined,
        conditionalLogic: {
          depends_on_question: 2,
          matrix_type: 'selected_aspects_only'
        },
        minValue: undefined,
        maxValue: undefined
      },
      {
        questionOrder: 4,
        text: 'Mi líder/supervisor/a directo/a se preocupó genuinamente por mi bienestar y me proporcionó el apoyo necesario para tener éxito.',
        category: 'liderazgo',
        responseType: 'rating_scale',
        choiceOptions: undefined,
        conditionalLogic: undefined,
        minValue: undefined,
        maxValue: undefined
      },
      {
        questionOrder: 5,
        text: 'Las oportunidades de crecimiento y desarrollo que recibí en la empresa cumplieron con las expectativas que tenía al momento de ingresar.',
        category: 'desarrollo_evp',
        responseType: 'rating_scale',
        choiceOptions: undefined,
        conditionalLogic: undefined,
        minValue: undefined,
        maxValue: undefined
      },
      {
        questionOrder: 6,
        text: 'Considero que el ambiente de trabajo fue siempre un lugar seguro y respetuoso, libre de acoso o discriminación.',
        category: 'seguridad_psicologica',
        responseType: 'rating_scale',
        choiceOptions: undefined,
        conditionalLogic: undefined,
        minValue: undefined,
        maxValue: undefined
      },
      {
        questionOrder: 7,
        text: 'Sentí que tenía la confianza y la autonomía necesarias para tomar decisiones relevantes sobre mi propio trabajo.',
        category: 'autonomia',
        responseType: 'rating_scale',
        choiceOptions: undefined,
        conditionalLogic: undefined,
        minValue: undefined,
        maxValue: undefined
      },
      // ════════════════════════════════════════════════════════════════
      // ← P8 NUEVA: NPS 0-10
      // ════════════════════════════════════════════════════════════════
      {
        questionOrder: 8,
        text: 'En una escala de 0 a 10, ¿qué tan probable es que recomiendes esta empresa como lugar para trabajar?',
        category: 'satisfaccion',
        responseType: 'nps_scale',
        choiceOptions: undefined,
        conditionalLogic: undefined,
        minValue: 0,
        maxValue: 10
      }
    ];
    
    let updatedCount = 0;
    let createdCount = 0;
    
    // ════════════════════════════════════════════════════════════════
    // PASO 3: Upsert lógico por pregunta
    // ════════════════════════════════════════════════════════════════
    
    for (const questionDef of questionsDefinition) {
      // Buscar pregunta existente por questionOrder
      const existingQuestion = await prisma.question.findFirst({
        where: {
          campaignTypeId: campaignType.id,
          questionOrder: questionDef.questionOrder
        }
      });
      
      if (existingQuestion) {
        // ✅ UPDATE: Pregunta existe (P1-P7)
        const updated = await prisma.question.update({
          where: { id: existingQuestion.id },
          data: {
            text: questionDef.text,
            category: questionDef.category,
            responseType: questionDef.responseType,
            choiceOptions: questionDef.choiceOptions || undefined,
            conditionalLogic: questionDef.conditionalLogic || undefined,
            isRequired: true,
            isActive: true,
            minValue: questionDef.minValue ?? 1,
            maxValue: questionDef.maxValue ?? 5
          }
        });
        updatedCount++;
        console.log(`  ♻️  Updated: Order ${questionDef.questionOrder} (ID: ${existingQuestion.id})`);
      } else {
        // 🆕 CREATE: Pregunta no existe (P8)
        const created = await prisma.question.create({
          data: {
            campaignTypeId: campaignType.id,
            text: questionDef.text,
            category: questionDef.category,
            questionOrder: questionDef.questionOrder,
            responseType: questionDef.responseType,
            choiceOptions: questionDef.choiceOptions || undefined,
            conditionalLogic: questionDef.conditionalLogic || undefined,
            isRequired: true,
            isActive: true,
            minValue: questionDef.minValue ?? 1,
            maxValue: questionDef.maxValue ?? 5
          }
        });
        createdCount++;
        console.log(`  🆕 Created: Order ${questionDef.questionOrder} (ID: ${created.id})`);
      }
    }
    
    console.log('');
    
    // ════════════════════════════════════════════════════════════════
    // PASO 4: Upsert Templates de Comunicación (preservar existentes)
    // ════════════════════════════════════════════════════════════════
    
    console.log('💭 Procesando templates de comunicación...');
    console.log('');
    
    const templatesDefinition = [
      {
        templateType: 'alerta_fuga_estancamiento',
        category: 'desarrollo_evp',
        conditionRule: 'score_question_5 < 2.5 AND keyword_match(razon_abierta, [carrera, crecimiento, oportunidad]) > 30%',
        templateText: {
          nombre_insight: "Alerta Crítica: Fuga de Talento por Estancamiento Profesional",
          diagnostico: "Hemos detectado un patrón crítico en el equipo de **{department_name}**. La percepción sobre 'Oportunidades de Crecimiento' es extremadamente baja, con un score promedio de solo **{score_question_5}** sobre 5. Esto se confirma con el análisis de texto, donde el **{keyword_percentage}%** de los colaboradores que se van mencionan esto como su razón principal.",
          implicacion_estrategica: "Esto representa una hemorragia de talento crítico. Nuestra data muestra que el **{tasa_rotacion_lamentada}%** de la rotación en este equipo es 'Lamentada' (alto rendimiento), con un costo estimado de **${costo_rotacion_estimado}**.",
          recomendacion_accionable: "Se requiere una **intervención urgente** con la gerencia de **{department_name}**. Se recomienda: 1) Realizar 'entrevistas de permanencia' con el talento de alto rendimiento restante. 2) Diseñar y comunicar un mapa de carrera técnico claro para los roles de **{role_name}**."
        },
        variablesRequired: ["department_name", "score_question_5", "keyword_percentage", "tasa_rotacion_lamentada", "costo_rotacion_estimado", "role_name"],
        priority: 10
      },
      {
        templateType: 'alerta_liderazgo_toxico',
        category: 'liderazgo',
        conditionRule: 'score_question_4 < 2.0 AND keyword_match(razon_abierta, [jefe, supervisor, lider, manager]) > 25%',
        templateText: {
          nombre_insight: "Alerta Crítica: Toxicidad en Liderazgo Detectada",
          diagnostico: "Se ha identificado un patrón preocupante en **{department_name}** donde el liderazgo directo obtiene una calificación crítica de **{score_question_4}** sobre 5. El **{keyword_percentage}%** de las renuncias mencionan explícitamente problemas con la supervisión directa.",
          implicacion_estrategica: "El liderazgo tóxico genera un efecto dominó: **{tasa_rotacion_lamentada}%** de rotación no deseada, clima laboral deteriorado y potencial exposición legal. El costo directo estimado supera **${costo_rotacion_estimado}** solo en este trimestre.",
          recomendacion_accionable: "**Acción inmediata requerida**: 1) Evaluación 360° del liderazgo en **{department_name}**. 2) Coaching ejecutivo intensivo o reubicación del supervisor. 3) Entrevistas de retención con colaboradores clave restantes antes de 30 días."
        },
        variablesRequired: ["department_name", "score_question_4", "keyword_percentage", "tasa_rotacion_lamentada", "costo_rotacion_estimado"],
        priority: 10
      },
      {
        templateType: 'gap_reconocimiento_critico',
        category: 'reconocimiento',
        conditionRule: 'avg_valoracion_reconocimiento > 4.0 AND avg_entrega_reconocimiento < 2.5',
        templateText: {
          nombre_insight: "Gap Crítico: Reconocimiento Altamente Valorado pero Mal Entregado",
          diagnostico: "Análisis revela una desconexión crítica en **{department_name}**: los colaboradores valoran extremadamente el reconocimiento (**{valoracion_reconocimiento}**/5) pero perciben que la empresa lo entrega deficientemente (**{entrega_reconocimiento}**/5). Esta brecha de **{gap_reconocimiento}** puntos predice rotación.",
          implicacion_estrategica: "Este gap representa el 'factor X' de la rotación no explicada. Colaboradores de alto rendimiento que valoran reconocimiento pero no lo reciben tienen **{probabilidad_renuncia}%** probabilidad de renunciar en los próximos 6 meses, con costo proyectado de **${costo_proyectado}**.",
          recomendacion_accionable: "**Estrategia de reconocimiento urgente**: 1) Implementar sistema de reconocimiento peer-to-peer inmediato. 2) Capacitar líderes en 'momentos de reconocimiento' semanales. 3) Establecer celebraciones de logros públicas mensuales en **{department_name}**."
        },
        variablesRequired: ["department_name", "valoracion_reconocimiento", "entrega_reconocimiento", "gap_reconocimiento", "probabilidad_renuncia", "costo_proyectado"],
        priority: 9
      }
    ];
    
    let templatesUpdatedCount = 0;
    let templatesCreatedCount = 0;
    
    for (const templateDef of templatesDefinition) {
      // Buscar template existente por templateType
      const existingTemplate = await prisma.communicationTemplate.findFirst({
        where: {
          templateType: templateDef.templateType
        }
      });
      
      if (existingTemplate) {
        // ✅ UPDATE: Template existe (preservar)
        await prisma.communicationTemplate.update({
          where: { id: existingTemplate.id },
          data: {
            category: templateDef.category,
            conditionRule: templateDef.conditionRule,
            templateText: JSON.stringify(templateDef.templateText),
            variablesRequired: templateDef.variablesRequired,
            priority: templateDef.priority,
            isActive: true
          }
        });
        templatesUpdatedCount++;
        console.log(`  ♻️  Updated template: ${templateDef.templateType}`);
      } else {
        // 🆕 CREATE: Template no existe
        await prisma.communicationTemplate.create({
          data: {
            templateType: templateDef.templateType,
            category: templateDef.category,
            conditionRule: templateDef.conditionRule,
            templateText: JSON.stringify(templateDef.templateText),
            variablesRequired: templateDef.variablesRequired,
            priority: templateDef.priority,
            isActive: true,
            usageCount: 0
          }
        });
        templatesCreatedCount++;
        console.log(`  🆕 Created template: ${templateDef.templateType}`);
      }
    }
    
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SEED COMPLETADO');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📊 RESUMEN:');
    console.log(`   ♻️  Preguntas actualizadas: ${updatedCount}`);
    console.log(`   🆕 Preguntas creadas: ${createdCount}`);
    console.log(`   ♻️  Templates actualizados: ${templatesUpdatedCount}`);
    console.log(`   🆕 Templates creados: ${templatesCreatedCount}`);
    console.log(`   📝 Total procesado: ${questionsDefinition.length} preguntas + ${templatesDefinition.length} templates`);
    console.log('');
    console.log('🎯 RESULTADO:');
    console.log('   ✅ P1-P7: Mantenidas (IDs + responses preservadas)');
    console.log('   ✅ P8: Agregada (NPS 0-10)');
    console.log('   ✅ Templates: Preservados/Creados');
    console.log('   ✅ isPermanent: true');
    console.log('   ✅ Idempotente (ejecutar múltiples veces = mismo resultado)');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding Retención Predictiva:', error);
    throw error;
  }
}

// Función principal para ejecutar solo este seed
async function main() {
  console.log('🌱 Starting FocalizaHR Retención Predictiva seed v2.0...');
  console.log('');
  
  try {
    await seedRetencionPredictiva();
    console.log('🎉 Retención Predictiva seed completed successfully!');
  } catch (error) {
    console.error('❌ Retención Predictiva seed failed:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

// Exportar función para usar desde seed.ts principal si se desea
export { seedRetencionPredictiva };