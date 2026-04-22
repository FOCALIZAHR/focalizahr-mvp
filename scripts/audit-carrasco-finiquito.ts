// Auditoría read-only: valor raw de finiquitoToday para persona CARRASCO
// en el path completo del enrichment de L2.
import { prisma } from '../src/lib/prisma'
import {
  calculateFiniquito,
  calculateFiniquitoConTopeCustomUF,
  calculateTenureMonths,
  UF_VALUE_CLP,
} from '../src/lib/utils/TalentFinancialFormulas'
import { SalaryConfigService } from '../src/lib/services/SalaryConfigService'

async function main() {
  // Buscar empleados apellido CARRASCO en cualquier account
  const empleados = await prisma.employee.findMany({
    where: {
      fullName: { contains: 'CARRASCO', mode: 'insensitive' },
      isActive: true,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      accountId: true,
      fullName: true,
      position: true,
      hireDate: true,
      acotadoGroup: true,
      standardJobLevel: true,
      department: { select: { displayName: true } },
    },
  })

  if (empleados.length === 0) {
    console.log('No se encontró ningún empleado con apellido CARRASCO')
    await prisma.$disconnect()
    return
  }

  console.log(`Encontrados ${empleados.length} empleados con apellido CARRASCO\n`)

  for (const e of empleados) {
    console.log(`══════════════════════════════════════════════════════`)
    console.log(`${e.fullName}`)
    console.log(`  accountId: ${e.accountId}`)
    console.log(`  employeeId: ${e.id}`)
    console.log(`  position:  ${e.position}`)
    console.log(`  dept:      ${e.department?.displayName ?? '(sin depto)'}`)
    console.log(`  hireDate:  ${e.hireDate.toISOString().slice(0, 10)}`)
    console.log(`  acotadoGroup:      ${e.acotadoGroup ?? '(null)'}`)
    console.log(`  standardJobLevel:  ${e.standardJobLevel ?? '(null)'}`)

    // Cálculo de tenureMonths (igual que buildEnrichedDataset)
    const tenureMonths = calculateTenureMonths(e.hireDate)
    console.log(`  tenureMonths:      ${tenureMonths} (${Math.floor(tenureMonths / 12)}y ${tenureMonths % 12}m)`)

    // RoleFitScore (se necesita para el finiquitoToday condicional)
    const latestCycle = await prisma.performanceCycle.findFirst({
      where: {
        accountId: e.accountId,
        status: { in: ['ACTIVE', 'IN_REVIEW', 'COMPLETED'] },
        performanceRatings: { some: { employeeId: e.id, roleFitScore: { not: null } } },
      },
      orderBy: { endDate: 'desc' },
      select: { id: true },
    })
    let roleFitScore: number | null = null
    if (latestCycle) {
      const rating = await prisma.performanceRating.findFirst({
        where: { employeeId: e.id, cycleId: latestCycle.id },
        select: { roleFitScore: true },
      })
      roleFitScore = rating?.roleFitScore ?? null
    }
    console.log(`  roleFitScore:      ${roleFitScore === null ? '(null — sin cycle)' : roleFitScore.toFixed(2)}`)

    // Salary (via SalaryConfigService por acotadoGroup)
    const salaryResult = await SalaryConfigService.getSalaryForAccount(
      e.accountId,
      e.acotadoGroup ?? undefined
    )
    const salary = salaryResult.monthlySalary
    console.log(`  salary (mensual):  ${salary.toLocaleString('es-CL')}`)
    console.log(`  salary source:     ${salaryResult.source} (${salaryResult.confidence})`)

    // ── REPLICACIÓN DEL CÁLCULO DE finiquitoToday ──
    // Lógica en WorkforceIntelligenceService.ts:481
    //   finiquitoToday: roleFitScore < 75 ? calculateFiniquito(salary, tenureMonths) : null
    console.log(`\n  ── CÁLCULO finiquitoToday ──`)
    const gateRoleFit = roleFitScore !== null && roleFitScore < 75
    console.log(`  roleFitScore < 75?  ${gateRoleFit} (gate actual del enricher)`)

    if (gateRoleFit) {
      const finiquitoRaw = calculateFiniquito(salary, tenureMonths)
      console.log(`  finiquitoToday RAW: ${finiquitoRaw.toLocaleString('es-CL')} CLP`)
    } else {
      console.log(`  finiquitoToday RAW: null  ← NO pasa el gate roleFitScore < 75`)
    }

    // ── Cálculo alternativo (sin gate) con tope 90 UF ──
    const finiquitoConTope = calculateFiniquitoConTopeCustomUF(
      salary,
      tenureMonths,
      UF_VALUE_CLP
    )
    console.log(`\n  ── CÁLCULO alternativo (sin gate, con tope 90 UF — L9 style) ──`)
    console.log(`  finiquito +0m:  ${finiquitoConTope.toLocaleString('es-CL')} CLP`)
    const f6 = calculateFiniquitoConTopeCustomUF(salary, tenureMonths + 6, UF_VALUE_CLP)
    const f12 = calculateFiniquitoConTopeCustomUF(salary, tenureMonths + 12, UF_VALUE_CLP)
    console.log(`  finiquito +6m:  ${f6.toLocaleString('es-CL')} CLP  (+${(f6 - finiquitoConTope).toLocaleString('es-CL')})`)
    console.log(`  finiquito +12m: ${f12.toLocaleString('es-CL')} CLP  (+${(f12 - finiquitoConTope).toLocaleString('es-CL')})`)

    // Cálculo L2 resolver actual
    console.log(`\n  ── Lo que devuelve EfficiencyDataResolver case l2_zombie ──`)
    console.log(`  finiquitoToday:  ${gateRoleFit ? calculateFiniquito(salary, tenureMonths).toLocaleString('es-CL') : 'null'}  ← del enriched, roleFit-gated`)
    console.log(`  finiquitoIn6m:   ${f6.toLocaleString('es-CL')}  ← calculado fresh en el resolver L2`)
    console.log(`  finiquitoIn12m:  ${f12.toLocaleString('es-CL')}  ← calculado fresh en el resolver L2`)
    console.log()
  }

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
