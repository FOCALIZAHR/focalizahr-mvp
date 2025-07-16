// src/scripts/seedTemplates.ts - ARQUITECTURA CONTEXTUAL
import { prisma } from '@/lib/prisma';

const seedTemplates = async () => {
  console.log('🌱 Starting template seeding with product context...');

  const templates = [
    // ✅ TEMPLATES GENERALES (productContext: 'general')
    {
      templateType: 'fortaleza_general',
      productContext: 'general', // NUEVO CAMPO
      category: 'general',
      conditionRule: 'overallScore >= 4.0',
      templateText: '💪 Fortaleza organizacional: {companyName} logra {overallScore}/5.0 puntos - Excelente desempeño general',
      variablesRequired: ['overallScore', 'companyName'],
      priority: 8,
      isActive: true
    },
    {
      templateType: 'oportunidad_general',
      productContext: 'general', // NUEVO CAMPO
      category: 'general',
      conditionRule: 'overallScore < 3.0',
      templateText: '🎯 Oportunidad de mejora: Score general {overallScore}/5.0 requiere plan de acción prioritario',
      variablesRequired: ['overallScore'],
      priority: 9,
      isActive: true
    },
    {
      templateType: 'excelencia_elite',
      productContext: 'general', // NUEVO CAMPO
      category: 'general',
      conditionRule: 'overallScore >= 4.3',
      templateText: '🌟 Organización de elite: {companyName} logra {overallScore}/5.0 puntos - Percentil 95+ del mercado laboral',
      variablesRequired: ['overallScore', 'companyName'],
      priority: 11,
      isActive: true
    },

    // ✅ TEMPLATES PARTICIPACIÓN (productContext: 'general')
    {
      templateType: 'participacion_excepcional',
      productContext: 'general', // NUEVO CAMPO
      category: 'participacion',
      conditionRule: 'participationRate >= 85',
      templateText: '📊 Participación excepcional: {participationRate}% del equipo completó el análisis - Máxima confiabilidad estadística garantizada',
      variablesRequired: ['participationRate'],
      priority: 8,
      isActive: true
    },
    {
      templateType: 'participacion_alta',
      productContext: 'general', // NUEVO CAMPO
      category: 'participacion',
      conditionRule: 'participationRate >= 75 && participationRate < 85',
      templateText: '✅ Excelente participación: {participationRate}% de respuesta permite análisis estadísticamente robusto',
      variablesRequired: ['participationRate'],
      priority: 6,
      isActive: true
    },
    {
      templateType: 'participacion_moderada',
      productContext: 'general', // NUEVO CAMPO
      category: 'participacion',
      conditionRule: 'participationRate >= 40 && participationRate < 75',
      templateText: '⚠️ Participación moderada: {participationRate}% - Considerar estrategias para incrementar engagement futuro',
      variablesRequired: ['participationRate'],
      priority: 7,
      isActive: true
    },

    // ✅ TEMPLATES DEPARTAMENTOS (productContext: 'general')
    {
      templateType: 'departamento_campeon',
      productContext: 'general', // NUEVO CAMPO
      category: 'departamentos',
      conditionRule: 'strongestDepartment && strongestDepartment.score >= 4.0 && departmentVariability > 0.5',
      templateText: '🏆 Departamento campeón: {strongest_dept} lidera con {strongest_dept_score}/5.0 - Modelo a replicar en organización',
      variablesRequired: ['strongest_dept', 'strongest_dept_score'],
      priority: 7,
      isActive: true
    },
    {
      templateType: 'departamento_oportunidad',
      productContext: 'general', // NUEVO CAMPO
      category: 'departamentos',
      conditionRule: 'weakestDepartment && weakestDepartment.score < 3.5 && departmentVariability > 0.8',
      templateText: '🎯 Oportunidad departamental: {weakest_dept} requiere atención ({weakest_dept_score}/5.0) - Priorizar intervención',
      variablesRequired: ['weakest_dept', 'weakest_dept_score'],
      priority: 8,
      isActive: true
    },
    {
      templateType: 'variabilidad_departamental',
      productContext: 'general', // NUEVO CAMPO
      category: 'departamentos',
      conditionRule: 'departmentVariability > 1.0',
      templateText: '📊 Variabilidad entre departamentos significativa ({dept_variability} puntos) - Oportunidad estandarización',
      variablesRequired: ['dept_variability'],
      priority: 6,
      isActive: true
    },
    {
      templateType: 'departamento_balance',
      productContext: 'general', // NUEVO CAMPO
      category: 'departamentos',
      conditionRule: 'departmentVariability <= 0.5 && Object.keys(departmentScores).length >= 3',
      templateText: '⚖️ Balance departamental excelente: Variabilidad mínima ({dept_variability}) indica cultura organizacional consistente',
      variablesRequired: ['dept_variability'],
      priority: 5,
      isActive: true
    },

    // ✅ TEMPLATES BENCHMARK (productContext: 'general')
    {
      templateType: 'benchmark_superior_significativo',
      productContext: 'general', // NUEVO CAMPO
      category: 'benchmark',
      conditionRule: 'benchmarkDifference > 0.5',
      templateText: '🏆 Ventaja competitiva significativa: {companyName} supera benchmark sectorial por +{benchmark_difference} puntos',
      variablesRequired: ['companyName', 'benchmark_difference'],
      priority: 9,
      isActive: true
    },
    {
      templateType: 'benchmark_superior_moderado',
      productContext: 'general', // NUEVO CAMPO
      category: 'benchmark',
      conditionRule: 'benchmarkDifference > 0.2 && benchmarkDifference <= 0.5',
      templateText: '📈 Por encima del promedio: Supera benchmark sectorial por +{benchmark_difference} puntos',
      variablesRequired: ['benchmark_difference'],
      priority: 7,
      isActive: true
    },
    {
      templateType: 'benchmark_gap_significativo',
      productContext: 'general', // NUEVO CAMPO
      category: 'benchmark',
      conditionRule: 'benchmarkDifference < -0.5',
      templateText: '🎯 Oportunidad sectorial: Puede elevarse +{improvement_potential} puntos para alcanzar liderazgo industrial',
      variablesRequired: ['improvement_potential'],
      priority: 8,
      isActive: true
    },

    // ✅ TEMPLATES POR CATEGORÍA (productContext: 'general')
    {
      templateType: 'fortaleza_liderazgo',
      productContext: 'general', // NUEVO CAMPO
      category: 'liderazgo',
      conditionRule: 'strongestCategory && strongestCategory.category === "liderazgo" && strongestCategory.score >= 4.0',
      templateText: '👑 Liderazgo sobresaliente: Equipo directivo destaca con {score}/5.0 - Ventaja competitiva en gestión',
      variablesRequired: ['score'],
      priority: 10,
      isActive: true
    },
    {
      templateType: 'oportunidad_desarrollo',
      productContext: 'general', // NUEVO CAMPO
      category: 'desarrollo',
      conditionRule: 'weakestCategory && weakestCategory.category === "desarrollo" && weakestCategory.score < 3.0',
      templateText: '📚 Oportunidad CRÍTICA en desarrollo: {score}/5.0 requiere plan de carrera inmediato - Factor clave retención',
      variablesRequired: ['score'],
      priority: 12,
      isActive: true
    },
    {
      templateType: 'fortaleza_ambiente',
      productContext: 'general', // NUEVO CAMPO
      category: 'ambiente',
      conditionRule: 'strongestCategory && strongestCategory.category === "ambiente" && strongestCategory.score >= 4.2',
      templateText: '🌟 Ambiente excepcional: {score}/5.0 en clima laboral - Foundation sólida para productividad',
      variablesRequired: ['score'],
      priority: 9,
      isActive: true
    },
    {
      templateType: 'equilibrio_bienestar',
      productContext: 'general', // NUEVO CAMPO
      category: 'bienestar',
      conditionRule: 'strongestCategory && strongestCategory.category === "bienestar" && strongestCategory.score >= 4.0',
      templateText: '🧘‍♀️ Bienestar destacado: {score}/5.0 indica balance vida-trabajo saludable',
      variablesRequired: ['score'],
      priority: 8,
      isActive: true
    },

    // ✅ TEMPLATES ESPECÍFICOS RETENCIÓN PREDICTIVA (productContext: 'retencion-predictiva')
    {
      templateType: 'retencion_riesgo_alto',
      productContext: 'retencion-predictiva', // NUEVO CAMPO - ESPECÍFICO DEL PRODUCTO
      category: 'retencion-predictiva',
      conditionRule: 'campaignType === "retencion-predictiva" && overallScore < 3.0',
      templateText: '🚨 Riesgo retención ALTO: Score {overallScore}/5.0 requiere estrategia retención inmediata',
      variablesRequired: ['overallScore'],
      priority: 11,
      isActive: true
    },
    {
      templateType: 'retencion_solida',
      productContext: 'retencion-predictiva', // NUEVO CAMPO - ESPECÍFICO DEL PRODUCTO
      category: 'retencion-predictiva',
      conditionRule: 'campaignType === "retencion-predictiva" && overallScore >= 4.0',
      templateText: '🛡️ Indicadores retención sólidos: Score {overallScore}/5.0 sugiere baja probabilidad rotación voluntaria',
      variablesRequired: ['overallScore'],
      priority: 9,
      isActive: true
    },
    {
      templateType: 'desarrollo_retencion_critico',
      productContext: 'retencion-predictiva', // NUEVO CAMPO - ESPECÍFICO DEL PRODUCTO
      category: 'retencion-predictiva',
      conditionRule: 'campaignType === "retencion-predictiva" && strongestCategory && strongestCategory.category === "desarrollo" && strongestCategory.score < 3.0',
      templateText: '📚 Desarrollo profesional CRÍTICO para retención: {score}/5.0 - Implementar plan carrera urgente',
      variablesRequired: ['score'],
      priority: 12,
      isActive: true
    },

    // ✅ TEMPLATES ESPECÍFICOS PULSO EXPRESS (productContext: 'pulso-express')
    {
      templateType: 'pulso_positivo',
      productContext: 'pulso-express', // NUEVO CAMPO - ESPECÍFICO DEL PRODUCTO
      category: 'pulso-express',
      conditionRule: 'campaignType === "pulso-express" && overallScore >= 4.0',
      templateText: '🚀 Pulso organizacional positivo: Score {overallScore}/5.0 indica ambiente saludable y productivo',
      variablesRequired: ['overallScore'],
      priority: 8,
      isActive: true
    },
    {
      templateType: 'pulso_alerta',
      productContext: 'pulso-express', // NUEVO CAMPO - ESPECÍFICO DEL PRODUCTO
      category: 'pulso-express',
      conditionRule: 'campaignType === "pulso-express" && overallScore < 3.0',
      templateText: '⚠️ Pulso requiere atención: Score {overallScore}/5.0 sugiere implementar plan mejora inmediato',
      variablesRequired: ['overallScore'],
      priority: 9,
      isActive: true
    },

    // ✅ TEMPLATES ESPECÍFICOS EXPERIENCIA COLABORADOR (productContext: 'experiencia-colaborador')
    {
      templateType: 'experiencia_destacada',
      productContext: 'experiencia-colaborador', // NUEVO CAMPO - ESPECÍFICO DEL PRODUCTO
      category: 'experiencia-colaborador',
      conditionRule: 'campaignType === "experiencia-colaborador" && strongestCategory && strongestCategory.score >= 4.0',
      templateText: '✨ Experiencia colaborador destacada: {category} sobresale ({score}/5.0) como pilar de la experiencia',
      variablesRequired: ['category', 'score'],
      priority: 8,
      isActive: true
    },
    {
      templateType: 'experiencia_gap_critico',
      productContext: 'experiencia-colaborador', // NUEVO CAMPO - ESPECÍFICO DEL PRODUCTO
      category: 'experiencia-colaborador',
      conditionRule: 'campaignType === "experiencia-colaborador" && weakestCategory && weakestCategory.score < 2.8',
      templateText: '🎯 Gap crítico experiencia: {category} ({score}/5.0) impacta significativamente en experiencia general',
      variablesRequired: ['category', 'score'],
      priority: 10,
      isActive: true
    },

    // ✅ TEMPLATES CONFIANZA ESTADÍSTICA (productContext: 'general')
    {
      templateType: 'confianza_alta',
      productContext: 'general', // NUEVO CAMPO
      category: 'estadistica',
      conditionRule: 'participationRate >= 75 && totalResponses >= 30',
      templateText: '📊 Alta confiabilidad estadística: {totalResponses} respuestas con {participationRate}% participación - Resultados altamente representativos',
      variablesRequired: ['totalResponses', 'participationRate'],
      priority: 4,
      isActive: true
    },
    {
      templateType: 'confianza_moderada',
      productContext: 'general', // NUEVO CAMPO
      category: 'estadistica',
      conditionRule: 'participationRate >= 40 && totalResponses >= 10 && (participationRate < 75 || totalResponses < 30)',
      templateText: '📈 Confiabilidad moderada: {totalResponses} respuestas - Considerar aumentar participación para mayor precisión',
      variablesRequired: ['totalResponses'],
      priority: 6,
      isActive: true
    },

    // ✅ TEMPLATES CORRELACIONALES AVANZADOS (productContext: 'general')
    {
      templateType: 'correlacion_alta_engagement',
      productContext: 'general', // NUEVO CAMPO
      category: 'correlacion',
      conditionRule: 'participationRate >= 80 && overallScore >= 4.0',
      templateText: '💎 Alta correlación: {participationRate}% participación + {overallScore} satisfacción indica compromiso organizacional sólido',
      variablesRequired: ['participationRate', 'overallScore'],
      priority: 6,
      isActive: true
    }
  ];

  try {
    console.log(`📤 Processing ${templates.length} templates with SAFE UPSERT...`);
    
    let createdCount = 0;
    let updatedCount = 0;

    for (const templateData of templates) {
      const existing = await prisma.communicationTemplate.findUnique({
        where: {
          templateType_productContext: {
            templateType: templateData.templateType,
            productContext: templateData.productContext,
          }
        }
      });

      const result = await prisma.communicationTemplate.upsert({
        where: {
          templateType_productContext: {
            templateType: templateData.templateType,
            productContext: templateData.productContext,
          },
        },
        update: {
            // No incluimos templateType ni productContext en el update
            category: templateData.category,
            conditionRule: templateData.conditionRule,
            templateText: templateData.templateText,
            variablesRequired: templateData.variablesRequired,
            priority: templateData.priority,
            isActive: templateData.isActive,
        },
        create: {
            // Incluimos todos los campos para la creación
            ...templateData,
            usageCount: 0 // Aseguramos que los nuevos empiecen en 0
        },
      });
      
      if (existing) {
        updatedCount++;
      } else {
        createdCount++;
      }
    }

    console.log(`✅ UPSERT completed successfully!`);
    console.log(`   📝 Created: ${createdCount} new templates`);
    console.log(`   🔄 Updated: ${updatedCount} existing templates`);

    const totalCount = await prisma.communicationTemplate.count();
    console.log(`   📊 Total templates in BD: ${totalCount}`);

    // Verificar inserción y mostrar estadísticas por productContext
    const generalTemplates = await prisma.communicationTemplate.count({
      where: { productContext: 'general' }
    });
    const retencionTemplates = await prisma.communicationTemplate.count({
      where: { productContext: 'retencion-predictiva' }
    });
    const pulsoTemplates = await prisma.communicationTemplate.count({
      where: { productContext: 'pulso-express' }
    });
    const experienciaTemplates = await prisma.communicationTemplate.count({
      where: { productContext: 'experiencia-colaborador' }
    });
    
    console.log(`📊 Templates by context:`);
    console.log(`   • General: ${generalTemplates}`);
    console.log(`   • Retención Predictiva: ${retencionTemplates}`);
    console.log(`   • Pulso Express: ${pulsoTemplates}`);
    console.log(`   • Experiencia Colaborador: ${experienciaTemplates}`);
    
    return { success: true, 
      total: totalCount,
      created: createdCount,
      updated: updatedCount,
      breakdown: {
        general: generalTemplates,
        retencion: retencionTemplates,
        pulso: pulsoTemplates,
        experiencia: experienciaTemplates
      }
    };
  } catch (error) {
    console.error('❌ Error in SAFE template seeding:', error);
    throw error;
  }
};

// Función para ejecutar desde admin panel
export const seedCommunicationTemplatesWithContext = async () => {
  try {
    const result = await seedTemplates();
    return result;
  } catch (error) {
    throw new Error(`Failed to seed templates with context: ${error.message}`);
  }
};

// Para ejecutar directamente
if (require.main === module) {
  seedTemplates()
    .then((result) => {
      console.log('🎉 Template seeding with product context completed successfully');
      console.log('📊 Final breakdown:', result.breakdown);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Template seeding failed:', error);
      process.exit(1);
    });
}

export default seedTemplates;