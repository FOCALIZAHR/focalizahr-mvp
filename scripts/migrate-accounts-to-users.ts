// scripts/migrate-accounts-to-users.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function migrateAccountsToUsers() {
  console.log('🔄 Iniciando migración Account → User...');
  console.log('================================================');
  
  try {
    // 1. Obtener todas las cuentas
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        adminEmail: true,
        adminName: true,
        passwordHash: true,
        role: true,
        companyName: true
      }
    });
    
    console.log(`📊 Encontradas ${accounts.length} cuentas para migrar`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const account of accounts) {
      // 2. Verificar si ya existe el usuario
      const existingUser = await prisma.user.findUnique({
        where: { email: account.adminEmail }
      });
      
      if (existingUser) {
        console.log(`⚠️  Usuario ya existe: ${account.adminEmail}`);
        skipped++;
        continue;
      }
      
      // 3. Determinar el rol correcto
      let userRole = 'ACCOUNT_OWNER'; // Por defecto
      
      if (account.role === 'FOCALIZAHR_ADMIN') {
        userRole = 'SUPER_ADMIN';
      } else if (account.role === 'CLIENT') {
        userRole = 'ACCOUNT_OWNER';
      }
      
      // 4. Crear el usuario
      await prisma.user.create({
        data: {
          accountId: account.id,
          email: account.adminEmail,
          name: account.adminName,
          passwordHash: account.passwordHash,
          role: userRole,
          departmentId: null, // Owners ven todo
          isActive: true
        }
      });
      
      console.log(`✅ Migrado: ${account.adminEmail} → Role: ${userRole}`);
      migrated++;
    }
    
    console.log('\n================================================');
    console.log(`✅ Migración completada`);
    console.log(`   - Usuarios migrados: ${migrated}`);
    console.log(`   - Usuarios omitidos: ${skipped}`);
    console.log('================================================');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  migrateAccountsToUsers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrateAccountsToUsers };