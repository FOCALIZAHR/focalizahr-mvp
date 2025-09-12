// scripts/migrate-categories.ts
// Script de migración manual para poblar standard_category
// Se ejecuta DESPUÉS del seed y ANTES de usar el sistema en producción

import { PrismaClient } from '@prisma/client';
import { DepartmentAdapter } from '../src/lib/services/DepartmentAdapter';

const prisma = new PrismaClient();

// Lista de categorías obsoletas del sistema anterior
const OBSOLETE_CATEGORIES = [
  'rrhh', 'ventas', 'desarrollo', 'marketing', 
  'operaciones', 'finanzas', 'gerencia', 'legal',
  'salud', 'investigacion', 'educacion', 'servicio'
];

async function migrateDepartmentCategories() {
  console.log('🔄 INICIANDO MIGRACIÓN DE CATEGORÍAS DE DEPARTAMENTOS');
  console.log('================================================');
  console.log('📅 Fecha:', new Date().toISOString());
  console.log('🎯 Sistema objetivo: 8 Gerencias Estratégicas\n');
  
  try {
    // 1. Obtener todos los departamentos que necesitan migración
    const departmentsToMigrate = await prisma.department.findMany({
      where: {
        OR: [
          { standardCategory: null },
          { standardCategory: '' },
          { standardCategory: { in: OBSOLETE_CATEGORIES } }
        ]
      },
      orderBy: { displayName: 'asc' }
    });
    
    console.log(`📊 Departamentos encontrados para migrar: ${departmentsToMigrate.length}`);
    
    if (departmentsToMigrate.length === 0) {
      console.log('✅ No hay departamentos que requieran migración');
      return;
    }
    
    console.log('\n🔄 PROCESANDO DEPARTAMENTOS:');
    console.log('----------------------------');
    
    // 2. Contadores para el resumen
    const results = {
      personas: 0,
      comercial: 0,
      marketing: 0,
      tecnologia: 0,
      operaciones: 0,
      finanzas: 0,
      servicio: 0,
      legal: 0,
      sin_asignar: 0,
      errores: 0
    };
    
    const sinAsignar: string[] = [];
    
    // 3. Procesar cada departamento
    for (const dept of departmentsToMigrate) {
      try {
        // Llamar al DepartmentAdapter para obtener la categoría
        const gerenciaCategory = DepartmentAdapter.getGerenciaCategory(dept.displayName);
        
        if (gerenciaCategory) {
          // Actualizar con la categoría encontrada
          await prisma.department.update({
            where: { id: dept.id },
            data: { standardCategory: gerenciaCategory }
          });
          
          console.log(`✅ ${dept.displayName.padEnd(40)} → ${gerenciaCategory}`);
          results[gerenciaCategory as keyof typeof results]++;
          
        } else {
          // Marcar como sin_asignar para revisión manual
          await prisma.department.update({
            where: { id: dept.id },
            data: { standardCategory: 'sin_asignar' }
          });
          
          console.log(`⚠️  ${dept.displayName.padEnd(40)} → sin_asignar (requiere revisión)`);
          results.sin_asignar++;
          sinAsignar.push(dept.displayName);
        }
        
      } catch (error) {
        console.error(`❌ Error procesando ${dept.displayName}:`, error);
        results.errores++;
      }
    }
    
    // 4. Mostrar resumen detallado
    console.log('\n================================================');
    console.log('📈 RESUMEN DE MIGRACIÓN:');
    console.log('================================================');
    
    console.log('\n📊 DISTRIBUCIÓN POR GERENCIA:');
    console.log('   Personas:    ', results.personas);
    console.log('   Comercial:   ', results.comercial);
    console.log('   Marketing:   ', results.marketing);
    console.log('   Tecnología:  ', results.tecnologia);
    console.log('   Operaciones: ', results.operaciones);
    console.log('   Finanzas:    ', results.finanzas);
    console.log('   Servicio:    ', results.servicio);
    console.log('   Legal:       ', results.legal);
    console.log('   ---------------------');
    console.log('   Sin asignar: ', results.sin_asignar);
    console.log('   Errores:     ', results.errores);
    
    const totalProcesados = Object.values(results).reduce((sum, val) => sum + val, 0);
    const exitosos = totalProcesados - results.sin_asignar - results.errores;
    const porcentajeExito = ((exitosos / totalProcesados) * 100).toFixed(1);
    
    console.log('\n📈 MÉTRICAS:');
    console.log(`   Total procesados:     ${totalProcesados}`);
    console.log(`   Categorizados:        ${exitosos} (${porcentajeExito}%)`);
    console.log(`   Requieren revisión:   ${results.sin_asignar}`);
    console.log(`   Errores:              ${results.errores}`);
    
    if (sinAsignar.length > 0) {
      console.log('\n⚠️  DEPARTAMENTOS QUE REQUIEREN REVISIÓN MANUAL:');
      sinAsignar.forEach(dept => {
        console.log(`   - ${dept}`);
      });
      console.log('\n💡 Estos departamentos han sido marcados como "sin_asignar"');
      console.log('   Deben ser revisados manualmente y asignados a una gerencia apropiada.');
    }
    
    console.log('\n✅ MIGRACIÓN COMPLETADA');
    console.log('================================================\n');
    
  } catch (error) {
    console.error('❌ Error fatal en la migración:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Verificar que se está ejecutando directamente
if (require.main === module) {
  console.log('🚀 Ejecutando script de migración de categorías...\n');
  
  migrateDepartmentCategories()
    .then(() => {
      console.log('✨ Script finalizado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en la ejecución del script:', error);
      process.exit(1);
    });
} else {
  console.warn('⚠️  Este script debe ejecutarse directamente, no ser importado');
}

export { migrateDepartmentCategories };