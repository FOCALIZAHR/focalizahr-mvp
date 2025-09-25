import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🔍 Verificando datos actuales...\n');
  
  try {
    // 1. Verificar Account
    const account = await prisma.account.findFirst();
    if (!account) {
      console.error('❌ No hay cuentas');
      return;
    }
    console.log(`✅ Cuenta: ${account.companyName}`);
    
    // 2. Verificar User existente
    const existingUser = await prisma.user.findFirst({
      where: { accountId: account.id }
    });
    
    if (!existingUser) {
      console.log('⚠️ No hay usuarios, creando desde Account...');
      // Crear primer usuario desde Account
      await prisma.user.create({
        data: {
          accountId: account.id,
          email: account.adminEmail,
          name: account.adminName,
          passwordHash: account.passwordHash,
          role: 'ACCOUNT_OWNER',
          isActive: true
        }
      });
    }
    
    const userBase = existingUser || await prisma.user.findFirst({ 
      where: { accountId: account.id }
    });
    
    console.log(`✅ Usuario base: ${userBase?.email}`);
    
    // 3. Buscar departamentos
    const departments = await prisma.department.findMany({
      where: { accountId: account.id }
    });
    
    console.log(`📊 Departamentos: ${departments.length}\n`);
    
    const ventasDept = departments.find(d => 
      d.standardCategory === 'ventas' ||
      d.standardCategory === 'comercial'
    );
    
    const marketingDept = departments.find(d => 
      d.standardCategory === 'marketing'
    );
    
    // 4. Crear usuarios de prueba
    const passwordHash = userBase!.passwordHash;
    
    // CEO
    const ceo = await prisma.user.upsert({
      where: { email: 'ceo@test.com' },
      update: { 
        role: 'CEO',
        isActive: true 
      },
      create: {
        accountId: account.id,
        email: 'ceo@test.com',
        name: 'CEO Test',
        passwordHash,
        role: 'CEO',
        departmentId: null,
        isActive: true
      }
    });
    console.log(`✅ CEO: ${ceo.email}`);
    
    // HR Manager
    const hr = await prisma.user.upsert({
      where: { email: 'hr@test.com' },
      update: { 
        role: 'HR_MANAGER',
        isActive: true 
      },
      create: {
        accountId: account.id,
        email: 'hr@test.com',
        name: 'HR Manager',
        passwordHash,
        role: 'HR_MANAGER',
        departmentId: null,
        isActive: true
      }
    });
    console.log(`✅ HR Manager: ${hr.email}`);
    
    // Gerente Ventas (si existe depto)
    if (ventasDept) {
      const ventas = await prisma.user.upsert({
        where: { email: 'ventas@test.com' },
        update: {
          role: 'AREA_MANAGER',
          departmentId: ventasDept.id,
          isActive: true
        },
        create: {
          accountId: account.id,
          email: 'ventas@test.com',
          name: 'Gerente Ventas',
          passwordHash,
          role: 'AREA_MANAGER',
          departmentId: ventasDept.id,
          isActive: true
        }
      });
      console.log(`✅ Gerente Ventas: ${ventas.email}`);
      console.log(`   → Departamento: ${ventasDept.displayName}`);
    }
    
    // Gerente Marketing (si existe depto)
    if (marketingDept) {
      const marketing = await prisma.user.upsert({
        where: { email: 'marketing@test.com' },
        update: {
          role: 'AREA_MANAGER',
          departmentId: marketingDept.id,
          isActive: true
        },
        create: {
          accountId: account.id,
          email: 'marketing@test.com',
          name: 'Gerente Marketing',
          passwordHash,
          role: 'AREA_MANAGER',
          departmentId: marketingDept.id,
          isActive: true
        }
      });
      console.log(`✅ Gerente Marketing: ${marketing.email}`);
      console.log(`   → Departamento: ${marketingDept.displayName}`);
    }
    
    console.log('\n════════════════════════════════');
    console.log('USUARIOS LISTOS PARA TESTING:');
    console.log('════════════════════════════════');
    console.log('CEO/HR: Ven TODO');
    console.log('Gerentes: Ven SOLO su área');
    console.log('Password: El mismo del usuario original');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();