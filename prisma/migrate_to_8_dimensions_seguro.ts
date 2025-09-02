// prisma/migrate_to_8_dimensions_FINAL.ts
// 🚀 MIGRACIÓN SEGURA A 8 DIMENSIONES - VERSIÓN CORREGIDA
// ✅ Nombres de campos verificados contra schema real de FocalizaHR

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando migración segura a 8 dimensiones...');
  console.log('📊 Mapeo: 4 dimensiones actuales → 8 dimensiones metodológicas');
  console.log('');

  try {
    // ========================================
    // PASO 1: VALIDACIÓN INICIAL
    // ========================================
    console.log('🛡️ PASO 1: Validación inicial...');
    
    // Contar templates actuales
    const templateCount = await prisma.communicationTemplate.count();
    console.log(`📋 Templates actuales: ${templateCount}`);
    
    // Contar questions actuales por categoría
    const currentCategories = await prisma.question.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    
    console.log('📊 Dimensiones actuales:');
    currentCategories.forEach((cat) => {
      console.log(`  ${cat.category}: ${cat._count.category} preguntas`);
    });
    console.log('');

    // ========================================
    // PASO 2: ACTUALIZAR TEMPLATES PRIMERO
    // ========================================
    console.log('🔧 PASO 2: Actualizando templates condition_rules...');
    
    // Mapeo variables obsoletas → nuevas
    const variableMapping = [
      { old: 'category_bienestar', new: 'category_satisfaccion' },
      { old: 'category_ambiente', new: 'category_autonomia' },
      { old: 'score_bienestar', new: 'category_satisfaccion' },
      { old: 'score_ambiente', new: 'category_autonomia' }
    ];
    
    for (const mapping of variableMapping) {
      const templatesToUpdate = await prisma.communicationTemplate.findMany({
        where: {
          OR: [
            { conditionRule: { contains: mapping.old } },
            { templateText: { contains: `{${mapping.old}}` } }
          ]
        }
      });

      if (templatesToUpdate.length > 0) {
        console.log(`🔄 Actualizando ${templatesToUpdate.length} templates: ${mapping.old} → ${mapping.new}`);
        
        for (const template of templatesToUpdate) {
          const newConditionRule = template.conditionRule?.replace(
            new RegExp(mapping.old, 'g'), 
            mapping.new
          ) || null;
          
          const newTemplateText = template.templateText.replace(
            new RegExp('\\{' + mapping.old + '\\}', 'g'),
            '{' + mapping.new + '}'
          );

          await prisma.communicationTemplate.update({
            where: { id: template.id },
            data: { 
              conditionRule: newConditionRule,
              templateText: newTemplateText
            }
          });
        }
      }
    }

    console.log('✅ Templates actualizados correctamente\n');

    // ========================================
    // PASO 3: OBTENER IDS DE CAMPAIGN TYPES
    // ========================================
    console.log('🔍 PASO 3: Obteniendo campaign types...');
    
    const pulsoExpress = await prisma.campaignType.findFirst({
      where: { 
        OR: [
          { slug: 'pulso-express' },
          { name: { contains: 'Pulso Express' } }
        ]
      }
    });

    const experienciaFull = await prisma.campaignType.findFirst({
      where: { 
        OR: [
          { slug: 'experiencia-full' },
          { name: { contains: 'Experiencia' } }
        ]
      }
    });

    const retencionPredictiva = await prisma.campaignType.findFirst({
      where: { 
        OR: [
          { name: { contains: 'Retención' } },
          { name: { contains: 'retención' } }
        ]
      }
    });

    console.log(`✅ Pulso Express ID: ${pulsoExpress?.id || 'No encontrado'}`);
    console.log(`✅ Experiencia Full ID: ${experienciaFull?.id || 'No encontrado'}`);
    console.log(`✅ Retención Predictiva ID: ${retencionPredictiva?.id || 'No encontrado'}\n`);

    // ========================================
    // PASO 4: ACTUALIZAR CATEGORÍAS - PULSO EXPRESS
    // ========================================
    if (pulsoExpress) {
      console.log('📝 Actualizando PULSO EXPRESS (12 preguntas)...');
      
      // Actualizar por texto exacto y campaignTypeId
      const pulsoUpdates = [
        // COMUNICACIÓN (antes ambiente)
        { text: 'Me siento cómodo expresando mis opiniones en el trabajo', category: 'comunicacion' },
        
        // RECONOCIMIENTO (antes bienestar)
        { text: 'Me siento valorado por el trabajo que realizo', category: 'reconocimiento' },
        
        // SATISFACCIÓN (antes bienestar)
        { text: 'Puedo mantener un buen equilibrio entre trabajo y vida personal', category: 'satisfaccion' },
        { text: 'En general, estoy satisfecho trabajando en esta empresa', category: 'satisfaccion' },
        
        // AUTONOMÍA (antes ambiente)
        { text: 'Existe un buen ambiente de compañerismo en mi equipo', category: 'autonomia' },
        { text: 'Mi lugar de trabajo me permite concentrarme y ser productivo', category: 'autonomia' },
        
        // CRECIMIENTO (antes desarrollo)  
        { text: 'Tengo oportunidades claras de crecimiento en mi trabajo actual', category: 'crecimiento' },
        { text: 'Mis habilidades son bien utilizadas en mi puesto actual', category: 'crecimiento' }
      ];

      for (const update of pulsoUpdates) {
        const result = await prisma.question.updateMany({
          where: { 
            text: update.text,
            campaignTypeId: pulsoExpress.id
          },
          data: { category: update.category }
        });
        
        if (result.count > 0) {
          console.log(`  ✅ → ${update.category}: "${update.text.substring(0, 40)}..."`);
        }
      }
    }

    // ========================================
    // PASO 5: ACTUALIZAR CATEGORÍAS - EXPERIENCIA FULL
    // ========================================
    if (experienciaFull) {
      console.log('\n📝 Actualizando EXPERIENCIA FULL (35 preguntas)...');
      
      const experienciaUpdates = [
        // COMUNICACIÓN
        { pattern: 'expresando mis opiniones', category: 'comunicacion' },
        { pattern: 'comunicación entre equipos', category: 'comunicacion' },
        
        // RECONOCIMIENTO
        { pattern: 'reconoce mis logros', category: 'reconocimiento' },
        { pattern: 'valorado', category: 'reconocimiento' },
        { pattern: 'feedback', category: 'reconocimiento' },
        
        // COMPENSACIONES (nuevas preguntas si existen)
        { pattern: 'compensación', category: 'compensaciones' },
        { pattern: 'salario', category: 'compensaciones' },
        { pattern: 'beneficios', category: 'compensaciones' },
        
        // SATISFACCIÓN
        { pattern: 'satisfecho', category: 'satisfaccion' },
        { pattern: 'equilibrio', category: 'satisfaccion' },
        { pattern: 'recomendaría', category: 'satisfaccion' },
        
        // AUTONOMÍA
        { pattern: 'autonomía', category: 'autonomia' },
        { pattern: 'compañerismo', category: 'autonomia' },
        { pattern: 'ambiente', category: 'autonomia' },
        
        // CRECIMIENTO
        { pattern: 'crecimiento', category: 'crecimiento' },
        { pattern: 'oportunidades', category: 'crecimiento' },
        { pattern: 'habilidades', category: 'crecimiento' },
        { pattern: 'mentoring', category: 'crecimiento' },
        { pattern: 'objetivos', category: 'crecimiento' }
      ];

      for (const update of experienciaUpdates) {
        const result = await prisma.question.updateMany({
          where: { 
            text: { contains: update.pattern, mode: 'insensitive' },
            campaignTypeId: experienciaFull.id
          },
          data: { category: update.category }
        });
        
        if (result.count > 0) {
          console.log(`  ✅ ${result.count} pregunta(s) → ${update.category}`);
        }
      }
    }

    // ========================================
    // PASO 6: ACTUALIZAR RETENCIÓN PREDICTIVA
    // ========================================
    if (retencionPredictiva) {
      console.log('\n📝 Actualizando RETENCIÓN PREDICTIVA...');
      
      const retencionUpdates = [
        { pattern: 'seguridad psicológica', category: 'comunicacion' },
        { pattern: 'autonomía', category: 'autonomia' },
        { pattern: 'recomendarías', category: 'satisfaccion' }
      ];

      for (const update of retencionUpdates) {
        const result = await prisma.question.updateMany({
          where: { 
            text: { contains: update.pattern, mode: 'insensitive' },
            campaignTypeId: retencionPredictiva.id
          },
          data: { category: update.category }
        });
        
        if (result.count > 0) {
          console.log(`  ✅ Retención: ${result.count} pregunta(s) → ${update.category}`);
        }
      }
    }

    // ========================================
    // PASO 7: VERIFICACIÓN FINAL
    // ========================================
    console.log('\n🔍 VERIFICACIÓN FINAL...\n');
    
    const finalCategories = await prisma.question.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    });
    
    console.log('📊 RESULTADO - Distribución de dimensiones:');
    console.log('═══════════════════════════════════════');
    
    const expectedDimensions = [
      'liderazgo', 'comunicacion', 'desarrollo', 'reconocimiento', 
      'compensaciones', 'satisfaccion', 'autonomia', 'crecimiento'
    ];
    
    let totalQuestions = 0;
    expectedDimensions.forEach(dim => {
      const found = finalCategories.find(cat => cat.category === dim);
      if (found) {
        console.log(`  ✅ ${dim.padEnd(15)} : ${found._count.category} preguntas`);
        totalQuestions += found._count.category;
      } else {
        console.log(`  ⚠️  ${dim.padEnd(15)} : 0 preguntas`);
      }
    });
    
    // Mostrar categorías no esperadas
    finalCategories.forEach(cat => {
      if (!expectedDimensions.includes(cat.category)) {
        console.log(`  ❓ ${cat.category.padEnd(15)} : ${cat._count.category} preguntas (categoría residual)`);
        totalQuestions += cat._count.category;
      }
    });
    
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total preguntas: ${totalQuestions}`);
    
    // Verificar integridad
    const dimensionesActivas = finalCategories.filter(cat => 
      expectedDimensions.includes(cat.category)
    ).length;
    
    if (dimensionesActivas >= 6) {
      console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
      console.log(`✅ ${dimensionesActivas}/8 dimensiones configuradas`);
    } else {
      console.log('\n⚠️ MIGRACIÓN PARCIAL');
      console.log('Algunas preguntas pueden necesitar actualización manual');
    }
    
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Verificar dashboard: npm run dev');
    console.log('2. Revisar PulseIndicatorGrid.tsx (remover .slice(0,4))');
    console.log('3. Completar encuesta de prueba');
    console.log('4. Verificar Kit Comunicación funciona con nuevas variables');

  } catch (error) {
    console.error('❌ Error durante migración:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('\n🛡️ ERROR EN MIGRACIÓN');
    console.error('═══════════════════════');
    console.error(e);
    console.error('\nPara revertir cambios:');
    console.error('1. git checkout -- .');
    console.error('2. npm run prisma:reset');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n🔌 Conexión Prisma cerrada');
  });