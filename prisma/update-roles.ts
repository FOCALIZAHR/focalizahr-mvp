// prisma/update-roles.ts
// SCRIPT TEMPORAL - Solo actualiza roles, no toca nada más

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateRoles() {
  console.log('🔄 Actualizando roles en cuentas existentes...');

  // 1. Actualizar cuenta test@focalizahr.cl a CLIENT (si existe)
  try {
    await prisma.account.update({
      where: { adminEmail: 'test@focalizahr.cl' },
      data: { role: 'CLIENT' }
    });
    console.log('✅ test@focalizahr.cl → role: CLIENT');
  } catch (e) {
    console.log('⚠️ test@focalizahr.cl no existe o ya tiene role');
  }

  // 2. Crear o actualizar cuenta ADMIN
  try {
    const adminPassword = await bcrypt.hash('Admin@FocalizaHR2025', 12);
    
    await prisma.account.upsert({
      where: { adminEmail: 'admin@focalizahr.com' },
      update: { 
        role: 'FOCALIZAHR_ADMIN',
        passwordHash: adminPassword
      },
      create: {
        companyName: 'FocalizaHR',
        adminEmail: 'admin@focalizahr.com',
        adminName: 'Admin FocalizaHR',
        passwordHash: adminPassword,
        subscriptionTier: 'enterprise',
        role: 'FOCALIZAHR_ADMIN'
      }
    });
    console.log('✅ admin@focalizahr.com → role: FOCALIZAHR_ADMIN');
  } catch (e) {
    console.log('❌ Error con cuenta admin:', e);
  }

  // 3. Crear cuenta cliente demo (opcional)
  try {
    const clientPassword = await bcrypt.hash('Cliente@123', 12);
    
    await prisma.account.upsert({
      where: { adminEmail: 'cliente@empresa.com' },
      update: { role: 'CLIENT' },
      create: {
        companyName: 'Empresa Demo',
        adminEmail: 'cliente@empresa.com',
        adminName: 'Cliente Demo',
        passwordHash: clientPassword,
        subscriptionTier: 'basic',
        role: 'CLIENT'
      }
    });
    console.log('✅ cliente@empresa.com → role: CLIENT');
  } catch (e) {
    console.log('⚠️ cliente@empresa.com ya existe');
  }

  console.log('\n📝 CREDENCIALES:');
  console.log('Admin: admin@focalizahr.com / Admin@FocalizaHR2025');
  console.log('Cliente: cliente@empresa.com / Cliente@123');
  console.log('Test: test@focalizahr.cl / (tu password actual)');
}

updateRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());