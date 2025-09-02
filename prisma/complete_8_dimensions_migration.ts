// prisma/complete_8_dimensions_migration.ts
// Script para migrar las preguntas restantes

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function completeMigration() {
  console.log('🔧 Completando migración de dimensiones restantes...\n');

  try {
    // Obtener IDs de campaign types
    const experienciaFull = await prisma.campaignType.findFirst({
      where: { slug: 'experiencia-full' }
    });

    if (!experienciaFull) {
      console.error('❌ No se encontró Experiencia Full');
      return;
    }

    // MIGRAR PREGUNTAS DE BIENESTAR
    console.log('📝 Migrando preguntas de BIENESTAR...');
    
    const bienestarUpdates = [
      // A SATISFACCIÓN
      { id: 'cmczi6u7o002114pguv1srt31', category: 'satisfaccion' }, // carga de trabajo
      { id: 'cmczi6uv7002314pgokrp2rbp', category: 'autonomia' },    // flexibilidad horarios
      { id: 'cmczi6w8o002714pg9guq27d9', category: 'satisfaccion' }, // seguridad trabajo
      { id: 'cmczi6wzy002914pgf0d4f00f', category: 'comunicacion' }, // expresar ideas
      { id: 'cmczi6xy2002b14pgvwh663ss', category: 'satisfaccion' }, // preocupación empresa
      { id: 'cmczi6ynq002d14pgzzukbf1a', category: 'satisfaccion' }, // energía motivación
      { id: 'cmczi6zg6002f14pgxs1ens26', category: 'satisfaccion' }, // nivel estrés
      { id: 'cmczi7000002h14pgia7bktvr', category: 'satisfaccion' }, // orgullo empresa
      { id: 'cmczi71fa002l14pgevixgjeh', category: 'satisfaccion' }, // retención
      { id: 'cmczi7230002n14pgy5c6fq9d', category: 'satisfaccion' }  // experiencia general
    ];

    for (const update of bienestarUpdates) {
      const result = await prisma.question.update({
        where: { id: update.id },
        data: { category: update.category }
      });
      console.log(`  ✅ Pregunta migrada a ${update.category}`);
    }

    // MIGRAR PREGUNTAS DE AMBIENTE
    console.log('\n📝 Migrando preguntas de AMBIENTE...');
    
    const ambienteUpdates = [
      { id: 'cmczi6qr9001r14pgnqxglzju', category: 'comunicacion' },  // comunicación interna
      { id: 'cmczi6rj7001t14pglubbgbei', category: 'comunicacion' },  // colaboración áreas
      { id: 'cmczi6syd001x14pgktt25015', category: 'autonomia' },     // herramientas
      { id: 'cmczi6tme001z14pgmlrhocqa', category: 'autonomia' }      // cohesión equipo
    ];

    for (const update of ambienteUpdates) {
      const result = await prisma.question.update({
        where: { id: update.id },
        data: { category: update.category }
      });
      console.log(`  ✅ Pregunta migrada a ${update.category}`);
    }

    // VERIFICACIÓN FINAL
    console.log('\n🔍 VERIFICACIÓN FINAL...\n');
    
    const finalCategories = await prisma.question.groupBy({
      by: ['category'],
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } }
    });
    
    console.log('📊 DISTRIBUCIÓN FINAL:');
    console.log('═══════════════════════════════');
    
    const expectedDimensions = [
      'liderazgo', 'comunicacion', 'desarrollo', 'reconocimiento', 
      'compensaciones', 'satisfaccion', 'autonomia', 'crecimiento'
    ];
    
    let totalCore = 0;
    expectedDimensions.forEach(dim => {
      const found = finalCategories.find(cat => cat.category === dim);
      if (found) {
        console.log(`  ✅ ${dim.padEnd(15)} : ${found._count.category} preguntas`);
        totalCore += found._count.category;
      }
    });
    
    // Mostrar categorías especiales (Retención Predictiva)
    console.log('\n📊 CATEGORÍAS ESPECIALES (Retención):');
    finalCategories.forEach(cat => {
      if (!expectedDimensions.includes(cat.category)) {
        console.log(`  🔸 ${cat.category.padEnd(15)} : ${cat._count.category} preguntas`);
      }
    });
    
    console.log('═══════════════════════════════');
    console.log(`\n✅ Total preguntas en 8 dimensiones core: ${totalCore}`);
    console.log('🎉 ¡MIGRACIÓN COMPLETADA!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

completeMigration();