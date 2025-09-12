// Archivo: scripts/delete-test-accounts-complete.ts
// ELIMINA COMPLETAMENTE las cuentas de prueba y TODOS sus datos

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deleteTestAccountsCompletely() {
  console.log('🔴 ELIMINACIÓN COMPLETA DE CUENTAS DE PRUEBA');
  console.log('=' .repeat(60));
  console.log('⚠️  ADVERTENCIA: Este script ELIMINA PERMANENTEMENTE:');
  console.log('   - Las cuentas de prueba');
  console.log('   - TODOS sus datos asociados');
  console.log('   - No hay vuelta atrás\n');
  
  const testAccountEmails = [
    'admin@empresalegado.cl',
    'admin@corporacionenterprise.cl'
  ];

  try {
    // 1. Buscar las cuentas
    console.log('🔍 Buscando cuentas de prueba...\n');
    
    const accountsToDelete = await prisma.account.findMany({
      where: { adminEmail: { in: testAccountEmails } },
      select: { 
        id: true, 
        companyName: true,
        adminEmail: true,
        _count: {
          select: {
            campaigns: true,
            departments: true,
            users: true
          }
        }
      },
    });

    if (accountsToDelete.length === 0) {
      console.log('✅ No se encontraron cuentas de prueba para eliminar.');
      console.log('   La base de datos ya está completamente limpia.');
      return;
    }

    // 2. Mostrar qué se va a eliminar
    console.log('📋 CUENTAS QUE SE ELIMINARÁN COMPLETAMENTE:\n');
    
    for (const account of accountsToDelete) {
      console.log(`   🏢 ${account.companyName}`);
      console.log(`      Email: ${account.adminEmail}`);
      console.log(`      ID: ${account.id}`);
      console.log(`      Datos asociados:`);
      console.log(`        - Campañas: ${account._count.campaigns}`);
      console.log(`        - Departamentos: ${account._count.departments}`);
      console.log(`        - Usuarios: ${account._count.users}`);
      console.log('');
    }

    // 3. Confirmación con cuenta regresiva
    console.log('⚠️  ÚLTIMA ADVERTENCIA:');
    console.log('   Esta acción es IRREVERSIBLE.');
    console.log('   Se eliminarán las cuentas Y todos sus datos.\n');
    console.log('   Comenzando eliminación en 5 segundos...');
    console.log('   (Presiona Ctrl+C para cancelar)\n');
    
    // Cuenta regresiva visual
    for (let i = 5; i > 0; i--) {
      process.stdout.write(`   ${i}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n');

    // 4. ELIMINAR TODO
    console.log('🗑️  Ejecutando eliminación completa...\n');
    
    const accountIds = accountsToDelete.map(acc => acc.id);
    
    // Nota: El orden importa por las foreign keys
    // Primero eliminar tablas dependientes, luego las principales
    
    // Eliminar respuestas (si existen)
    try {
      const deletedResponses = await prisma.response.deleteMany({
        where: {
          participant: {
            campaign: {
              accountId: { in: accountIds }
            }
          }
        }
      });
      if (deletedResponses.count > 0) {
        console.log(`   ✓ ${deletedResponses.count} respuestas eliminadas`);
      }
    } catch (e) {
      // Tabla podría no tener datos
    }

    // Eliminar participantes
    try {
      const deletedParticipants = await prisma.participant.deleteMany({
        where: {
          campaign: {
            accountId: { in: accountIds }
          }
        }
      });
      if (deletedParticipants.count > 0) {
        console.log(`   ✓ ${deletedParticipants.count} participantes eliminados`);
      }
    } catch (e) {
      // Tabla podría no tener datos
    }

    // Eliminar campañas
    const deletedCampaigns = await prisma.campaign.deleteMany({
      where: { accountId: { in: accountIds } }
    });
    if (deletedCampaigns.count > 0) {
      console.log(`   ✓ ${deletedCampaigns.count} campañas eliminadas`);
    }

    // Eliminar departamentos
    const deletedDepartments = await prisma.department.deleteMany({
      where: { accountId: { in: accountIds } }
    });
    if (deletedDepartments.count > 0) {
      console.log(`   ✓ ${deletedDepartments.count} departamentos/gerencias eliminados`);
    }

    // Eliminar usuarios adicionales (si hay)
    const deletedUsers = await prisma.user.deleteMany({
      where: { accountId: { in: accountIds } }
    });
    if (deletedUsers.count > 0) {
      console.log(`   ✓ ${deletedUsers.count} usuarios eliminados`);
    }

    // FINALMENTE: Eliminar las cuentas
    console.log('\n🔴 Eliminando las cuentas principales...');
    const deletedAccounts = await prisma.account.deleteMany({
      where: { id: { in: accountIds } }
    });
    console.log(`   ✓ ${deletedAccounts.count} cuentas eliminadas completamente`);

    // 5. Verificación final
    console.log('\n🔍 Verificando eliminación completa...');
    
    const remainingAccounts = await prisma.account.count({
      where: { adminEmail: { in: testAccountEmails } }
    });

    if (remainingAccounts === 0) {
      console.log('   ✅ Verificado: Las cuentas fueron eliminadas completamente\n');
    } else {
      console.log('   ⚠️ Advertencia: Quedaron cuentas sin eliminar\n');
    }

    // 6. Resumen final
    console.log('=' .repeat(60));
    console.log('✅ ELIMINACIÓN COMPLETA EXITOSA');
    console.log('=' .repeat(60));
    console.log('\n📝 Resumen:');
    console.log(`   • Cuentas eliminadas: ${deletedAccounts.count}`);
    console.log(`   • Campañas eliminadas: ${deletedCampaigns.count}`);
    console.log(`   • Departamentos eliminados: ${deletedDepartments.count}`);
    console.log(`   • Base de datos completamente limpia`);
    console.log('\n💡 Siguiente paso:');
    console.log('   Puedes ejecutar tu seed original sin modificaciones:');
    console.log('   npm run seed\n');

  } catch (error) {
    console.error('\n❌ ERROR durante la eliminación:', error);
    
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      
      // Mensajes de ayuda para errores comunes
      if (error.message.includes('foreign key')) {
        console.error('\n💡 Parece ser un error de foreign key.');
        console.error('   Intenta ejecutar el script de limpieza primero:');
        console.error('   npx tsx scripts/cleanup-test-data-v2.ts');
      }
    }
    
    throw error;
  }
}

// Ejecutar la eliminación
deleteTestAccountsCompletely()
  .catch((e) => {
    console.error('\n💥 Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('🔌 Desconectando de la base de datos...');
    await prisma.$disconnect();
    console.log('👋 Proceso finalizado\n');
  });