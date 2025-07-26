// prisma/seedDepartments.ts
// FOCALIZAHR DEPARTMENTS - ENTERPRISE SEED SCRIPT
// Fase 1: Foundation - Configuración segura departamentos testing

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Empezando a sembrar departamentos de prueba...');
  
  // Obtenemos la cuenta de prueba para asociar los departamentos
  // Asegúrate de que este email coincida con tu cuenta de prueba
  const testAccount = await prisma.account.findUnique({
    where: { adminEmail: 'test@focalizahr.cl' },
    select: { id: true, adminEmail: true, companyName: true }
  });

  if (!testAccount) {
    console.error('❌ Error: La cuenta de prueba test@focalizahr.cl no fue encontrada.');
    console.error('Por favor, asegúrate de que la cuenta exista antes de ejecutar este script.');
    console.log('');
    console.log('💡 Para crear la cuenta de prueba, ejecuta:');
    console.log('   npx prisma studio');
    console.log('   O crea manualmente en la tabla Account');
    return;
  }

  console.log(`✅ Cuenta encontrada: ${testAccount.companyName} (${testAccount.adminEmail})`);

  // Mapeo basado en segmentationData real de tu campaña
  const departmentsToCreate = [
    { 
      displayName: 'Gestión de Personas', 
      standardCategory: 'Personas',
      description: 'Equipo encargado de la gestión del talento humano',
      isActive: true
    },
    { 
      displayName: 'Recursos Humanos', 
      standardCategory: 'RRHH',
      description: 'Departamento de recursos humanos corporativo',
      isActive: true
    },
    { 
      displayName: 'Tecnología de la Información', 
      standardCategory: 'TI',
      description: 'Equipo de desarrollo y sistemas tecnológicos',
      isActive: true
    },
    { 
      displayName: 'Equipo Comercial', 
      standardCategory: 'Ventas',
      description: 'Fuerza de ventas y desarrollo comercial',
      isActive: true
    },
  ];

  console.log(`🎯 Creando ${departmentsToCreate.length} departamentos...`);

  let created = 0;
  let updated = 0;

  for (const dept of departmentsToCreate) {
    try {
      const result = await prisma.department.upsert({
        where: {
          accountId_displayName: {
            accountId: testAccount.id,
            displayName: dept.displayName,
          },
        },
        update: {
          standardCategory: dept.standardCategory,
          description: dept.description,
          isActive: dept.isActive,
          updatedAt: new Date(),
        },
        create: {
          accountId: testAccount.id,
          displayName: dept.displayName,
          standardCategory: dept.standardCategory,
          description: dept.description,
          isActive: dept.isActive,
          participantCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Verificar si fue creado o actualizado
      const wasCreated = result.createdAt.getTime() === result.updatedAt.getTime();
      if (wasCreated) {
        created++;
        console.log(`  ✅ Creado: '${dept.displayName}' → ${dept.standardCategory}`);
      } else {
        updated++;
        console.log(`  🔄 Actualizado: '${dept.displayName}' → ${dept.standardCategory}`);
      }

    } catch (error) {
      console.error(`  ❌ Error procesando '${dept.displayName}':`, error);
    }
  }

  console.log('');
  console.log('📊 Resumen:');
  console.log(`  - Departamentos creados: ${created}`);
  console.log(`  - Departamentos actualizados: ${updated}`);
  console.log(`  - Total configurados: ${created + updated}`);

  // Verificar configuración final
  const finalDepartments = await prisma.department.findMany({
    where: { 
      accountId: testAccount.id,
      isActive: true 
    },
    select: {
      displayName: true,
      standardCategory: true,
      participantCount: true,
    },
  });

  console.log('');
  console.log('🎯 Configuración final:');
  finalDepartments.forEach(dept => {
    console.log(`  - ${dept.standardCategory} → "${dept.displayName}"`);
  });

  console.log('');
  console.log('✅ Siembra de departamentos completada exitosamente.');
  console.log('');
  console.log('🚀 Próximo paso:');
  console.log('   Ejecutar testing analytics para validar Fase 2');
  console.log('   fetch("/api/campaigns/[ID]/analytics") debe retornar departmentScoresDisplay');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });