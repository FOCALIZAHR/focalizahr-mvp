/**
 * SCRIPT DE RECUPERACIÓN - NOVIEMBRE 2025
 * 
 * Propósito: Procesar manualmente los journeys de noviembre que no fueron
 * agregados porque el CRON automático usa mes actual por defecto.
 * 
 * Ejecutar: npx tsx recover-november.ts
 */

import { PrismaClient } from '@prisma/client';
import { OnboardingAggregationService } from './src/lib/services/OnboardingAggregationService';

const prisma = new PrismaClient();

async function recoverNovember() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔧 SCRIPT DE RECUPERACIÓN - NOVIEMBRE 2025');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const accountId = 'cmfgedx7b00012413i92048wl'; // Corporación Enterprise
  const periodStart = new Date('2025-11-01T00:00:00');
  const periodEnd = new Date('2025-11-30T23:59:59');
  
  console.log(`📅 Período: ${periodStart.toISOString().split('T')[0]} → ${periodEnd.toISOString().split('T')[0]}`);
  console.log(`🏢 Account: ${accountId}\n`);
  
  try {
    // ========================================================================
    // FASE 1: AGREGAR MÉTRICAS MENSUALES
    // ========================================================================
    console.log('📊 FASE 1: Agregando métricas departamentales...\n');
    
    const result = await OnboardingAggregationService.aggregateAllDepartments(
      accountId,
      periodStart,
      periodEnd
    );
    
    console.log('\n✅ RESULTADO AGREGACIÓN:');
    console.log(`   ├─ Departamentos procesados: ${result.departmentsProcessed}`);
    console.log(`   ├─ Exitoso: ${result.success ? 'SÍ' : 'NO'}`);
    console.log(`   └─ Errores: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('\n⚠️ ERRORES ENCONTRADOS:');
      result.errors.forEach((err: string, i: number) => {
        console.log(`   ${i + 1}. ${err}`);
      });
    }
    
    if (!result.success) {
      console.log('\n❌ Agregación falló. Abortando actualización de acumulados.');
      return;
    }
    
    // ========================================================================
    // FASE 2: ACTUALIZAR SCORES ACUMULADOS (12 MESES)
    // ========================================================================
    console.log('\n📈 FASE 2: Actualizando scores acumulados (12 meses)...\n');
    
    await OnboardingAggregationService.updateAccumulatedExoScores(accountId);
    
    console.log('✅ Acumulados actualizados correctamente');
    
    // ========================================================================
    // FASE 3: VERIFICACIÓN
    // ========================================================================
    console.log('\n🔍 FASE 3: Verificando resultados...\n');
    
    const insights = await prisma.departmentOnboardingInsight.findMany({
      where: {
        accountId,
        periodStart: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      include: {
        department: {
          select: {
            displayName: true
          }
        }
      },
      orderBy: {
        department: {
          displayName: 'asc'
        }
      }
    });
    
    console.log(`📋 Insights creados: ${insights.length}`);
    console.log('');
    
    insights.forEach(insight => {
      console.log(`   ├─ ${insight.department.displayName}`);
      console.log(`   │  ├─ EXO Score: ${insight.avgEXOScore ?? 'N/A'}`);
      console.log(`   │  ├─ Total Journeys: ${insight.totalJourneys}`);
      console.log(`   │  ├─ Completados: ${insight.completedJourneys}`);
      console.log(`   │  └─ En Riesgo: ${insight.atRiskJourneys}`);
      console.log('   │');
    });
    
    // Verificar "Departamentos sin Asignar"
    const sinAsignar = insights.find(i => 
      i.department.displayName === 'Departamentos sin Asignar'
    );
    
    console.log('\n═══════════════════════════════════════════════════════════');
    if (sinAsignar) {
      console.log('✅ ÉXITO: "Departamentos sin Asignar" fue procesado');
      console.log(`   └─ EXO Score: ${sinAsignar.avgEXOScore}`);
      console.log(`   └─ Journeys: ${sinAsignar.totalJourneys}`);
    } else {
      console.log('⚠️ ADVERTENCIA: "Departamentos sin Asignar" NO fue procesado');
      console.log('   Revisar logs arriba para detectar errores.');
    }
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    console.error('\nStack trace:', (error as Error).stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexión a BD cerrada');
  }
}

// Ejecutar
recoverNovember()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });