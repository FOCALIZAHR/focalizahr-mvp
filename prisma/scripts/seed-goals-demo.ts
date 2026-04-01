// ════════════════════════════════════════════════════════════════════════════
// SEED: Goals Demo Data for Executive Hub Insight #7
// prisma/scripts/seed-goals-demo.ts
// ════════════════════════════════════════════════════════════════════════════
// Crea metas variadas (90%, 60%, 30%, 0%) para empleados existentes
// con GoalProgressUpdates para Time Travel, y regenera ratings.
//
// Ejecutar:
//   npx tsx prisma/scripts/seed-goals-demo.ts
//
// Prerequisitos:
//   - Al menos 1 PerformanceCycle activo con ratings
//   - Empleados con PerformanceRating en ese ciclo
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

/** Distribución de progreso para simular variedad realista */
const GOAL_PROFILES = [
  { progress: 95, status: 'COMPLETED' as const, label: 'Sobre-cumplidor' },
  { progress: 85, status: 'ON_TRACK' as const, label: 'Sólido' },
  { progress: 60, status: 'AT_RISK' as const, label: 'En riesgo' },
  { progress: 30, status: 'BEHIND' as const, label: 'Rezagado' },
  { progress: 0, status: 'NOT_STARTED' as const, label: 'Sin avance' },
]

/** Metas tipo para asignar */
const GOAL_TEMPLATES = [
  { title: 'Cumplir presupuesto del área', type: 'KPI' as const, unit: '%' },
  { title: 'Reducir rotación de equipo', type: 'KPI' as const, unit: '%' },
  { title: 'Implementar mejora de procesos', type: 'PROJECT' as const, unit: null },
  { title: 'Alcanzar NPS interno del departamento', type: 'KPI' as const, unit: 'puntos' },
  { title: 'Capacitar equipo en nuevas competencias', type: 'OBJECTIVE' as const, unit: '%' },
]

async function main() {
  console.log('🎯 Seed Goals Demo — Iniciando...\n')

  // 1. Encontrar ciclo activo más reciente
  const cycle = await prisma.performanceCycle.findFirst({
    where: { status: { in: ['ACTIVE', 'IN_REVIEW', 'COMPLETED'] } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      accountId: true,
      startDate: true,
      endDate: true,
      includeGoals: true,
      competenciesWeight: true,
      goalsWeight: true,
    },
  })

  if (!cycle) {
    console.error('❌ No hay ciclo activo. Crea un ciclo primero.')
    process.exit(1)
  }

  console.log(`📋 Ciclo: ${cycle.name} (${cycle.id})`)
  console.log(`   Account: ${cycle.accountId}`)
  console.log(`   Periodo: ${cycle.startDate.toISOString().split('T')[0]} → ${cycle.endDate.toISOString().split('T')[0]}`)
  console.log(`   includeGoals: ${cycle.includeGoals} | Pesos: ${cycle.competenciesWeight}/${cycle.goalsWeight}\n`)

  // 2. Activar includeGoals si está desactivado
  if (!cycle.includeGoals) {
    await prisma.performanceCycle.update({
      where: { id: cycle.id },
      data: { includeGoals: true, competenciesWeight: 70, goalsWeight: 30 },
    })
    console.log('✅ includeGoals activado (70/30)\n')
  }

  // 3. Obtener empleados con ratings en este ciclo
  const ratings = await prisma.performanceRating.findMany({
    where: { cycleId: cycle.id, accountId: cycle.accountId },
    select: {
      employeeId: true,
      calculatedScore: true,
      employee: {
        select: {
          id: true,
          fullName: true,
          departmentId: true,
          acotadoGroup: true,
        },
      },
    },
  })

  if (ratings.length === 0) {
    console.error('❌ No hay ratings en este ciclo. Genera ratings primero.')
    process.exit(1)
  }

  console.log(`👥 ${ratings.length} empleados con ratings encontrados\n`)

  // 4. Limpiar goals existentes de demo (si se re-ejecuta)
  const existingGoals = await prisma.goal.findMany({
    where: {
      accountId: cycle.accountId,
      periodYear: cycle.startDate.getFullYear(),
      description: { contains: '[DEMO SEED]' },
    },
    select: { id: true },
  })

  if (existingGoals.length > 0) {
    // Delete progress updates first (FK constraint)
    await prisma.goalProgressUpdate.deleteMany({
      where: { goalId: { in: existingGoals.map(g => g.id) } },
    })
    await prisma.goal.deleteMany({
      where: { id: { in: existingGoals.map(g => g.id) } },
    })
    console.log(`🗑️  Limpiados ${existingGoals.length} goals de ejecuciones anteriores\n`)
  }

  // 5. Crear goals para cada empleado
  const periodYear = cycle.startDate.getFullYear()
  const goalStartDate = new Date(cycle.startDate)
  goalStartDate.setMonth(goalStartDate.getMonth() - 1) // Goals start 1 month before cycle
  const goalDueDate = new Date(cycle.endDate)
  goalDueDate.setMonth(goalDueDate.getMonth() + 1) // Goals end 1 month after cycle

  // Dates for progress updates (simulating mid-cycle updates)
  const midDate = new Date(cycle.startDate.getTime() + (cycle.endDate.getTime() - cycle.startDate.getTime()) * 0.5)
  const lateDate = new Date(cycle.startDate.getTime() + (cycle.endDate.getTime() - cycle.startDate.getTime()) * 0.8)

  let goalsCreated = 0
  let updatesCreated = 0

  for (let i = 0; i < ratings.length; i++) {
    const rating = ratings[i]
    const emp = rating.employee

    // Assign a profile based on index (distribute evenly across profiles)
    const profile = GOAL_PROFILES[i % GOAL_PROFILES.length]

    // Each employee gets 2-3 goals with combined weight = 100
    const goalCount = 2 + (i % 2) // 2 or 3 goals
    const weights = goalCount === 2 ? [60, 40] : [50, 30, 20]

    for (let g = 0; g < goalCount; g++) {
      const template = GOAL_TEMPLATES[g % GOAL_TEMPLATES.length]

      // Vary progress slightly per goal (±10%)
      const goalProgress = Math.max(0, Math.min(100, profile.progress + (g * 5 - 5)))
      const currentValue = goalProgress

      const goal = await prisma.goal.create({
        data: {
          accountId: cycle.accountId,
          employeeId: emp.id,
          departmentId: emp.departmentId,
          createdById: 'seed-script',
          title: template.title,
          description: `[DEMO SEED] Meta demo para ${emp.fullName} — perfil: ${profile.label}`,
          type: template.type,
          level: 'INDIVIDUAL',
          originType: 'MANAGER_CREATED',
          metricType: 'PERCENTAGE',
          startValue: 0,
          targetValue: 100,
          currentValue,
          unit: template.unit,
          progress: goalProgress,
          status: profile.status === 'COMPLETED' && goalProgress >= 100 ? 'COMPLETED' : profile.status,
          weight: weights[g],
          periodYear,
          startDate: goalStartDate,
          dueDate: goalDueDate,
          isAligned: false,
          isOrphan: true,
          completedAt: goalProgress >= 100 ? lateDate : null,
        },
      })

      goalsCreated++

      // Create progress updates for Time Travel
      // Update 1: Initial (at cycle start)
      if (goalProgress > 0) {
        const midProgress = Math.round(goalProgress * 0.4)
        await prisma.goalProgressUpdate.create({
          data: {
            goalId: goal.id,
            accountId: cycle.accountId,
            previousValue: 0,
            newValue: midProgress,
            previousProgress: 0,
            newProgress: midProgress,
            comment: `Avance intermedio — ${profile.label}`,
            updatedById: 'seed-script',
            createdAt: midDate,
          },
        })
        updatesCreated++

        // Update 2: Near end (at 80% of cycle)
        await prisma.goalProgressUpdate.create({
          data: {
            goalId: goal.id,
            accountId: cycle.accountId,
            previousValue: midProgress,
            newValue: currentValue,
            previousProgress: midProgress,
            newProgress: goalProgress,
            comment: `Actualización final — ${profile.label}`,
            updatedById: 'seed-script',
            createdAt: lateDate,
          },
        })
        updatesCreated++
      }
    }
  }

  console.log(`✅ ${goalsCreated} goals creados`)
  console.log(`✅ ${updatesCreated} progress updates creados\n`)

  // 6. Regenerar ratings para que goalsRawPercent se persista
  console.log('🔄 Regenerando ratings con includeGoals=true...')
  console.log('   Esto puede tomar unos segundos...\n')

  try {
    // Import the service dynamically to avoid module resolution issues
    // We call the API endpoint instead for simplicity
    const cycleConfig = {
      competenciesWeight: cycle.competenciesWeight || 70,
      goalsWeight: cycle.goalsWeight || 30,
      includeGoals: true,
    }

    // Process each employee's hybrid score
    let recalculated = 0
    for (const rating of ratings) {
      const emp = rating.employee

      // Get employee goal score via Time Travel
      const goals = await prisma.goal.findMany({
        where: {
          employeeId: emp.id,
          startDate: { lte: cycle.endDate },
          dueDate: { gte: cycle.startDate },
          status: { notIn: ['CANCELLED'] },
          weight: { gt: 0 },
        },
        include: {
          progressUpdates: {
            where: { createdAt: { lte: cycle.endDate } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })

      if (goals.length === 0) continue

      // Calculate weighted goals score
      const details = goals.map(g => {
        const progress = g.progressUpdates.length > 0
          ? g.progressUpdates[0].newProgress
          : 0
        return { progress, weight: g.weight }
      })

      const totalWeight = details.reduce((s, d) => s + d.weight, 0)
      const weightedSum = details.reduce((s, d) => s + (d.progress * d.weight / 100), 0)
      const goalsRawPercent = totalWeight > 0
        ? Math.min(100, Math.max(0, Math.round((weightedSum / totalWeight) * 100)))
        : 0

      // Normalize to 1-5 scale
      const goalsScore = 1 + (goalsRawPercent / 100) * 4

      // Calculate hybrid score
      const compScore = rating.calculatedScore
      const hybridScore = (compScore * cycleConfig.competenciesWeight / 100)
        + (goalsScore * cycleConfig.goalsWeight / 100)

      // Update the rating
      await prisma.performanceRating.updateMany({
        where: {
          cycleId: cycle.id,
          employeeId: emp.id,
        },
        data: {
          goalsRawPercent,
          goalsScore: Math.round(goalsScore * 100) / 100,
          goalsCount: goals.length,
          hybridScore: Math.round(hybridScore * 100) / 100,
        },
      })

      recalculated++
    }

    console.log(`✅ ${recalculated} ratings actualizados con goalsRawPercent\n`)

  } catch (err) {
    console.error('⚠️  Error regenerando ratings:', err)
    console.log('   Puedes regenerar manualmente desde:')
    console.log('   POST /api/admin/performance-cycles/[cycleId]/generate-ratings\n')
  }

  // 7. Verificación
  const verification = await prisma.performanceRating.findMany({
    where: { cycleId: cycle.id, goalsRawPercent: { not: null } },
    select: { goalsRawPercent: true },
  })

  console.log('═══════════════════════════════════════')
  console.log(`📊 Verificación: ${verification.length} ratings con goalsRawPercent`)
  if (verification.length > 0) {
    const avg = Math.round(verification.reduce((s, r) => s + (r.goalsRawPercent ?? 0), 0) / verification.length)
    const min = Math.round(Math.min(...verification.map(r => r.goalsRawPercent ?? 0)))
    const max = Math.round(Math.max(...verification.map(r => r.goalsRawPercent ?? 0)))
    console.log(`   Promedio: ${avg}% | Min: ${min}% | Max: ${max}%`)
  }
  console.log('═══════════════════════════════════════\n')

  console.log('🎯 Seed completo. Abre Executive Hub → Insight "Metas" para verificar.')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
