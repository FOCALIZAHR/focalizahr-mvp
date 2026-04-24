import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function crearPulsoAmbientesSanos() {
  console.log('🧹 Limpiando datos existentes si hay...');
  
  // Limpiar si existe
  try {
    await prisma.question.deleteMany({
      where: {
        campaignType: {
          slug: 'pulso-ambientes-sanos'
        }
      }
    });
    
    await prisma.surveyConfiguration.deleteMany({
      where: {
        campaignType: {
          slug: 'pulso-ambientes-sanos'
        }
      }
    });
    
    await prisma.campaignType.deleteMany({
      where: { slug: 'pulso-ambientes-sanos' }
    });
  } catch (e) {
    console.log('No había datos previos');
  }

  console.log('✨ Creando Pulso de Ambientes Sanos...');

  // FIXED: Usar nombres correctos del schema
  const campaignType = await prisma.campaignType.create({
    data: {
      name: 'Pulso de Ambientes Sanos',
      slug: 'pulso-ambientes-sanos',
      description: 'Detección preventiva de toxicidad y zona gris pre-crisis - Ley Karin',
      questionCount: 8,
      estimatedDuration: 7,
      methodology: 'Metodología Proyectiva + Análisis Condicional',
      category: 'clima',
      isActive: true,
      sortOrder: 4,
      isPermanent: false,
      flowType: 'employee-based',
      questions: {
        create: [
          {
            text: 'Sin mencionar nombres, describe una dinámica o comportamiento recurrente que consideras el mayor obstáculo para un ambiente de trabajo justo y respetuoso.',
            category: 'comunicacion',
            questionOrder: 1,
            responseType: 'text_open',
            isRequired: true,
            // FIXED: Agregar campos requeridos que faltaban
            isActive: true
          },
          {
            text: 'Imagina que un compañero reporta un trato injusto. ¿Qué es más probable que piense el resto del equipo?',
            category: 'seguridad_psicologica',
            questionOrder: 2,
            responseType: 'single_choice',
            choiceOptions: ["Qué valiente por alzar la voz", "Qué arriesgado, mejor no meterse"],
            responseValueMapping: {
              "Qué valiente por alzar la voz": 5,
              "Qué arriesgado, mejor no meterse": 1
            },
            isRequired: true,
            isActive: true
          },
          {
            text: 'Imagina que un miembro del equipo expresa un desacuerdo respetuoso con una decisión del líder. ¿Qué es más probable que ocurra después?',
            category: 'liderazgo',
            questionOrder: 3,
            responseType: 'single_choice',
            choiceOptions: ["Se genera una discusión constructiva", "El líder lo toma de forma personal"],
            responseValueMapping: {
              "Se genera una discusión constructiva": 5,
              "El líder lo toma de forma personal": 1
            },
            isRequired: true,
            isActive: true
          },
          {
            text: '¿Con qué frecuencia observas que se utiliza un lenguaje (bromas, sarcasmo) que podría ser incómodo o descalificador?',
            category: 'reconocimiento',
            questionOrder: 4,
            responseType: 'rating_scale',
            minLabel: 'Nunca',
            maxLabel: 'Siempre',
            isRequired: true,
            isActive: true
          },
          {
            text: 'Considerando la asignación de tareas y recursos, ¿qué dinámica describe mejor la realidad?',
            category: 'satisfaccion',
            questionOrder: 5,
            responseType: 'single_choice',
            choiceOptions: ["Es un sistema equitativo y transparente", "Hay más flexibilidad según la persona"],
            responseValueMapping: {
              "Es un sistema equitativo y transparente": 5,
              "Hay más flexibilidad según la persona": 1
            },
            isRequired: true,
            isActive: true
          },
          {
            text: 'Para tu desarrollo y bienestar, ¿qué es MÁS importante que tu líder fomente?',
            category: 'liderazgo',
            questionOrder: 6,
            responseType: 'single_choice',
            choiceOptions: ["Un feedback claro y respetuoso", "Autonomía y confianza"],
            isRequired: true,
            isActive: true
          },
          {
            text: 'Calificación del liderazgo (se ajustará según tu respuesta anterior)',
            category: 'liderazgo',
            questionOrder: 7,
            responseType: 'rating_scale',
            minLabel: 'Puede mejorar',
            maxLabel: 'Excelente',
            isRequired: true,
            isActive: true
          },
          {
            text: 'Independientemente de la carga de trabajo, ¿con qué frecuencia terminas tu día agotado/a debido a las interacciones en tu equipo?',
            category: 'satisfaccion',
            questionOrder: 8,
            responseType: 'rating_scale',
            minLabel: 'Nunca',
            maxLabel: 'Siempre',
            isRequired: true,
            isActive: true
          }
        ]
      }
    },
    include: {
      questions: true
    }
  });

  console.log('✅ Tipo de campaña creado con ID:', campaignType.id);
  console.log('✅ Preguntas creadas:', campaignType.questions.length);

  // FIXED: Verificar si tabla surveyConfiguration existe y usar nombres correctos
  try {
    const config = await prisma.surveyConfiguration.create({
      data: {
        campaignTypeId: campaignType.id,
        categoryConfigs: {
          comunicacion: {
            displayName: "Transparencia y Colaboración",
            icon: "MessageSquare",
            color: "cyan",
            description: "Cómo fluye la comunicación en tu equipo",
            motivationalText: "Tu perspectiva mejora la comunicación",
            order: 1
          },
          seguridad_psicologica: {
            displayName: "Seguridad Psicológica",
            icon: "Shield",
            color: "purple",
            description: "Qué tan seguro te sientes para expresarte",
            motivationalText: "Un espacio seguro para todos",
            order: 2
          },
          liderazgo: {
            displayName: "Calidad del Liderazgo",
            icon: "Award",
            color: "gradient",
            description: "La efectividad del liderazgo en tu área",
            motivationalText: "Tu feedback mejora el liderazgo",
            order: 3
          },
          reconocimiento: {
            displayName: "Respeto y Valoración",
            icon: "Heart",
            color: "cyan",
            description: "El nivel de respeto en las interacciones diarias",
            motivationalText: "Construyendo respeto mutuo",
            order: 4
          },
          satisfaccion: {
            displayName: "Equidad y Bienestar",
            icon: "Scale",
            color: "purple",
            description: "Justicia en decisiones y sostenibilidad del equipo",
            motivationalText: "Por un ambiente justo y sostenible",
            order: 5
          }
        },
        conditionalRules: [{
          triggerQuestionOrder: 6,
          targetQuestionOrder: 7,
          type: "modify_text",
          textMapping: {
            "Un feedback claro y respetuoso": "¿Cómo calificarías la claridad y respeto del feedback de tu líder?",
            "Autonomía y confianza": "¿Cómo calificarías la confianza y autonomía que te da tu líder?"
          }
        }],
        uiSettings: {
          showCategoryIntros: true,
          questionTransitions: "slide",
          progressDisplay: "categorical",
          breakAfterQuestions: [5],
          completionCelebration: true,
          theme: {
            primaryColor: "cyan",
            secondaryColor: "purple",
            showGradients: true
          }
        }
      }
    });
    console.log('✅ Configuración UI creada');
  } catch (e) {
    console.log('⚠️  Tabla survey_configurations no existe o error:', e);
    console.log('ℹ️  El sistema funcionará sin configuración UI avanzada');
  }

  console.log('\n🎉 ¡PULSO DE AMBIENTES SANOS CREADO EXITOSAMENTE!');
  console.log('📋 Próximos pasos:');
  console.log('1. Reinicia tu servidor: npm run dev');
  console.log('2. Prueba creando una campaña con este tipo');
  console.log(`3. Slug para testing: "pulso-ambientes-sanos"`);
  console.log(`4. Verifica que aparece en el wizard de creación`);
}

// Ejecutar
crearPulsoAmbientesSanos()
  .catch((e) => {
    console.error('❌ Error:', e);
    console.log('\n🔍 DEBUGGING INFO:');
    console.log('- Verifica que Prisma está conectado: npx prisma studio');
    console.log('- Regenera cliente: npx prisma generate');
    console.log('- Revisa schema: npx prisma db pull');
  })
  .finally(async () => {
    await prisma.$disconnect();
  });