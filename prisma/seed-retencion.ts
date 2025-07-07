// prisma/seed-retencion.ts
// FocalizaHR Retención Predictiva - Seed Separado
// Ejecutar: npm run db:seed:retencion

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedRetencionPredictiva() {
  console.log('🎯 Seeding FocalizaHR Retención Predictiva...');

  try {
    // 1. Verificar si ya existe
    const existing = await prisma.campaignType.findUnique({
      where: { slug: 'retencion-predictiva' }
    });

    if (existing) {
      console.log('⚠️  FocalizaHR Retención Predictiva ya existe. Saltando...');
      return;
    }

    // 2. Crear campaign type
    console.log('📝 Creando campaign type Retención Predictiva...');
    const campaignType = await prisma.campaignType.create({
      data: {
        name: 'FocalizaHR Retención Predictiva',
        slug: 'retencion-predictiva',
        description: 'Instrumento estratégico para identificar y predecir las causas de la rotación de talento.',
        questionCount: 7,
        estimatedDuration: 12,
        methodology: 'Exit Interview Scientific Framework + Predictive Analytics + Conditional Logic',
        category: 'retencion',
        isActive: true,
        sortOrder: 3
      }
    });
    console.log('✅ Campaign type creado:', campaignType.id);

    // 3. Crear las 7 preguntas
    console.log('📋 Creando 7 preguntas...');
    
    const questions = [
      {
        text: 'Si tuvieras que resumir en una frase la razón principal que te llevó a tomar la decisión de buscar una nueva oportunidad, ¿cuál sería?',
        category: 'causa_raiz',
        questionOrder: 1,
        responseType: 'text_open'
      },
      {
        text: 'De la siguiente lista, por favor selecciona los 3 aspectos que MÁS VALORAS o habrías valorado para tu desarrollo y permanencia en la empresa.',
        category: 'valoracion_aspectos',
        questionOrder: 2,
        responseType: 'multiple_choice',
        choiceOptions: [
          "Oportunidades de Crecimiento",
          "Flexibilidad y Equilibrio", 
          "Autonomía y Confianza",
          "Reconocimiento y Valoración",
          "Liderazgo de Apoyo",
          "Compensación y Beneficios"
        ]
      },
      {
        text: 'Ahora, para los 3 aspectos que seleccionaste, ¿cómo calificarías la calidad con la que la empresa los entregó?',
        category: 'calidad_entrega',
        questionOrder: 3,
        responseType: 'rating_matrix_conditional',
        conditionalLogic: {
          depends_on_question: 2,
          matrix_type: 'selected_aspects_only'
        }
      },
      {
        text: 'Mi líder/supervisor/a directo/a se preocupó genuinamente por mi bienestar y me proporcionó el apoyo necesario para tener éxito.',
        category: 'liderazgo',
        questionOrder: 4,
        responseType: 'rating_scale'
      },
      {
        text: 'Las oportunidades de crecimiento y desarrollo que recibí en la empresa cumplieron con las expectativas que tenía al momento de ingresar.',
        category: 'desarrollo_evp',
        questionOrder: 5,
        responseType: 'rating_scale'
      },
      {
        text: 'Considero que el ambiente de trabajo fue siempre un lugar seguro y respetuoso, libre de acoso o discriminación.',
        category: 'seguridad_psicologica',
        questionOrder: 6,
        responseType: 'rating_scale'
      },
      {
        text: 'Sentí que tenía la confianza y la autonomía necesarias para tomar decisiones relevantes sobre mi propio trabajo.',
        category: 'autonomia',
        questionOrder: 7,
        responseType: 'rating_scale'
      }
    ];

    for (const [index, questionData] of questions.entries()) {
      const question = await prisma.question.create({
        data: {
          campaignTypeId: campaignType.id,
          text: questionData.text,
          category: questionData.category,
          questionOrder: questionData.questionOrder,
          responseType: questionData.responseType,
          choiceOptions: questionData.choiceOptions || undefined,
          conditionalLogic: questionData.conditionalLogic || undefined,
          isRequired: true,
          isActive: true,
          minValue: 1,
          maxValue: 5
        }
      });
      console.log(`✅ Pregunta ${questionData.questionOrder}/7 creada`);
    }

    // 4. Crear templates de comunicación (5 claves)
    console.log('💭 Creando templates inteligencia...');
    
    const templates = [
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

    for (const templateData of templates) {
      const template = await prisma.communicationTemplate.create({
        data: {
          templateType: templateData.templateType,
          category: templateData.category,
          conditionRule: templateData.conditionRule,
          templateText: JSON.stringify(templateData.templateText),
          variablesRequired: templateData.variablesRequired,
          priority: templateData.priority,
          isActive: true,
          usageCount: 0
        }
      });
      console.log(`✅ Template ${templateData.templateType} creado`);
    }

    // 5. Verificación final
    const verification = await prisma.campaignType.findUnique({
      where: { slug: 'retencion-predictiva' },
      include: {
        questions: true
      }
    });

    console.log('🎉 FocalizaHR Retención Predictiva seeded exitosamente!');
    console.log(`   - Campaign type: ${verification?.name}`);
    console.log(`   - Preguntas: ${verification?.questions.length}/7`);
    console.log(`   - Templates: ${templates.length}`);

  } catch (error) {
    console.error('❌ Error seeding Retención Predictiva:', error);
    throw error;
  }
}

// Función principal para ejecutar solo este seed
async function main() {
  console.log('🌱 Starting FocalizaHR Retención Predictiva seed...')
  
  try {
    await seedRetencionPredictiva();
    console.log('🎉 Retención Predictiva seed completed successfully!')
  } catch (error) {
    console.error('❌ Retención Predictiva seed failed:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

// Exportar función para usar desde seed.ts principal si se desea
export { seedRetencionPredictiva }