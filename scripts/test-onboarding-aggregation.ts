/**
 * TEST SCRIPT: OnboardingAggregationService
 * 
 * Ejecuta agregación de métricas onboarding para verificar funcionamiento
 * 
 * Uso:
 *   npx tsx scripts/test-onboarding-aggregation.ts
 */

import { OnboardingAggregationService } from '@/lib/services/OnboardingAggregationService';

async function testOnboardingAggregation() {
  console.log('🧪 TESTING OnboardingAggregationService');
  console.log('==========================================\n');
  
  const accountId = 'cmfivd2040000fbu2sk4wkoz5';
  
  try {
    console.log(`📊 Account ID: ${accountId}`);
    console.log(`📅 Período: Mes actual (default)\n`);
    console.log('⏳ Ejecutando agregación...\n');
    
    const startTime = Date.now();
    
    // Ejecutar agregación
    const result = await OnboardingAggregationService.aggregateAllDepartments(
      accountId
      // periodStart y periodEnd = mes actual (default)
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Resultados
    console.log('==========================================');
    console.log('📋 RESULTADOS:');
    console.log('==========================================\n');
    
    if (result.success) {
      console.log('✅ Status: SUCCESS');
      console.log(`✅ Departamentos procesados: ${result.departmentsProcessed}`);
      console.log(`✅ Errores: ${result.errors.length}`);
      console.log(`⏱️  Duración: ${duration}s\n`);
      
      if (result.departmentsProcessed === 0) {
        console.log('⚠️  NOTA: No se procesaron departamentos.');
        console.log('   Posibles razones:');
        console.log('   - No hay journeys onboarding en el período actual');
        console.log('   - No hay departamentos con datos de onboarding');
        console.log('   - El accountId no tiene journeys creados\n');
      }
      
    } else {
      console.log('❌ Status: FAILED');
      console.log(`❌ Departamentos procesados: ${result.departmentsProcessed}`);
      console.log(`❌ Errores encontrados: ${result.errors.length}\n`);
      
      console.log('📝 DETALLES DE ERRORES:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }
    
    // Query para verificar en BD
    console.log('==========================================');
    console.log('🔍 VERIFICACIÓN EN BD:');
    console.log('==========================================\n');
    console.log('Ejecuta esta query para ver los insights creados:\n');
    console.log(`SELECT 
  d.display_name AS departamento,
  oi.period_start,
  oi.period_end,
  oi.total_journeys,
  oi.avg_exo_score,
  oi.avg_age,
  oi.avg_seniority,
  oi.critical_alerts,
  oi.created_at
FROM department_onboarding_insights oi
JOIN departments d ON oi.department_id = d.id
WHERE oi.account_id = '${accountId}'
  AND oi.created_at > NOW() - INTERVAL '1 hour'
ORDER BY oi.created_at DESC;`);
    
  } catch (error) {
    console.error('\n❌ ERROR FATAL:', error);
    console.error('\nStack trace:', (error as Error).stack);
  }
}

// Ejecutar test
testOnboardingAggregation()
  .then(() => {
    console.log('\n✅ Test completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test falló:', error);
    process.exit(1);
  });