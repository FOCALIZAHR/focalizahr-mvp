// ════════════════════════════════════════════════════════════════════════════
// MIGRACIÓN RETROACTIVA — GoalCycle (Gate A.5)
// prisma/scripts/migrate-goal-cycle-retroactive.ts
// ════════════════════════════════════════════════════════════════════════════
// Para cada (accountId, periodYear) con metas SIN goalCycleId, crea un GoalCycle
// ANNUAL retroactivo y asocia SOLO las metas de ESE año. Cada año presente en los
// datos de una cuenta es un ciclo separado (NO todo el historial en uno).
//
//   status : year == referenceYear → ACTIVE
//            year <  referenceYear → CLOSED   (closedBy/closedAt seteados)
//            year >  referenceYear → PLANNING
//   name   : ACTIVE → "Ciclo Vigente {year}" · CLOSED/PLANNING → "Ciclo {year}"
//   ventanas: assignment = MIN(startDate) · closure = MAX(dueDate) del año
//             tracking = assignment + (closure - assignment)/2
//             (closure NO se recorta a 31-dic: refleja la ventana real de las metas)
//
// IDEMPOTENTE:
//   - No duplica ciclo: findFirst por la unique key (account, year, ANNUAL, 0, 0);
//     si existe, se reusa.
//   - No re-asocia: updateMany solo toma metas con goalCycleId=null.
//   Re-ejecutar → groupBy(goalCycleId=null) ya no las devuelve → no-op.
//
// GUARDA "1 ACTIVE": no crea un 2º ciclo ACTIVE si la cuenta ya tiene uno
//   (la migración escribe status directo, sin pasar por el advisory lock de
//   GoalCycleService.activate() que es Gate B). Defensiva.
//
// DRY-RUN por default. Persiste solo con --apply.
//   Diagnóstico global (no escribe):
//     npx tsx prisma/scripts/migrate-goal-cycle-retroactive.ts
//   Primera corrida real (Gate A.5), SOLO una cuenta:
//     npx tsx prisma/scripts/migrate-goal-cycle-retroactive.ts --apply --account=<id>
//   Filtro de años (usado por el smoke):  --years=2019,2020
// ════════════════════════════════════════════════════════════════════════════

import { PrismaClient } from '@prisma/client'

type CycleStatus = 'ACTIVE' | 'CLOSED' | 'PLANNING'
type GroupAction = 'created' | 'reused' | 'skipped-active-guard'

export interface MigrateOptions {
  dryRun: boolean
  referenceYear?: number        // default: año en curso (inyectable para el smoke)
  filterAccountId?: string
  filterYears?: number[]
}

export interface MigrateGroupResult {
  accountId: string
  year: number
  goalCount: number             // metas huérfanas del grupo al diagnosticar
  status: CycleStatus
  name: string
  assignmentWindow: Date
  trackingWindow: Date
  closureWindow: Date
  action: GroupAction
  cycleId: string | null
  associated: number            // metas efectivamente asociadas (0 en dry-run/skip)
}

export interface MigrateResult {
  referenceYear: number
  dryRun: boolean
  groups: MigrateGroupResult[]
  cyclesCreated: number
  goalsAssociated: number
}

function midpoint(a: Date, b: Date): Date {
  return new Date(a.getTime() + (b.getTime() - a.getTime()) / 2)
}

function resolveStatus(year: number, referenceYear: number): CycleStatus {
  if (year === referenceYear) return 'ACTIVE'
  if (year < referenceYear) return 'CLOSED'
  return 'PLANNING'
}

function resolveName(status: CycleStatus, year: number): string {
  return status === 'ACTIVE' ? `Ciclo Vigente ${year}` : `Ciclo ${year}`
}

/**
 * Núcleo de la migración. Recibe la instancia de Prisma (para que el smoke la
 * inyecte). NO abre ni cierra la conexión.
 */
export async function migrate(
  prisma: PrismaClient,
  opts: MigrateOptions
): Promise<MigrateResult> {
  const referenceYear = opts.referenceYear ?? new Date().getFullYear()
  const dryRun = opts.dryRun

  const where: {
    goalCycleId: null
    accountId?: string
    periodYear?: { in: number[] }
  } = { goalCycleId: null }
  if (opts.filterAccountId) where.accountId = opts.filterAccountId
  if (opts.filterYears && opts.filterYears.length > 0) {
    where.periodYear = { in: opts.filterYears }
  }

  const groups = await prisma.goal.groupBy({
    by: ['accountId', 'periodYear'],
    where,
    _count: { _all: true },
    _min: { startDate: true },
    _max: { dueDate: true },
    orderBy: [{ accountId: 'asc' }, { periodYear: 'asc' }],
  })

  const result: MigrateResult = {
    referenceYear,
    dryRun,
    groups: [],
    cyclesCreated: 0,
    goalsAssociated: 0,
  }

  for (const g of groups) {
    const year = g.periodYear
    const assignmentWindow = g._min.startDate
    const closureWindow = g._max.dueDate

    // Defensivo: Goal.startDate/dueDate son NOT NULL; si algo raro los deja null,
    // saltar el grupo antes que escribir ventanas inválidas.
    if (!assignmentWindow || !closureWindow) {
      console.warn(`[skip] ${g.accountId} año ${year}: startDate/dueDate nulos — grupo omitido`)
      continue
    }

    const trackingWindow = midpoint(assignmentWindow, closureWindow)
    const status = resolveStatus(year, referenceYear)
    const name = resolveName(status, year)

    // IDEMPOTENCIA-A: ¿ya existe el ciclo de este período?
    const existing = await prisma.goalCycle.findFirst({
      where: { accountId: g.accountId, year, periodType: 'ANNUAL', quarter: 0, semester: 0 },
      select: { id: true },
    })

    // GUARDA "1 ACTIVE": solo aplica si íbamos a CREAR uno ACTIVE nuevo.
    if (!existing && status === 'ACTIVE') {
      const otherActive = await prisma.goalCycle.count({
        where: { accountId: g.accountId, status: 'ACTIVE' },
      })
      if (otherActive > 0) {
        console.warn(`[guard] ${g.accountId} ya tiene un GoalCycle ACTIVE — grupo ${year} OMITIDO (no crea 2º ACTIVE)`)
        result.groups.push({
          accountId: g.accountId, year, goalCount: g._count._all, status, name,
          assignmentWindow, trackingWindow, closureWindow,
          action: 'skipped-active-guard', cycleId: null, associated: 0,
        })
        continue
      }
    }

    if (dryRun) {
      // Cuántas asociaría (si el ciclo ya existe, cuenta las que siguen huérfanas)
      const wouldAssociate = existing
        ? await prisma.goal.count({ where: { accountId: g.accountId, periodYear: year, goalCycleId: null } })
        : g._count._all
      result.groups.push({
        accountId: g.accountId, year, goalCount: g._count._all, status, name,
        assignmentWindow, trackingWindow, closureWindow,
        action: existing ? 'reused' : 'created', cycleId: existing?.id ?? null,
        associated: wouldAssociate,
      })
      continue
    }

    // APPLY: crear/reusar + asociar, atómico por grupo.
    let action: GroupAction
    let cycleId: string
    let associated = 0
    await prisma.$transaction(async (tx) => {
      if (existing) {
        cycleId = existing.id
        action = 'reused'
      } else {
        const created = await tx.goalCycle.create({
          data: {
            accountId: g.accountId,
            name,
            periodType: 'ANNUAL',
            year,
            // quarter/semester quedan en 0 por default (protege el @@unique)
            assignmentWindow,
            trackingWindow,
            closureWindow,
            status,
            createdBy: 'system-retroactive-migration',
            ...(status === 'CLOSED'
              ? { closedBy: 'system-retroactive-migration', closedAt: closureWindow }
              : {}),
          },
          select: { id: true },
        })
        cycleId = created.id
        action = 'created'
        result.cyclesCreated++
      }

      const assoc = await tx.goal.updateMany({
        where: { accountId: g.accountId, periodYear: year, goalCycleId: null },
        data: { goalCycleId: cycleId },
      })
      associated = assoc.count
      result.goalsAssociated += assoc.count
    })

    result.groups.push({
      accountId: g.accountId, year, goalCount: g._count._all, status, name,
      assignmentWindow, trackingWindow, closureWindow,
      action: action!, cycleId: cycleId!, associated,
    })
  }

  return result
}

// ────────────────────────────────────────────────────────────────────────────
// CLI
// ────────────────────────────────────────────────────────────────────────────
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function printTable(res: MigrateResult): void {
  console.log('══════════════════════════════════════════════════════════════════════')
  console.log(`  MIGRACIÓN RETROACTIVA GoalCycle — ${res.dryRun ? 'DRY-RUN (no escribe)' : 'APPLY'}`)
  console.log(`  referenceYear=${res.referenceYear}  ·  grupos=${res.groups.length}`)
  console.log('══════════════════════════════════════════════════════════════════════')
  if (res.groups.length === 0) {
    console.log('  (sin metas huérfanas en el scope — nada que migrar)')
    return
  }
  console.log('cuenta                     │ año  │ #metas │ status   │ name              │ assignment │ tracking   │ closure    │ acción │ asoc')
  console.log('───────────────────────────┼──────┼────────┼──────────┼───────────────────┼────────────┼────────────┼────────────┼────────┼─────')
  for (const g of res.groups) {
    console.log(
      `${g.accountId.padEnd(26)} │ ${String(g.year).padEnd(4)} │ ${String(g.goalCount).padStart(5)}  │ ${g.status.padEnd(8)} │ ${g.name.padEnd(17)} │ ${fmtDate(g.assignmentWindow)} │ ${fmtDate(g.trackingWindow)} │ ${fmtDate(g.closureWindow)} │ ${g.action.padEnd(6)} │ ${String(g.associated).padStart(4)}`
    )
  }
  console.log('───────────────────────────────────────────────────────────────────────')
  console.log(`  Ciclos ${res.dryRun ? 'a crear' : 'creados'}: ${res.dryRun ? res.groups.filter(g => g.action === 'created').length : res.cyclesCreated}   ·   Metas ${res.dryRun ? 'a asociar' : 'asociadas'}: ${res.dryRun ? res.groups.reduce((s, g) => s + g.associated, 0) : res.goalsAssociated}`)
  if (res.dryRun) console.log('  → DRY-RUN: nada persistido. Re-correr con --apply para escribir.')
}

async function runCli(): Promise<void> {
  const directUrl = process.env.DIRECT_URL
  if (!directUrl) {
    console.error('❌ DIRECT_URL no configurada en .env')
    process.exit(1)
  }
  const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } })

  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const accountArg = args.find((a) => a.startsWith('--account='))?.split('=')[1]
  const yearsArg = args.find((a) => a.startsWith('--years='))?.split('=')[1]
  const filterYears = yearsArg ? yearsArg.split(',').map((y) => parseInt(y, 10)) : undefined

  try {
    const res = await migrate(prisma, {
      dryRun: !apply,
      filterAccountId: accountArg,
      filterYears,
    })
    printTable(res)
  } catch (e) {
    console.error('❌ Error:', e instanceof Error ? e.message : e)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

// Auto-ejecutar solo si se invoca directamente (no cuando el smoke importa migrate).
// Mode-agnóstico (CJS/ESM bajo tsx): compara el archivo invocado en argv[1].
const invokedDirectly = (process.argv[1] ?? '')
  .replace(/\\/g, '/')
  .endsWith('migrate-goal-cycle-retroactive.ts')
if (invokedDirectly) {
  void runCli()
}
