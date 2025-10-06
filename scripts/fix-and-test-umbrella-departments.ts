// scripts/fix-and-test-umbrella-departments.ts
// PASO 1: Diagnóstico + Corrección + Validación

import { prisma } from '../src/lib/prisma';

async function diagnosticAndFix() {
  console.log('🔍 PASO 1: DIAGNÓSTICO Y CORRECCIÓN DE DEPARTAMENTOS PARAGUAS');
  console.log('=============================================================\n');

  try {
    // ==========================================
    // FASE 1: DIAGNÓSTICO - Identificar problemas
    // ==========================================
    console.log('📊 FASE 1: DIAGNÓSTICO\n');

    // 1.1 Buscar departamentos con nombre "sin asignar"
    const deptsByName = await prisma.department.findMany({
      where: {
        OR: [
          { displayName: { contains: 'sin asignar', mode: 'insensitive' } },
          { displayName: { contains: 'sin_asignar', mode: 'insensitive' } },
          { displayName: { contains: 'no asignado', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        displayName: true,
        standardCategory: true,
        parentId: true,
        level: true,
        unitType: true,
        accountId: true,
        account: {
          select: {
            companyName: true
          }
        },
        _count: {
          select: {
            participants: true
          }
        }
      }
    });

    console.log(`Encontrados ${deptsByName.length} departamentos con "sin asignar" en el nombre:\n`);

    const problemDepts: typeof deptsByName = [];
    const correctDepts: typeof deptsByName = [];

    deptsByName.forEach((dept) => {
      const isCorrect = 
        dept.standardCategory === 'sin_asignar' &&
        dept.level === 3 &&
        dept.unitType === 'departamento' &&
        dept.parentId === null;

      if (isCorrect) {
        correctDepts.push(dept);
      } else {
        problemDepts.push(dept);
      }

      const status = isCorrect ? '✅ CORRECTO' : '❌ PROBLEMA';
      console.log(`${status} - "${dept.displayName}" (${dept.account.companyName})`);
      console.log(`   ID: ${dept.id}`);
      console.log(`   standardCategory: ${dept.standardCategory} ${dept.standardCategory !== 'sin_asignar' ? '❌' : '✅'}`);
      console.log(`   level: ${dept.level} ${dept.level !== 3 ? '❌' : '✅'}`);
      console.log(`   unitType: ${dept.unitType} ${dept.unitType !== 'departamento' ? '❌' : '✅'}`);
      console.log(`   parentId: ${dept.parentId || 'null'} ${dept.parentId !== null ? '❌' : '✅'}`);
      console.log(`   Participantes asignados: ${dept._count.participants}`);
      console.log();
    });

    // ==========================================
    // FASE 2: RESUMEN DEL DIAGNÓSTICO
    // ==========================================
    console.log('\n📋 RESUMEN DEL DIAGNÓSTICO:');
    console.log('=========================\n');
    console.log(`✅ Departamentos correctos: ${correctDepts.length}`);
    console.log(`❌ Departamentos problemáticos: ${problemDepts.length}\n`);

    if (problemDepts.length === 0) {
      console.log('🎉 ¡No se encontraron problemas! Todos los departamentos paraguas están correctos.\n');
      console.log('Procediendo a verificar que cada cuenta tenga su departamento paraguas...\n');
    } else {
      console.log('⚠️ Se encontraron departamentos con configuración incorrecta.\n');
      console.log('Departamentos a corregir:\n');
      problemDepts.forEach((dept, index) => {
        console.log(`${index + 1}. ${dept.account.companyName}: "${dept.displayName}"`);
        console.log(`   ID: ${dept.id}`);
        console.log(`   Participantes afectados: ${dept._count.participants}`);
        console.log();
      });
    }

    // ==========================================
    // FASE 3: CORRECCIÓN (si hay problemas)
    // ==========================================
    if (problemDepts.length > 0) {
      console.log('\n🔧 FASE 2: CORRECCIÓN DE DEPARTAMENTOS\n');
      console.log('¿Deseas proceder con la corrección? (Esto actualizará la base de datos)\n');
      console.log('Se corregirán los siguientes campos:');
      console.log('  - standardCategory → "sin_asignar"');
      console.log('  - parentId → null');
      console.log('  - level → 3');
      console.log('  - unitType → "departamento"\n');

      // En un script real, podrías agregar confirmación interactiva
      // Por ahora, procedemos automáticamente
      console.log('Procediendo con la corrección automática...\n');

      let correctedCount = 0;

      for (const dept of problemDepts) {
        console.log(`🔄 Corrigiendo: ${dept.id} - "${dept.displayName}" (${dept.account.companyName})`);
        
        const before = {
          standardCategory: dept.standardCategory,
          parentId: dept.parentId,
          level: dept.level,
          unitType: dept.unitType
        };

        await prisma.department.update({
          where: { id: dept.id },
          data: {
            standardCategory: 'sin_asignar',
            parentId: null,
            level: 3,
            unitType: 'departamento'
          }
        });

        correctedCount++;

        console.log(`   ✅ Corregido:`);
        console.log(`      standardCategory: "${before.standardCategory}" → "sin_asignar"`);
        console.log(`      parentId: ${before.parentId || 'null'} → null`);
        console.log(`      level: ${before.level} → 3`);
        console.log(`      unitType: "${before.unitType}" → "departamento"`);
        console.log();
      }

      console.log(`✅ Corrección completada: ${correctedCount} departamentos actualizados\n`);
    }

    // ==========================================
    // FASE 4: VERIFICACIÓN POST-CORRECCIÓN
    // ==========================================
    console.log('\n🔍 FASE 3: VERIFICACIÓN POST-CORRECCIÓN\n');

    // Verificar que cada cuenta activa tenga su departamento paraguas
    const activeAccounts = await prisma.account.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        companyName: true
      }
    });

    console.log(`Verificando ${activeAccounts.length} cuentas activas...\n`);

    const accountsWithoutUmbrella: typeof activeAccounts = [];
    const accountsWithUmbrella: typeof activeAccounts = [];

    for (const account of activeAccounts) {
      const umbrella = await prisma.department.findFirst({
        where: {
          accountId: account.id,
          standardCategory: 'sin_asignar'
        }
      });

      if (umbrella) {
        accountsWithUmbrella.push(account);
        console.log(`✅ ${account.companyName}: Tiene departamento paraguas (${umbrella.displayName})`);
      } else {
        accountsWithoutUmbrella.push(account);
        console.log(`❌ ${account.companyName}: NO tiene departamento paraguas`);
      }
    }

    // ==========================================
    // FASE 5: RESUMEN FINAL
    // ==========================================
    console.log('\n\n📊 RESUMEN FINAL:');
    console.log('=================\n');
    console.log(`Total cuentas activas: ${activeAccounts.length}`);
    console.log(`✅ Con departamento paraguas: ${accountsWithUmbrella.length}`);
    console.log(`❌ Sin departamento paraguas: ${accountsWithoutUmbrella.length}\n`);

    if (accountsWithoutUmbrella.length > 0) {
      console.log('⚠️ Las siguientes cuentas NO tienen departamento paraguas:');
      console.log('   (Se creará automáticamente en la primera carga de participantes)\n');
      accountsWithoutUmbrella.forEach((account) => {
        console.log(`   - ${account.companyName} (ID: ${account.id})`);
      });
      console.log();
    }

    if (problemDepts.length > 0) {
      console.log('✅ Todos los departamentos problemáticos han sido corregidos.');
      console.log('✅ La carga de participantes debería funcionar correctamente ahora.\n');
    } else {
      console.log('✅ No se encontraron problemas en la configuración.');
      console.log('✅ El sistema está listo para cargar participantes.\n');
    }

    // ==========================================
    // FASE 6: PRUEBA DE CONCEPTO (DRY RUN)
    // ==========================================
    console.log('\n🧪 FASE 4: PRUEBA DE CONCEPTO (DRY RUN)\n');
    console.log('Simulando búsqueda del departamento paraguas para cada cuenta...\n');

    for (const account of activeAccounts.slice(0, 3)) { // Solo primeras 3 para brevedad
      console.log(`\n🔍 Cuenta: ${account.companyName}`);
      
      const searchResult = await prisma.department.findFirst({
        where: {
          accountId: account.id,
          standardCategory: 'sin_asignar'
        },
        select: {
          id: true,
          displayName: true,
          standardCategory: true,
          parentId: true,
          level: true
        }
      });

      if (searchResult) {
        console.log('   ✅ Búsqueda exitosa:');
        console.log(`      ID: ${searchResult.id}`);
        console.log(`      Nombre: "${searchResult.displayName}"`);
        console.log(`      Categoría: ${searchResult.standardCategory}`);
        console.log(`      Level: ${searchResult.level}`);
        console.log(`      ParentId: ${searchResult.parentId || 'null'}`);
        console.log('   ✅ La API de carga encontrará este departamento correctamente');
      } else {
        console.log('   ℹ️  No existe departamento paraguas');
        console.log('   ✅ La API creará uno automáticamente en la primera carga');
      }
    }

    console.log('\n=============================================================');
    console.log('🏁 DIAGNÓSTICO Y CORRECCIÓN COMPLETADOS');
    console.log('=============================================================\n');

    console.log('📋 PRÓXIMOS PASOS:\n');
    console.log('1. ✅ Revisar este reporte');
    console.log('2. ✅ Si todo está correcto, proceder a probar carga de participantes');
    console.log('3. ✅ Monitorear logs en la primera carga para confirmar funcionamiento\n');

  } catch (error) {
    console.error('\n❌ Error durante el diagnóstico:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
diagnosticAndFix()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });