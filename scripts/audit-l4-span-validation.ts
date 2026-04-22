// ════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN §14 del SPEC_L4_ARQUITECTURA_LIDERAZGO.md — read-only
// Verifica que las dependencias de data existan para implementar Span
// Intelligence. No toca producto.
// ════════════════════════════════════════════════════════════════════════════

import { prisma } from '../src/lib/prisma'

async function main() {
  const accountId = process.argv[2] ?? 'cmfgedx7b00012413i92048wl'

  console.log(`\nAccount: ${accountId}\n`)
  console.log('════════════════════════════════════════════════════════════')

  // 1. directReports via relación recursiva
  const managers = await prisma.employee.findMany({
    where: { accountId, isActive: true, status: 'ACTIVE' },
    select: {
      id: true,
      fullName: true,
      position: true,
      managerId: true,
      _count: { select: { directReports: true } },
    },
  })

  const withDirects = managers.filter(m => m._count.directReports > 0)
  console.log('\n📊 1. DIRECT REPORTS (universo de managers)')
  console.log(`   Empleados activos totales:  ${managers.length}`)
  console.log(`   Con ≥1 direct report:       ${withDirects.length}`)
  console.log(`   Densidad gerencial:         ${((withDirects.length / managers.length) * 100).toFixed(1)}%`)

  if (withDirects.length === 0) {
    console.log('   ⚠️  Ningún empleado tiene directReports. Span no computable.')
  } else {
    const top10 = withDirects
      .sort((a, b) => b._count.directReports - a._count.directReports)
      .slice(0, 10)
    console.log('\n   Top 10 managers por span:')
    for (const m of top10) {
      console.log(
        `     ${String(m._count.directReports).padStart(3)} directs  ${m.fullName.padEnd(40)} ${m.position ?? ''}`
      )
    }
    const min = Math.min(...withDirects.map(m => m._count.directReports))
    const max = Math.max(...withDirects.map(m => m._count.directReports))
    const avg =
      withDirects.reduce((s, m) => s + m._count.directReports, 0) /
      withDirects.length
    const median = [...withDirects]
      .sort((a, b) => a._count.directReports - b._count.directReports)[
      Math.floor(withDirects.length / 2)
    ]._count.directReports
    console.log(`\n   Span min/median/avg/max:   ${min} / ${median} / ${avg.toFixed(1)} / ${max}`)
  }

  // 2. acotadoGroup — clave para arquetipo McKinsey
  const acotadoGroups = await prisma.employee.groupBy({
    by: ['acotadoGroup'],
    where: { accountId, isActive: true, status: 'ACTIVE' },
    _count: true,
  })
  console.log('\n📊 2. ACOTADO GROUP (arquetipo McKinsey)')
  for (const g of acotadoGroups.sort((a, b) => b._count - a._count)) {
    console.log(`   ${(g.acotadoGroup ?? '(null)').padEnd(25)} ${g._count}`)
  }
  const conAcotado = acotadoGroups
    .filter(g => g.acotadoGroup !== null)
    .reduce((s, g) => s + g._count, 0)
  const sinAcotado = acotadoGroups
    .filter(g => g.acotadoGroup === null)
    .reduce((s, g) => s + g._count, 0)
  console.log(
    `   Cobertura: ${conAcotado}/${conAcotado + sinAcotado} (${((conAcotado / (conAcotado + sinAcotado)) * 100).toFixed(0)}%)`
  )

  // 3. managerLevel — clave para capa jerárquica
  const levels = await prisma.employee.groupBy({
    by: ['managerLevel'],
    where: { accountId, isActive: true, status: 'ACTIVE' },
    _count: true,
  })
  console.log('\n📊 3. MANAGER LEVEL (capa jerárquica)')
  for (const l of levels.sort(
    (a, b) => (a.managerLevel ?? 99) - (b.managerLevel ?? 99)
  )) {
    const label =
      l.managerLevel === 1
        ? 'CEO'
        : l.managerLevel === 2
          ? 'Director'
          : l.managerLevel === 3
            ? 'Gerente'
            : l.managerLevel === 4
              ? 'Jefe'
              : l.managerLevel === 5
                ? 'IC'
                : '(null)'
    console.log(
      `   L${l.managerLevel ?? '-'} ${label.padEnd(15)} ${l._count}`
    )
  }

  // 4. Salarios — Employee NO tiene campo salary. Se infiere vía
  // SalaryConfigService.getSalaryForAccount(accountId, acotadoGroup)
  // que devuelve promedio por arquetipo (no salary individual).
  console.log('\n📊 4. SALARIOS (via SalaryConfigService — no hay campo Employee.salary)')
  console.log('   El salary por manager será estimado desde su acotadoGroup.')
  console.log('   Implicación: costoFTEgestionado es relativo entre arquetipos,')
  console.log('   no valor real por persona. Consistente con L1/L2/L9.')

  console.log('\n════════════════════════════════════════════════════════════')
  console.log('RESULTADO: dependencias para SpanIntelligenceService')
  console.log('════════════════════════════════════════════════════════════')
  console.log(
    `  directReports relation:    ${withDirects.length > 0 ? '✅ activo' : '❌ sin data'}`
  )
  console.log(
    `  acotadoGroup cobertura:    ${conAcotado > 0 ? '✅' : '❌'}  ${((conAcotado / managers.length) * 100).toFixed(0)}%`
  )
  console.log(
    `  managerLevel cobertura:    ${levels.some(l => l.managerLevel !== null) ? '✅' : '⚠️ '} ver conteo arriba`
  )
  console.log(`  salary fallback:           ✅ SalaryConfigService con defaults Chile`)

  await prisma.$disconnect()
}

main().catch(async e => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
