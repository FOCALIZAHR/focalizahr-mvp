// scripts/fix-user-roles.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserRoles() {
  console.log('🔧 Iniciando corrección de roles...\n');
  
  try {
    // Buscar usuarios con rol SUPER_ADMIN
    const usersToFix = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' }
    });
    
    console.log(`📊 Encontrados ${usersToFix.length} usuarios con SUPER_ADMIN`);
    
    if (usersToFix.length === 0) {
      console.log('✅ No hay usuarios que corregir');
      return;
    }
    
    // Actualizar cada usuario
    for (const user of usersToFix) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'FOCALIZAHR_ADMIN' }
      });
      
      console.log(`✅ Actualizado: ${user.email} (SUPER_ADMIN → FOCALIZAHR_ADMIN)`);
    }
    
    // Verificar el cambio
    const verifyAdmin = await prisma.user.findUnique({
      where: { email: 'admin@focalizahr.com' }
    });
    
    console.log(`
================================================
✅ CORRECCIÓN COMPLETADA
================================================
Admin FocalizaHR:
- Email: ${verifyAdmin?.email}
- Rol actual: ${verifyAdmin?.role}
- Estado: ${verifyAdmin?.isActive ? 'Activo' : 'Inactivo'}
================================================
    `);
    
  } catch (error) {
    console.error('❌ Error al corregir roles:', error);
    throw error;
  }
}

// Ejecutar corrección
fixUserRoles()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 Desconectado de BD');
  });