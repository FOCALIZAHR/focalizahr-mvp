import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedTestingIsolation() {
  console.log('🚀 Iniciando seed de Testing Aislado...');
  console.log('📌 Manteniendo "Empresa Demo FocalizaHR" intacta');
  
  try {
    // PASO 1: CREAR O ACTUALIZAR DOS CUENTAS DE PRUEBA AISLADAS
    console.log('\n🏢 PASO 1: Creando/actualizando cuentas de prueba...');
    
    // Cuenta A: Empresa Legado SA (estructura plana)
    const passwordHashA = await bcrypt.hash('testing123', 12);
    const empresaLegado = await prisma.account.upsert({
      where: { adminEmail: 'admin@empresalegado.cl' },
      update: {
        companyName: 'Empresa Legado SA',
        passwordHash: passwordHashA,
        industry: 'retail',
        companySize: 'pequeña',
      },
      create: {
        companyName: 'Empresa Legado SA',
        industry: 'retail',
        companySize: 'pequeña',
        adminEmail: 'admin@empresalegado.cl',
        adminName: 'Admin Legado',
        passwordHash: passwordHashA,
        subscriptionTier: 'free',
        maxActiveCampaigns: 1,
        maxParticipantsPerCampaign: 100,
        maxCampaignDurationDays: 30
      }
    });
    console.log('✅ Creada/Actualizada: Empresa Legado SA (estructura plana)');
    
    // Cuenta B: Corporación Enterprise (estructura jerárquica)
    const passwordHashB = await bcrypt.hash('enterprise123', 12);
    const corporacionEnterprise = await prisma.account.upsert({
      where: { adminEmail: 'admin@corporacionenterprise.cl' },
      update: {
        companyName: 'Corporación Enterprise',
        passwordHash: passwordHashB,
        industry: 'tecnologia',
        companySize: 'mediana',
      },
      create: {
        companyName: 'Corporación Enterprise',
        industry: 'tecnologia',
        companySize: 'mediana',
        adminEmail: 'admin@corporacionenterprise.cl',
        adminName: 'Admin Enterprise',
        passwordHash: passwordHashB,
        companyLogo: 'https://via.placeholder.com/150',
        subscriptionTier: 'professional',
        maxActiveCampaigns: 5,
        maxParticipantsPerCampaign: 500,
        maxCampaignDurationDays: 90
      }
    });
    console.log('✅ Creada/Actualizada: Corporación Enterprise (estructura jerárquica)');
    
    // PASO 2: LIMPIAR DEPARTAMENTOS EXISTENTES (por si acaso)
    console.log('\n🧹 PASO 2: Limpiando departamentos previos...');
    
    await prisma.department.deleteMany({
      where: { 
        accountId: { 
          in: [empresaLegado.id, corporacionEnterprise.id] 
        } 
      }
    });
    console.log('✅ Departamentos previos eliminados');
    
    // PASO 3: CREAR ESTRUCTURA DEPARTAMENTAL NUEVA
    console.log('\n📊 PASO 3: Creando estructuras departamentales nuevas...');
    
    // ESTRUCTURA PLANA para Empresa Legado SA
    console.log('\n🏢 Empresa Legado SA - Creando departamentos planos...');
    
    await prisma.department.createMany({
      data: [
        {
          accountId: empresaLegado.id,
          displayName: 'RRHH',
          standardCategory: 'rrhh',
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'media',
          emotionalComplexity: 'alta',
          marketScarcity: 'normal'
        },
        {
          accountId: empresaLegado.id,
          displayName: 'Personas',
          standardCategory: 'rrhh',
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'media',
          emotionalComplexity: 'alta',
          marketScarcity: 'normal'
        },
        {
          accountId: empresaLegado.id,
          displayName: 'Recursos Humanos',
          standardCategory: 'rrhh',
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'media',
          emotionalComplexity: 'alta',
          marketScarcity: 'normal'
        },
        {
          accountId: empresaLegado.id,
          displayName: 'Ventas',
          standardCategory: 'ventas',
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'media',
          emotionalComplexity: 'alta',
          marketScarcity: 'escaso'
        },
        {
          accountId: empresaLegado.id,
          displayName: 'Gestión Humana',
          standardCategory: 'rrhh',
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'media',
          emotionalComplexity: 'media',
          marketScarcity: 'normal'
        }
      ]
    });
    console.log('✅ Creados 5 departamentos planos (incluye casos prueba RRHH)');
    
    // ESTRUCTURA JERÁRQUICA para Corporación Enterprise
    console.log('\n🏢 Corporación Enterprise - Creando estructura jerárquica...');
    
    // Primero: Crear GERENCIAS (nivel 2)
    const gerenciaComercial = await prisma.department.create({
      data: {
        accountId: corporacionEnterprise.id,
        displayName: 'Gerencia Comercial',
        unitType: 'gerencia',
        level: 2,
        isActive: true,
        technicalComplexity: 'media',
        emotionalComplexity: 'alta',
        marketScarcity: 'normal',
        employeeCount: 50
      }
    });
    
    const gerenciaTecnologia = await prisma.department.create({
      data: {
        accountId: corporacionEnterprise.id,
        displayName: 'Gerencia de Tecnología',
        unitType: 'gerencia',
        level: 2,
        isActive: true,
        technicalComplexity: 'critica',
        emotionalComplexity: 'baja',
        marketScarcity: 'critico',
        employeeCount: 30
      }
    });
    
    const gerenciaOperaciones = await prisma.department.create({
      data: {
        accountId: corporacionEnterprise.id,
        displayName: 'Gerencia de Operaciones',
        unitType: 'gerencia',
        level: 2,
        isActive: true,
        technicalComplexity: 'alta',
        emotionalComplexity: 'media',
        marketScarcity: 'escaso',
        employeeCount: 40
      }
    });
    
    console.log('✅ Creadas 3 Gerencias (nivel 2)');
    
    // Segundo: Crear DEPARTAMENTOS bajo las gerencias (nivel 3)
    await prisma.department.createMany({
      data: [
        // Bajo Gerencia Comercial
        {
          accountId: corporacionEnterprise.id,
          displayName: 'Ventas Nacional',
          standardCategory: 'ventas',
          parentId: gerenciaComercial.id,
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'media',
          emotionalComplexity: 'alta',
          marketScarcity: 'normal',
          employeeCount: 25
        },
        {
          accountId: corporacionEnterprise.id,
          displayName: 'Marketing Digital',
          standardCategory: 'marketing',
          parentId: gerenciaComercial.id,
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'alta',
          emotionalComplexity: 'media',
          marketScarcity: 'escaso',
          employeeCount: 15
        },
        // Bajo Gerencia Tecnología
        {
          accountId: corporacionEnterprise.id,
          displayName: 'Desarrollo Software',
          standardCategory: 'desarrollo',
          parentId: gerenciaTecnologia.id,
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'critica',
          emotionalComplexity: 'baja',
          marketScarcity: 'critico',
          employeeCount: 20
        },
        {
          accountId: corporacionEnterprise.id,
          displayName: 'Infraestructura',
          standardCategory: 'desarrollo',
          parentId: gerenciaTecnologia.id,
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'alta',
          emotionalComplexity: 'baja',
          marketScarcity: 'escaso',
          employeeCount: 10
        },
        // Bajo Gerencia Operaciones
        {
          accountId: corporacionEnterprise.id,
          displayName: 'Logística',
          standardCategory: 'operaciones',
          parentId: gerenciaOperaciones.id,
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'media',
          emotionalComplexity: 'media',
          marketScarcity: 'normal',
          employeeCount: 20
        },
        {
          accountId: corporacionEnterprise.id,
          displayName: 'Control de Calidad',
          standardCategory: 'operaciones',
          parentId: gerenciaOperaciones.id,
          unitType: 'departamento',
          level: 3,
          isActive: true,
          technicalComplexity: 'alta',
          emotionalComplexity: 'baja',
          marketScarcity: 'normal',
          employeeCount: 15
        }
      ]
    });
    
    console.log('✅ Creados 6 Departamentos bajo gerencias (nivel 3)');
    
    // RESUMEN FINAL
    console.log('\n📋 RESUMEN DE SEED COMPLETADO:');
    console.log('=====================================');
    console.log('✅ Empresa Demo FocalizaHR: INTACTA (no modificada)');
    console.log('✅ Empresa Legado SA: 5 departamentos planos (testing retrocompatibilidad)');
    console.log('✅ Corporación Enterprise: 3 gerencias + 6 departamentos (testing jerarquía)');
    console.log('=====================================');
    console.log('🎯 Protocolo de Testing en Aislamiento implementado exitosamente');
    
  } catch (error) {
    console.error('❌ Error en seed de testing aislado:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el seed
seedTestingIsolation()
  .then(() => {
    console.log('✅ Seed completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed falló:', error);
    process.exit(1);
  });