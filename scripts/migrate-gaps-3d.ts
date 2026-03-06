// ════════════════════════════════════════════════════════════════════════════
// MIGRATION: Recalculate gapsJson, matchPercent, readinessLevel
// scripts/migrate-gaps-3d.ts
// ════════════════════════════════════════════════════════════════════════════
// Candidatos nominados antes del fix 3D tienen gapsJson sin campos
// 'status' ni 'notEvaluated'. Este script recalcula desde la fuente
// (PerformanceResultsService scores + CompetencyTarget) y actualiza en BD.
//
// USO:
//   npx tsx -r tsconfig-paths/register scripts/migrate-gaps-3d.ts          # dry-run
//   npx tsx -r tsconfig-paths/register scripts/migrate-gaps-3d.ts --apply  # escribe en BD
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient, ReadinessLevel } from '@prisma/client'
import { SuccessionService } from '@/lib/services/SuccessionService'

const prisma = new PrismaClient()
const DRY_RUN = !process.argv.includes('--apply')

async function main() {
  console.log(`\n=== MIGRATION: gapsJson → formato 3D ===`)
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN (sin escritura)' : 'APPLY (escribiendo en BD)'}`)
  console.log('')

  // 1. Fetch ALL active candidates with their position info
  const candidates = await prisma.successionCandidate.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      employeeId: true,
      criticalPositionId: true,
      matchPercent: true,
      readinessLevel: true,
      gapsJson: true,
      criticalPosition: {
        select: {
          accountId: true,
          standardJobLevel: true,
          positionTitle: true,
        },
      },
      employee: {
        select: {
          fullName: true,
          standardJobLevel: true,
        },
      },
    },
  })

  console.log(`Total candidatos activos: ${candidates.length}`)

  // 2. Filter: only those whose gapsJson lacks 'status' field
  const needsMigration = candidates.filter(c => {
    const gaps = c.gapsJson as any[]
    if (!Array.isArray(gaps) || gaps.length === 0) return false
    return gaps[0].status === undefined
  })

  console.log(`Candidatos con formato antiguo (sin 'status'): ${needsMigration.length}`)
  if (needsMigration.length === 0) {
    console.log('Nada que migrar. Saliendo.\n')
    return
  }

  // 3. Group by accountId to reuse cycleId
  const cycleCache = new Map<string, string | null>()

  let migrated = 0
  let skipped = 0
  let errors = 0

  for (const c of needsMigration) {
    const accountId = c.criticalPosition.accountId
    const targetJobLevel = c.criticalPosition.standardJobLevel
    const employeeName = c.employee?.fullName || c.employeeId

    try {
      // Get cycle for this account (cached)
      if (!cycleCache.has(accountId)) {
        const cycleId = await SuccessionService.getCurrentCycleId(accountId)
        cycleCache.set(accountId, cycleId)
      }

      const cycleId = cycleCache.get(accountId)
      if (!cycleId) {
        console.log(`  SKIP ${employeeName}: sin ciclo activo para account ${accountId}`)
        skipped++
        continue
      }

      // Recalculate match using SuccessionService (full recalculation from source)
      const match = await SuccessionService.calculateMatch(
        c.employeeId,
        targetJobLevel,
        cycleId,
        accountId
      )

      if (match.gaps.length === 0) {
        console.log(`  SKIP ${employeeName}: sin competency targets para nivel "${targetJobLevel}"`)
        skipped++
        continue
      }

      // Calculate readiness
      const readiness = SuccessionService.calculateReadiness(match.gaps, match.matchPercent)

      // Detail for each candidate
      const notEvalCount = match.gaps.filter(g => g.notEvaluated).length
      const readyCount = match.gaps.filter(g => g.status === 'READY').length
      const gapSmallCount = match.gaps.filter(g => g.status === 'GAP_SMALL').length
      const gapCritCount = match.gaps.filter(g => g.status === 'GAP_CRITICAL').length

      console.log(
        `  ${DRY_RUN ? '[DRY]' : '[UPD]'} ${employeeName}` +
        ` | match: ${c.matchPercent}% → ${match.matchPercent}%` +
        ` | readiness: ${c.readinessLevel} → ${readiness.level}` +
        ` | gaps: ${match.gaps.length} total` +
        ` (READY=${readyCount}, SMALL=${gapSmallCount}, CRIT=${gapCritCount}, NOT_EVAL=${notEvalCount})`
      )

      if (!DRY_RUN) {
        await prisma.successionCandidate.update({
          where: { id: c.id },
          data: {
            gapsJson: JSON.parse(JSON.stringify(match.gaps)),
            matchPercent: match.matchPercent,
            gapsCriticalCount: match.counts.critical,
            gapsStrategicCount: match.counts.strategic,
            gapsLeadershipCount: match.counts.leadership,
            readinessLevel: readiness.level as ReadinessLevel,
            readinessScore: readiness.score,
            readinessReasoning: JSON.parse(JSON.stringify(readiness.reasoning)),
            estimatedMonths: readiness.estimatedMonths,
            lastCalculatedAt: new Date(),
          },
        })
      }

      migrated++
    } catch (err: any) {
      console.error(`  ERROR ${employeeName}: ${err.message}`)
      errors++
    }
  }

  console.log(`\n=== RESULTADO ===`)
  console.log(`Migrados: ${migrated} de ${needsMigration.length}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errores: ${errors}`)
  if (DRY_RUN) {
    console.log(`\n(Dry-run. Para aplicar: npx tsx -r tsconfig-paths/register scripts/migrate-gaps-3d.ts --apply)\n`)
  }
}

main()
  .catch(err => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
