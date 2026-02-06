// scripts/force-calculate-topito.ts
import { PrismaClient } from '@prisma/client';
import { PerformanceRatingService } from '../src/lib/services/PerformanceRatingService';

const prisma = new PrismaClient();

// TUS IDS REALES
const ACCOUNT_ID = 'cmfgedx7b00012413i92048wl';
const CYCLE_ID = 'cmkxgi4nn0005jksdctnwx4f8';

async function forceCalculate() {
  console.log(`🚀 [MANUAL TRIGGER] Iniciando cálculo para ciclo: ${CYCLE_ID}`);

  try {
    // 1. Validar existencia
    const cycle = await prisma.performanceCycle.findUnique({
      where: { id: CYCLE_ID },
    });

    if (!cycle) {
      throw new Error('❌ Ciclo no encontrado en BD.');
    }

    console.log(`✅ Ciclo encontrado: "${cycle.name}" (Status: ${cycle.status})`);

    // 2. Ejecutar el Motor de Cálculo (Capa 9)
    console.log('⚙️  Invocando PerformanceRatingService...');
    
    const start = performance.now();
    
    // Esta función hace la magia: Lee encuestas -> Calcula Promedios -> Escribe en PerformanceRating
    const result = await PerformanceRatingService.generateRatingsForCycle(
      CYCLE_ID,
      ACCOUNT_ID
    );

    const end = performance.now();

    console.log('✅ Cálculo finalizado exitosamente.');
    console.log(`⏱️  Tiempo: ${((end - start) / 1000).toFixed(2)}s`);
    
    // CORRECCIÓN AQUÍ: Usamos result.success
    console.log(`📊 Ratings Generados Exitosamente: ${result.success}`);
    console.log(`⚠️ Fallidos: ${result.failed}`);
    
    if (result.errors.length > 0) {
        console.log('errores:', result.errors);
    }

    console.log(`👉 AHORA PUEDES VER EL 9-BOX EN EL DASHBOARD`);

  } catch (error) {
    console.error('❌ Error fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceCalculate();