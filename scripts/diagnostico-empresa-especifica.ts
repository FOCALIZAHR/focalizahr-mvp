/**
 * SCRIPT DE DIAGNÓSTICO CORREGIDO
 * Filtra por accountId específico para analizar UNA empresa
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ⚙️ CONFIGURACIÓN: Cambia este ID al de tu empresa
const TARGET_ACCOUNT_ID = 'cmfgedx7b00012413i92048wl';

async function diagnosticarEmpresa() {
  console.log('\n🔍 DIAGNÓSTICO DE ESTRUCTURA - EMPRESA ESPECÍFICA\n');
  console.log('='.repeat(70));
  
  // Verificar que la empresa existe
  const account = await prisma.account.findUnique({
    where: { id: TARGET_ACCOUNT_ID },
    select: {
      id: true,
      companyName: true,
      adminEmail: true
    }
  });
  
  if (!account) {
    console.log(`❌ Empresa con ID ${TARGET_ACCOUNT_ID} no encontrada`);
    return;
  }
  
  console.log(`\n✅ Analizando empresa:`);
  console.log(`   Nombre: ${account.companyName}`);
  console.log(`   Admin: ${account.adminEmail}`);
  console.log(`   ID: ${account.id}\n`);
  console.log('='.repeat(70));
  
  // 1. Estructura de departamentos
  console.log('\n📋 PASO 1: Estructura Organizacional\n');
  
  const departments = await prisma.department.findMany({
    where: {
      accountId: TARGET_ACCOUNT_ID,
      isActive: true
    },
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
  
  // Agrupar por nivel
  const gerencias = departments.filter(d => d.level === 2);
  const departamentos = departments.filter(d => d.level === 3);
  const otros = departments.filter(d => d.level !== 2 && d.level !== 3);
  
  console.log('🏢 GERENCIAS (Level 2):\n');
  
  gerencias.forEach(g => {
    const hijos = departamentos.filter(d => d.parentId === g.id);
    
    console.log(`├─ ${g.displayName}`);
    console.log(`│  ID: ${g.id}`);
    console.log(`│  Categoría: ${g.standardCategory || 'SIN CATEGORÍA'}`);
    console.log(`│  Journeys propios: ${g._count.journeys}`);
    console.log(`│  Participants: ${g._count.participants}`);
    console.log(`│  Departamentos hijos: ${hijos.length}`);
    
    if (hijos.length > 0) {
      hijos.forEach((d, i) => {
        const esUltimo = i === hijos.length - 1;
        const prefijo = esUltimo ? '└─' : '├─';
        console.log(`│  ${prefijo} ${d.displayName} (${d._count.journeys} journeys, ${d._count.participants} participants)`);
      });
    }
    console.log(`│`);
  });
  
  // Departamentos huérfanos (sin padre válido)
  const huerfanos = departamentos.filter(d => {
    return !d.parentId || !gerencias.some(g => g.id === d.parentId);
  });
  
  if (huerfanos.length > 0) {
    console.log(`\n⚠️  DEPARTAMENTOS HUÉRFANOS (sin gerencia padre válida): ${huerfanos.length}\n`);
    huerfanos.forEach(d => {
      console.log(`├─ ${d.displayName}`);
      console.log(`│  Parent: ${d.parentId || 'NULL'}`);
      console.log(`│  Journeys: ${d._count.journeys}`);
      console.log(`│  Participants: ${d._count.participants}`);
      console.log(`│`);
    });
  }
  
  // 2. Análisis de journeys mal asignados
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 PASO 2: Journeys Mal Asignados\n');
  
  const catchAlls = departments.filter(d => 
    d.standardCategory === 'sin_asignar' ||
    d.displayName.toLowerCase().includes('sin asignar')
  );
  
  console.log(`Departamentos "catch-all" encontrados: ${catchAlls.length}\n`);
  
  let totalJourneysMalAsignados = 0;
  
  for (const catchAll of catchAlls) {
    console.log(`📦 ${catchAll.displayName}`);
    console.log(`   ID: ${catchAll.id}`);
    console.log(`   Parent: ${catchAll.parentId || 'ROOT'}`);
    console.log(`   Journeys: ${catchAll._count.journeys}`);
    console.log(`   Participants: ${catchAll._count.participants}`);
    
    totalJourneysMalAsignados += catchAll._count.journeys;
    
    if (catchAll._count.journeys > 0) {
      // Mostrar primeros 5 journeys
      const journeys = await prisma.journeyOrchestration.findMany({
        where: { departmentId: catchAll.id },
        select: {
          id: true,
          fullName: true,
          nationalId: true,
          createdAt: true
        },
        take: 5
      });
      
      console.log(`   Primeros 5 journeys:`);
      journeys.forEach(j => {
        console.log(`   ├─ ${j.fullName} (${j.nationalId})`);
      });
    }
    console.log('');
  }
  
  // 3. Resumen y recomendaciones
  console.log('='.repeat(70));
  console.log('\n📋 RESUMEN Y ACCIONES\n');
  
  console.log(`✅ Gerencias con estructura correcta: ${gerencias.filter(g => {
    const hijos = departamentos.filter(d => d.parentId === g.id);
    return hijos.length > 0;
  }).length}`);
  
  console.log(`⚠️  Gerencias sin departamentos hijos: ${gerencias.filter(g => {
    const hijos = departamentos.filter(d => d.parentId === g.id);
    return hijos.length === 0;
  }).length}`);
  
  console.log(`⚠️  Departamentos huérfanos: ${huerfanos.length}`);
  console.log(`⚠️  Journeys en catch-all: ${totalJourneysMalAsignados}`);
  
  if (totalJourneysMalAsignados > 0) {
    console.log(`\n🔧 ACCIÓN REQUERIDA:`);
    console.log(`   Reasignar ${totalJourneysMalAsignados} journeys desde catch-all a departamentos correctos`);
    console.log(`   Ejecutar: npx tsx scripts/reasignar-journeys-empresa.ts`);
  }
  
  if (huerfanos.length > 0) {
    console.log(`\n🔧 ACCIÓN REQUERIDA:`);
    console.log(`   Asignar padre válido a ${huerfanos.length} departamentos huérfanos`);
  }
  
  // Buscar posible basura
  const posibleBasura = departments.filter(d => 
    d.displayName.toLowerCase().includes('topito') ||
    d.displayName.toLowerCase().includes('test') ||
    d.displayName.toLowerCase().includes('prueba') ||
    d._count.journeys === 0 && d._count.participants === 0
  );
  
  if (posibleBasura.length > 0) {
    console.log(`\n🗑️  POSIBLE BASURA (0 journeys, 0 participants):`);
    console.log(`   ${posibleBasura.length} departamentos sin datos`);
    posibleBasura.slice(0, 5).forEach(d => {
      console.log(`   ├─ ${d.displayName}`);
    });
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

diagnosticarEmpresa()
  .then(() => {
    console.log('✅ Diagnóstico completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });