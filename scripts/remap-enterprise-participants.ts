// scripts/remap-enterprise-participants.ts
// Script para remapear participantes del paraguas a departments correctos
// Corporación Enterprise - Corrección masiva

import { prisma } from '@/lib/prisma';
import { DepartmentAdapter } from '@/lib/services/DepartmentAdapter';

interface RemapResult {
  total: number;
  remapped: number;
  unmapped: number;
  details: Array<{
    email: string;
    originalDept: string;
    category: string | null;
    targetDept: string | null;
    status: 'success' | 'no_category' | 'no_department';
  }>;
}

async function remapEnterpriseParticipants(): Promise<RemapResult> {
  const accountId = 'cmfgedx7b00012413i92048wl'; // Corporación Enterprise
  
  const result: RemapResult = {
    total: 0,
    remapped: 0,
    unmapped: 0,
    details: []
  };
  
  try {
    // PASO 1: Obtener el departamento paraguas
    const umbrella = await prisma.department.findFirst({
      where: {
        accountId: accountId,
        standardCategory: 'sin_asignar'
      }
    });
    
    if (!umbrella) {
      throw new Error('No se encontró departamento paraguas');
    }
    
    // PASO 2: Obtener participantes en paraguas
    const participantsInUmbrella = await prisma.participant.findMany({
      where: {
        departmentId: umbrella.id
      },
      select: {
        id: true,
        email: true,
        department: true, // String original del CSV
        name: true
      }
    });
    
    result.total = participantsInUmbrella.length;
    
    // PASO 3: Obtener departments de destino disponibles
    const availableDepartments = await prisma.department.findMany({
      where: {
        accountId: accountId,
        isActive: true,
        standardCategory: {
          not: 'sin_asignar'
        }
      },
      orderBy: {
        level: 'desc' // Preferir level 3 (departamentos) sobre level 2 (gerencias)
      }
    });
    
    // PASO 4: Procesar cada participante
    for (const participant of participantsInUmbrella) {
      if (!participant.department) {
        result.unmapped++;
        result.details.push({
          email: participant.email,
          originalDept: 'NULL',
          category: null,
          targetDept: null,
          status: 'no_category'
        });
        continue;
      }
      
      // Obtener categoría usando DepartmentAdapter
      const category = DepartmentAdapter.getGerenciaCategory(participant.department);
      
      if (category && category !== 'sin_asignar') {
        // Buscar department con esa categoría
        const targetDept = availableDepartments.find(d => 
          d.standardCategory === category
        );
        
        if (targetDept) {
          // Actualizar participante
          await prisma.participant.update({
            where: { id: participant.id },
            data: { departmentId: targetDept.id }
          });
          
          result.remapped++;
          result.details.push({
            email: participant.email,
            originalDept: participant.department,
            category: category,
            targetDept: targetDept.displayName,
            status: 'success'
          });
        } else {
          result.unmapped++;
          result.details.push({
            email: participant.email,
            originalDept: participant.department,
            category: category,
            targetDept: null,
            status: 'no_department'
          });
        }
      } else {
        result.unmapped++;
        result.details.push({
          email: participant.email,
          originalDept: participant.department,
          category: null,
          targetDept: null,
          status: 'no_category'
        });
      }
    }
    
    // PASO 5: Generar resumen
    console.log('\n' + '='.repeat(60));
    console.log('RESUMEN DE REMAPEO - CORPORACIÓN ENTERPRISE');
    console.log('='.repeat(60));
    console.log(`Total participantes procesados: ${result.total}`);
    console.log(`✅ Remapeados exitosamente: ${result.remapped}`);
    console.log(`⚠️ Permanecen sin asignar: ${result.unmapped}`);
    console.log(`📈 Tasa de éxito: ${((result.remapped / result.total) * 100).toFixed(1)}%`);
    
    // PASO 6: Distribución por categoría
    const categoryGroups = result.details
      .filter(d => d.status === 'success')
      .reduce((acc, item) => {
        if (!acc[item.category!]) {
          acc[item.category!] = new Set<string>();
        }
        acc[item.category!].add(item.targetDept!);
        return acc;
      }, {} as Record<string, Set<string>>);
    
    console.log('\n📊 DISTRIBUCIÓN POR CATEGORÍA:');
    console.log('-'.repeat(60));
    Object.entries(categoryGroups).forEach(([category, depts]) => {
      const count = result.details.filter(d => d.category === category && d.status === 'success').length;
      console.log(`${category.padEnd(15)} : ${count} participantes → ${Array.from(depts).join(', ')}`);
    });
    
    // PASO 7: Casos sin mapear
    const unmappedCases = result.details.filter(d => d.status !== 'success');
    if (unmappedCases.length > 0) {
      console.log('\n⚠️ CASOS SIN MAPEAR:');
      console.log('-'.repeat(60));
      const unmappedByReason = {
        no_category: unmappedCases.filter(d => d.status === 'no_category').length,
        no_department: unmappedCases.filter(d => d.status === 'no_department').length
      };
      console.log(`Sin categoría válida: ${unmappedByReason.no_category}`);
      console.log(`Categoría válida pero sin department: ${unmappedByReason.no_department}`);
      
      // Mostrar primeros 10 ejemplos
      console.log('\nEjemplos (primeros 10):');
      unmappedCases.slice(0, 10).forEach(d => {
        console.log(`  "${d.originalDept}" → ${d.status}`);
      });
    }
    
    // PASO 8: Verificación final
    console.log('\n🔍 VERIFICACIÓN POST-REMAPEO:');
    console.log('-'.repeat(60));
    
    const finalDistribution = await prisma.department.findMany({
      where: { accountId },
      include: {
        _count: {
          select: { participants: true }
        }
      },
      orderBy: {
        _count: {
          participants: 'desc'
        }
      }
    });
    
    finalDistribution.forEach(dept => {
      if (dept._count.participants > 0) {
        const percentage = ((dept._count.participants / result.total) * 100).toFixed(1);
        console.log(`${dept.displayName.padEnd(30)} : ${dept._count.participants.toString().padStart(3)} participantes (${percentage}%)`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    
    return result;
    
  } catch (error) {
    console.error('❌ Error durante el remapeo:', error);
    throw error;
  }
}

// Ejecutar el script
remapEnterpriseParticipants()
  .then(result => {
    console.log('\n✅ Remapeo completado exitosamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });