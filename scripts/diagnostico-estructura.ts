/**
 * SCRIPT DE DIAGNÓSTICO - ESTRUCTURA DEPARTAMENTAL
 * Verificar jerarquía y journeys asignados
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnosticarEstructura() {
  console.log('\n🔍 DIAGNÓSTICO DE ESTRUCTURA DEPARTAMENTAL\n');
  console.log('='.repeat(60));
  
  // 1. Verificar estructura de departamentos
  console.log('\n📋 PASO 1: Estructura de Departamentos\n');
  
  const departments = await prisma.department.findMany({
    where: { isActive: true },
    select: {
      id: true,
      displayName: true,
      standardCategory: true,
      parentId: true,
      level: true,
      unitType: true,
      _count: {
        select: {
          journeys: true,
          participants: true
        }
      }
    },
    orderBy: [
      { level: 'asc' },
      { displayName: 'asc' }
    ]
  });
  
  console.log(`Total departamentos: ${departments.length}\n`);
  
  // Agrupar por nivel - ✅ CAMBIO: Claves como strings
  const porNivel = {
    '2': departments.filter(d => d.level === 2),
    '3': departments.filter(d => d.level === 3),
    'sin_nivel': departments.filter(d => d.level === null)
  };
  
  console.log('🏢 GERENCIAS (Level 2):');
  porNivel['2'].forEach(g => {
    console.log(`  ├─ ${g.displayName}`);
    console.log(`  │  Categoría: ${g.standardCategory || 'SIN CATEGORÍA'}`);
    console.log(`  │  Journeys: ${g._count.journeys}`);
    console.log(`  │  Participants: ${g._count.participants}`);
    console.log(`  │  Parent: ${g.parentId || 'ROOT'}`);
    console.log(`  │`);
  });
  
  console.log('\n🏬 DEPARTAMENTOS (Level 3):');
  porNivel['3'].forEach(d => {
    const parent = departments.find(p => p.id === d.parentId);
    console.log(`  ├─ ${d.displayName}`);
    console.log(`  │  Gerencia Padre: ${parent?.displayName || 'SIN PADRE'}`);
    console.log(`  │  Categoría: ${d.standardCategory || 'SIN CATEGORÍA'}`);
    console.log(`  │  Journeys: ${d._count.journeys}`);
    console.log(`  │  Participants: ${d._count.participants}`);
    console.log(`  │`);
  });
  
  console.log('\n⚠️  DEPARTAMENTOS SIN NIVEL:');
  porNivel['sin_nivel'].forEach(d => {
    console.log(`  ├─ ${d.displayName}`);
    console.log(`  │  Categoría: ${d.standardCategory || 'SIN CATEGORÍA'}`);
    console.log(`  │  Journeys: ${d._count.journeys} ← VERIFICAR ESTO`);
    console.log(`  │  Participants: ${d._count.participants}`);
    console.log(`  │`);
  });
  
  // 2. Verificar journeys en "sin_asignar"
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 PASO 2: Journeys en Departamento Catch-All\n');
  
  const sinAsignar = departments.find(
    d => d.standardCategory === 'sin_asignar' || 
         d.displayName.toLowerCase().includes('sin asignar')
  );
  
  if (sinAsignar) {
    console.log(`✅ Departamento "sin_asignar" encontrado:`);
    console.log(`   ID: ${sinAsignar.id}`);
    console.log(`   Nombre: ${sinAsignar.displayName}`);
    console.log(`   Journeys: ${sinAsignar._count.journeys}`);
    console.log(`   Participants: ${sinAsignar._count.participants}`);
    
    if (sinAsignar._count.journeys > 0) {
      console.log(`\n⚠️  PROBLEMA DETECTADO:`);
      console.log(`   Hay ${sinAsignar._count.journeys} journeys en el catch-all`);
      console.log(`   Estos deberían estar en departamentos específicos\n`);
      
      // Mostrar detalles de los journeys mal asignados
      const journeysMalAsignados = await prisma.journeyOrchestration.findMany({
        where: { departmentId: sinAsignar.id },
        select: {
          id: true,
          fullName: true,
          nationalId: true,
          departmentId: true,
          createdAt: true
        },
        take: 10
      });
      
      console.log(`   Primeros 10 journeys en "sin_asignar":`);
      journeysMalAsignados.forEach(j => {
        console.log(`   ├─ ${j.fullName} (RUT: ${j.nationalId})`);
        console.log(`   │  Journey ID: ${j.id}`);
        console.log(`   │  Creado: ${j.createdAt.toISOString().split('T')[0]}`);
      });
    }
  }
  
  // 3. Verificar si participants tienen departamentos correctos
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 PASO 3: Comparar Journeys vs Participants\n');
  
  const journeysConParticipants = await prisma.journeyOrchestration.findMany({
    where: {
      departmentId: sinAsignar?.id
    },
    select: {
      id: true,
      fullName: true,
      nationalId: true,
      departmentId: true,
      stage1ParticipantId: true,
      stage2ParticipantId: true,
      stage3ParticipantId: true,
      stage4ParticipantId: true
    },
    take: 5
  });
  
  console.log('Análisis de 5 journeys en "sin_asignar":\n');
  
  for (const journey of journeysConParticipants) {
    console.log(`Journey: ${journey.fullName} (${journey.nationalId})`);
    console.log(`  Journey.departmentId: ${journey.departmentId}`);
    
    // ✅ FIX: Filtrar nulls antes de usar en query
    const participantIds = [
      journey.stage1ParticipantId,
      journey.stage2ParticipantId,
      journey.stage3ParticipantId,
      journey.stage4ParticipantId
    ].filter((id): id is string => id !== null);
    
    if (participantIds.length > 0) {
      // ✅ FIX: Usar departmentRel (nombre correcto de la relación)
      const participant = await prisma.participant.findFirst({
        where: {
          id: { in: participantIds }
        },
        include: {
          departmentRel: {
            select: {
              displayName: true,
              standardCategory: true
            }
          }
        }
      });
      
      if (participant) {
        console.log(`  Participant.departmentId: ${participant.departmentId}`);
        console.log(`  Participant.department: ${participant.departmentRel?.displayName}`);
        console.log(`  Categoría: ${participant.departmentRel?.standardCategory}`);
        
        if (participant.departmentId !== journey.departmentId) {
          console.log(`  ⚠️  DESINCRONIZACIÓN DETECTADA`);
          console.log(`  → Journey apunta a: "sin_asignar"`);
          console.log(`  → Participant apunta a: "${participant.departmentRel?.displayName}"`);
        }
      }
    }
    console.log('');
  }
  
  // 4. Resumen y recomendaciones
  console.log('='.repeat(60));
  console.log('\n📋 RESUMEN Y RECOMENDACIONES\n');
  
  const gerenciasConHijos = porNivel['2'].filter(g => {
    return porNivel['3'].some(d => d.parentId === g.id);
  });
  
  const gerenciasSinHijos = porNivel['2'].filter(g => {
    return !porNivel['3'].some(d => d.parentId === g.id);
  });
  
  const deptosSinPadre = porNivel['3'].filter(d => !d.parentId);
  
  console.log(`✅ Gerencias con jerarquía correcta: ${gerenciasConHijos.length}`);
  gerenciasConHijos.forEach(g => {
    const hijos = porNivel['3'].filter(d => d.parentId === g.id);
    console.log(`   ├─ ${g.displayName} (${hijos.length} departamentos)`);
  });
  
  if (gerenciasSinHijos.length > 0) {
    console.log(`\n⚠️  Gerencias SIN departamentos hijos: ${gerenciasSinHijos.length}`);
    gerenciasSinHijos.forEach(g => {
      console.log(`   ├─ ${g.displayName}`);
    });
  }
  
  if (deptosSinPadre.length > 0) {
    console.log(`\n⚠️  Departamentos SIN gerencia padre: ${deptosSinPadre.length}`);
    deptosSinPadre.forEach(d => {
      console.log(`   ├─ ${d.displayName}`);
    });
  }
  
  if (sinAsignar && sinAsignar._count.journeys > 0) {
    console.log(`\n🔧 ACCIÓN REQUERIDA:`);
    console.log(`   ${sinAsignar._count.journeys} journeys necesitan ser reasignados`);
    console.log(`   Ejecutar: npm run migrate:fix-journeys-departments`);
  } else {
    console.log(`\n✅ NO HAY PROBLEMAS DETECTADOS`);
    console.log(`   Todos los journeys están correctamente asignados`);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

diagnosticarEstructura()
  .then(() => {
    console.log('✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en diagnóstico:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });