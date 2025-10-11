// scripts/remap-enterprise-participants.ts
// ✅ ACTUALIZADO: Compatible con RUT obligatorio + email opcional
// Versión: 2.0 - Sincronizado con schema Prisma actualizado

import { prisma } from '../src/lib/prisma';
import { DepartmentAdapter } from '../src/lib/services/DepartmentAdapter';

/**
 * Script de mantenimiento para remapear participantes desde el departamento "paraguas"
 * hacia sus departamentos correctos usando el sistema de categorización inteligente.
 * 
 * CONTEXTO:
 * - Problema: Participantes asignados incorrectamente al departamento "sin_asignar"
 * - Causa: Código legacy buscaba por displayName exacto en lugar de standardCategory
 * - Solución: Re-categorizar usando DepartmentAdapter como fuente única de verdad
 * 
 * CAMBIOS v2.0:
 * - ✅ Maneja email nullable (ahora opcional en schema)
 * - ✅ Usa nationalId como identificador primario
 * - ✅ Incluye phoneNumber como canal alternativo
 * - ✅ Type-safe para Prisma schema actualizado
 */

interface RemapResult {
  total: number;
  remapped: number;
  skipped: number;
  successRate: string;
}

interface RemapError {
  error: string;
}

async function remapEnterpriseParticipants(): Promise<RemapResult | RemapError> {
  // ID de la cuenta a procesar (Corporación Enterprise)
  const accountId = 'cmfgedx7b00012413i92048wl';
  
  console.log('🔄 Iniciando remapeo de participantes...');
  console.log(`📍 Account ID: ${accountId}\n`);
  
  try {
    // ============================================
    // PASO 1: Obtener departamento paraguas
    // ============================================
    const umbrella = await prisma.department.findFirst({
      where: { 
        accountId, 
        standardCategory: 'sin_asignar' 
      }
    });
    
    if (!umbrella) {
      console.error('❌ No se encontró departamento paraguas (sin_asignar)');
      return { error: 'No umbrella department found' };
    }
    
    console.log(`📂 Paraguas encontrado: "${umbrella.displayName}"`);
    console.log(`   ID: ${umbrella.id}\n`);
    
    // ============================================
    // PASO 2: Obtener participantes en paraguas
    // ============================================
    // ✅ CAMBIO CRÍTICO: Incluye nationalId y phoneNumber
    const participants = await prisma.participant.findMany({
      where: { departmentId: umbrella.id },
      select: { 
        id: true,
        email: true,           // ⚠️ Ahora puede ser null
        nationalId: true,      // ✅ NUEVO - Identificador primario
        phoneNumber: true,     // ✅ NUEVO - Canal alternativo
        department: true       // Campo de texto del CSV (crítico para remapeo)
      }
    });
    
    console.log(`👥 Participantes en paraguas: ${participants.length}\n`);
    
    if (participants.length === 0) {
      console.log('✅ No hay participantes para remapear');
      return { 
        total: 0, 
        remapped: 0, 
        skipped: 0,
        successRate: 'N/A'
      };
    }
    
    // ============================================
    // PASO 3: Obtener departments válidos
    // ============================================
    const availableDepts = await prisma.department.findMany({
      where: {
        accountId,
        isActive: true,
        standardCategory: { not: 'sin_asignar' }
      },
      orderBy: { level: 'desc' } // Preferir departamentos (level 3) sobre gerencias (level 2)
    });
    
    console.log(`🏢 Departamentos disponibles para mapeo: ${availableDepts.length}`);
    console.log('   Categorías:', [...new Set(availableDepts.map(d => d.standardCategory))].join(', '));
    console.log('');
    
    // ============================================
    // PASO 4: Remapear cada participante
    // ============================================
    let remapped = 0;
    let skipped = 0;
    
    console.log('🔄 Procesando participantes...\n');
    
    for (const p of participants) {
      // ✅ CAMBIO CRÍTICO: Identificador robusto con prioridad
      // Prioridad: nationalId > email > phoneNumber > id truncado
      const identifier = 
        p.nationalId || 
        p.email || 
        p.phoneNumber || 
        `ID-${p.id.slice(0, 8)}`;
      
      // ✅ LÓGICA PRESERVADA: Sin department (texto) = no se puede mapear
      if (!p.department) {
        console.log(`⚠️  ${identifier}: Sin departamento (campo vacío en CSV) - SKIP`);
        skipped++;
        continue;
      }
      
      // ============================================
      // Categorización usando DepartmentAdapter
      // ============================================
      // ✅ FUENTE ÚNICA DE VERDAD para mapeo
      const category = DepartmentAdapter.getGerenciaCategory(p.department);
      
      if (category && category !== 'sin_asignar') {
        // Categoría válida encontrada, buscar department matching
        const targetDept = availableDepts.find(d => 
          d.standardCategory === category
        );
        
        if (targetDept) {
          // ✅ ÉXITO: Remapear participante
          await prisma.participant.update({
            where: { id: p.id },
            data: { departmentId: targetDept.id }
          });
          
          console.log(`✅ ${identifier}: "${p.department}" → ${targetDept.displayName} (${category})`);
          remapped++;
        } else {
          // ⚠️ Categoría válida pero no existe department en BD
          console.log(`⚠️  ${identifier}: Categoría "${category}" encontrada pero sin department disponible`);
          console.log(`    Término original: "${p.department}"`);
          skipped++;
        }
      } else {
        // ⚠️ No se pudo categorizar (término muy específico o desconocido)
        console.log(`⚠️  ${identifier}: "${p.department}" → sin categoría válida (permanece en paraguas)`);
        skipped++;
      }
    }
    
    // ============================================
    // PASO 5: Reporte de resultados
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL REMAPEO');
    console.log('='.repeat(60));
    console.log(`   Total procesados: ${participants.length}`);
    console.log(`   ✅ Remapeados exitosamente: ${remapped}`);
    console.log(`   ⚠️  Omitidos (sin mapeo): ${skipped}`);
    
    const successRate = participants.length > 0 
      ? ((remapped / participants.length) * 100).toFixed(1)
      : '0.0';
    
    console.log(`   📈 Tasa de éxito: ${successRate}%`);
    console.log('='.repeat(60) + '\n');
    
    // Recomendaciones
    if (skipped > 0) {
      console.log('💡 RECOMENDACIONES:');
      console.log('   - Revisa los términos sin mapeo arriba');
      console.log('   - Considera agregar aliases a DepartmentAdapter.ts');
      console.log('   - O usa la UI de Mapping-Review para mapeo manual\n');
    }
    
    return { 
      total: participants.length, 
      remapped, 
      skipped,
      successRate: `${successRate}%`
    };
    
  } catch (error) {
    console.error('\n💥 ERROR CRÍTICO:', error);
    throw error;
  }
}

// ============================================
// EJECUCIÓN DEL SCRIPT
// ============================================
remapEnterpriseParticipants()
  .then(result => {
    if ('error' in result) {
      console.error(`\n❌ Error: ${result.error}`);
      process.exit(1);
    } else {
      console.log('✅ Proceso completado exitosamente');
      console.log(`   Resultados: ${result.remapped}/${result.total} remapeados (${result.successRate})\n`);
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('\n💥 Error fatal durante ejecución:', error);
    process.exit(1);
  })
  .finally(() => {
    // Desconectar Prisma Client
    prisma.$disconnect();
  });