// ════════════════════════════════════════════════════════════════════════════
// SEED: Goals Demo Data for Executive Hub Insight #7
// prisma/scripts/seed-goals-demo.ts
// ════════════════════════════════════════════════════════════════════════════
// Crea metas variadas (95%, 85%, 60%, 30%, 0%) para empleados existentes con
// GoalProgressUpdates para Time Travel, y regenera ratings.
//
// ⚠️ REESCRITO 2026-07-13 — POR QUÉ (leer antes de tocar):
// ────────────────────────────────────────────────────────────────────────────
// La versión anterior escribía con `prisma.goal.create` DIRECTO, salteándose
// GoalsService y por lo tanto `validateTotalWeight`. Asumía pizarra en blanco
// ("cada empleado recibe 2-3 metas que suman 100%") y le sumó otro 100% de peso
// encima a empleados que YA tenían metas reales → 39 de 49 empleados quedaron con
// más de 100% de peso (hasta 230%). Además pisó a mano 50 PerformanceRating REALES
// de un ciclo ACTIVE. La base Supabase es única (= producción). Saneado por
// `cleanup-seed-goals-demo.ts` + `fix-tp26-include-goals.ts`.
//
// AHORA: toda meta se crea vía `GoalsService.createManagerGoal` — el mismo camino
// del wizard real. Eso hereda automáticamente las reglas de negocio vivas (tope de
// 100% de peso, límite de metas por empleado, herencia de GoalCycle, alerta de
// asignación) sin duplicar ninguna lógica acá. Si una regla cambia, este seed la
// respeta solo, sin mantenimiento.
//
// CONSECUENCIA (por diseño): el seed ya NO puede inventar pesos. Reparte SOLO dentro
// del presupuesto libre de cada empleado (100 − peso ya asignado). Si alguien no
// tiene presupuesto, se lo SALTA y lo informa. Genera menos datos que antes, pero
// nunca datos inválidos.
//
// Ejecutar:
//   npx tsx prisma/scripts/seed-goals-demo.ts                 (usa el ciclo tal como está)
//   npx tsx prisma/scripts/seed-goals-demo.ts --enable-goals  (además activa includeGoals 70/30)
//
// Prerequisitos:
//   - Al menos 1 PerformanceCycle con ratings
//   - Un GoalCycle ACTIVE en la cuenta (las metas heredan su ciclo)
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '../../src/lib/prisma'
import { GoalsService } from '../../src/lib/services/GoalsService'
import { PerformanceRatingService } from '../../src/lib/services/PerformanceRatingService'

const ENABLE_GOALS = process.argv.includes('--enable-goals')

// Firma del seed — `cleanup-seed-goals-demo.ts` borra por AMBAS. No cambiar.
const SEED_CREATED_BY = 'seed-script'
const SEED_MARK = '[DEMO SEED]'

const ACTIVAS = ['NOT_STARTED', 'ON_TRACK', 'AT_RISK', 'BEHIND'] as const

/** Distribución de progreso para simular variedad realista */
const GOAL_PROFILES = [
  { progress: 95, label: 'Sobre-cumplidor' },
  { progress: 85, label: 'Sólido' },
  { progress: 60, label: 'En riesgo' },
  { progress: 30, label: 'Rezagado' },
  { progress: 0, label: 'Sin avance' },
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

  // 1. Ciclo de desempeño más reciente
  const cycle = await prisma.performanceCycle.findFirst({
    where: { status: { in: ['ACTIVE', 'IN_REVIEW', 'COMPLETED'] } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, accountId: true, startDate: true, endDate: true,
      includeGoals: true, competenciesWeight: true, goalsWeight: true,
    },
  })

  if (!cycle) {
    console.error('❌ No hay ciclo de desempeño. Crea uno primero.')
    process.exit(1)
  }

  console.log(`📋 Ciclo: ${cycle.name} (${cycle.id})`)
  console.log(`   Account: ${cycle.accountId}`)
  console.log(`   Periodo: ${cycle.startDate.toISOString().split('T')[0]} → ${cycle.endDate.toISOString().split('T')[0]}`)
  console.log(`   includeGoals: ${cycle.includeGoals} | Pesos: ${cycle.competenciesWeight}/${cycle.goalsWeight}\n`)

  // 2. includeGoals — NUNCA se activa solo (antes se hacía en silencio y por eso
  //    DESEMPEÑO_TP26 quedó ponderando metas sin ventana de seguimiento).
  if (!cycle.includeGoals) {
    if (ENABLE_GOALS) {
      await prisma.performanceCycle.updateMany({
        where: { id: cycle.id, accountId: cycle.accountId },
        data: { includeGoals: true, competenciesWeight: 70, goalsWeight: 30 },
      })
      console.log('✅ includeGoals activado (70/30) — pediste --enable-goals\n')
    } else {
      console.log('⚠️  includeGoals=false en este ciclo: los ratings NO tendrán hybridScore.')
      console.log('    Si querés el híbrido, re-corré con --enable-goals (decisión consciente).\n')
    }
  }

  // 3. GoalCycle activo (las metas heredan su ciclo vía GoalsService)
  const goalCycle = await prisma.goalCycle.findFirst({
    where: { accountId: cycle.accountId, status: 'ACTIVE' },
    select: { id: true, name: true },
  })
  if (!goalCycle) {
    console.log('⚠️  No hay GoalCycle ACTIVE: las metas se crearán SIN ciclo asociado.\n')
  } else {
    console.log(`🗓️  GoalCycle activo: ${goalCycle.name} (las metas lo heredan)\n`)
  }

  // 4. Empleados con rating en el ciclo
  const ratings = await prisma.performanceRating.findMany({
    where: { cycleId: cycle.id, accountId: cycle.accountId },
    select: {
      employeeId: true,
      employee: { select: { id: true, fullName: true, departmentId: true } },
    },
  })

  if (ratings.length === 0) {
    console.error('❌ No hay ratings en este ciclo. Genera ratings primero.')
    process.exit(1)
  }
  console.log(`👥 ${ratings.length} empleados con ratings\n`)

  // 5. Limpiar metas de corridas anteriores (por la firma doble, id exacto)
  const previas = await prisma.goal.findMany({
    where: {
      accountId: cycle.accountId,
      createdById: SEED_CREATED_BY,
      description: { contains: SEED_MARK },
    },
    select: { id: true },
  })
  if (previas.length > 0) {
    await prisma.goal.deleteMany({ where: { id: { in: previas.map((g) => g.id) } } })
    console.log(`🗑️  ${previas.length} metas de corridas anteriores borradas (GoalProgressUpdate/GoalAlert caen en cascada)\n`)
  }

  // 6. Fechas
  const periodYear = cycle.startDate.getFullYear()
  const goalStartDate = new Date(cycle.startDate)
  goalStartDate.setMonth(goalStartDate.getMonth() - 1)
  const goalDueDate = new Date(cycle.endDate)
  goalDueDate.setMonth(goalDueDate.getMonth() + 1)
  const midDate = new Date(cycle.startDate.getTime() + (cycle.endDate.getTime() - cycle.startDate.getTime()) * 0.5)
  const lateDate = new Date(cycle.startDate.getTime() + (cycle.endDate.getTime() - cycle.startDate.getTime()) * 0.8)

  let goalsCreated = 0
  let updatesCreated = 0
  let saltados = 0
  const motivosSalto: string[] = []

  // 7. Crear metas VÍA GoalsService (hereda validateTotalWeight, límite, ciclo, alerta)
  for (let i = 0; i < ratings.length; i++) {
    const emp = ratings[i].employee
    if (!emp) continue
    const profile = GOAL_PROFILES[i % GOAL_PROFILES.length]

    // ── Presupuesto REAL disponible: 100 − peso ya asignado (metas activas) ──
    const existentes = await prisma.goal.findMany({
      where: {
        accountId: cycle.accountId,
        employeeId: emp.id,
        level: 'INDIVIDUAL',
        status: { in: [...ACTIVAS] },
      },
      select: { weight: true },
    })
    const usado = existentes.reduce((s, g) => s + (g.weight || 0), 0)
    const disponible = 100 - usado

    if (disponible <= 0) {
      saltados++
      motivosSalto.push(`${emp.fullName}: sin presupuesto de peso (ya usa ${usado}%)`)
      continue
    }

    // ── Límite de metas por empleado (Account.maxIndividualGoals) ──
    const limite = await GoalsService.checkGoalLimit(cycle.accountId, emp.id)
    if (!limite.canCreate) {
      saltados++
      motivosSalto.push(`${emp.fullName}: límite de metas alcanzado (${limite.current}/${limite.max})`)
      continue
    }

    // 2 o 3 metas, con los pesos ESCALADOS al presupuesto libre (nunca inventados)
    const cupo = Math.min(2 + (i % 2), limite.max - limite.current)
    const base = cupo === 2 ? [60, 40] : cupo === 3 ? [50, 30, 20] : [100]
    const pesos = base.map((b) => Math.max(1, Math.floor((b * disponible) / 100)))

    for (let g = 0; g < cupo; g++) {
      const template = GOAL_TEMPLATES[g % GOAL_TEMPLATES.length]
      const goalProgress = Math.max(0, Math.min(100, profile.progress + (g * 5 - 5)))

      try {
        // ── LA CREACIÓN REAL: mismo método que usa el wizard ──
        const goal = await GoalsService.createManagerGoal({
          accountId: cycle.accountId,
          employeeId: emp.id,
          departmentId: emp.departmentId ?? undefined,
          createdById: SEED_CREATED_BY,
          level: 'INDIVIDUAL',
          title: template.title,
          description: `${SEED_MARK} Meta demo para ${emp.fullName} — perfil: ${profile.label}`,
          type: template.type,
          metricType: 'PERCENTAGE',
          startValue: 0,
          targetValue: 100,
          unit: template.unit ?? undefined,
          weight: pesos[g],
          periodYear,
          startDate: goalStartDate,
          dueDate: goalDueDate,
        })
        goalsCreated++

        // ── Progreso: también por el motor real (calcula progress + status) ──
        if (goalProgress > 0) {
          const midProgress = Math.round(goalProgress * 0.4)
          await GoalsService.updateProgress({
            goalId: goal.id,
            newValue: midProgress,
            comment: `Avance intermedio — ${profile.label}`,
            updatedById: SEED_CREATED_BY,
          })
          await GoalsService.updateProgress({
            goalId: goal.id,
            newValue: goalProgress,
            comment: `Actualización final — ${profile.label}`,
            updatedById: SEED_CREATED_BY,
          })
          updatesCreated += 2

          // Back-dating SOLO de las filas de auditoría: updateProgress las estampa con
          // now(), y el Time Travel de getEmployeeGoalsScore filtra por createdAt <=
          // cycle.endDate (que es pasado). Sin esto el demo daría 0% de avance.
          // Se toca GoalProgressUpdate.createdAt, NUNCA el Goal.
          const ups = await prisma.goalProgressUpdate.findMany({
            where: { goalId: goal.id },
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          })
          if (ups[0]) await prisma.goalProgressUpdate.update({ where: { id: ups[0].id }, data: { createdAt: midDate } })
          if (ups[1]) await prisma.goalProgressUpdate.update({ where: { id: ups[1].id }, data: { createdAt: lateDate } })
        }
      } catch (err) {
        // La regla de negocio rechazó la meta (peso, límite, duplicado). Es el
        // comportamiento CORRECTO: se informa y se sigue, no se fuerza la escritura.
        saltados++
        motivosSalto.push(`${emp.fullName} · "${template.title}": ${(err as Error).message}`)
      }
    }
  }

  console.log(`✅ ${goalsCreated} metas creadas (vía GoalsService)`)
  console.log(`✅ ${updatesCreated} progress updates`)
  if (saltados > 0) {
    console.log(`\n⏭️  ${saltados} saltos por reglas de negocio (esto es lo esperado, no un error):`)
    motivosSalto.slice(0, 10).forEach((m) => console.log(`   · ${m}`))
    if (motivosSalto.length > 10) console.log(`   · … y ${motivosSalto.length - 10} más`)
  }

  // 8. Regenerar ratings con el MOTOR REAL (antes se pisaban a mano con updateMany)
  console.log('\n🔄 Regenerando ratings con PerformanceRatingService.generateRating...')
  let recalculados = 0
  let errores = 0
  for (const r of ratings) {
    try {
      await PerformanceRatingService.generateRating(cycle.id, r.employeeId, cycle.accountId)
      recalculados++
    } catch (err) {
      errores++
      console.error(`   ❌ ${r.employee?.fullName}: ${(err as Error).message}`)
    }
  }
  console.log(`✅ ${recalculados} ratings regenerados · ${errores} errores\n`)

  // 9. Verificación
  const verif = await prisma.performanceRating.findMany({
    where: { cycleId: cycle.id, accountId: cycle.accountId, goalsRawPercent: { not: null } },
    select: { goalsRawPercent: true },
  })

  console.log('═══════════════════════════════════════')
  console.log(`📊 ratings con goalsRawPercent: ${verif.length}`)
  if (verif.length > 0) {
    const vals = verif.map((v) => v.goalsRawPercent ?? 0)
    const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length)
    console.log(`   Promedio: ${avg}% | Min: ${Math.round(Math.min(...vals))}% | Max: ${Math.round(Math.max(...vals))}%`)
  } else {
    console.log('   (0 → el ciclo tiene includeGoals=false; correr con --enable-goals si querés híbrido)')
  }

  // Control de integridad: el seed ya NO puede romper el tope de 100%
  const activas = await prisma.goal.findMany({
    where: { accountId: cycle.accountId, level: 'INDIVIDUAL', status: { in: [...ACTIVAS] }, employeeId: { not: null } },
    select: { employeeId: true, weight: true },
  })
  const suma = new Map<string, number>()
  activas.forEach((g) => suma.set(g.employeeId!, (suma.get(g.employeeId!) ?? 0) + (g.weight || 0)))
  const excedidos = [...suma.values()].filter((s) => s > 100).length
  console.log(`🔐 empleados con peso >100%: ${excedidos} (el seed no puede generarlos: GoalsService lo impide)`)
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
