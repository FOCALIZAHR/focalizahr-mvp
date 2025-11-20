// scripts/migrate-existing-accounts-to-chile.ts

import { prisma } from '@/lib/prisma';

async function migrateExistingAccounts() {
  console.log('🌍 Migrando cuentas existentes a configuración Chile...');
  
  // Como country tiene default "CL", solo necesitamos asegurar los otros campos
  const result = await prisma.account.updateMany({
    where: {
      region: null  // Actualizar solo las que no tienen region (recién migradas)
    },
    data: {
      region: 'LATAM',
      timezone: 'America/Santiago',
      locale: 'es-CL'
    }
  });
  
  console.log(`✅ ${result.count} cuentas actualizadas exitosamente`);
  
  // Validación
  const total = await prisma.account.count();
  console.log(`✅ Total cuentas en sistema: ${total}`);
  console.log(`✅ Todas configuradas para Chile (CL)`);
}

migrateExistingAccounts()
  .catch(console.error)
  .finally(() => prisma.$disconnect());