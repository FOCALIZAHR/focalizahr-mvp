// Archivo: scripts/cleanup-test-data-v2.ts
// Limpieza completa y segura de datos de prueba

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanupTestAccountsData() {
  console.log('🚀 Iniciando limpieza completa de datos de prueba...\n');
  
  const testAccountEmails = [
    'admin@empresalegado.cl',
    'admin@corporacionenterprise.cl'
  ];

  try {
    // 1. Identificar las cuentas de prueba por email
    const accountsToClean = await prisma.account.findMany({
      where: { adminEmail: { in: testAccountEmails } },
      select: { 
        id: true, 
        companyName: true,
        adminEmail: true 
      },
    });

    if (accountsToClean.length === 0) {
      console.log('✅ No se encontraron cuentas de prueba.');
      console.log('   La base de datos ya está limpia.');
      return;
    }

    const accountIdsToClean = accountsToClean.map(acc => acc.id);
    
    console.log('📋 Cuentas identificadas para limpieza:');
    accountsToClean.forEach(acc => {
      console.log(`   - ${acc.companyName} (${acc.adminEmail})`);
      console.log(`     ID: ${acc.id}`);
    });
    console.log('');

    // 2. Verificar campañas antes de eliminar
    const campaignsToDelete = await prisma.campaign.findMany({
      where: { accountId: { in: accountIdsToClean } },
      select: { 
        id: true, 
        name: true,
        status: true,
        totalInvited: true,
        totalResponded: true 
      }
    });

    if (campaignsToDelete.length > 0) {
      console.log(`📊 Campañas a eliminar: ${campaignsToDelete.length}`);
      campaignsToDelete.forEach(camp => {
        console.log(`   - "${camp.name}" (${camp.status})`);
        console.log(`     Invitados: ${camp.totalInvited}, Respondieron: ${camp.totalResponded}`);
      });
      console.log('');
    }

    // 3. Verificar departamentos antes de eliminar
    const departmentsToDelete = await prisma.department.findMany({
      where: { accountId: { in: accountIdsToClean } },
      select: { 
        id: true, 
        displayName: true,
        unitType: true,
        level: true 
      }
    });

    if (departmentsToDelete.length > 0) {
      console.log(`🏢 Departamentos/Unidades a eliminar: ${departmentsToDelete.length}`);
      
      // Separar por tipo para mejor visualización
      const gerencias = departmentsToDelete.filter(d => d.unitType === 'gerencia');
      const departamentos = departmentsToDelete.filter(d => d.unitType === 'departamento' || !d.unitType);
      
      if (gerencias.length > 0) {
        console.log(`   Gerencias (${gerencias.length}):`);
        gerencias.forEach(g => console.log(`     - ${g.displayName}`));
      }
      
      if (departamentos.length > 0) {
        console.log(`   Departamentos (${departamentos.length}):`);
        departamentos.forEach(d => console.log(`     - ${d.displayName}`));
      }
      console.log('');
    }

    // 4. Confirmar antes de proceder (opcional - comentar si quieres ejecución directa)
    console.log('⚠️  ATENCIÓN: Se procederá a eliminar todos estos datos.');
    console.log('   Esto incluye participantes y respuestas asociadas.');
    console.log('   LAS CUENTAS TAMBIÉN SERÁN ELIMINADAS COMPLETAMENTE.\n');
    
    // Esperar 3 segundos antes de proceder (dar chance de cancelar con Ctrl+C)
    console.log('   Comenzando en 3 segundos... (Ctrl+C para cancelar)\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. ELIMINAR CAMPAÑAS (elimina en cascada participantes, respuestas, email_logs)
    console.log('🗑️  Eliminando campañas y datos asociados...');
    const deletedCampaigns = await prisma.campaign.deleteMany({
      where: { accountId: { in: accountIdsToClean } },
    });
    console.log(`   ✓ ${deletedCampaigns.count} campañas eliminadas (con participantes y respuestas)`);

    // 6. ELIMINAR DEPARTAMENTOS Y UNIDADES ORGANIZACIONALES
    console.log('🗑️  Eliminando estructura organizacional...');
    const deletedDepartments = await prisma.department.deleteMany({
      where: { accountId: { in: accountIdsToClean } },
    });
    console.log(`   ✓ ${deletedDepartments.count} departamentos/gerencias eliminados`);

    // 7. ELIMINAR LAS CUENTAS COMPLETAMENTE
    console.log('🗑️  Eliminando las cuentas...');
    const deletedAccounts = await prisma.account.deleteMany({
      where: { id: { in: accountIdsToClean } }
    });
    console.log(`   ✓ ${deletedAccounts.count} cuentas eliminadas COMPLETAMENTE`);

    // 8. Verificación final
    console.log('\n🔍 Verificando limpieza...');
    
    const remainingAccounts = await prisma.account.count({
      where: { adminEmail: { in: testAccountEmails } }
    });

    if (remainingAccounts === 0) {
      console.log('   ✅ Limpieza verificada: Cuentas y datos eliminados completamente');
    } else {
      console.log(`   ⚠️ Advertencia: Quedaron ${remainingAccounts} cuentas`);
    }

    // 9. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('✨ LIMPIEZA COMPLETA EXITOSA');
    console.log('='.repeat(60));
    console.log('\n📝 Resumen:');
    console.log(`   • Cuentas ELIMINADAS: ${deletedAccounts.count}`);
    console.log(`   • Campañas eliminadas: ${deletedCampaigns.count}`);
    console.log(`   • Departamentos eliminados: ${deletedDepartments.count}`);
    console.log(`   • Base de datos completamente limpia`);
    console.log('\n💡 Siguiente paso: Ejecutar seed original sin cambios');
    console.log('   npm run seed\n');

  } catch (error) {
    console.error('\n❌ ERROR durante la limpieza:', error);
    
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }
    
    throw error;
  }
}

// Ejecutar la limpieza
cleanupTestAccountsData()
  .catch((e) => {
    console.error('\n💥 Error fatal durante la limpieza:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Desconectando de la base de datos...');
    await prisma.$disconnect();
    console.log('👋 Proceso finalizado\n');
  });